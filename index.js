var nodeimu = require('nodeimu');
var IMU = new nodeimu.IMU();
var os = require('os');

console.log(os.hostname());
var robotData = {};
robotData.counter = 0;
robotData.timestamp = Date.now();
robotData.odometer = 0;

var irobot = require('./irobot');
var robot = new irobot.Robot('/dev/ttyUSB0');

robot.on('sensordata', function(data) {
    console.log("data", data.cliff_sensors);
    robotData.botSensors = data;
    robotData.cliff_R = data.cliff_sensors.right.signal.raw;
    robotData.cliff_FR = data.cliff_sensors.front_right.signal.raw;
    robotData.cliff_FL = data.cliff_sensors.front_left.signal.raw;
    robotData.cliff_L = data.cliff_sensors.left.signal.raw;
    //if(Math.random() > .999) console.log(robotData);

    robotData.volts = data.battery.voltage.volts;
    robotData.bumpLeft = data.bumpers.left.activated;
    robotData.bumpRight = data.bumpers.right.activated;
    robotData.bumpBoth = data.bumpers.both.activated;
});

var socket = require('socket.io-client')('http://math.seattleacademy.org:1500');
socket.on('connect', function() {
    console.log("connect");
    placeBot();
});
socket.on('postAllBots', function(bots) {
    //console.warn('postAllBots',bots);

    for (var i = 0; i < bots.length; i++) {
        if (bot[i]) {
            if (bot[i].name == os.hostname()) {
                //console.log(bot[i]);
                console.log('L:', bot[i].vL, "  R: ", bot[i].vR);
            }
        }
    }
    // console.log("postAllBots", bots)

});
socket.on('disconnect', function() {

    console.log("disconnect");
});
var sensors = {};
sensors.counter = 0;
var counter = 0;
var bot = {};

function placeBot() {

    bot.x = 250;
    bot.y = 268;
    bot.color = "red";
    bot.name = os.hostname();
    bot.r = 15;
    bot.theta = 0;
    //bot.vL = 0;
    //bot.vR = 0;
    bot.volts = robotData.volts;
    bot.sensors = robotData.sensors;

    IMU.getValue(function(err, data) {
        var tempo = 4;
        var pitch = Math.pow(2, 4 / 12);

        function moveBot(vL, vR) {
            robot.drive({ left: vL, right: vR });
        }

        function singBot(song) {
            robot.sing(song);
        }

        if (err) throw err;
        sensors = data;
        sensors.counter = counter++;
        bot.counter = counter;
        //bot.humidity = sensors.humidity.toFixed(0);
        bot.humidity = robotData.cliff_R;
        socket.emit("postbot", bot);
        bot.heading = data.fusionPose.z * 180 / Math.PI;
        if (robotData.cliff_R > 650) {
            //console.log("hit cliff right");
            // robot.sing([[120,500]]);
        }

        if (bot.heading < 0) bot.heading += 360;
        if (robotData.cliff_FR > 700) {
            robot.sing([
                [150, 500]
            ]);
        }

        leds = {
            play: true,
            advance: false,
            power_color: 0.2,
            power_intensity: 0.65
        }
        robot.setLEDs(leds);

        if (robotData.bumpBoth == true) {
            console.log("bumpBoth");
            var backupSong = [
                [880, 100]
            ];
            setTimeout(moveBot, 0, -50, -50);
            setTimeout(singBot, 100, backupSong);
            setTimeout(singBot, 1100, backupSong);
            setTimeout(singBot, 2100, backupSong);
            setTimeout(singBot, 3100, backupSong);
            setTimeout(moveBot, 4000, -50, 50);
            setTimeout(moveBot, 8000, 50, 50);
            setTimeout(moveBot, 12000, 0, 0);

            //robot.drive({ left: '-20', right: '-40' });
            //robot.drive({ left: '-20', right: '-40' });
        } else
        if (robotData.bumpLeft == true) {
            robot.sing([
                [330 * pitch, 100 * tempo], //e
                [295 * pitch, 100 * tempo], //d
                [262 * pitch, 100 * tempo], //c
                [295 * pitch, 100 * tempo], //d
                [330 * pitch, 100 * tempo], //e
                [330 * pitch, 100 * tempo], //e
                [330 * pitch, 200 * tempo] //e

            ]);
        } else
        if (robotData.bumpRight == true) {
            console.log("bumpRight")
            robot.sing([
                [220, 100],
                [110, 200]
            ]); //robot.drive({ left: '-20', right: '-40' });
        }


        //robot.drive({ left: '-20', right: '20' });
    });
}

placeBot();
setInterval(placeBot, 100);
