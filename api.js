var ApiController = function(app, config) {

    var Spreadsheet = require('edit-google-spreadsheet');
    var mongoose = require('mongoose');
    var _ = require('underscore');
    var syncManager = require('./sync');

    /* MAP API FUNCTIONS */

    app.get("/api/map/refresh", function(req, res) {
        syncManager.refresh().then(function(mapState) {
            res.status(200).json(mapState.toObject());
        }).catch(function(err) {
            res.status(500).json(err);
        });
    });

    /* hit this url in the browser to force the map data to refresh */
    app.get("/api/map/forceRefresh", function(req, res) {
        syncManager.forceRefresh().then(function(mapState) {
            res.status(200).json(mapState.toObject());
        }).catch(function(err) {
            res.status(500).json(err);
        });
    });

    app.get("/api/map", function(req, res) {
        mongoose.model('MapState').getCurrent().then(function(mapState) {
            res.status(200).json({"map": mapState.toObject(), "time": new Date()});
        }).catch(function(err) {
            res.status(500).json({"error": err});
        });
    });

    app.get("/api/map/history", function(req, res) {
        var limit = 10;
        if (_.has(req.params, 'limit')) {
            limit = Number(req.params.limit);
        }
        mongoose.model('MapState').getAll(limit).then(function(states) {
            res.status(200).json({"states": states, "limit": limit, "time": new Date()});
        }).catch(function(err) {
            res.status(500).json({"error": err});
        });
    });

    /* PLAYER/THANE API FUNCTIONS */

    app.get("/api/thanes", function(req, res) {
        mongoose.model('Player').getAll().then(function(players) {
            res.status(200).json({"thanes": players, "time": new Date()});
        }).catch(function(err) {
            res.status(500).json({"error": err});
        });
    });

    /* hit this url in the browser to force player/thane data to refresh */
    app.get("/api/thanes/forceRefresh", function(req, res) {
        syncManager.loadPlayers().then(function(players) {
            res.status(200).json({"players": players});
        }).catch(function(err) {
            res.status(500).json(err);
        });
    });

    
    return app;
};
module.exports = ApiController;