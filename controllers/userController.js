const jwt = require('jsonwebtoken');
require('dotenv').config();
const client = require('../databasepg.js');
const bcrypt= require('bcrypt')

const getuser=async (req,res)=>{

   const user= (await client.query('SELECT firstname,lastname,email,isadmin,designation from users where email = $1',[req.user])).rows[0]
    return res.status(200).json(user);

}

const editUser= async (req,res)=>{

    const {email,
        firstName,
        lastName,
        password,
        designation} =req.body
    const emailprev=req.user;
    const hash=await bcrypt.hash(password, 10);
    const role = (parseInt(req.role)==1?true:false)
    if (!email || !password || !firstName || !lastName || !designation) {
            return res.status(400).json({ 'message': 'All fields are required' });
    }
    console.log(emailprev +"  "+ email)
    if(emailprev==email){
        
        await client.query('UPDATE users SET firstname=$1, lastname=$2, hashedpassword=$3, designation=$4, isadmin=$5 WHERE email=$6', [firstName, lastName, hash, designation, role, email]);
        return res.status(201).send("Successful");
    }else{

        const duplicates= (await client.query("select * from users where email=$1",[email])).rowCount>0
        if(duplicates) return res.sendStatus(409);
        return res.status(201).send("Successful");
    }


    

}


module.exports={getuser,editUser};