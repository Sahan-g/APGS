const jwt = require('jsonwebtoken');
require('dotenv').config();
const client = require('../databasepg.js');
const bcrypt= require('bcrypt')

const getuser=async (req,res)=>{

   const user= (await client.query('SELECT firstname,lastname,email,isadmin,designation,profilepic,mimetype   from users where email = $1',[req.user])).rows[0]
   
    const image = {"image":user.profilepic,
                    "mimetype":user.mimetype
    }


   const response={
    "firstname":user.firstname,
    "lastname":user.lastname,
    "email":user.email,
    "isAdmin":user.isadmin,
    "designation":user.designation,
    "profilepic":image
   }
   
   
   return res.status(200).json(response);

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
    
    if(emailprev==email){
        
        await client.query('UPDATE users SET firstname=$1, lastname=$2, hashedpassword=$3, designation=$4, isadmin=$5 WHERE email=$6', [firstName, lastName, hash, designation, role, email]);
        return res.status(201).send("Successful");
    }else{

        const duplicates= (await client.query("select * from users where email=$1",[email])).rowCount>0
        if(duplicates) return res.sendStatus(409);
        return res.status(201).send("Successful");
    }

    
    

}

const AddProfilePicture=async( req,res)=>{
    const user= req.user;
    const image= req.file;

    console.log(image.mimetype)
    



    
    if(image){

        await client.query('UPDATE users SET profilepic = $1, mimetype = $2 WHERE email = $3',[image.buffer,image.mimetype,user])
        return res.status(201).json('Profile Picture added')

    }
    await client.query("UPDATE users SET profilepic=null WHERE email=$1", [user]);
    return res.status(201).json('Profile Picture removed');

}


module.exports={getuser,editUser,AddProfilePicture};