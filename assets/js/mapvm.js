var MapViewModel = function(data) {
    var self = this,
        historyUrl = data.historyUrl,
        mapUrl = data.mapUrl,
        refreshRate = data.refreshRate,
        playerUrl = data.playerUrl,
        playerRefreshRate = data.playerRefreshRate,
        pollTimer = null,
        playerTimer = null;

    this.isInitialized = true;
    this.isLoading = ko.observable(true);
    this.isError = ko.observable(false);
    this.isNotFound = ko.observable(false);
    this.mapState = ko.observable(null);
    this.states = ko.observableArray();
    this.isRefresh = ko.observable(true);
    this.players = ko.observableArray();

    this.hasMapState = ko.pureComputed(function() {
        return (this.mapState() !== null && !this.isLoading() && !this.isError() && !this.isNotFound());
    }, this);

    // refresh handling
    
    this.refreshText = ko.pureComputed(function() {
        return (this.isRefresh() === true) ? "Refresh On" : "Refresh Off";
    }, this);

    this.onRefreshToggle = function() {
        if (this.isRefresh() === true) {
            window.console.log("turning off refresh");
            this.isRefresh(false);
            $("#refreshToggle").removeClass("active").prop('aria-pressed', false);
            clearPollTimer();
            clearPlayerTimer();
        } else {
            window.console.log("turning on refresh");
            this.isRefresh(true);
            $("#refreshToggle").addClass('active').prop('aria-pressed', true);
            setPollTimer();
            setPlayerTimer();
        }
    };

    // polling
    this.refresh = function() {
        window.console.log("refresh called - " + new Date().toString());
        $.ajax({
            "url": mapUrl,
            "cache": false,
            "dataType": "json",
            "success": function(response) {
                if (response.map && (self.mapState === null || self.mapState._id !== response.map._id)) {
                    self.isLoading(true);
                    var newState = new MapStateViewModel(response.map, self.players());
                    self.states.unshift(newState);
                    self.mapState(newState);
                    self.isLoading(false);
                }
                // regardless, set a new timeout
                window.clearTimeout(pollTimer);
                setPollTimer();
            },
            "error": function(err) {
                // todo: handle error
            }
        });
    };

    this.refreshPlayers = function() {
        window.console.log("refresh players called - " + new Date().toString());
        $.ajax({
            "url": playerUrl,
            "cache": false,
            "dataType": "json",
            "success": function(response) {
                if (response.thanes) {
                    response.thanes.forEach(function(thane) {
                        var playerVM = self.players().find(function(player) {
                            return (player.playerId === thane.playerId);
                        });
                        if (playerVM && playerVM !== undefined && playerVM !== null) {
                            playerVM.update(thane);
                        }
                    });
                }
                // regardless, set a new timeout
                window.clearTimeout(playerTimer);
                setPlayerTimer();
            },
            "error": function(err) {
                // todo: handle error
            }
        });
    };

    var setPollTimer = function() {
        pollTimer = window.setTimeout(function() {
            self.refresh();
        }, refreshRate);
    };

    var clearPollTimer = function() {
        if (pollTimer !== null) {
            window.clearTimeout(pollTimer);
            pollTimer = null;
        }
    };

    var setPlayerTimer = function() {
        playerTimer = window.setTimeout(function() {
            self.refreshPlayers();
        }, playerRefreshRate);
    };

    var clearPlayerTimer = function() {
        if (playerTimer !== null) {
            window.clearTimeout(playerTimer);
            playerTimer = null;
        }
    };

    // initial load - players first, then map states
    $.ajax({
        "url": playerUrl,
        "cache": false,
        "dataType": "json",
        "success": function(response) {
            if (response.thanes) {
                response.thanes.forEach(function(thane) {
                    self.players.push(new PlayerViewModel(thane));
                });
            }
            $.ajax({
                "url": historyUrl,
                "cache": false,
                "dataType": "json",
                "success": function(response) {
                    if (response.states) {
                        response.states.forEach(function(state) {
                            self.states.push(new MapStateViewModel(state, self.players()));
                        });
                        if (self.states().length > 0) {
                            self.mapState(self.states()[0]);
                        }
                    }
                    self.isLoading(false);
                    setPollTimer();
                    setPlayerTimer();
                },
                "error": function(err) {
                    // todo: handle error
                }
            });
        },
        "error": function(err) {
            // todo: handle error
        }
    });

    ko.applyBindings(this);
};
MapViewModel.prototype = {};

var MapStateViewModel = function(data, players) {
    var self = this;
    this._id = data._id;
    this.hexes = ko.observableArray();
    this.time = ko.observable(new Date(data.time));
    this.label = ko.pureComputed(function() {
        if (this.time() !== null) {
            return this.time().toLocaleString();
        }
        return "";
    }, this);
    // create hexes
    data.hexes.forEach(function(hex) {
        self.hexes.push(new HexViewModel(hex, players));
    });
};
MapStateViewModel.prototype = {};

var HexViewModel = function(data, players) {
    this.id = ko.observable(data._id);
    this.hexId = ko.observable(data.hexId);
    this.landform = ko.observable(data.landform);
    this.destroyed = ko.observable(data.destroyed);
    this.underAttack = ko.observable(data.underAttack);
    this.owner = ko.observable(data.owner);
    this.players = ko.observableArray();

    // players
    var self = this;
    if (data.players.length > 0) {
        data.players.forEach(function(playerId) {
            var playerVM = players.find(function(player) {
                return (player.playerId === playerId);
            });
            if (playerVM !== undefined && playerVM !== null) {
                self.players.push(playerVM);
                playerVM.hex(self.hexId());
            }
        });
    }

    this.hexClasses = ko.pureComputed(function() {
        var classList = ["hex"];
        if (this.destroyed() === true) {
            classList.push("hex-destroyed");
        } else if (this.underAttack() === true) {
            classList.push("hex-attacked");
        } else {
            classList.push("hex-normal");
        }
        if (this.owner() !== null) {
            classList.push("team-" + this.owner());
        }
        if (this.landform() !== null) {
            classList.push(this.landform());
        }
        return classList.join(" ");
    }, this);

    this.label = ko.pureComputed(function() {
        return this.hexId().toUpperCase();
    }, this);

    this.hasPlayers = ko.pureComputed(function() {
        return (this.players().length > 0);
    }, this);
};
HexViewModel.prototype = {};

var PlayerViewModel = function(data) {
    this.playerId = data.playerId;
    this.name = ko.observable(data.name);
    this.team = ko.observable(data.team);
    this.icon = ko.observable(data.icon);
    this.dead = ko.observable(data.dead);
    this.hex = ko.observable(null);

    this.hasIcon = ko.pureComputed(function() {
        return (this.icon() !== null);
    }, this);

    this.playerClass = ko.pureComputed(function() {
        return "playerIcon " + this.icon();
    }, this);

    this.src = ko.pureComputed(function() {
        return "/assets/images/" + this.icon() + ".png";
    }, this);

    this.location = ko.pureComputed(function() {
        if (this.hex() !== null) {
            return this.hex().toUpperCase();
        }
        return "";
    }, this);

    this.statusClass = ko.pureComputed(function() {
        if (this.dead() === true) {
            return "text-danger dead";
        }
        return "";
    }, this);

    this.status = ko.pureComputed(function() {
        if (this.dead() === true) {
            return '<strong class="text-danger">DEAD</strong>';
        }
        return '<span class="text-success">Alive</span>';
    }, this);

    this.update = function(data) {
        this.name(data.name);
        this.team(data.team);
        this.icon(data.icon);
        this.dead(data.dead);
    };
};
PlayerViewModel.prototype = {};