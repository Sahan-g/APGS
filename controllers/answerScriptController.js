const client = require('../databasepg')
const s3= require('../config/s3')
const  guid = require('uuid');
const { PutObjectCommand, DeleteObjectCommand,GetObjectCommand, } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const axios  = require('axios');




const getAnswerScripts=async (req,res)=>{

    
try{

    const batch = req.params.batch;
    const assignmentid= req.params.assignmentid;
    const modulecode = req.params.modulecode.toUpperCase();
    const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        
    
    const Accessresult = await client.query(
            `SELECT u.userid, m.modulecode 
             FROM users AS u 
             INNER JOIN lecturer_modules AS m 
             ON u.userid = m.userid 
             WHERE u.userid = $1 AND m.modulecode=$2`,
            [userid,modulecode]
        );
    if(Accessresult.rowCount==0 ){
        
            return res.status(401).json({'message': 'you do  not have permission to this resource or the resource does not exist'});
    }

    if(!modulecode || !batch || !assignmentid){
        
        return res.sendStatus(400);
    }
    else{
        
        const result= await client.query('SELECT * FROM studentanswerscripts WHERE batch= $1 AND modulecode=$2 AND assignmentid=$3 ',[parseInt(batch),modulecode,parseInt(assignmentid)])
        
       
        
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

   
    try {
        const batch = req.params.batch;
        const assignmentid= req.params.assignmentid;
        const modulecode = req.params.modulecode.toUpperCase();
        const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        
    
        const Accessresult = await client.query(
                `SELECT u.userid, m.modulecode 
                 FROM users AS u 
                 INNER JOIN lecturer_modules AS m 
                 ON u.userid = m.userid 
                 WHERE u.userid = $1 AND m.modulecode=$2`,
                [userid,modulecode]
            );
        if(Accessresult.rowCount==0 ){
            
                return res.status(401).json({'message': 'you do  not have permission to this resource or the resource does not exist'});
        }
        
    
        const scripts= req.files;
    
        const uploadPromises = scripts.map(async (script) => {
            const key = guid.v4();
            const studentid = script.originalname.split('.').slice(0, -1).join('.');
        
            
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
        
            return key; 
        });
        
        await Promise.all(uploadPromises);
        return res.status(200).json("success")

        
    } catch (error) {
        console.log(error);
        return res.sendStatus(400);
    }


}


const Grade = async (req, res) => {
    
    try {
        const batch = req.params.batch;
        const assignmentid = req.params.assignmentid;
        const modulecode = req.params.modulecode.toUpperCase();
      
        const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        
    
        const Accessresult = await client.query(
                `SELECT u.userid, m.modulecode 
                 FROM users AS u 
                 INNER JOIN lecturer_modules AS m 
                 ON u.userid = m.userid 
                 WHERE u.userid = $1 AND m.modulecode=$2`,
                [userid,modulecode]
            );
        if(Accessresult.rowCount==0 ){
            
                return res.status(401).json({'message': 'you do  not have permission to this resource or the resource does not exist'});
        }
        const result = await client.query(`SELECT studentid, fileid FROM studentanswerscripts WHERE batch = $1 AND assignmentid = $2 AND modulecode = $3`, [batch, assignmentid, modulecode]);
        const answerscript = await client.query(`SELECT schemeid FROM assignments WHERE batch = $1 AND modulecode = $2 AND assignmentid = $3`, [batch, modulecode, assignmentid]);

        const scripts = await Promise.all(result.rows.map(async (row) => {
            const command = new GetObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                Key: `scripts/${row.fileid}`,
            });

            const url = await getSignedUrl(s3, command, {
                expiresIn: 3600 // 1hr
            });

            return {
                studentId: row.studentid,
                downloadUrl: url
            };
        }));

        const command = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `schemes/${answerscript.rows[0].schemeid}`
        });
        const schemeurl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        const body = JSON.stringify({
            'answerScript': schemeurl,
            'studentAnswers': scripts
        });

        const gradedResult = await axios.post('http://127.0.0.1:5000/grade', body,{
            headers: {
              'Content-Type': 'application/json'
            }
        });
        await console.log(gradedResult.data.results[0])
        const schemevalues = gradedResult.data.results[0].markingAns;
            // insert Correct answers to the answers table
        schemevalues.map(async (ans, index) => {
            let i = index + 1; 
            await client.query(`
                INSERT INTO answers (assignmentid, batch, modulecode, questionnumber, answer)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (assignmentid, questionnumber) DO UPDATE
                SET batch = EXCLUDED.batch,
                    modulecode = EXCLUDED.modulecode,
                    questionnumber = EXCLUDED.questionnumber,
                    answer = EXCLUDED.answer;
            `, [assignmentid, batch, modulecode, i, parseInt(ans)]);
        });
        

        // insert marks of each student

        await Promise.all(gradedResult.data.results.map(async (result) => {
            await client.query(`
                UPDATE studentanswerscripts
                SET marks = $5 
                WHERE assignmentid = $1 
                  AND modulecode = $2
                  AND batch = $3 
                  AND studentid = $4;
            `, [assignmentid, modulecode, batch, result.studentId, result.score]);

            await Promise.all(result.studentAns.map(async (answer, index) => {
                let flag = parseInt(schemevalues[index + 1]) === parseInt(answer) ? 1 : 0;
                const alreadyMarked = await client.query(`SELECT graded FROM studentanswerscripts WHERE
                                            assignmentid=$1 AND modulecode= $2 AND studentid= $3 AND batch= $4
                `,[assignmentid,modulecode,result.studentId,batch])
                //console.log(parseInt(alreadyMarked.rows[0].graded)==0)
                if(parseInt(alreadyMarked.rows[0].graded)==0){
                   
                    await client.query(`
                        INSERT INTO studentanswers 
                        (assignmentid, batch, modulecode, questionnumber, studentid, answer, flag)
                        VALUES ($1, $2, $3, $4, $5, $6, $7);
                    `, [assignmentid, batch, modulecode, index + 1, result.studentId, parseInt(answer), flag]);
                }
                else {
                    
                    await client.query(`
                        UPDATE studentanswers
                        SET answer = $1, flag = $2
                        WHERE assignmentid = $3 AND batch = $4 AND modulecode = $5 AND questionnumber = $6 AND studentid = $7;
                    `, [parseInt(answer), flag, assignmentid, batch, modulecode, index + 1, result.studentId]);
                }
            }));
            await client.query(`
            UPDATE studentanswerscripts
            SET graded = $1
            WHERE assignmentid = $1 
              AND modulecode = $2
              AND batch = $3 
              AND studentid = $4;
        `, [assignmentid, modulecode, batch, result.studentId]);
        }));

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}


