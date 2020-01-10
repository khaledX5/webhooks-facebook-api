
// om namah shivay

// requires
const _ = require('lodash');
const winston = require('winston');

// module variables
const config = require('./config.json');
const defaultConfig = config.development;
const environment = process.env.NODE_ENV || 'development';
const environmentConfig = config[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);
const MqttCardentials = config.Mqtt;
const MysqlCardentials = config.Mysql;
// as a best practice
// all global variables should be referenced via global. syntax
// and their names should always begin with g
global.Mqtt= MqttCardentials;
global.mysqlConfig= MysqlCardentials;

// Logger configuration
const logConfiguration = {
  'transports': [
      new winston.transports.File({
          filename: './logs/ussd.log',
        level: 'debug' 
      })
  ]
};

// Create the logger
const logger = winston.createLogger(logConfiguration);

global.logger = logger;
module.exports = {
    "global":global,
    "development": config.development
}