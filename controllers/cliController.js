const moment = require('moment');
const inquirer = require('inquirer'); // https://github.com/SBoudrias/Inquirer.js
inquirer.registerPrompt('datetime', require('inquirer-datepicker-prompt'));

/*
 * CliController manages the interactions with CLI. 
 */

class CliController {

    async addMorePrompt() {
        return await inquirer.prompt({
            type: 'confirm',
            name: 'value',
            message: 'Would you like to add another entry?',
            default: false
        });
    }

    async getTopMenuResponse(experimentalMode) {

        let choices = [
            { name: 'Add time for today', value: 'today' },
            { name: 'Add time for any day', value: 'adhoc' },
            { name: 'View weekly time report', value: 'report' }
        ];

        if (experimentalMode) {
            choices.push({ name: 'Perform batch entry of reoccuring tasks for current week', value: 'reoccuring' });
        }


        const response = await inquirer.prompt([{
            type: 'list',
            name: 'value',
            message: 'What would you like to do?',
            choices: choices
        }]);
        return response;
    }

    async confirmReoccurring() {
        return await inquirer.prompt({
            type: 'confirm',
            name: 'value',
            message: `\nThis experimental batch feature enables automated entry of reoccuring\nfixed-time tasks (such as daily scrums) that you perform each day of the week.\nTo do so, Tickory will enter each of the entries found in your config.json\nas separate entries for each day of the current work week (Monday through\nFriday). Would you like to continue?`,
            default: false
        });
    }

    async captureEntry(data, isToday) {

        let result = {};

        const client = await inquirer.prompt({
            type: 'list',
            name: 'value',
            message: 'What is the client?',
            choices: await this._getClientChoices(data)
        });

        const project = await inquirer.prompt({
            type: 'list',
            name: 'value',
            message: 'What is the project?',
            choices: await this._getProjectChoices(data, client.value)
        });

        const task = await inquirer.prompt({
            type: 'list',
            name: 'value',
            message: 'What is the task?',
            choices: await this._getTaskChoices(data, client.value, project.value)
        });
        result.taskId = task.value;

        if (!isToday) {
            const date = await inquirer.prompt({
                type: 'datetime',
                name: 'value',
                message: 'What date did you do this work?',
                format: ['dd', '-', 'mmm', ' (', 'ddd', ')']
            });
            result.date = moment(date.value).format('YYYY-MM-DD');
        } else {
            result.date = moment().format('YYYY-MM-DD');
        }

        const time = await inquirer.prompt({
            type: 'number',
            name: 'value',
            message: 'How long (in hours) did you spend on this task?',
            default: 0.5,
            validate: function(value) {
                var valid = !isNaN(parseFloat(value));
                return valid || 'Please enter a number';
            }
        });
        result.hours = time.value;

        const notes = await inquirer.prompt({
            type: 'input',
            name: 'value',
            message: 'Please describe the work that you were doing.',
            validate: function(value) {
                var valid = value !== "";
                return valid || 'Please enter a description of your work.';
            }
        });
        result.notes = notes.value;

        return result;

    }

    _compare(a, b) {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    }

    async _getClientChoices(data) {
        data.sort(this._compare);
        let response = [];
        for (let client of data) {
            let choice = {};
            choice.name = client.name;
            choice.value = client.id;
            response.push(choice);
        }
        return response;
    }

    async _getProjectChoices(data, clientId) {
        let response = [];
        for (let client of data) {
            client.projects.sort(this._compare);
            if (client.id === clientId) {
                for (let project of client.projects) {
                    let choice = {};
                    choice.name = project.name;
                    choice.value = project.id;
                    response.push(choice);
                }
            }
        }
        return response;
    }

    async _getTaskChoices(data, clientId, projectId) {
        let response = [];
        for (let client of data) {
            if (client.id === clientId) {
                for (let project of client.projects) {
                    project.tasks.sort(this._compare);
                    if (project.id === projectId) {
                        for (let task of project.tasks) {
                            let choice = {};
                            choice.name = task.name;
                            choice.value = task.id;
                            response.push(choice);
                        }
                    }
                }
            }
        }
        return response;
    }

    async _getSubscriptionChoices(roles) {
        let response = [];
        for (let role of roles) {
            let choice = {};
            choice.name = `${role.company} (Subscription: ${role.subscription_id})`;
            choice.value = role;
            response.push(choice);
        }
        return response;
    }

    async getTickspotSubscription(roles) {
        const response = await inquirer.prompt([{
            type: 'list',
            name: 'value',
            message: 'What Tickspot subscription you would like to use?',
            choices: await this._getSubscriptionChoices(roles)
        }]);
        return response;
    }

    async getUserCredentials() {
        const response = {};
        const username = await inquirer.prompt([{
            type: 'input',
            name: 'value',
            message: 'What is your Tickspot username?',
        }]);
        const password = await inquirer.prompt([{
            type: 'password',
            name: 'value',
            mask: '*',
            message: 'What is your Tickspot password?',
        }]);
        response.username = username.value;
        response.password = password.value;
        return response;
    }

    async _getUserChoices(users) {
        let response = [];
        for (let user of users) {
            let choice = {};
            choice.name = `${user.first_name} ${user.last_name}`;
            choice.value = user.id;
            response.push(choice);
        }
        return response;
    }

    async getSelectedUser(users) {
        const response = await inquirer.prompt([{
            type: 'list',
            name: 'value',
            message: 'Please select your name from the list below.',
            choices: await this._getUserChoices(users)
        }]);
        return response;
    }

}

module.exports = CliController;