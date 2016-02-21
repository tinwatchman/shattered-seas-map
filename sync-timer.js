/**
 * SyncTimer class - class that handles polling and
 * syncing the server's data with that in the spreadsheet
 */
var SyncTimer = function() {

    var mongoose = require('mongoose');
    var _ = require('underscore');
    var ModelController = require('./model');
    var syncManager = require('./sync');
    var config = require('./config');

    var self = this;
    var isRunning = false;
    var isLoading = false;
    var isLoadingThanes = false;
    var rate = config.mapRefreshRate;
    var thaneRate = config.thaneRefreshRate;
    var timer = null;
    var thaneTimer = null;

    var prepDatabase = function() {
        return new Promise(
            function(resolve, reject) {
                if (mongoose.connection.readyState === 0) {
                    mongoose.connect(config.database.uri, config.database.options, function(err) {
                        if (err) return reject(err);
                        mongoose.set('debug', true);
                        ModelController(mongoose, config);
                        resolve();
                    });
                } else if (mongoose.connection.readyState === 2) {
                    mongoose.connection.on('connected', function() {
                        mongoose.set('debug', true);
                        ModelController(mongoose, config);
                        resolve();
                    });
                }
                resolve();
            }
        );
    };

    this.start = function() {
        if (!isRunning && timer === null) {
            console.log("SyncTimer.start");
            isRunning = true;
            prepDatabase().then(function() {
                timer = setInterval(function() {
                    self.load();
                }, rate);
                thaneTimer = setInterval(function() {
                    self.loadThanes();
                }, thaneRate);
                syncManager.forceRefresh();
            }).catch(function(err) {
                console.error("SyncTimer.start ERROR");
                console.error(err);
                console.log("SyncTimer.start ERROR");
                console.dir(err);
                //TODO: handle error
            });
        }
    };

    this.load = function() {
        console.log("SyncTimer.load");
        if (!isLoading) {
            isLoading = true;
            prepDatabase().then(function() {
                syncManager.refresh().then(function() {
                    isLoading = false;
                }).catch(function(err) {
                    console.error("SyncTimer.load => syncManager.refresh ERROR");
                    console.error(err);
                    console.log("SyncTimer.load => syncManager.refresh ERROR");
                    console.dir(err);
                    //TODO: handle error
                });
            }).catch(function(err) {
                console.error("SyncTimer.load ERROR");
                console.error(err);
                console.log("SyncTimer.load ERROR");
                console.dir(err);
                //TODO: handle error
            });
        }
    };

    this.loadThanes = function() {
        console.log("SyncTimer.loadThanes");
        if (!isLoadingThanes && !isLoading) {
            isLoadingThanes = true;
            prepDatabase().then(function() {
                syncManager.loadPlayers().then(function() {
                    isLoadingThanes = false;
                }).catch(function(err) {
                    console.error("SyncTimer.loadThanes => syncManager.refresh ERROR");
                    console.error(err);
                    console.log("SyncTimer.loadThanes => syncManager.refresh ERROR");
                    console.dir(err);
                    //TODO: handle error
                });
            }).catch(function(err) {
                console.error("SyncTimer.loadThanes ERROR");
                console.error(err);
                console.log("SyncTimer.loadThanes ERROR");
                console.dir(err);
                //TODO: handle error
            });
        }
    };

    this.stop = function() {
        console.log("SyncTimer.stop");
        if (isRunning && timer !== null) {
            clearInterval(timer);
            timer = null;
            clearInterval(thaneTimer);
            thaneTimer = null;
            isRunning = false;
            isLoading = false;
            isLoadingThanes = false;
        }
    };

    this.isStarted = function() {
        return isRunning;
    };
};
module.exports = new SyncTimer();