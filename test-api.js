const http = require('http');

const data = JSON.stringify({
  name: 'Test Bulb',
  serialPrefix: 'TEST',
  warrantyMonths: '12',
  creditPoints: '50',
  quantity: '5'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/product',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
