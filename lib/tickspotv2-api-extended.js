const Tickspot = require('tickspotv2-api');

/*
 * TickspotEx extends https://github.com/Frederikbh/tickspotv2-api to 
 * support additional API calls.   
 */

class TickspotExt extends Tickspot {

    async getAllClientProjects(clientID, options, callback) {
        return this._getAll({
            paths: ['clients', clientID, 'projects']
        }, options, callback);
    }

}

module.exports = TickspotExt;