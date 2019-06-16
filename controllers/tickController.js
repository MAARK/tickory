const TickspotExt = require('../lib/tickspotv2-api-extended');

/*
 * TickController manages all of the interactions with Tickspot API. 
 */

class TickController {

    constructor(params) {
        // https://github.com/Frederikbh/tickspotv2-api#readme
        this.tick = new TickspotExt(`Tickory (${params.username})`, params.subscriptionId, params.token, params.username, params.password);

    }

    async getEntriesByDateRange(userId, startDate, endDate) {
        const query = { start_date: startDate, end_date: endDate };
        try {
            const entries = await this.tick.getUserEntries(userId, query);
            return entries;
        } catch (error) {
            return error;
        }
    }


    // Adds recoccuring meeting entries for each of the 
    // specified dates  
    async addReoccuringEntries(userId, entries, dates) {
        for (let date of dates) {
            for (let entry of entries) {
                try {
                    let response = await this.createEntry(date, entry.hours, entry.notes, entry.taskId, userId);
                } catch (error) {
                    return false;
                }
            }
        }
        return true;
    }

    async getMyTasks() {
        let response = {};
        response.lastUpdated = new Date();
        let clients = await this.getClients();
        for (let client of clients) {
            client.projects = [];
            let projects = await this.getAllClientProjects(client.id);
            for (let project of projects) {
                project.tasks = [];
                let tasks = await this.getAllProjectTasks(project.id);
                for (let task of tasks) {
                    project.tasks.push(task);
                }
                client.projects.push(project);
            }
        }
        response.clients = clients;
        return response;
    }

    async getMyTasksAsSummaries() {
        let result = [];
        let clients = await this.getClients();
        for (let client of clients) {
            let c = {};
            c.name = client.name;
            c.projects = [];
            let projects = await this.getAllClientProjects(client.id);
            for (let project of projects) {
                let p = {};
                p.name = project.name;
                p.tasks = [];
                let tasks = await this.getAllProjectTasks(project.id);
                for (let task of tasks) {
                    let t = {};
                    t.name = task.name;
                    p.tasks.push(task);
                }
                c.projects.push(p);
            }
            result.push(c);
        }
        return result;
    }

    async getClients() {
        try {
            const clients = await this.tick.getClients();
            return clients;
        } catch (error) {
            return error;
        }
    }

    async getAllClientProjects(clientId) {
        try {
            const projects = await this.tick.getAllClientProjects(clientId);
            return projects;
        } catch (error) {
            return error;
        }
    }

    async getAllProjectTasks(projectId) {
        try {
            const tasks = await this.tick.getProjectTasks(projectId);
            return tasks;
        } catch (error) {
            return error;
        }
    }

    async getProjects() {

        try {
            const projects = await this.tick.getProjects();
            return projects;
        } catch (error) {
            return error;
        }
    }

    async getRoles() {
        try {
            const roles = await this.tick.getRoles();
            return roles;
        } catch (error) {
            return error;
        }
    }

    async getUsers() {
        try {
            const users = await this.tick.getUsers();
            return users;
        } catch (error) {
            return error;
        }
    }

    async createEntry(date, hours, notes, taskId, userId) {

        const entry = {
            "date": date,
            "hours": hours,
            "notes": notes,
            "task_id": taskId,
            "user_id": userId
        };

        try {
            const response = await this.tick.createEntry(entry);
            return true;
        } catch (error) {
            // response[0].errors != null
            return false;
        }


    }

}

module.exports = TickController;