var ReviewViewModel = function() {
    var self = this;

    moment.tz.add("America/New_York|EST EDT EWT EPT|50 40 40 40|01010101010101010101010101010101010101010101010102301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-261t0 1nX0 11B0 1nX0 11B0 1qL0 1a10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 RB0 8x40 iv0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|21e6");
    
    this.isInitialized = true;
    this.isLoading = ko.observable(true);
    this.isError = ko.observable(false);
    this.isReady = ko.observable(false);
    this.states = ko.observableArray();

    // player controls
    this.frame = ko.observable(0);
    this.totalFrames = ko.observable(0);
    this.currentFrame = ko.observable();
    this.isPlaying = ko.observable(false);
    var playTimer = null;

    this.displayFrame = ko.pureComputed(function() {
        if (this.isReady()) {
            return this.frame() + 1;
        }
        return 0;
    }, this);

    this.playBtnIcon = ko.pureComputed(function() {
        if (this.isPlaying()) {
            return "glyphicon glyphicon-pause";
        }
        return "glyphicon glyphicon-play";
    }, this);

    this.playBtnClass = ko.pureComputed(function() {
        if (this.isPlaying()) {
            return "btn btn-success btn-block";
        }
        return "btn btn-primary btn-block";
    }, this);

    this.progressBarClass = ko.pureComputed(function() {
        if (this.isPlaying()) {
            return "progress-bar progress-bar-success";
        }
        return "progress-bar progress-bar-primary";
    }, this);

    this.progressWidth = ko.pureComputed(function() {
        if (this.isReady()) {
            return ((this.frame()+1)/this.totalFrames())*100;
        }
        return 0;
    }, this);

    this.progressText = ko.pureComputed(function() {
        return "Step " + (this.frame()+1) + " of " + this.totalFrames();
    }, this);

    var stopPlay = function() {
        window.clearInterval(playTimer);
        playTimer = null;
        self.isPlaying(false);
    };

    this.onPlay = function() {
        if (this.isPlaying()) {
            // if playing
            stopPlay();
        } else {
            // if paused
            if ((this.frame()+1) === this.totalFrames()) {
                this.frame(0);
            }
            playTimer = window.setInterval(function() {
                self.onNext();
            }, 1000);
            this.isPlaying(true);
            this.onNext();
        }
    };

    this.onNext = function() {
        var nextFrame = this.frame() + 1,
            total = this.totalFrames();
        if (nextFrame < total) {
            this.frame(nextFrame);
            this.refresh();
        } else if (nextFrame >= total && this.isPlaying()) {
            stopPlay();
        }
    };

    this.onBack = function() {
        var frameNum = this.frame();
        if (frameNum > 0) {
            this.frame(frameNum-1);
            this.refresh();
        }
    };

    this.refresh = function() {
        if (this.isReady()) {
            var n = this.frame();
            var s = this.states()[n];
            this.currentFrame(s);
        }
    };

    this.onSkipTo = function() {
        var input = window.prompt("Skip to frame number:", "1");
        var num = Number(input);
        if ( (isNaN(num) && input.length > 0) ||
             num <= 0 || num > this.totalFrames() ) {
            window.alert("Please enter a valid frame number between 1 and " + this.totalFrames());
        } else if (input.length > 0) {
            this.frame(num-1);
            this.refresh();
        }
    };

    // initial load
    $.ajax({
        "url": "/assets/data/review.json",
        "method": "GET",
        "dataType": "json",
        "success": function(response) {
            try {
                response.states.forEach(function(state) {
                    self.states.push(new MapStateViewModel(state));
                });
                self.totalFrames(response.length);
                self.frame(0);
                self.isReady(true);
                self.refresh();
            } catch (e) {
                self.isError(true);
            }
            self.isLoading(false);
        },
        "error": function(err) {
            self.isError(true);
            self.isLoading(false);
            self.isReady(false);
        }
    });

    ko.applyBindings(this);
}
ReviewViewModel.prototype = {};

var MapStateViewModel = function(data) {
    var self = this;
    this._id = data._id;
    this.created = ko.observable(moment(data.created).local());
    this.hexes = ko.observableArray();
    this.label = ko.pureComputed(function() {
        return this.created().tz('America/New_York').format("ddd MM/DD/YY h:mm A z");
    }, this);
    // create hexes
    data.hexes.forEach(function(hex) {
        self.hexes.push(new HexViewModel(hex));
    });
};
MapStateViewModel.prototype = {};

var HexViewModel = function(data) {
    var self = this;

    this.hexId = ko.observable(data.hexId);
    this.landform = ko.observable(data.landform);
    this.destroyed = ko.observable(data.destroyed);
    this.underAttack = ko.observable(data.underAttack);
    this.owner = ko.observable(data.owner);
    this.players = ko.observableArray();

    // players
    if (data.players.length > 0) {
        data.players.forEach(function(player) {
            self.players.push(new PlayerViewModel(player));
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
    this.name = ko.observable(data.name);
    this.team = ko.observable(data.team);
    this.icon = ko.observable(data.icon);

    this.playerClass = ko.pureComputed(function() {
        return "playerIcon " + this.icon();
    }, this);
};
PlayerViewModel.prototype = {};

ko.bindingHandlers.percentWidth = {
    update: function(element, valueAccessor) {
        var value = ko.unwrap(valueAccessor());
        if (value) {
            $(element).width(value + "%");
        }
    }
}
