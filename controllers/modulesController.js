const jwt = require('jsonwebtoken');
require('dotenv').config();
const client = require('../databasepg.js');

const getModules =async  (req,res)=>{
 

    const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
    const modules = await client.query(
        'SELECT m.modulecode, m.modulename FROM users AS u JOIN lecturer_modules AS lm ON u.userid = lm.userid JOIN modules AS m ON lm.modulecode = m.modulecode WHERE u.userid = $1',
        [userid]
    );
    //console.log(modules);
    res.status(200).json(modules.rows);
}

const AddModule =async (req,res)=>{
    const {modulecode,modulename,credits} = req.body;

    if(!modulecode) res.status(400).json('Module Code is Required');
    if(!modulename) res.status(400).json('Module Name is Required');
    if(!credits) res.status(400).json('Credits is Required');
    
    const result = await client.query('SELECT COUNT(*) FROM modules WHERE modulecode = $1', [modulecode]);

   
    const rowCount = parseInt(result.rows[0].count);
    const duplicates = rowCount > 0;
    
    if(duplicates) res.sendStatus(409)

    await client.query('INSERT INTO modules (modulecode, modulename, credits) VALUES ($1, $2, $3)', [modulecode, modulename, parseInt(credits)]);

    const { userid } = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0];
    
    
    await client.query('INSERT INTO lecturer_modules (userid, modulecode) VALUES ($1, $2)', [userid, modulecode]);
    
    res.status(201).json("Module Created ");
}

const GetModule= async (req,res)=>{
        const modulecode=req.modulecode;
        console.log(modulecode)
        const info= (await client.query("SELECT * FROM modules WHERE modulecode =$1",[modulecode])).rows[0]
    
       return res.status(201).json(info)

}



module.exports={getModules,AddModule,GetModule}