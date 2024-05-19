const jwt = require('jsonwebtoken');
require('dotenv').config();
const client = require('../databasepg.js');
const bcrypt= require('bcrypt')
const { PutObjectCommand, DeleteObjectCommand,GetObjectCommand, } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3.js')
const  guid = require('uuid');


const getuser=async (req,res)=>{

   const user= (await client.query('SELECT firstname,lastname,email,isadmin,designation,profilepic   from users where email = $1',[req.user])).rows[0]
  
   let url= null;

 if(user.profilepic!= null){

    const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `userimages/${user.profilepic}`,
    });

     url = await getSignedUrl(s3, command, {
        expiresIn: 3600 // 1hr
    });

 }

   const response={
    "firstName":user.firstname,
    "lastName":user.lastname,
    "email":user.email,
    "isAdmin":user.isadmin,
    "designation":user.designation,
    "profilepic":url
   }
   
   
   return res.status(200).json(response);

}

const editUser= async (req,res)=>{

    
    const {firstName,
        lastName,
        designation
    } = req.body
   

    if(!firstName || !lastName || !designation ){
        return res.status(400).json({'message':'All the fileds are required'});
    }
    await client.query('UPDATE users SET firstname = $1, lastname=$2, designation=$3  WHERE email = $4',[firstName,lastName,designation,req.user])
    
    return res.status(200).json({'message':'Profile updated'})
    // const {email,
    //     firstName,
    //     lastName,
    //     password,
    //     designation} =req.body
    // const emailprev=req.user;
    // const hash=await bcrypt.hash(password, 10);
    // const role = (parseInt(req.role)==1?true:false)
    // if (!email || !password || !firstName || !lastName || !designation) {
    //         return res.status(400).json({ 'message': 'All fields are required' });
    // }
    
    // if(emailprev==email){
        
    //     await client.query('UPDATE users SET firstname=$1, lastname=$2, hashedpassword=$3, designation=$4, isadmin=$5 WHERE email=$6', [firstName, lastName, hash, designation, role, email]);
    //     return res.status(201).send("Successful");
    // }else{

    //     const duplicates= (await client.query("select * from users where email=$1",[email])).rowCount>0
    //     if(duplicates) return res.sendStatus(409);
    //     return res.status(201).send("Successful");
    // }

    
    

}


const changeEmail =async (req,res)=>{

    const {newmail} = req.body

    if(!newmail){
        return res.status(400).json({'message':'provide an email address '})
    }

    if( newmail == req.user){
        return res.status(200).json({'message':'no Cahnges were done'})
    }else{

        const duplicates = await  client.query(`SELECT email FROM users where email=$1`,[newmail])

        if(duplicates.rowCount>0){
            return res.status(409).json({'message':'email already exists'});
        }
        else{
            await client.query(`UPDATE users SET email=$1 where email = $2 `,[newmail, req.user])
        }
    }

}


const AddProfilePicture=async( req,res)=>{
    const user= req.user;
    const image= req.file;

    const key = guid.v4();
    const userImage= (await client.query('SELECT profilepic  FROM users WHERE email = $1',[req.user])).rows[0]
    if(image){

        if(userImage.profilepic){

            const deleteParams = {
                Bucket: process.env.BUCKET_NAME,
                Key: 'userimages/' + userImage.profilepic
            };
            const deleteCommand = new DeleteObjectCommand(deleteParams);
            await s3.send(deleteCommand);



        }
        
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: 'userimages/' + key,
            Body: image.buffer,
            ContentType: image.mimetype
        };
        const command = new PutObjectCommand(params);
        
        
        await s3.send(command);
        
        await client.query('UPDATE users SET profilepic = $1  WHERE email = $2',[key,user])

        return res.status(201).json('Profile Picture added')

    }
    await client.query("UPDATE users SET profilepic=null WHERE email=$1", [user]);
    return res.status(201).json('Profile Picture removed');

}


const changePassword=async (req,res)=>{

    const {password}= req.body;
    if(!password){
        return res.status(400).json({'message':'passowrd cannot be empty'});
    }
    const hash = await bcrypt.hash(password, 10);

    await client.query(`UPDATE users SET hashedpassword=$1 where email=$2`,[hash,req.user])
    return res.status(200).json({'message':'password Chaged succeffully'})


}


module.exports={getuser,editUser,AddProfilePicture,changeEmail,changePassword};



// -- Table: public.tokens

// -- DROP TABLE IF EXISTS public.tokens;

// CREATE TABLE IF NOT EXISTS public.tokens
// (
//     refreshtoken character varying(500) COLLATE pg_catalog."default",
//     email character varying COLLATE pg_catalog."default" NOT NULL,
//     CONSTRAINT tokens_pkey PRIMARY KEY (email),
//     CONSTRAINT tokens_email_fkey FOREIGN KEY (email)
//         REFERENCES public.users (email) MATCH SIMPLE
//         ON UPDATE NO ACTION
//         ON DELETE NO ACTION
// )

// TABLESPACE pg_default;

// ALTER TABLE IF EXISTS public.tokens
//     OWNER to postgres;