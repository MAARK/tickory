const CliController = require('./controllers/cliController');
const DataController = require('./controllers/dataController');
const log = require('./util/log');
const argv = require('yargs').argv;
const util = require('./util/util');

module.exports = () => {

    const cliController = new CliController();
    const dataController = new DataController();

    async function main() {

        // Command-line arguments 
        const experimentalMode = argv.experimentalmode != undefined;
        const clearCredentials = argv.clean === 'all';
        const clearProjectData = argv.clean === 'project-data';
        if (clearCredentials) {
            dataController.clearCredentials();
        } else if (clearProjectData) {
            dataController.clearProjectData();
        }

        // Get credentials 
        const credentialsFound = await getCredentials();
        if (!credentialsFound) {
            log.err("Unable to validate your Tickspot credentials. Please try again.");
            return false;
        }

        // Get current hours 
        const weeklyHours = await dataController.getWeeklyHours();
        const t = weeklyHours > 1 ? `${weeklyHours} hours` : `${weeklyHours} hour`;
        log.i(`You have entered ${t} total the week of ${util.getStartDateOfCurrentWeek(true)} to ${util.getEndDateOfCurrentWeek(true)}.\n`);

        // Main  
        const choice = await cliController.getTopMenuResponse(experimentalMode);
        // Enter time 
        if (choice.value === 'today' || choice.value === 'adhoc') {
            const data = await dataController.getTickData();
            return await makeEntry(data, choice);
            // View report 
        } else if (choice.value === 'report') {
            const report = await dataController.getWeeklyReport();
            log.i("\nYour Weekly Report\n");
            log.i(report);
            return true;
            // Batch mode     
        } else {
            const r = await cliController.confirmReoccurring();
            if (r.value === true) {
                const s = await dataController.addReoccuringEntries();
                if (s) {
                    log.i(`Power up! You have successfully entered batch entries for your work week.`);
                    return true;
                } else {
                    log.err(`There was a problem adding batch entries. Please check on Tickspot to determine which entries were entered.`);
                    return false;
                }
            } else {
                return true;
            }
        }
    }

    async function makeEntry(data, choice) {
        const entry = await cliController.captureEntry(data.clients, (choice.value === 'today'));
        const response = await dataController.createEntry(entry);
        if (response) {
            log.i(`Power up! You have successfully recorded ${entry.hours} new hours.`);
            const again = await cliController.addMorePrompt();
            if (again.value) {
                return await makeEntry(data, choice);
            } else {
                return true;
            }
        } else {
            log.err('There was a problem adding your entry into Tickspot. Make sure you have been assigned to the project for which you are trying to enter time.');
        }
    }

    async function getCredentials() {

        const cached = await dataController.loadCachedCredentials();
        if (cached) {
            log.i(`\n🕗 Welcome to Tickory, an unofficial CLI for Tick time tracking.\n`);
            return true;
        }

        log.i(`\n🕗 Welcome to Tickory, an unofficial CLI for Tick time tracking. Before using\nfor the first time, you will need to set up access to Tickspot. Please answer\nthe following questions and then you will be all set!\n`);

        const user = await cliController.getUserCredentials();
        dataController.updateCredentials(user);

        const roles = await dataController.getUserRoles();
        if (roles && roles.length === 1 && roles[0] === 'Unable to authenticate user') {
            return false;
        } else if (roles.length > 1) {
            const role = await cliController.getTickspotSubscription(roles);
            const params = { subscriptionId: role.value.subscription_id, token: role.value.api_token };
            await dataController.updateCredentials(params);
        } else if (roles.length === 1) {
            const params = { subscriptionId: roles[0].subscription_id, token: roles[0].api_token };
            await dataController.updateCredentials(params);
        } else {
            return false;
        }

        const users = await dataController.getUsers();
        if (users.length > 1) {
            const user = await cliController.getSelectedUser(users);
            const params = { userId: user.value };
            await dataController.updateCredentials(params);
        } else if (users.length === 1) {
            const params = { userId: users[0].id };
            await dataController.updateCredentials(params);
        } else {
            return false;
        }

        const sc = await dataController.saveCredentials();
        return sc;
    }

    (async() => {
        try {
            const result = await main();
            if (result) {}
        } catch (e) {
            log.err(e);
        }
    })();

};