const log = require('./log');
const argv = require('yargs').argv;
const readFileSync = require('fs').readFileSync;
const statSync = require('fs').statSync;
const t = require('tcomb-validation');
const validate = require('tcomb-validation').validate;

module.exports = {

    /*
     * Gets and validates the structure of the config file. Looks at command-line 
     * argument to determine config file path. 
     *   
     * Based originally on gh-issue-mover's https://github.com/buildo/gh-issue-mover/blob/master/src/config.js
     * 
     * @return {JSON} result 
     */

    getConfigJson: function() {

        function fileExists(filePath) {
            try {
                return statSync(filePath).isFile();
            } catch (e) {
                return false;
            }
        }

        function safeParseJSON(str) {
            try {
                return { json: JSON.parse(str) };
            } catch (error) {
                return { error };
            }
        }

        const ReoccuringEntry = t.interface({
            hours: t.Number,
                taskId: t.Number,
                notes: t.String
        });

        const ReoccuringEntries = t.list(ReoccuringEntry);

        const Config = t.interface({
            reoccuringEntries: ReoccuringEntries
        });

        let cf = argv.config;

        if (!cf) {
            cf = 'config.json';
            if (fileExists(cf)) {
                log.i('Using default config.json that was located in start-up directory.');
            } else {
                log.err('Please provide a config file using --config');
                process.exit(1);
            }
        } else {
            if (!fileExists(cf)) {
                log.err('The specified config.json file was not found. Please provide a valid config file using --config');
                return false;
            }
        }

        const configFile = readFileSync(cf, 'utf-8');

        let { error, json: result } = safeParseJSON(configFile);

        if (error) {
            log.err(`🚫 Invalid JSON: ${error.message.replace(/\n/g,"")}`);
            process.exit(1);
        }

        const validateResult = validate(result, Config);
        if (!validateResult.isValid()) {
            log.err(`🚫 The configuation file is not valid. Unable to continue. Details:`);
            validateResult.errors.forEach(e => {
                log.err(`Invalid value ${e.actual} supplied to ${e.path.join('/')}. Expected a ${t.getTypeName(e.expected)}`);
            });
            process.exit(1);
        }

        return result;
    }
};