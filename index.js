var nodeimu = require('nodeimu');
var IMU = new nodeimu.IMU();

var robotData = {};
robotData.counter = 0;
robotData.timestamp = Date.now();
robotData.mac = networkInterfaces.wlan0[0].mac;
robotData.odometer = 0;

var irobot = require('./irobot');
var robot = new irobot.Robot('/dev/ttyUSB0');

robot.on('sensordata', function(data) {
    //console.log(data);
    robotData.volts = data.battery.voltage.volts;
});

var socket = require('socket.io-client')('http://math.seattleacademy.org:1500');
socket.on('connect', function() {
    console.log("connect");
    placeBot();
});
socket.on('drawAllBots', function(bots) {
    for (var i = 0; i < bots.length; i++) {
        if (bot[i].color == 'blue') {
            console.log('L:', bot[i].vL, "  R: ", bot[i].vR);
        }
    }
    console.log("drawAllBots", bots)

});
socket.on('disconnect', function() {

    console.log("disconnect");
});
var sensors = {};
sensors.counter = 0;
var counter = 0;

function placeBot() {
    var bot = {};
    bot.x = 300;
    bot.y = 200;
    bot.color = "blue";
    bot.r = 15;
    bot.theta = Math.random() * 360;
    bot.vL = 0;
    bot.vR = 0;
    bot.volts = robotData.volts;

    IMU.getValue(function(err, data) {
        if (err) throw err;
        sensors = data;
        sensors.counter = counter++;
        bot.counter = counter;
        bot.humidity = sensors.humidity.toFixed(0);
        socket.emit("postbot", bot);
        //robot.drive({ left: '-20', right: '20' });
    });
}

placeBot();
