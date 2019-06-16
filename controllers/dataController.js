const util = require('../util/util');
const TickController = require('./tickController');
const moment = require('moment');
const Spinner = require('cli-spinner').Spinner;
const log = require('../util/log');
const getConfigJson = require('../util/configFile').getConfigJson;
const homeDirectory = require('os').homedir();
const path = require('path');
const { table } = require('table');

/*
 * DataController manages all of the cached and live data in the app.   
 */

class DataController {

    constructor() {
        this.dataFile = path.join(homeDirectory, '.tickory-tasks.json');
        this.credentialsFile = path.join(homeDirectory, '.tickory.json');
        this.daysTilExpiration = 7;
        this.credentials = {};
        this.config = null;
    }

    clearCredentials() {
        util.deleteFile(this.credentialsFile);
        this.clearProjectData();
    }

    clearProjectData() {
        util.deleteFile(this.dataFile);
    }

    _loadConfigFile() {
        const result = getConfigJson();
        if (result) {
            this.config = result;
            return true;
        } else {
            return false;
        }
    }

    async getTickData() {
        let data;
        const cached = util.fileExists(this.dataFile);
        if (cached) {
            data = await util.loadJSONFile(this.dataFile);
            let isStale = await this._isStaleCache(data.lastUpdated);
            if (!isStale) {
                return data;
            }
        }

        let spinner = new Spinner("Getting your project data from Tickspot...");
        spinner.setSpinnerString('|/-\\');
        spinner.start();
        const tickController = new TickController(this.credentials);
        data = await tickController.getMyTasks();
        try {
            await util.writeToFile(this.dataFile, data);
        } catch (e) {
            spinner.stop(true);
            log.err(`😱 Something went wrong while saving the cache`);
            return data;
        }
        spinner.stop(true);
        return data;
    }

    async _isStaleCache(lastUpdated) {
        let lastUpdate = moment(lastUpdated);
        let today = moment();
        let diff = today.diff(lastUpdate, 'days');
        return (diff > 7);
    }

    async createEntry(entry) {
        const userId = this.credentials.userId;
        const tickController = new TickController(this.credentials);
        const response = await tickController.createEntry(entry.date, entry.hours, entry.notes, entry.taskId, userId);
        return response;
    }

    async addReoccuringEntries() {
        if (this._loadConfigFile()) {
            const userId = this.credentials.userId;
            const entries = this.config.reoccuringEntries;
            const dates = util.getDatesOfCurrentWeek();
            const tickController = new TickController(this.credentials);
            const response = await tickController.addReoccuringEntries(userId, entries, dates);
            return response;
        } else {
            return false;
        }
    }

    async getUserRoles() {
        const tickController = new TickController(this.credentials);
        const roles = await tickController.getRoles();
        return roles;
    }

    async loadCachedCredentials() {
        if (util.fileExists(this.credentialsFile)) {
            this.credentials = await util.loadJSONFile(this.credentialsFile);
            this._decryptCredentails();
            return true;
        } else {
            return false;
        }
    }

    async saveCredentials() {
        try {
            return await util.writeToFile(this.credentialsFile, this._encryptCredentials());
        } catch (e) {
            log.err(`😱 Something went wrong while saving your Tickspot credentials.`);
            return e;
        }
    }

    _decryptCredentails() {
        this.credentials.username = util.decrypt(this.credentials.username);
        this.credentials.password = util.decrypt(this.credentials.password);
        this.credentials.subscriptionId = util.decrypt(this.credentials.subscriptionId);
        this.credentials.token = util.decrypt(this.credentials.token);
        this.credentials.userId = util.decrypt(this.credentials.userId);
    }

    _encryptCredentials() {
        let result = {};
        result.username = util.encypt(this.credentials.username);
        result.subscriptionId = util.encypt(this.credentials.subscriptionId);
        result.token = util.encypt(this.credentials.token);
        result.userId = util.encypt(this.credentials.userId);
        return result;
    }

