module.exports = function(app, config) {    
    
    var express = require('express');
    
    app.use('/assets', express.static(config.assetPath));
    
};