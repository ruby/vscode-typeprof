import * as assert from 'assert';
import * as path from 'path';
import * as cp from 'child_process';
import * as fs from 'fs';

import * as vscode from 'vscode';

import { retryUntil } from './utils/retryUntil';
import { sleep } from './utils/sleep';

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

        const study = list.items.filter((item) => item.label === 'study');
        assert.strictEqual(study.length, 1);
        assert.strictEqual(study[0].kind, vscode.CompletionItemKind.Method);
        const singletonClass = list.items.filter((item) => item.label === 'singleton_class');
        assert.strictEqual(singletonClass.length, 1);
        assert.strictEqual(singletonClass[0].kind, vscode.CompletionItemKind.Method);
    });
});

suite('diagnostics', () => {
    setup(() => {
        installDependencies();
    });

    teardown(() => {
        cleanUpFiles();
    });

    test('wrong number of arguments (given 0, expected 1)', async () => {
        const doc = await openTargetFile(path.join(simpleProgramPath, 'student.rb'));
        const diagnostics = vscode.languages.getDiagnostics(doc.uri);
        const actual = diagnostics.filter(
            (d) => d.message === '[error] wrong number of arguments (given 0, expected 1)',
        );
        assert.strictEqual(actual.length, 1);
        assert.strictEqual(actual[0].severity, vscode.DiagnosticSeverity.Error);
        assert.deepStrictEqual(
            actual[0].range,
            new vscode.Range(new vscode.Position(13, 0), new vscode.Position(13, 10)),
        );
    });

    test('wrong number of arguments (given 2, expected 1)', async () => {
        const doc = await openTargetFile(path.join(simpleProgramPath, 'student.rb'));
        const diagnostics = vscode.languages.getDiagnostics(doc.uri);
        const actual = diagnostics.filter(
            (d) => d.message === '[error] wrong number of arguments (given 2, expected 1)',
        );
        assert.strictEqual(actual.length, 1);
        assert.strictEqual(actual[0].severity, vscode.DiagnosticSeverity.Error);
        assert.deepStrictEqual(
            actual[0].range,
            new vscode.Range(new vscode.Position(14, 0), new vscode.Position(14, 29)),
        );
    });

    test('failed to resolve overload: Integer#+', async () => {
        const doc = await openTargetFile(path.join(simpleProgramPath, 'increment.rb'));
        const diagnostics = vscode.languages.getDiagnostics(doc.uri);
        const actual = diagnostics.filter((d) => d.message === '[error] failed to resolve overload: Integer#+');
        // TODO: fix this length to 1
        assert.strictEqual(actual.length, 2);
        assert.strictEqual(actual[0].severity, vscode.DiagnosticSeverity.Error);
        assert.deepStrictEqual(
            actual[0].range,
            new vscode.Range(new vscode.Position(6, 4), new vscode.Position(6, 17)),
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
        assert.deepStrictEqual(loc[0].range, new vscode.Range(new vscode.Position(1, 2), new vscode.Position(3, 5)));
    });

    test('go to study method', async () => {
        const doc = await openTargetFile(path.join(simpleProgramPath, 'student.rb'));
        const loc = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            doc.uri,
            new vscode.Position(11, 5),
        );
        assert.strictEqual(loc.length, 1);
        assert.deepStrictEqual(loc[0].range, new vscode.Range(new vscode.Position(5, 2), new vscode.Position(8, 5)));
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
