/**
 * ReportController class
 * Gets the data for the end-of-game summary.
 * Wound up being pretty slow, so I just grabbed
 * the data out of it once and saved it as a static
 * JSON file.
 */
var ReportController = function(app, config) {
    var mongoose = require('mongoose');
    var _ = require('underscore');

    var isStateChange = function(previous, next) {
        return _.some(next.hexes, function(nextHex) {
            var prevHex = _.findWhere(previous.hexes, {'hexId': nextHex.hexId});
            var playerDiff = _.difference(nextHex.players, prevHex.players);
            return (
                nextHex.landform !== prevHex.landform ||
                nextHex.owner !== prevHex.owner ||
                nextHex.underAttack !== prevHex.underAttack ||
                nextHex.destroyed !== prevHex.destroyed ||
                nextHex.buildings[0] !== prevHex.buildings[0] ||
                nextHex.buildings[1] !== prevHex.buildings[1] ||
                nextHex.buildings[2] !== prevHex.buildings[2] ||
                nextHex.buildings[3] !== prevHex.buildings[3] ||
                playerDiff.length > 0
            );
        });
    };

    app.get("/api/report", function(req, res) {
        var start = Date.parse("Sat, 23 Jan 2016 09:50:00 EST"),
            end = Date.parse("Sat, 23 Jan 2016 18:30:00 EST");
        mongoose.model('MapState').find({
            created: { $gte: start, $lte: end }
        }).sort({
            created: 1
        }).exec(function(err, results) {
            if (err) throw err;
            var changes = [],
                len = results.length,
                previous = null;
            for (var i=0; i<len; i++) {
                if (previous === null || isStateChange(previous, results[i])) {
                    changes.push(results[i]);
                    previous = results[i];
                }
            }
            res.status(200).json({
                "changes": changes,
                "length": changes.length,
                "time": new Date()
            });
        });
    });

    app.get('/review', function(req, res) {
        res.render('report', {'layout': false, 'config': config});
    });
};
ReportController.prototype = {};
module.exports = ReportController;