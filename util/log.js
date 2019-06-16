//https://www.npmjs.com/package/chalk
const chalk = require('chalk');

if (!chalk.supportsColor) {
    console.log("🚫 Terminal does not support colors.");
}

module.exports = {

    err: (s) => console.error(chalk.redBright.bgWhiteBright(s)),

    warn: (s) => console.log(chalk.yellowBright(s)),

    success: (s) => console.log(chalk.bgGreenBright.whiteBright(s)),

    em: (s) => console.log(chalk.bold(s)),

    i: (s) => console.log(s)
};