const getGrade = async (req, res) => {
    try {
        const batch = parseInt(req.params.batch);
        const assignmentid = parseInt(req.params.assignmentid);
        const modulecode = req.params.modulecode;
        const studentid = req.params.studentid;
        
        console.log(assignmentid)
       
        if (isNaN(batch) || isNaN(assignmentid)) {
            return res.status(400).json({ error: 'Invalid batch or assignment ID' });
        }

        const result = await client.query(`
            SELECT *
            FROM studentanswerscripts 
            WHERE assignmentid = $1
            AND batch = $2 
            AND modulecode = $3 
            AND studentid = $4;
        `, [assignmentid, batch, modulecode, studentid]);


        if (result.rowCount === 0) {
            return res.status(404).json('Selected file not found');
        }

        const command = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `scripts/${result.rows[0].fileid}`
        });

        const scriptUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // to send
        const marks = result.rows[0].marks; // to send

        const studentAnswers = await client.query(`
            SELECT sa.questionnumber, sa.studentid, sa.answer AS student_answer, a.answer AS correct_answer
            FROM public.studentanswers sa
            INNER JOIN public.answers a
                ON sa.assignmentid = a.assignmentid
                AND sa.batch = a.batch
                AND sa.modulecode = a.modulecode
                AND sa.questionnumber = a.questionnumber
            WHERE sa.assignmentid = $1
            AND sa.batch = $2
            AND sa.modulecode = $3
            AND sa.studentid = $4;
        `, [assignmentid, batch, modulecode, studentid]);
        

       
        const infoResult= result.rows;
        const jsonAnswers= studentAnswers.rows
        
        return res.status(200).json({ infoResult, scriptUrl, marks, jsonAnswers });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
};

