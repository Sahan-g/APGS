const { PutObjectCommand } = require('@aws-sdk/client-s3');
const client= require('../databasepg.js')
const guid = require('uuid')
const s3 = require('../config/s3.js');
const { param } = require('../routes/api/assignment.js');

const getAssignments=async(req,res)=>{

    try{

        const modulecode= req.params.modulecode;
        const batch =req.params.batch;
        
        console.log(modulecode,batch)
    
    
    
        if(!modulecode || !batch){
            return res.status(400);
        }
         const result=await  client.query('SELECT * FROM assignments where batch = $1 and modulecode=$2 ',[parseInt(batch),modulecode])
    
        
        if(result.rowCount){
            return res.status(200).json(result)
        }
        else{
            return res.status(200).json("no Assignments found")
        }
    }catch{
        return res.status(400);
    }
    
    
}

const HandleNewAssignment= async (req,res)=>{

    try{

        const {batch,modulecode,assignmenttitle,schemepath}= req.body;
        
        const schemekey= guid.v4()
        const currentDate= new Date();
        const date= currentDate.getFullYear()+'-'+(parseInt(currentDate.getMonth())+1).toString()+'-'+currentDate.getDate();
        
        const params={
            Bucket: process.env.BUCKET_NAME,
            Key:'schemes/'+ schemekey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        }
        
        console.log(req.file)
       
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
        console.log(req.params);
    
        return res.status(200).json('ok');
    }
    catch (e){
        console.log(e);
        return res.satus(400).json('Bad request');
    }

}


module.exports={getAssignments,HandleNewAssignment,ChangeScheme,Update}