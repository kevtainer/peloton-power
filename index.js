const SerialPort = require('serialport')
const Delimiter = require('@serialport/parser-delimiter')
const udp = require('dgram')

const PACKET_DELIMITER = Buffer.from('f6', 'hex');

power = 0;
cadence = 0;

port = new SerialPort('/dev/ttyUSB0', { baudRate: 19200 });
parser = port.pipe(new Delimiter({ delimiter: PACKET_DELIMITER }));
parser.on('data', onSerialMessage);

var client = udp.createSocket('udp4');
var http = require('http'); // 1 - Import Node.js core module

var server = http.createServer(function (req, res) {   // 2 - creating server

  if (req.url == '/metrics') { //check the URL of the current request
        
    // set response header
    res.writeHead(200, { 'Content-Type': 'application/json' }); 
    
    // set response content
    res.write(JSON.stringify({ cadence: cadence, power: power }));

    res.end();
  }
});

server.listen(5000); //3 - listen for any incoming requests

console.log('Node.js web server at port 5000 is running..')
/** 
setInterval(function() {
  data = JSON.stringify({ power, cadence });
  //sending msg
  client.send(data,2222,'localhost',function(error){
    if(error){
      client.close();
    }else{
      console.log('Data sent !!!');
    }
  });
}, 250)*/


function onSerialMessage(data) {
  // @todo handle bike versions (v1/v2) -- data[0]
  switch(data[1]) {
    case 65:
      cadence = decodePeloton(data, data[2], false);
      return;
    case 68:
      power = decodePeloton(data, data[2], true);
      return;
  }
}

function decodePeloton(bufferArray, byteLength, isPower) {
  let decimalPlace = 1;
  let precision = 0.0;
  let accumulator = 0;
  let iteratorOffset = 3;

  for (let iteratorTemp = iteratorOffset; iteratorTemp < iteratorOffset + byteLength; iteratorTemp++) {
    let offsetVal = bufferArray[iteratorTemp] - 48;
    if (offsetVal < 0 || offsetVal > 9) {
      console.log("invalid value detected: ", offsetVal);
      return;
    }

    if (!isPower || iteratorTemp != iteratorOffset) {
      accumulator += (offsetVal * decimalPlace);
      decimalPlace *= 10;
    } else {
      precision = decimalPlace * offsetVal / 10.0;
    }
  }

  return accumulator + precision;
}