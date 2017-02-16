var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var cors = require('cors');
var mqttService  = require('mqtt');

//default, or overwrite in the individual methods
var key= fs.readFileSync('./key.pem');
var cert= fs.readFileSync('./server.pem');
var amqHost='broker-amq-mqtt-ssl-xpaas-amq.cloudapps.demo.com';
var amqPort=443;
var amqProtocol="mqtts://";
var amqUsername='admin';
var amqPassword='admin';
var passphasePassword='password';
var topic="my.topic";
var options={
  host: amqHost,
  port: amqPort,
  key:key,
  cert:cert,
  passphrase: passphasePassword,
  username: amqUsername,
  password: amqPassword,
  servername : amqHost,
  rejectUnauthorized: false
};

var url=amqProtocol+amqHost+":"+amqPort;

var clients=new Array();
var messages=new Array();

function mqttRoute() {
  var mqtt = new express.Router();
  mqtt.use(cors());
  mqtt.use(bodyParser());



  // POST REST endpoint - note we use 'body-parser' middleware above to parse the request body in this route.
  // This can also be added in application.js
  // See: https://github.com/senchalabs/connect#middleware for a list of Express 4 middleware
  mqtt.post('/connect', function(req, res) {
    console.log('MQTT CONNECT - ' +req.body.clientId);
    //connect as client
    console.log('connecting....');
   var  client=clients[req.body.clientId];
if (!client) {
   client=mqttService.connect(url,options);

      client.on('connect', () => {
      console.log('connected');
      client.subscribe(topic);
      console.log('subscribed to topic - '+topic);
      clients[req.body.clientId]=client;
      console.log('clients size '+clients.length);
    }); //on connect
} else {

  console.log('client exist');
}

      client.on('message', (topic, message) => {
        console.log('message received by '+req.body.clientId+':'+message);
        messages.push(message);

        if(this.topic === topic) {
          connected = (this.message.toString() === message);
        }
      });

    res.json({msg: 'client id  '+req.body.clientId});
  });

mqtt.post('/pub', function(req, res) {
    console.log('MQTT CLIENT Pub - ' +req.body.clientId);
    console.log('MQTT CLIENT Pub - ' +req.body.amqMsg);
    //connect as client
    var client=clients[req.body.clientId];
    console.log('got client '+client);
    client.publish(topic, req.body.amqMsg);
    console.log(client+ '  published message '+req.body.amqMsg );


/*  client.on('message', (topic, message) => {
    console.log('message received :'+message);
    if(this.topic === topic) {
      connected = (this.message.toString() === message);
    }
  });*/



    res.json({msg: 'client id  '+req.body.clientId});
  });


  mqtt.post('/', function(req, res) {
    console.log('MQTT - ' +req.body.clientId);
    var client=clients[req.body.clientId];
  
    var message=messages.pop();
    if (!message) {
      message='no more messages';
    }
    res.json({msg: ''+message});
  });

  return mqtt;
}

module.exports = mqttRoute;
