module.exports = function(mongoose, config) {

    var Schema = require('mongoose').Schema;
    var _ = require('underscore');

    if (!_.has(mongoose.models, 'MapState') || _.isUndefined(mongoose.models.MapState) || _.isNull(mongoose.models.MapState)) {
        var PlayerSchema = new Schema({
            playerId: { type: String, required: true, index: true, unique: true },
            name: { type: String },
            team: { type: String },
            icon: { type: String },
            dead: { type: Boolean, "default": false }
        }, {
            timestamps: {
                createdAt: "created",
                updatedAt: "updated"
            }
        });

        var HexSchema = new Schema({
            "hexId": {type: String, required: true},
            "h": {type: String, required: true},
            "v": {type: String, required: true},
            "landform": {type: String, "default": null},
            "owner": {type: String, "default": null},
            "players": {type: [String], "default": []},
            "buildings": {type: [String], "default": [null, null, null, null]},
            "underAttack": {type: Boolean, "default": false},
            "destroyed": {type: Boolean, "default": false},
            "warriors": {type: Number, "default": 0},
            "gold": {type: Number, "default": 0},
            "horses": {type: Number, "default": 0},
            "glory": {type: Number, "default": 0}
        }, {
            timestamps: {
                createdAt: "created",
                updatedAt: "updated"
            }
        });

        var MapStateSchema = new Schema({
            "hexes": [ HexSchema ],
            "time": {type: Date, required: true}
        }, {
            timestamps: {
                createdAt: "created",
                updatedAt: "updated"
            }
        });

        // MapState static methods
        MapStateSchema.statics.getCurrent = function() {
            var self = this;
            return new Promise(
                function(resolve, reject) {
                    self.model('MapState')
                        .findOne()
                        .sort({"created": -1})
                        .exec(function(err, mapState) {
                            if (err !== null) {
                                reject(err);
                            } else if (_.isUndefined(mapState) || _.isNull(mapState)) {
                                resolve(null);
                            } else {
                                resolve(mapState);
                            }
                        }
                    );
                }
            );
        };
        MapStateSchema.statics.getAll = function(limit) {
            var self = this;
            if (_.isUndefined(limit) || _.isNull(limit) || _.isNaN(limit)) {
                limit = 10;
            }
            return new Promise(
                function(resolve, reject) {
                    self.model('MapState')
                        .find()
                        .sort({"created": -1})
                        .limit(10)
                        .exec(function(err, results) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(results);
                            }
                        });
                }
            );
        };

        // Player static methods
        PlayerSchema.statics.getAll = function() {
            var self = this;
            return new Promise(
                function(resolve, reject) {
                    self.model('Player').find().exec(function(err, results) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(results);
                        }
                    });
                }
            );
        };

        var MapState = mongoose.model('MapState', MapStateSchema);
        var Player = mongoose.model('Player', PlayerSchema);
    }

    return;
};