    updateCredentials(params) {
        this.credentials.username = params.username ? params.username : this.credentials.username;
        this.credentials.password = params.password ? params.password : this.credentials.password;
        this.credentials.subscriptionId = params.subscriptionId ? params.subscriptionId : this.credentials.subscriptionId;
        this.credentials.token = params.token ? params.token : this.credentials.token;
        this.credentials.userId = params.userId ? params.userId : this.credentials.userId;
    }

    async getWeeklyHours() {
        const startDate = util.getStartDateOfCurrentWeek();
        const endDate = util.getEndDateOfCurrentWeek();
        const userId = this.credentials.userId;
        const tickController = new TickController(this.credentials);
        const entries = await tickController.getEntriesByDateRange(userId, startDate, endDate);
        let totalHours = 0;
        for (let entry of entries) {
            totalHours += entry.hours;
        }
        return totalHours;
    }

    async getUsers() {
        const tickController = new TickController(this.credentials);
        const users = await tickController.getUsers();
        users.sort(this._compareFirstName);
        return users;
    }

    _compareFirstName(a, b) {
        if (a.first_name < b.first_name) {
            return -1;
        }
        if (a.first_name > b.first_name) {
            return 1;
        }
        return 0;
    }

    async getWeeklyReport() {
        const startDate = util.getStartDateOfCurrentWeek();
        const endDate = util.getEndDateOfCurrentWeek();
        const userId = this.credentials.userId;
        const tickController = new TickController(this.credentials);
        const entries = await tickController.getEntriesByDateRange(userId, startDate, endDate);
        const weekdates = util.getDatesOfCurrentWeek(true);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let report = [];
        let totalHours = 0;
        report.push(this._createTableHeader());
        for (let weekdate of weekdates) {
            for (let day of days) {
                let d = util.getDayForDate(weekdate, true);
                if (d === day) {
                    report.push(this._createSpacer());
                    let hours = 0;
                    let tasks = [];
                    for (let entry of entries) {
                        if (weekdate === entry.date) {
                            hours += entry.hours;
                            let task = {};
                            task.id = entry.task_id;
                            task.hours = entry.hours;
                            let idx = tasks.map(function(t) { return t.id; }).indexOf(task.id);
                            if (idx === -1) {
                                tasks.push(task);
                            } else {
                                tasks[idx].hours = hours;
                            }
                        }
                    }
                    let row = this._createDaySummaryEntry(day, weekdate, hours);
                    report.push(row);
                    totalHours += hours;
                    for (let task of tasks) {
                        let d = await this._getTaskDetails(task.id);
                        let dr = this._createDailyProjectEntry(d.client, d.project, d.task, task.hours);
                        report.push(dr);
                    }
                }
            }
        }
        report.push(this._createSpacer());
        report.push(this._createTableFooter(totalHours));
        const config = {
            drawHorizontalLine: (index, size) => {
                return index === 0 || index === 1 || index === size - 1 || index === size;
            }
        };
        let result = table(report, config);
        return result;
    }

    async _getTaskDetails(taskId) {
        const data = await this.getTickData();
        let result = {};
        for (let client of data.clients) {
            for (let project of client.projects) {
                for (let task of project.tasks) {
                    if (task.id === taskId) {
                        result.client = client.name;
                        result.project = project.name;
                        result.task = task.name;
                    }
                }
            }
        }
        return result;
    }

    _createTableHeader() {
        return ['Day', 'Date', 'Client', 'Project', 'Task', 'Hours'];
    }

    _createTableFooter(total) {
        return [' ', ' ', ' ', ' ', 'Weekly Total', total];
    }

    _createDaySummaryEntry(day, date, total) {
        return [day, date, ' ', ' ', ' ', total];
    }

    _createDailyProjectEntry(client, project, task, total) {
        return ['', '', client, project, task, total];
    }

    _createSpacer() {
        return [' ', ' ', ' ', ' ', ' ', ' '];
    }

}

module.exports = DataController;