// not fully completed
const removeFile = async (req, res) => {
    try {
        const fileid = req.params.fileid;
        const batch = req.params.batch;
        const assignmentid = req.params.assignmentid;
        const modulecode = req.params.modulecode.toUpperCase();

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

        if (!modulecode || !batch || !assignmentid || !fileid) {
            return res.sendStatus(400);
        }

        const result = await client.query(`
            SELECT fileid 
            FROM studentanswerscripts 
            WHERE batch = $1 AND modulecode = $2 AND assignmentid = $3
        `, [parseInt(batch), modulecode, parseInt(assignmentid)]);

        if (result.rowCount === 0) {
            return res.sendStatus(404);
        }

        const deleteParams = {
            Bucket: process.env.BUCKET_NAME,
            Key: 'scripts/' + fileid
        };

        const command = new DeleteObjectCommand(deleteParams);
        await s3.send(command);

        await client.query('DELETE FROM studentanswerscripts WHERE modulecode=$1 AND assignmentid=$2 AND batch=$3 AND fileid =$4 '
            ,[modulecode,assignmentid,batch,fileid]
        )

        return res.sendStatus(200);
    } catch (e) {
        console.log(e);
        return res.status(500).json('Internal Server Error');
    }
};


const RemoveFiles = async (req, res) => {
    try {
        const fileids = req.body.fileids;
        const batch = req.params.batch;
        const assignmentid = req.params.assignmentid;
        const modulecode = req.params.modulecode.toUpperCase();

        const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;

        const Accessresult = await client.query(
            `SELECT u.userid, m.modulecode 
             FROM users AS u 
             INNER JOIN lecturer_modules AS m 
             ON u.userid = m.userid 
             WHERE u.userid = $1 AND m.modulecode = $2`,
            [userid, modulecode]
        );
        if (Accessresult.rowCount == 0) {
            return res.status(401).json({'message': 'you do not have permission to this resource or the resource does not exist'});
        }

        if (!modulecode || !batch || !assignmentid || !fileids || fileids.length === 0) {
            return res.sendStatus(400);
        }

        const deleteCommands = fileids.map(fileid => {
            return {
                Bucket: process.env.BUCKET_NAME,
                Key: 'scripts/' + fileid
            };
        });

        
        for (const deleteParams of deleteCommands) {
            const command = new DeleteObjectCommand(deleteParams);
            await s3.send(command);

            await client.query('DELETE FROM studentanswerscripts WHERE modulecode = $1 AND assignmentid = $2 AND batch = $3 AND fileid = $4', 
                [modulecode, assignmentid, batch, deleteParams.Key.split('/')[1]]);
        }

        return res.sendStatus(200);
    } catch (error) {
        console.log(error);
        return res.status(500).json('Internal Server Error');
    }
};


