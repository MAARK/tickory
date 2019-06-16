const moment = require('moment');
const readFileSync = require('fs').readFileSync;
const statSync = require('fs').statSync;
const fs = require('fs');
const fsp = require('fs').promises;
const Cpass = require('cpass').Cpass;
const cpass = new Cpass();
const log = require('./log');


/*
 * Utility library for dates, file I/O, string encyption, etc.
 */

module.exports = {

    /* 
     * Returns an array of dates for the current week.  
     * 
     * Important: A Moment week is Sun-Sat, whereas 
     * a Tickspot week is Mon-Sun. Therefore, we need 
     * to take care on what value to give Sunday - we 
     * technically reference the *next* Sunday (7), not the 
     * current week Sunday (which is 0).   
     */
    getDatesOfCurrentWeek(weekends) {
        const mon = moment().day(1).format('YYYY-MM-DD');
        const tue = moment().day(2).format('YYYY-MM-DD');
        const wed = moment().day(3).format('YYYY-MM-DD');
        const thu = moment().day(4).format('YYYY-MM-DD');
        const fri = moment().day(5).format('YYYY-MM-DD');
        const sat = moment().day(6).format('YYYY-MM-DD');
        const sun = moment().day(7).format('YYYY-MM-DD');
        if (weekends) {
            return [mon, tue, wed, thu, fri, sat, sun];
        } else {
            return [mon, tue, wed, thu, fri];
        }
    },

    /* 
     * Returns the day of the week based on the date provided. 
     * If returnAsString = true, then it returns a three-letter
     * abbreviation of day. If false, then index value; 
     * 
     * Important: A Moment week is Sun-Sat, whereas 
     * a Tickspot week is Mon-Sun. We need to adjust 
     * for this difference.    
     */
    getDayForDate(date, returnAsString) {
        let idx = 0;
        const momentIndex = moment(date).day();
        if (momentIndex === 0) {
            idx = 6;
        } else {
            idx = momentIndex - 1;
        }
        if (returnAsString)
            return this._getDayStringforNumber(idx);
        else {
            return idx;
        }

    },

    _getDayStringforNumber(idx) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days[idx];
    },

    getStartDateOfCurrentWeek(userFriendly) {
        if (userFriendly) {
            return moment().day(1).format('MMM DD');
        } else {
            return moment().day(1).format('YYYY-MM-DD');
        }
    },

    getEndDateOfCurrentWeek(userFriendly) {
        if (userFriendly) {
            return moment().day(7).format('MMM DD');
        } else {
            return moment().day(7).format('YYYY-MM-DD');
        }

    },

    deleteFile(filePath) {
        if (this.fileExists(filePath)) {
            try {
                return fs.unlinkSync(filePath);
            } catch (e) {
                return false;
            }
        } else {
            return true;
        }
    },

    fileExists(filePath) {
        try {
            return statSync(filePath).isFile();
        } catch (e) {
            return false;
        }
    },

    safeParseJSON(str) {
        try {
            return { json: JSON.parse(str) };
        } catch (error) {
            return { error };
        }
    },

    async loadJSONFile(filePath) {
        const j = readFileSync(filePath, 'utf-8');
        let { error, json: result } = this.safeParseJSON(j);
        if (error) {
            log.err(`🚫 Invalid JSON: ${error.message.replace(/\n/g,"")}`);
            process.exit(1);
        }
        return result;
    },

    async createFolder(folder) {
        if (!fs.existsSync(folder)) {
            try {
                return await fsp.mkdir(folder);
            } catch (err) {
                log.err(err);
            }
        }
    },

    async writeToFile(filename, data) {
        return new Promise((resolve, reject) => {
            try {
                const file = fs.createWriteStream(filename);
                file.write(JSON.stringify(data));
                file.end();
                file.on("finish", () => {
                    resolve(true);
                });
                file.on("error", reject);
            } catch (err) {
                reject();
            }
        });
    },

    encypt(string) {
        if (string) {
            return cpass.encode(string);
        } else {
            return null;
        }
    },

    decrypt(string) {
        if (string) {
            return cpass.decode(string);
        } else {
            return null;
        }
    },

    sortByName(a, b) {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    }



};