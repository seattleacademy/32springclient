var nodeimu = require('nodeimu');
var IMU = new nodeimu.IMU();

var robotData = {};
robotData.counter = 0;
robotData.timestamp = Date.now();
//robotData.mac = networkInterfaces.wlan0[0].mac;
robotData.odometer = 0;

var irobot = require('./irobot');
var robot = new irobot.Robot('/dev/ttyUSB0');

robot.on('sensordata', function(data) {
    //console.log(data);
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
    //console.log(bots);
    // for (var i = 0; i < bots.length; i++) {
    //     if (bot[i].color == 'red') {
    //         console.log(bot[i]);
    //         console.log('L:', bot[i].vL, "  R: ", bot[i].vR);
    //     }
    // }
    console.log("postAllBots", bots)

});
socket.on('disconnect', function() {

    console.log("disconnect");
});
var sensors = {};
sensors.counter = 0;
var counter = 0;
var bot = {};

function placeBot() {

    bot.x = 100;
    bot.y = 200;
    bot.color = "red";
    bot.r = 15;
    bot.theta = 0;
    bot.vL = 0;
    bot.vR = 0;
    bot.volts = robotData.volts;

    IMU.getValue(function(err, data) {
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
        bot.humidity = sensors.humidity.toFixed(0);
        socket.emit("postbot", bot);
        bot.heading = data.fusionPose.z * 180 / Math.PI;
        if (bot.heading < 0) bot.heading += 360;

        if (robotData.bumpBoth == true) {
            console.log("bumpBoth");
            var backupSong = [[880,100]];
            setTimeout(moveBot, 0, -50, -50);
            setTimeout(singBot,100,backupSong);
            setTimeout(singBot,1100,backupSong);
            setTimeout(singBot,2100,backupSong);
            setTimeout(singBot,3100,backupSong);
            setTimeout(moveBot, 4000, -50, 50);
            setTimeout(moveBot, 8000, 50, 50);
            setTimeout(moveBot, 12000, 0, 0);

            //robot.drive({ left: '-20', right: '-40' });
            //robot.drive({ left: '-20', right: '-40' });
        } else
        if (robotData.bumpLeft == true) {
            robot.sing([
                [440, 200],
                [220, 100]
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
setInterval(placeBot, 1000);
