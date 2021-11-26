const { spawn, execSync } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');
var waitOn = require('wait-on');
var express = require('express');
var app = express();

app.use('/hasura', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    "/hasura": "/",
  }
}));
app.use('/', createProxyMiddleware({ target: `http://localhost:3007`, changeOrigin: true }));
app.listen(process.env.PORT, () => {
  console.log(`Hello bugfixers! Wrapped app listening at ${process.env.PORT} port`);
})


const deeplinksApp = spawn('npm', ['run', 'heroku-next-start'], {
    env: {
      ...process.env,
      PORT: 3007
    }
  });

deeplinksApp.stdout.on('data', (data) => {
 console.log(`{ "logtype": "app", "log": ${data}`);
});

deeplinksApp.stderr.on('data', (data) => {
  console.log(`{ "logtype": "app", "error": ${data}`);
});

deeplinksApp.on('close', (code) => {
  console.log(`deeplinksApp exited with code ${code}`);
});

var migrations;
var opts = {
  resources: [
    'tcp:localhost:8080',
    'tcp:localhost:3007',
  ],
  delay: 2000, // initial delay in ms, default 0
  interval: 100, // poll interval in ms, default 250ms
  simultaneous: 1, // limit to 1 connection per resource at a time
  timeout: 30000, // timeout in ms, default Infinity
  tcpTimeout: 1000, // tcp timeout in ms, default 300ms
};

waitOn(opts, function (err) {
  if (err) {
    console.log(`{ "logtype": "migrations", "log": "err"`);
  }
  migrations = spawn('npm', ['run', 'migrate']);
  deeplinksApp.stderr.on('data', (data) => {
    console.log(`{ "logtype": "migrations", "error": ${data}`);
  });
  migrations.stdout.on('data', (data) => {
   console.log(`{ "logtype": "migrations", "log": "${data}"`);
  });
  migrations.on('close', (code) => {
    console.log(`migrations exited with code ${code}`);
  });
});