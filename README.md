# Tickory

[![Build Status](https://travis-ci.org/Maark/tickory.svg)](https://travis-ci.org/Maark/tickory)
[![Dependency Status](https://david-dm.org/MAARK/tickory.svg)](https://david-dm.org/MAARK/tickory)
[![npm version](https://badge.fury.io/js/tickory.svg)](https://badge.fury.io/js/tickory)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An unofficial CLI for [Tick](https://www.tickspot.com/) time tracking, Tickory is designed to allow for rapid time entry into Tickspot in two ways:  

* Enter time directly from the command line.  

* Enter time via batch mode for reoccuring fixed-time tasks (such as daily scrums) that you perform each day of the week. (experimental mode)

You can also view a weekly time report.

## Usage

1. Install from npm:

```bash

npm install -g tickory

```

2. Run from the command line using:

```bash
tickory
```

## First-Time Startup

When you first run Tickory, it will request your Tickspot username and password. Your credentials are required to access the Tickspot API and get an API token that is used each time data is requested from or sent to Tick.

Your username (email address), API token, user ID, and subscription ID are saved as encrypted strings (using [cpass](https://github.com/koltyakov/cpass#readme)) in your home directory in the `.tickory.json` file. (Your password is never saved and is only used once to get the token.)

## Getting and Refreshing Project Data

Tickory caches your client, project, and task data to optimize performance and saves it in your home directory in the `.tickory-tasks.json` file. This cache is updated every 7 days. However, if you want to force a data update earlier (such as in the case of being added to a new project before the cache updates), use the `--clean=project-data` command line argument to clear the project data cache and have Tickory reload from Tickspot immediately.  

## Command-Line Arguments

Tickory accepts the following commmand-line arguments:

* `--clean=project-data|all` - clears some or all of the cache depending on the value used:  
  * `project-data` removes the  `.tickory-tasks.json` file from your home directory,  which forces Tickory to refresh your project data from Tickspot. 
  * `all` removes both the `.tickory.json` file (which stores credentials for Tick access) and the `.tickory-tasks.json` file (project data). When you use this flag, Tickory will prompt you for your credentials  (see “First-Time Startup" above) and redownload project data.

* `--experimentalmode` - enables the experimental feature (batch mode processing).

* `--config=config.json` - optional configuration JSON file that allows you to set up reoccurring entries. (See "Entering Reoccuring Entries" below.)

## Experimental Mode: Entering Reoccuring Enteries

*Disclaimer: In order to utilize this experimental feature, you need to be able to do some investigation work on your own using the Tickspot API to obtain the taskId for the tasks you want to include.*

This experimental feature of Tickory supports adding of time entries to Tickspot in batch mode. To do so, you need to create a config.json file, enter a listing of time entries using a special format, and reference the file using the `--config` command-line argument.

When you select the “Perform batch entry of recoccuring tasks for current week” from the top menu and Tickory loads a valid config.json file, Tickory will enter each of the entries found in your config.json as separate time entries for *each* day of the *current* work week (Monday through Friday).

Note: It doesn’t matter when you perform this process during a given week, Tickory will determine the dates for Mon-Fri of the current week and record time accordingly.

The configuration file is a JSON file in the following format:

```json
{
    "reoccuringEntries": [{
            "hours": 0.25,
            "taskId": 11111101,
            "notes": "Daily scrum meeting with dev team"
        },
        {
            "hours": 0.25,
            "taskId": 11111102,
            "notes": "Daily bug council with PM"
        },
        {
            "hours": 0.25,
            "taskId": 11111103,
            "notes": "Scrum meeting with full project team"
        }
    ]
}
```

### Obtaining Task Ids

In order to obtain the `taskId` for a given task, you will need to connect to the [Tickspot API v2](https://www.tickspot.com/api) through Postman or your favorite API tool and use a combination of `GET /clients`, `GET /projects`, `GET project/tasks`, or `GET /tasks` calls to manually track down the ids you want to reference in the configuration file.

## Future Enhancements

* Batch mode: Ability to create the config.json file interactively through menu-based selections (and thereby also eliminate the need to manually look up task ids).
* Batch mode: Ability to add recoccuring entries for one day (e.g., once a week of a given week, or a particular pattern (e.g., Mon-Wed-Fri)

## MIT License

Copyright (c) 2019 Maark

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
