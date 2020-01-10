var createError = require('http-errors');
var express = require('express');
var path = require('path');
var app = express();
const config = require('./config/config.js');
let routes  = require('./routes/Webhook');
let bodyParser = require('body-parser');
let fs = require('fs');
let morgan = require('morgan');

var accessLogStream = fs.createWriteStream(
  path.join(__dirname, './logs/webhook.log'), {flags: 'a'}
);
// setup the logger 
app.use(morgan('combined', {stream: accessLogStream}));


app.use(bodyParser.json());

app.use('/', routes);

//app.use(global.gConfig.config_id);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

});

module.exports = app;