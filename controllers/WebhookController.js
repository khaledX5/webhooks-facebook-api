
//configuring the AWS environment
const logger = global.logger;
exports.verify_app = (req, res, next) => {
    
    console.log(req.params);
};
exports.init = (req, res, next) => {
    res.send('up and runnig') ;
};



