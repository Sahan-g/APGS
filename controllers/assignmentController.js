const { PutObjectCommand } = require('@aws-sdk/client-s3');
const client= require('../databasepg.js')
const guid = require('uuid')
const s3 = require('../config/s3.js');
const { param } = require('../routes/api/assignment.js');

const getAssignments=async(req,res)=>{

    try{

        const modulecode= req.params.modulecode.toUpperCase();
        const batch =req.params.batch;
        
        const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        
    
        const Accessresult = await client.query(
            `SELECT u.userid, m.modulecode 
             FROM users AS u 
             INNER JOIN lecturer_modules AS m 
             ON u.userid = m.userid 
             WHERE u.userid = $1 AND m.modulecode=$2`,
            [userid,modulecode.toUpperCase()]
        );
        if(Accessresult.rowCount==0 ){
        
            return res.status(401).json({'message': 'you do  not have permission to this resource or the resource does not exist'});
        }
    
    
    
        if(!modulecode || !batch){
            return res.status(400);
        }
         const result=await  client.query('SELECT * FROM assignments where batch = $1 and modulecode=$2 ',[parseInt(batch),modulecode])
    
        
        if(result.rowCount){
            console.log(result.rowCount)
            return res.status(200).json(result)
        }
        else{
            return res.status(200).json("no Assignments found");
        }
    }catch(e){
        console.log(e)
        return res.status(400).json('Internal Server Error');
    }
    
    
}

const HandleNewAssignment= async (req,res)=>{

    try{

        const {batch,modulecode,assignmenttitle,schemepath}= req.body;
        const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        
    
        const Accessresult = await client.query(
            `SELECT u.userid, m.modulecode 
             FROM users AS u 
             INNER JOIN lecturer_modules AS m 
             ON u.userid = m.userid 
             WHERE u.userid = $1 AND m.modulecode=$2`,
            [userid,modulecode.toUpperCase()]
        );
        if(Accessresult.rowCount==0 ){
        
            return res.status(401).json({'message': 'you do  not have permission to this resource or the resource does not exist'});
        }
        
        const schemekey= guid.v4()
        const currentDate= new Date();
        const date= currentDate.getFullYear()+'-'+(parseInt(currentDate.getMonth())+1).toString()+'-'+currentDate.getDate();
        
        const params={
            Bucket: process.env.BUCKET_NAME,
            Key:'schemes/'+ schemekey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        }
        
        
       
        const command = new PutObjectCommand(params)
        await s3.send(command)
    
        await client.query(' INSERT INTO public.assignments (batch, modulecode, assignmenttitle, assignmentdate, schemeid, schemepath)VALUES ($1, $2,$3,$4,$5,$6) ',[batch,modulecode,assignmenttitle,date,schemekey,req.file.originalname])
           
        return res.status(200).json('success');    
    }catch (e){
        console.log(e);
        return res.status(200).json('bad request');
    }
    
}


const ChangeScheme = async (req,res) =>{

    try{

        const {id, modulecode,batch} = req.params;
    
        const assignment= (await client.query('SELECT * FROM assignments WHERE assignmentid = $1 AND modulecode=$2 AND batch= $3 ',[id,modulecode,batch])).rows[0];
      
        
        const params ={ 
            Bucket: process.env.BUCKET_NAME,
            Key:'schemes/'+ assignment.schemeid.toString(),
            Body: req.file.buffer,
            ContentType: req.file.mimetype,

        }
        const command =  new PutObjectCommand(params);
        await s3.send(command);

        await client.query('UPDATE assignments SET schemepath=$1 where schemeid=$2',[req.file.originalname,assignment.schemeid.toString()])

    
        return res.status(200).json('success');
    }
    catch (e){
        console.log(e);
        return res.status(400).json('Bad request');
    }



}


const Update =async (req,res)=>{

    try{

        const {id, modulecode,batch} = req.params;
        const title = req.body.assignmenttitle;
        if(title==null){
            return res.status(400).josn('assignment title cannot be null');
        }
        await client.query('UPDATE assignments SET assignmenttitle= $1 WHERE modulecode = $2 AND batch=$3 AND assignmentid=$4',[title,modulecode,batch,id])
        return res.status(200).json('successful');
    }
    catch (e){
        console.log(e);
        return res.status(400).json('Bad request');
    }

}

const deleteAssignment=async(req,res)=>{

try {

    const {id,modulecode,batch}= req.params;

    const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        
    
    const Accessresult = await client.query(
        `SELECT u.userid, m.modulecode 
         FROM users AS u 
         INNER JOIN lecturer_modules AS m 
         ON u.userid = m.userid 
         WHERE u.userid = $1 AND m.modulecode=$2`,
        [userid,modulecode.toUpperCase()]
    );
    if(Accessresult.rowCount==0 ){
    
        return res.status(401).json({'message': 'you do  not have permission to this resource or the resource does not exist'});
    }

    if(!id || !modulecode || !batch){
        return res.status(400).json('All fields Are required')
    }else{


        await client.query(`DELETE FROM assignments WHERE modulecode=$1 AND assignmentid=$2 AND batch=$3`,[modulecode.toUpperCase(),parseInt(id),parseInt(batch)])
        return res.status(200).json({'message':'successful'})

    }




    
} catch (e) {
    console.log(e)

    return res.status(400).json('Bad Request')
}

}


const getDetails=async (req,res)=>{

    try{

        const modulecode= req.params.modulecode;
        const batch =req.params.batch;
        const id= req.params.id
    
        if(!modulecode || !batch || !id){
            return res.status(400).json({'message':'all the filelds are required'});
        }
    
        const result= await client.query(`SELECT * FROM assignments WHERE modulecode=$1 AND batch = $2  AND assignmentid = $3 `
        ,[modulecode.toUpperCase(),parseInt(batch),parseInt(id)] )
        if(result.rowCount==0){
            return res.status(200).json({'message': 'no assignments found'})
        }
    
        return res.status(200).json(result.rows)
    }
    catch(e){
        console.log(e);
        return res.status(500)
    }


}



module.exports={getAssignments,HandleNewAssignment,ChangeScheme,Update,deleteAssignment,getDetails}




// -- Table: public.assignments

// -- DROP TABLE IF EXISTS public.assignments;

// CREATE TABLE IF NOT EXISTS public.assignments
// (
//     batch integer NOT NULL,
//     modulecode character varying(10) COLLATE pg_catalog."default" NOT NULL,
//     assignmenttitle character varying(100) COLLATE pg_catalog."default" NOT NULL,
//     assignmentid integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
//     assignmentdate date NOT NULL,
//     schemeid character varying COLLATE pg_catalog."default",
//     schemepath character varying COLLATE pg_catalog."default",
//     CONSTRAINT assignments_pkey PRIMARY KEY (batch, modulecode, assignmentid),
//     CONSTRAINT assignments_modulecode_fkey FOREIGN KEY (modulecode)
//         REFERENCES public.modules (modulecode) MATCH SIMPLE
//         ON UPDATE NO ACTION
//         ON DELETE NO ACTION
// )

// TABLESPACE pg_default;

// ALTER TABLE IF EXISTS public.assignments
//     OWNER to postgres;
