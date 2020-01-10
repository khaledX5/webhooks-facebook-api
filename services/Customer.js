let mysqlHandler = require('../handerls/MysqlHandler');
let mqtt = require('../handerls/MqttHandler');
let Promise = require('bluebird');

exports.has_pin = async(customer) => {

  if(customer.pin === null) {
    logger.error(`error:has_pin:with_data[${JSON.stringify(customer)}]:with_status:[{ status:0 }]`);
    return { status:0 };
  }
  logger.debug(`has_pin:with_data[${JSON.stringify(customer)})]:with_status:[{ status:1 }]`);
  return {status:1};
};
exports.verify_customer = async (customer  , pin) => {
  if(customer.pin !== pin) {
    logger.error(`error:verify_customer:with_data[${JSON.stringify(customer),pin}]:with_message:[pin is not correct]`);
    return {errMesage:'pin is not correct'};
  }
  let query  = `select name from customer_type where id ='${customer.type}'   `;
  return mysqlHandler.do(query).then((type)=> {
    logger.debug(`verify_customer:with_data[${JSON.stringify(customer)  , pin}]:with_return:[${JSON.stringify({ customer_name:customer.name , customer_type :type[0].name})}]`);
    return { customer_name:customer.name , customer_type :type[0].name};
  });
};


exports.resetCustomerPIN = async (customer ) => {
  const random_new_pin = Math.floor(1000 + Math.random() * 9000);
  logger.debug(`resetCustomerPIN:with_data[${JSON.stringify(customer)}]`);

  let query  = `update pvmpro.customer Set pin = '${random_new_pin}'  where id = '${customer.id}'   `;
  return mysqlHandler.do(query).then(()=> {
    let message = `Your pin is changed to ${random_new_pin}.`;
    mqtt.sendMessage(JSON.stringify({ 
      message , 
      customer_phone:customer.phone 
    }));
    logger.debug(`resetCustomerPIN:with_data[${JSON.stringify(customer)}]:with_return:{message:'reset is done'}`);

    return {message:'reset is done'};
  });
};

exports.setCustomerPIN = async (customer , pin) => {
  let query  = `update pvmpro.customer Set pin = '${pin}'  where id = '${customer.id}'   `;
  return mysqlHandler.do(query).then((customer)=> {
    logger.debug(`setCustomerPIN:with_data[${JSON.stringify(customer), pin}]:with_return:{message:'set pin is done'}`);
    return { message:'set pin is done' };
  });
};
exports.requestCustomerSupport = async (customer) => {
  let query = `INSERT INTO support (customer_id,status,created_at) 
  values('${customer.id}',1,CURRENT_TIMESTAMP)`;

  logger.debug(`requestCustomerSupport:with_data[${JSON.stringify(customer)}]}`);

  return mysqlHandler.do(query).then((customer)=> {
    logger.debug(`requestCustomerSupport:with_data[${JSON.stringify(customer)}]:with_return:{message:'request support successfully'}`);
    return { message:'request support successfully' };
  });
};
exports.changeCustomerPIN = async (customer , pin , new_pin) => {
  if(customer.pin !== pin) {
    logger.error(`error:changeCustomerPIN:with_data[${JSON.stringify(customer) , pin , new_pin}]:with_return:[{errMesage:'pin is not correct'}]`);
    return {errMesage:'pin is not correct'};
  }
  let query  = `update pvmpro.customer Set pin = '${new_pin}'  where id = '${customer.id}'   `;
  logger.debug(`changeCustomerPIN:with_data[${JSON.stringify(customer) , pin , new_pin}]`);

  return mysqlHandler.do(query).then((customer)=> {
    logger.debug(`changeCustomerPIN:with_data[${JSON.stringify(customer) , pin , new_pin}]:with_return:{ message:'pin changed successfully'}`);
    return { message:'pin changed successfully ' };
  });
};

exports.get_customer_balance = async (customer  , pin) => {
  if(customer.pin !== pin) {
    logger.error(`error:get_customer_balance:with_data[${JSON.stringify(customer) , pin }]:with_return:[{errMesage:'pin is not correct'}]`);
    return {errMesage:'pin is not correct'};
  }
  logger.debug(`get_customer_balance:with_data[${JSON.stringify(customer) , pin }]:with_return:[${ JSON.stringify({ customer_balance:customer.balance })}]`);
  return { customer_balance:customer.balance };
};
exports.topup_customer_balance = async (customer  , pin, amount , balance_type , transaction_id ) => {
  if(customer.pin !== pin){
    logger.error(`error:topup_customer_balance:with_data[${JSON.stringify(customer),pin,amount,balance_type,transaction_id}]:with_return:[{errMesage:'pin is not correct'}]`);
    return { errMesage:'pin is not correct' };
  }

  let uniqness_query_of_trans_id  = `select * from transaction where  transaction_id =${transaction_id};`;
  return mysqlHandler.do(uniqness_query_of_trans_id).then((uniqness_query_of_trans_id)=>{
    if(uniqness_query_of_trans_id.length !== 0) {
      logger.error(`error:topup_customer_balance:Promise.props:with_return:[ { errMesage:'transaction id is existed before ' }]`);
      return { errMesage:'transaction id is existed before ' }; 
    }
    let promises = {};
    let query  = `select name from customer_type where id ='${customer.type}'   `;
    let lock_table  = `LOCK TABLES transaction WRITE;`;
    let query2  = `select serial_no from transaction  ORDER BY id DESC LIMIT 1  `;
    
    promises.lock_table = mysqlHandler.do(lock_table);
    promises.type = mysqlHandler.do(query);
    promises.transaction= mysqlHandler.do(query2);

    return Promise.props(promises)
        .then(({lock_table, type, transaction  }) => {
          let unlock_query = 'UNLOCK TABLES;';
          if(balance_type == "rent" && type[0].name != 'entrepreneur') {
            logger.error(`error:topup_customer_balance:Promise.props:with_return:[ { errMesage:'balance type is not correct for that customer' }]`);
            mysqlHandler.do(unlock_query);
            return { errMesage:'balance type is not correct for that customer' }; 
          }

            
        let serial_no = transaction[0].serial_no+1;
        let dateNow =new Date().toISOString().slice(0, 19).replace('T', ' ');
        let add_transaction_query = `INSERT INTO  transaction(amount,date,customer_id,type,transaction_id,serial_no , created_at,updated_at) 
          values('${amount}','${dateNow}','${customer.id}',
        '${balance_type}','${transaction_id}','${serial_no}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);`;  
        let new_amount = customer.balance + amount;
        let customer_query = `update pvmpro.customer  Set balance = '${new_amount}' , updated_at =CURRENT_TIMESTAMP  where id = '${customer.id}'`;
        return mysqlHandler.do(customer_query).then(()=> 
          mysqlHandler.do(add_transaction_query).then(()=>{
            mysqlHandler.do(unlock_query);
              logger.debug(`topup_customer_balance:with_return:[${JSON.stringify({customer_balance:new_amount})}]`);
                return {customer_balance:new_amount};
            })
          );
        })
        .catch((err)=>{
          let unlock_query = 'UNLOCK TABLES;';
          mysqlHandler.do(unlock_query);
        });
  })


};

exports.is_exist = async (msisdn) => {
  logger.debug(`is_exist:with_data[${msisdn}]`);

  let query  = `select * from customer where phone ='${msisdn}'`;
  return mysqlHandler.do(query).then((res)=> res);
};