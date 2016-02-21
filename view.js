module.exports = function(app, config) {

    var mongoose = require('mongoose');
    var ExpressHandlebars = require('express-handlebars');

    // handlebars setup
    app.engine('handlebars', ExpressHandlebars({
        defaultLayout: config.views.defaultLayout,
        helpers: {
            toJSON: function(obj) {
                return JSON.stringify(obj);
            }
        }
    }));
    app.set('view engine', 'handlebars');
    if (config.views.isViewCacheEnabled) {
        app.enable('view cache');
    }

    app.get('/', function(req, res) {
        res.render('map', {'layout': false, 'config': config});
    });
};