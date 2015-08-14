import fs from 'fs';
import through2 from 'through2';
import Promise from 'promise';
import QunitHarness from 'qunit-harness';


var readFile = Promise.denodeify(fs.readFile);

function hang () {
    return new Promise(function () {
        // NOTE: hang forever
    });
}

export default function (options) {
    options = {
        basePath:          options.basePath || '',
        port:              options.port,
        crossDomainPort:   options.crossDomainPort,
        scripts:           options.scripts || [],
        css:               options.css || [],
        configApp:         options.configApp || null,
        saucelabsSettings: options.saucelabsSettings || null
    };

    var tests        = [];
    var qunitHarness = new QunitHarness();

    async function runTests () {
        qunitHarness
            .fixtures(options.basePath)
            .scripts(options.scripts)
            .css(options.css)
            .tests(tests);

        if (typeof options.port === 'number')
            qunitHarness.port(options.port);

        if (typeof options.crossDomainPort === 'number')
            qunitHarness.crossDomainPort(options.crossDomainPort);

        if (typeof options.configApp === 'function')
            qunitHarness.configApp(options.configApp);

        qunitHarness.create();

        if (options.saucelabsSettings) {
            qunitHarness.saucelabs(options.saucelabsSettings);
            return await qunitHarness.run();
        }

        await hang();
    }

    return through2.obj(function (file, enc, done) {
        tests.push(file.path);
        done();
    }, async function (done) {
        var error = null;

        try {
            await runTests();
        }
        catch (err) {
            error = err;
        }
        finally {
            qunitHarness.close();
            done(error);
        }
    });
};