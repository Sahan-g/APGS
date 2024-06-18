const client = require('../databasepg.js');

const accessCheck = async(req,res,next)=>{

    const modulecode = req.body.modulecode


    const result = await client.query(`SELECT u.userid , m.modulecode FROM users AS u INNER JOIN lecturer_modules as m where u.userid =$1  `
        ,[modulecode]
    )

    if(result.rowCount==1 ){
        next()
    }
    else{
        return res.status(401).json({'message': 'you do  not have permission to this resource'});
    }

}

module.exports ={accessCheck}