const client = require('../databasepg.js');


const GetBatches=async( req,res)=>{

    try{
        const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        const modulecode= req.params.modulecode.toUpperCase();
    
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

    
    const result=(await client.query("SELECT * FROM batch where modulecode =$1",[modulecode])).rows
    return res.status(201).json(result);
    }catch(e){
        console.log(e);
        return res.status(500).json('Internal Server Error');
    }
    

}

const AddBatch=async(req,res)=>{
    
    try{
        const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        const modulecode= req.params.modulecode.toUpperCase();
    
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
    
        
        
        console.log('hit')
        const batch= parseInt(req.body.batch);
        console.log(modulecode)
        if(batch){
            await client.query('INSERT INTO batch (modulecode, batch) VALUES ($1, $2)', [modulecode, batch]);
        return res.status(201).json("Successful");
        }
        return res.status(400).json('batch is not valid');
    }catch(e){
    console.log(e)
    return res.status(500).json('Internal Server Error');
    
}
}

const EditBatch =async (req,res)=>{
    try{
        const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        const modulecode= req.params.modulecode.toUpperCase();
    
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
        const {newBatch} = req.body;
        const result= (await client.query('SELECT * FROM batch  where batch= $1 AND modulecode = $2',[newBatch,modulecode])).rowCount;
        if(result!=0){
            return res.status(409).json("Batch Already Exists");
        }
        else{
            await client.query("UPDATE batch  set batch = $1 where modulecode=$2",[parseInt(newBatch),modulecode]);
            return res.status(200).json('successful');
        }
    
    

    }catch(e){
        console.log(e);
        return res.status(500).json("Internal Server Error");
    }
}


const DeleteBatch =async(req,res)=>{

    try{
        const userid = (await client.query('SELECT userid FROM users WHERE email = $1', [req.user])).rows[0].userid;
        const modulecode= req.params.modulecode.toUpperCase();
    
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
        const {batch} = req.body;
        await client.query('DELETE from batch WHERE modulecode=$1,batch=$2',[modulecode,ParseInt(batch)])
        return res.status(200).json('successful');

    }
    catch(e){
        console.log(e);
        return res.status(500).json('Internal Server Error');
    }


}

module.exports={GetBatches,AddBatch,EditBatch,DeleteBatch}




// CREATE TABLE IF NOT EXISTS public.batch
// (
//     modulecode character varying COLLATE pg_catalog."default" NOT NULL,
//     batch integer NOT NULL,
//     CONSTRAINT batch_pkey PRIMARY KEY (modulecode, batch)
//         INCLUDE(modulecode, batch),
//     CONSTRAINT batch_modulecode_fkey FOREIGN KEY (modulecode)
//         REFERENCES public.modules (modulecode) MATCH SIMPLE
//         ON UPDATE CASCADE
//         ON DELETE CASCADE
// )

// TABLESPACE pg_default;

// ALTER TABLE IF EXISTS public.batch
//     OWNER to postgres;