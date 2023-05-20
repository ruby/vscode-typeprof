import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';

export function run(): Promise<void> {
    if (process.env.PATH && process.env.RUBY_BIN_PATH) {
        console.log(
            "Prefer a newly-installed Ruby version over the system's default one." +
                ' This is a workaround for https://github.com/microsoft/vscode-test/issues/20',
        );
        const previous = process.env.PATH;
        process.env.PATH = [process.env.RUBY_BIN_PATH, ...previous.split(path.delimiter)].join(path.delimiter);
        console.log(`Previous PATH: ${previous}`);
        console.log(` Current PATH: ${process.env.PATH}`);
    }

    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
    });

    const testsRoot = path.resolve(__dirname, '..');

    mocha.timeout(60000);

    return new Promise((c, e) => {
        glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
            if (err) {
                return e(err);
            }

            // Add files to the test suite
            files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test
                mocha.run((failures) => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                console.error(err);
                e(err);
            }
        });
    });
}
