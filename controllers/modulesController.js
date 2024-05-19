const jwt = require('jsonwebtoken');
require('dotenv').config();
const client = require('../databasepg.js');

const getModules =async  (req,res)=>{
 

    const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
    const modules = await client.query(
        'SELECT m.modulecode, m.modulename, m.credits FROM users AS u JOIN lecturer_modules AS lm ON u.userid = lm.userid JOIN modules AS m ON lm.modulecode = m.modulecode WHERE u.userid = $1',
        [userid]
    );
    
    res.status(200).json(modules.rows);
}

const AddModule =async (req,res)=>{
    var {modulecode,modulename,credits,n} = req.body;

    if(!modulecode) res.status(400).json('Module Code is Required');
    if(!modulename) res.status(400).json('Module Name is Required');
    if(!credits) res.status(400).json('Credits is Required');
    

    modulecode= modulecode.toUpperCase();
    modulename= modulename.toUpperCase();
    
    
    const result = await client.query('SELECT COUNT(*) FROM modules WHERE modulecode = $1', [modulecode]);

   
    const rowCount = parseInt(result.rows[0].count);
    const duplicates = rowCount > 0;
    
    if(duplicates) return  res.sendStatus(409)

    await client.query('INSERT INTO modules (modulecode, modulename, credits) VALUES ($1, $2, $3)', [modulecode, modulename, parseInt(credits)]);

    const { userid } = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0];
    
    
    await client.query('INSERT INTO lecturer_modules (userid, modulecode) VALUES ($1, $2)', [userid, modulecode]);
    
    res.status(201).json("Module Created ");
}

const GetModule= async (req,res)=>{
        
    
    const modulecode= req.params.modulecode.toUpperCase();
     
        const info= (await client.query("SELECT * FROM modules WHERE modulecode =$1",[modulecode])).rows[0]
        if(info){

            return res.status(201).json(info)
        }
        return res.status(404).json("module not found")


}
 const EditModule = async(req,res)=>{

    const modulecodeprev= req.params.modulecode.toUpperCase();

    const foundmodule= (await client.query("Select * from modules where modulecode=$1",[modulecodeprev])).rowCount==0
    if(foundmodule) return res.status(404).json("module not found")

    const{modulecode,modulename,credits} = req.body;

    if(!modulecode) return res.json("Module Code required")
    if(!modulename) return res.json("Module name required")
    if(!credits) return res.json("Credits required")
    
    const dbmodule=(await client.query("SELECT * FROM modules WHERE modulecode = $1", [modulecode]))
    const duplicates = dbmodule.rowCount > 0;
    if (modulecode.toUpperCase()!=modulecodeprev &&  duplicates) {
        return res.status(400).json({ error: "Module code needs to be unique" });
    }
    
    
        
    await client.query("UPDATE  modules set modulecode=$1, modulename=$2, credits=$3  WHERE modulecode=$4",[modulecode.toUpperCase(),modulename.toUpperCase(),parseInt(credits),modulecodeprev])
    return res.status(200).json("Successful")

   
 }

 const DeleteModule= async(req,res)=>{
    const modulecode= req.params.modulecode.toUpperCase();
    console.log(modulecode)
    const foundmodule= (await client.query("Select * from modules where modulecode=$1",[modulecode])).rowCount==0
    if(foundmodule) return res.status(404).json("module not found")
    
    await client.query("DELETE from modules where modulecode=$1",[modulecode])
    return res.status(200).json("Module Deleted")

 }


module.exports={getModules,AddModule,GetModule,EditModule,DeleteModule}