const client = require('../databasepg')
const s3= require('../config/s3')
const  guid = require('uuid');
const { PutObjectCommand, S3,DeleteObjectCommand } = require('@aws-sdk/client-s3');




const getAnswerScripts=async (req,res)=>{


try{
    
    const batch = req.params.batch;
    const assignmentid= req.params.assignmentid;
    const modulecode = req.params.modulecode;

  

    if(!modulecode || !batch || !assignmentid){
        
        return res.sendStatus(400);
    }
    else{
        const result= await client.query('SELECT * FROM studentanswers where batch= $1 and modulecode=$2 and assignmentid=$3 ',[parseInt(batch),modulecode,parseInt(assignmentid)])
        
       
        
        if(result.rowCount){
            
            return res.json(result)
        }
        
        return res.json("No Scripts available")



    }
}
catch{

    
    return res.sendStatus(400)
}


}

const uploadAnswerScripts=async (req,res)=>{

    const batch = req.params.batch;
    const assignmentid= req.params.assignmentid;
    const modulecode = req.params.modulecode;

    const scripts= req.files;

    try {
        const uploadPromises = scripts.map(async (script) => {
            const key = guid.v4();
            const studentid = script.originalname;
        
            
            const existingFileIdQuery = `SELECT fileid FROM studentanswerscripts WHERE assignmentid = $1 AND studentid = $2 AND batch = $3 AND modulecode = $4`;
            const res = await client.query(existingFileIdQuery, [assignmentid, studentid, batch, modulecode]);
            const existingFileId = res.rows.length > 0 ? res.rows[0].fileid : null;
        
           
            await client.query(`
                INSERT INTO studentanswerscripts (assignmentid, studentid, batch, modulecode, fileid)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (assignmentid, studentid, modulecode, batch) DO UPDATE
                SET fileid = EXCLUDED.fileid`,
                [assignmentid, studentid, batch, modulecode, key]);
        
           
            const params = {
                Bucket: process.env.BUCKET_NAME,
                Key: 'scripts/' + key,
                Body: script.buffer,
                ContentType: script.mimetype
            };
            const command = new PutObjectCommand(params);
        
            // Upload the new file to S3
            await s3.send(command);
        
            // If an old file exists and it's different from the new file, delete the old file
            if (existingFileId && existingFileId !== key) {
                const deleteParams = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: 'scripts/' + existingFileId
                };
                const deleteCommand = new DeleteObjectCommand(deleteParams);
                await s3.send(deleteCommand);
            }
        
            return key;  // Optionally return the key
        });
        

        await Promise.all(uploadPromises);
        return res.status(200).json("success")

        
    } catch (error) {
        console.log(error);
        return res.sendStatus(400);
    }


}


const Grade =async (req,res)=>{

    

}


module.exports={getAnswerScripts, uploadAnswerScripts}
