import * as assert from 'assert';
import * as path from 'path';
import * as cp from 'child_process';
import * as fs from 'fs';

import * as vscode from 'vscode';

const projectRoot = path.join(__dirname, '..', '..', '..', '..');
const simpleProgramPath = path.join(projectRoot, 'src', 'test', 'simpleProgram');

suite('completion', () => {
    setup(() => {
        installDependencies();
    });

    teardown(() => {
        cleanUpFiles();
    });

    test('liam.', async function () {
        this.skip(); // currently, this test does not work because TypeProf v0.30.0 does only support `self.` completion
        const doc = await openTargetFile(path.join(simpleProgramPath, 'student.rb'));
        const pos = new vscode.Position(13, 18);
        const list = await retryUntil(
            async () => {
                const cmd = 'vscode.executeCompletionItemProvider';
                const list = await vscode.commands.executeCommand<vscode.CompletionList>(cmd, doc.uri, pos);
                if (
                    list &&
                    list.items.length > 0 &&
                    list.items.some((item) => item.kind === vscode.CompletionItemKind.Method)
                ) {
                    return list;
                }
            },
            { maxTries: 10, sleepInMs: 500 },
        );
        assert.ok(list);
        //const study = list.items.filter((item) => item.label === 'study');
        //assert.strictEqual(study.length, 1);
        //assert.strictEqual(study[0].kind, vscode.CompletionItemKind.Method);
        //const singletonClass = list.items.filter((item) => item.label === 'singleton_class');
        //assert.strictEqual(singletonClass.length, 1);
        //assert.strictEqual(singletonClass[0].kind, vscode.CompletionItemKind.Method);
    });
});

suite('diagnostics', () => {
    setup(() => {
        installDependencies();
    });

    teardown(() => {
        cleanUpFiles();
    });

    test('wrong number of arguments (0 for 1)', async () => {
        const doc = await openTargetFile(path.join(simpleProgramPath, 'student.rb'));
        const diagnostics = vscode.languages.getDiagnostics(doc.uri);
        const actual = diagnostics.filter((d) => d.message === 'wrong number of arguments (0 for 1)');
        assert.strictEqual(actual.length, 1);
        assert.strictEqual(actual[0].severity, vscode.DiagnosticSeverity.Error);
        assert.deepStrictEqual(
            actual[0].range,
            new vscode.Range(new vscode.Position(13, 5), new vscode.Position(13, 10)),
        );
    });

    test('wrong number of arguments (2 for 1)', async () => {
        const doc = await openTargetFile(path.join(simpleProgramPath, 'student.rb'));
        const diagnostics = vscode.languages.getDiagnostics(doc.uri);
        console.log(diagnostics);
        const actual = diagnostics.filter((d) => d.message === 'wrong number of arguments (2 for 1)');
        assert.strictEqual(actual.length, 1);
        assert.strictEqual(actual[0].severity, vscode.DiagnosticSeverity.Error);
        assert.deepStrictEqual(
            actual[0].range,
            new vscode.Range(new vscode.Position(14, 5), new vscode.Position(14, 10)),
        );
    });

    test('failed to resolve overloads', async () => {
        const doc = await openTargetFile(path.join(simpleProgramPath, 'increment.rb'));
        const diagnostics = vscode.languages.getDiagnostics(doc.uri);
        const actual = diagnostics.filter((d) => d.message === 'failed to resolve overloads');
        assert.strictEqual(actual.length, 1);
        assert.strictEqual(actual[0].severity, vscode.DiagnosticSeverity.Error);
        assert.deepStrictEqual(
            actual[0].range,
            new vscode.Range(new vscode.Position(6, 11), new vscode.Position(6, 13)),
        );
    });
});

suite('go to definitions', () => {
    setup(() => {
        installDependencies();
    });

    teardown(() => {
        cleanUpFiles();
    });

    test('go to initialize method', async () => {
        const doc = await openTargetFile(path.join(simpleProgramPath, 'student.rb'));
        const loc = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            doc.uri,
            new vscode.Position(10, 16),
        );
        assert.strictEqual(loc.length, 1);
        assert.deepStrictEqual(loc[0].range, new vscode.Range(new vscode.Position(1, 6), new vscode.Position(1, 16)));
    });

    test('go to study method', async () => {
        const doc = await openTargetFile(path.join(simpleProgramPath, 'student.rb'));
        const loc = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            doc.uri,
            new vscode.Position(11, 5),
        );
        assert.strictEqual(loc.length, 1);
        assert.deepStrictEqual(loc[0].range, new vscode.Range(new vscode.Position(5, 6), new vscode.Position(5, 11)));
    });
});

async function openTargetFile(path: string) {
    const doc = await vscode.workspace.openTextDocument(path);
    await vscode.window.showTextDocument(doc);
    await new Promise((res) => setTimeout(res, 5000));
    return doc;
}

function cleanUpFiles() {
    fs.unlinkSync(path.join(simpleProgramPath, 'rbs_collection.lock.yaml'));
    fs.unlinkSync(path.join(simpleProgramPath, 'Gemfile.lock'));
    fs.rmdirSync(path.join(simpleProgramPath, '.gem_rbs_collection'));
}

function installDependencies() {
    const cwd = simpleProgramPath;
    cp.execSync('bundle install && bundle exec rbs collection install', { cwd });
}

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryUntil<T>(
    task: () => Promise<T>,
    { maxTries, sleepInMs }: { maxTries: number; sleepInMs: number },
): Promise<T | undefined> {
    for (let tries = 1; tries <= maxTries; tries++) {
        const result = await task();
        if (result) {
            return result;
        }
        console.log('[%d/%d] retrying after %d ms...', tries, maxTries, sleepInMs);
        await sleep(sleepInMs);
    }
}
