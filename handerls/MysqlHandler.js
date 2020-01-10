
//configuring the AWS environment
let mysql = require('mysql');
let con;


exports.openConnection = () => {
  logger.info(`openConnection`);
  con =  mysql.createConnection({
      host: global.mysqlConfig.host,
      user:  global.mysqlConfig.user,
      password:  global.mysqlConfig.password,
      database:  global.mysqlConfig.database,
      port:global.mysqlConfig.port
    })

    con.connect(function(err) {
        if (err) {
          logger.error(`openConnection:con.connect:with_error[${err.message}]`);
          throw err;
        }
        logger.info(`openConnection:con.connect:with_success`);
    });
};
exports.closeConnection = () => {
  con.end(function(err) {
    if (err) {
      logger.error(`closeConnection:con.end:with_error[${err.message}]`);
      throw err;
    }
    logger.info(`closeConnection:con.end:with_success`);

  });
};

exports.do = async (q) => {
  logger.debug(`do:with_query[${q}]`);
  let result = await new Promise((resolve, reject) => {
    this.openConnection();
      con.query(q, function (err, result) {     
          if (err) {
            logger.error(`do:con.query:with_error[${err.message}]`);
            return reject(err);
          }
          if (result) {
            return resolve(result);   
          }
      });   
      this.closeConnection();
  });
  logger.debug(`do:with_result[${JSON.stringify(result)}]`);
  return result;


};


