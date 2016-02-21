var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var _ = require('underscore');
var ModelController = require('./model');
var ApiController = require('./api');
var AssetController = require('./asset');
var ViewController = require('./view');
var ReportController = require('./report');
var timer = require('./sync-timer');

var Server = function(config) {
    var host = config.host,
        port = config.port,
        app = express(),
        server = null;

    // database setup
    app.use(function(req, res, next) {
        mongoose.connect(config.database.uri, config.database.options, function(err) {
            if (arguments.length > 0 && err !== null && _.has(err, 'name') && err.name === "MongoError") {
                res.status(500).send({"message": "Could not connect to database!", "error": err});
                return;
            }
            mongoose.set('debug', true);
            ModelController(mongoose, config);
            next();
        });
    });

    app.use(function(req, res, next) {
        var today = new Date();
        var isAfterSeven = (today.getUTCHours() >= 12);
        if (isAfterSeven && !timer.isStarted()) {
            timer.start();
        } else if (!isAfterSeven && timer.isStarted()) {
            timer.stop();
        }
        next();
    });

    // middleware
    app.use(helmet());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // controllers
    ApiController(app, config);
    AssetController(app, config);
    ViewController(app, config);
    ReportController(app, config);

    this.start = function() {
        if (host !== null) {
            server = app.listen(port, host, function() {
                console.log("App listening at http://%s:%s", host, port);
            });
        } else {
            server = app.listen(port, function() {
                console.log("App listening on port %s", port);
            });
        }
    };
};
Server.prototype = {};
module.exports = Server;