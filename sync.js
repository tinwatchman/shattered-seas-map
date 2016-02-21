/**
 * SyncManager class - handles loading spreadsheet data
 */
var SyncManager = function() {
    var mongoose = require('mongoose');
    var config = require('./config');
    var Spreadsheet = require('edit-google-spreadsheet');
    var _ = require('underscore');

    var self = this;

    // public properties
    this.currentMapState = null;

    /**
     * Promise wrapper around spreadsheet load
     */
    var loadMapSheet = function() {
        return new Promise(
            function(resolve, reject) {
                Spreadsheet.load({
                    debug: true,
                    spreadsheetId: config.spreadsheet.sheetId,
                    worksheetId: config.spreadsheet.mapWorksheetId,
                    oauth: {
                        email: config.spreadsheet.serviceAccount,
                        keyFile: config.spreadsheet.keyFile
                    }
                }, function sheetReady(err, spreadsheet) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(spreadsheet);
                    }
                });
            }
        );
    };

    var loadMetadata = function() {
        return new Promise(
            function(resolve, reject) {
                loadMapSheet()
                    .then(function(spreadsheet) {
                        spreadsheet.metadata(function(err, metadata) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(metadata);
                            }
                        });
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }
        );
    };

    var loadCurrentMapState = function() {
        return new Promise(
            function(resolve, reject) {
                mongoose.model('MapState').getCurrent()
                    .then(function(mapState) {
                        self.currentMapState = mapState;
                        resolve();
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }
        );
    };

    var isMapUpdated = function() {
        return new Promise(
            function(resolve, reject) {
                loadCurrentMapState()
                    .then(loadMetadata)
                    .then(function(metadata) {
                        if (self.currentMapState === null || 
                            metadata.updated.getTime() > self.currentMapState.time.getTime()) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    })
                    .catch(function(err) {
                        reject(err);
                    });
            }
        );
    };

    var hasNoValue = function(obj, prop) {
        return (!_.has(obj, prop) ||
                _.isUndefined(obj[prop]) ||
                _.isNull(obj[prop]) ||
                _.isEmpty(String(obj[prop])) ||
                String(obj[prop]).search(/\w/) === -1 ||
                obj[prop] === "-" ||
                obj[prop] === "--" ||
                obj[prop] === "---"
        );
    };

    this.refresh = function() {
        return new Promise(
            function(resolve, reject) {
                var isDirty = false;
                isMapUpdated()
                    .then(function(isUpdated) {
                        console.log("isUpdated: %s", isUpdated);
                        if (!isUpdated) {
                            resolve(self.currentMapState);
                        } else {
                            isDirty = true;
                            return loadMapSheet();
                        }
                    })
                    .then(function(spreadsheet) {
                        if (isDirty) {
                            console.log("spreadsheet undefined: " + _.isUndefined(spreadsheet));
                            return new Promise(
                                function(onDataResolved, onDataRejected) {
                                    spreadsheet.receive(function(err, rows, info) {
                                        if (err) {
                                            onDataRejected(err);
                                        } else {
                                            onDataResolved(rows, info);
                                        }
                                    });
                                }
                            );
                        }
                    })
                    .then(function(rows, info) {
                        if (isDirty) {
                            console.log("rows undefined: " + _.isUndefined(rows));
                            console.log("info undefined: " + _.isUndefined(info));
                            var MapState = mongoose.model('MapState');
                            var stateData = self.createMapState(rows, info);
                            var mapState = new MapState({
                                "hexes": [],
                                "time": stateData.time
                            });
                            stateData.hexes.forEach(function(hex) {
                                var hexEO = mapState.hexes.create(hex);
                                mapState.hexes.push(hexEO);
                            });
                            mapState.save(function(err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(mapState);
                                }
                            });
                        }
                    })
                    .catch(function(err) {
                        console.error("SyncManager.refresh error!");
                        console.error(err);
                        console.dir(err);
                        reject(err);
                    });
            }
        );
    };

    this.forceRefresh = function() {
        return new Promise(
            function(resolve, reject) {
                loadMapSheet().then(function(spreadsheet) {
                    return new Promise(
                        function(onDataResolved, onDataRejected) {
                            spreadsheet.receive(function(err, rows, info) {
                                if (err) {
                                    onDataRejected(err);
                                } else {
                                    onDataResolved(rows, info);
                                }
                            });
                        }
                    );
                }).then(function(rows, info) {
                    var MapState = mongoose.model('MapState');
                    var stateData = self.createMapState(rows, info);
                    var mapState = new MapState({
                        "hexes": [],
                        "time": stateData.time
                    });
                    stateData.hexes.forEach(function(hex) {
                        var hexEO = mapState.hexes.create(hex);
                        mapState.hexes.push(hexEO);
                    });
                    mapState.save(function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(mapState);
                        }
                    });
                }).catch(function(err) {
                    console.error("SyncManager.forceRefresh error!");
                    throw err;
                });
            }
        );
    };

    this.createMapState = function(rows, info) {
        var hexList = [],
            rowKey,
            row,
            hex,
            Index = config.spreadsheet.indexes,
            rowEnd = config.spreadsheet.mapEndRow;
        for (var i=config.spreadsheet.mapStartRow; i<=rowEnd; i++) {
            rowKey = String(i);
            if (_.has(rows, rowKey)) {
                row = rows[rowKey];
                // get hex id, h and v
                var h = row[Index.H].toLowerCase(),
                    v = row[Index.V],
                    hexId = h + v,
                    landform = null,
                    owner = null,
                    players = [],
                    buildings = [null, null, null, null],
                    destroyed = false,
                    underAttack = false,
                    warriors = 0,
                    gold = 0,
                    horses = 0,
                    glory = 0;
                // get owner
                if (!hasNoValue(row, Index.TEAM)) {
                    owner = row[Index.TEAM].toLowerCase();
                }
                // get players
                if (!hasNoValue(row, Index.PLAYERS) && String(row[Index.PLAYERS]).indexOf(",") > -1) {
                    players = row[Index.PLAYERS].split(",");
                } else if (!hasNoValue(row, Index.PLAYERS)) {
                    players = [ row[Index.PLAYERS] ];
                }
                // get buildings
                if (!hasNoValue(row, Index.BUILDING1)) {
                    buildings[0] = row[Index.BUILDING1].toLowerCase();
                }
                if (!hasNoValue(row, Index.BUILDING2)) {
                    buildings[1] = row[Index.BUILDING2].toLowerCase();
                }
                if (!hasNoValue(row, Index.BUILDING3)) {
                    buildings[2] = row[Index.BUILDING3].toLowerCase();
                }
                if (!hasNoValue(row, Index.BUILDING4)) {
                    buildings[3] = row[Index.BUILDING4].toLowerCase();
                }
                // get if it's destroyed
                if (!hasNoValue(row, Index.DESTROYED) && row[Index.DESTROYED] === "DESTROYED") {
                    destroyed = true;
                }
                // get if it's under attack
                if (!hasNoValue(row, Index.UNDER_ATTACK) && row[Index.UNDER_ATTACK] === "YES") {
                    underAttack = true;
                }
                // get landform
                if (!hasNoValue(row, Index.LANDFORM)) {
                    landform = row[Index.LANDFORM];
                }
                // calculate warriors, gold, etc. just for kicks
                if (!destroyed && owner !== null) {
                    warriors = (_.contains(buildings, "barracks")) ? 4 : 2;
                    gold = (_.contains(buildings, "mine")) ? 2 : 1;
                    horses = (_.contains(buildings, "stable")) ? 2 : 1;
                    glory = (_.contains(buildings, "temple")) ? 2 : 0;
                }
                hexList.push({
                    "hexId": hexId,
                    "h": h,
                    "v": v,
                    "landform": landform,
                    "owner": owner,
                    "players": players,
                    "buildings": buildings,
                    "destroyed": destroyed,
                    "underAttack": underAttack,
                    "warriors": warriors,
                    "gold": gold,
                    "horses": horses,
                    "glory": glory
                });
            }
        }
        return {
            "hexes": hexList,
            "time": _.has(info, 'worksheetUpdated') ? info.worksheetUpdated : new Date()
        };
    };

    this.loadPlayers = function() {
        return new Promise(
            function(resolve, reject) {
                Spreadsheet.load({
                    debug: true,
                    spreadsheetId: config.spreadsheet.sheetId,
                    worksheetId: config.spreadsheet.playerWorksheetId,
                    oauth: {
                        email: config.spreadsheet.serviceAccount,
                        keyFile: config.spreadsheet.keyFile
                    }
                }, function sheetReady(err, spreadsheet) {
                    if (err) throw err;
                    spreadsheet.receive(function(err, rows, info) {
                        if (err) throw err;
                        var playerData = self.getPlayerData(rows),
                            promises = [];
                        playerData.forEach(function(player) {
                            promises.push(self.updateOrCreatePlayer(player));
                        });
                        Promise.all(promises).then(function(results) {
                            resolve(results);
                        }).catch(function(results) {
                            reject(results);
                        });
                    });
                });
            }
        );
    };

    this.getPlayerData = function(rows) {
        var data = [],
            Index = config.spreadsheet.playerIndexes,
            startRow = config.spreadsheet.playerStartRow,
            endRow = config.spreadsheet.playerEndRow;
        for (var i=startRow; i<=endRow; i++) {
            var rowKey = String(i);
            if (_.has(rows, rowKey)) {
                var row = rows[rowKey],
                    id = row[Index.ID],
                    team = row[Index.TEAM].toLowerCase(),
                    name = row[Index.NAME],
                    icon = null,
                    dead = false;
                if (!hasNoValue(row, Index.ICON)) {
                    icon = row[Index.ICON];
                }
                if (!hasNoValue(row, Index.DEAD) && row[Index.DEAD] === "DEAD") {
                    dead = true;
                }
                data.push({
                    "playerId": id,
                    "team": team,
                    "name": name,
                    "icon": icon,
                    "dead": dead
                });
            }
        }
        return data;
    };

    this.updateOrCreatePlayer = function(playerInfo) {
        return new Promise(
            function(resolve, reject) {
                mongoose.model('Player').findOneAndUpdate(
                    {"playerId": playerInfo.playerId},
                    playerInfo,
                    {'upsert': true, 'new': true},
                    function(err, player) {
                        if (err) throw err;
                        if (_.isUndefined(player) || _.isNull(player)) {
                            resolve(playerInfo);
                        } else {
                            resolve(player.toObject());
                        }
                    }
                );
            }
        );
    };
};

module.exports = new SyncManager();