module.exports = (function() {
    var config = {};
    var isProduction = (process.env.NODE_ENV === "production");

    if (isProduction) {
        config.host = null;
        config.port = (process.env.PORT !== undefined) ? process.env.PORT : 5000;
    } else {
        config.host = "localhost";
        config.port = 3000;
    }

    // DATABASE SETUP
    config.database = {};
    if (isProduction) {
        config.database.uri = /* {{PRODUCTION DATABASE URL}} */;
        config.database.options = {};
    } else {
        config.database.uri = /* {{LOCAL DATABASE URL}} */;
        config.database.options = {};
    }

    // SPREADSHEET SETUP - PROD
    config.spreadsheet = {
        sheetId: "{{SPREADSHEET ID}}",
        serviceAccount: "{{SERVICE GOOGLE ACCOUNT}}",
        keyFile: /* {{SERVICE ACCOUNT PRIVATE CERTIFICATE}} */,
        mapWorksheetId: "{{WORKSHEET ID}}",
        playerWorksheetId: "{{WORKSHEET ID}}",
        mapStartRow: 2,
        mapEndRow: 120,
        playerStartRow: 2,
        playerEndRow: 39
    };
    
    // INDEXES
    config.spreadsheet.indexes = {
        H: "1",
        V: "2",
        TEAM: "4",
        PLAYERS: "5",
        BUILDING1: "6",
        BUILDING2: "7",
        BUILDING3: "8",
        BUILDING4: "9",
        DESTROYED: "11",
        UNDER_ATTACK: "10",
        LANDFORM: "3"
    };
    config.spreadsheet.playerIndexes = {
        ID: "1",
        TEAM: "2",
        NAME: "3",
        ICON: "4",
        DEAD: "5"
    };

    // REFRESH RATES
    config.mapRefreshRate = 30000;
    config.thaneRefreshRate = 120000;
    config.mapClientRefreshRate = 15000;
    config.thaneClientRefreshRate = 60000;
    config.historyUrl = "/api/map/history";
    config.mapUrl = "/api/map";
    config.playerUrl = "/api/thanes";

    // STATIC ASSET PATH
    config.assetPath = __dirname + "/assets";

    // VIEW CONFIG
    config.views = {
        defaultLayout: null,
        isViewCacheEnabled: false
    };

    return config;
})();