const GradeSelected =async (req,res)=>{

    try{

        
        const batch = req.params.batch;
        const assignmentid = req.params.assignmentid;
        const modulecode = req.params.modulecode.toUpperCase();
        const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        const {fileids}=  req.body;
        
        
        const Accessresult = await client.query(
            `SELECT u.userid, m.modulecode 
            FROM users AS u 
            INNER JOIN lecturer_modules AS m 
            ON u.userid = m.userid 
            WHERE u.userid = $1 AND m.modulecode=$2`,
            [userid,modulecode]
        );
        if(Accessresult.rowCount==0 ){
            
            return res.status(401).json({'message': 'you do  not have permission to this resource or the resource does not exist'});
        }
        const query = `
        SELECT studentid, fileid
        FROM studentanswerscripts
        WHERE batch = $1
          AND assignmentid = $2
          AND modulecode = $3
          AND fileid = ANY($4::text[])
      `;
      const result = await client.query(query, [parseInt(batch), parseInt(assignmentid), modulecode, fileids]);
      const answerscript = await client.query(`SELECT schemeid FROM assignments WHERE batch = $1 AND modulecode = $2 AND assignmentid = $3`, [batch, modulecode, assignmentid]);

      if(result.rowCount==0){
        return res.status(400).json('No files were found');
      }
      if(answerscript.rowCount==0){
        return res.status(400).json('Answer Sheet not found');
      }
   
      const scripts = await Promise.all(result.rows.map(async (row) => {
        const command = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `scripts/${row.fileid}`,
        });

        const url = await getSignedUrl(s3, command, {
            expiresIn: 3600 // 1hr
        });

        return {
            studentId: row.studentid,
            downloadUrl: url
        };
    }));

    const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `schemes/${answerscript.rows[0].schemeid}`
    });
    const schemeurl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const body = JSON.stringify({
        'answerScript': schemeurl,
        'studentAnswers': scripts
    });

    const gradedResult = await axios.post('http://127.0.0.1:5000/grade', body,{
        headers: {
          'Content-Type': 'application/json'
        }
    });
    await console.log(gradedResult.data.results[0])
    const schemevalues = gradedResult.data.results[0].markingAns;
        // insert Correct answers to the answers table
    schemevalues.map(async (ans, index) => {
        let i = index + 1; 
        await client.query(`
            INSERT INTO answers (assignmentid, batch, modulecode, questionnumber, answer)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (assignmentid, questionnumber) DO UPDATE
            SET batch = EXCLUDED.batch,
                modulecode = EXCLUDED.modulecode,
                questionnumber = EXCLUDED.questionnumber,
                answer = EXCLUDED.answer;
        `, [assignmentid, batch, modulecode, i, parseInt(ans)]);
    });
    

    // insert marks of each student

    await Promise.all(gradedResult.data.results.map(async (result) => {
        await client.query(`
            UPDATE studentanswerscripts
            SET marks = $5 
            WHERE assignmentid = $1 
              AND modulecode = $2
              AND batch = $3 
              AND studentid = $4;
        `, [assignmentid, modulecode, batch, result.studentId, result.score]);

        await Promise.all(result.studentAns.map(async (answer, index) => {
            let flag = parseInt(schemevalues[index + 1]) === parseInt(answer) ? 1 : 0;
            const alreadyMarked = await client.query(`SELECT graded FROM studentanswerscripts WHERE
                                        assignmentid=$1 AND modulecode= $2 AND studentid= $3 AND batch= $4
            `,[assignmentid,modulecode,result.studentId,batch])
            //console.log(parseInt(alreadyMarked.rows[0].graded)==0)
            if(parseInt(alreadyMarked.rows[0].graded)==0){
               
                await client.query(`
                    INSERT INTO studentanswers 
                    (assignmentid, batch, modulecode, questionnumber, studentid, answer, flag)
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                `, [assignmentid, batch, modulecode, index + 1, result.studentId, parseInt(answer), flag]);
            }
            else {
                
                await client.query(`
                    UPDATE studentanswers
                    SET answer = $1, flag = $2
                    WHERE assignmentid = $3 AND batch = $4 AND modulecode = $5 AND questionnumber = $6 AND studentid = $7;
                `, [parseInt(answer), flag, assignmentid, batch, modulecode, index + 1, result.studentId]);
            }
        }));
        await client.query(`
        UPDATE studentanswerscripts
        SET graded = $1
        WHERE assignmentid = $1 
          AND modulecode = $2
          AND batch = $3 
          AND studentid = $4;
    `, [assignmentid, modulecode, batch, result.studentId]);
    }));

    res.sendStatus(200);
    }catch(e){
        console.log(e);
        return res.status(500).json('Internal Server Error')
    }



}




module.exports={getAnswerScripts, uploadAnswerScripts,Grade,getGrade,removeFile,GradeSelected,RemoveFiles}



// //CREATE TABLE IF NOT EXISTS public.answers
// (
//     assignmentid integer NOT NULL,
//     batch integer NOT NULL,
//     modulecode character varying(10) COLLATE pg_catalog."default" NOT NULL,
//     questionnumber integer NOT NULL,
//     answer integer NOT NULL,
//     CONSTRAINT answers_pkey PRIMARY KEY (questionnumber, assignmentid, batch, modulecode),
//     CONSTRAINT answers_assignmentid_batch_modulecode_fkey FOREIGN KEY (assignmentid, batch, modulecode)
//         REFERENCES public.assignments (assignmentid, batch, modulecode) MATCH SIMPLE
//         ON UPDATE NO ACTION
//         ON DELETE NO ACTION
// )

// TABLESPACE pg_default;

// ALTER TABLE IF EXISTS public.answers
//     OWNER to postgres;



// max  min  


// CREATE TABLE IF NOT EXISTS public.studentanswers
// (
//     assignmentid integer NOT NULL,
//     batch integer NOT NULL,
//     modulecode character varying(10) COLLATE pg_catalog."default" NOT NULL,
//     questionnumber integer NOT NULL,
//     studentid character varying(10) COLLATE pg_catalog."default" NOT NULL,
//     answer integer NOT NULL,
//     flag integer DEFAULT 0,
//     CONSTRAINT studentanswers_pkey PRIMARY KEY (questionnumber, assignmentid, batch, modulecode, studentid),
//     CONSTRAINT studentanswers_assignmentid_studentid_modulecode_batch_fkey FOREIGN KEY (assignmentid, studentid, modulecode, batch)
//         REFERENCES public.studentanswerscripts (assignmentid, studentid, modulecode, batch) MATCH SIMPLE
//         ON UPDATE NO ACTION
//         ON DELETE NO ACTION
// )

// TABLESPACE pg_default;

// ALTER TABLE IF EXISTS public.studentanswers
//     OWNER to postgres;