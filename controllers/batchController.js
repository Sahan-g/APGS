const client = require('../databasepg.js');


const GetBatches=async( req,res)=>{

    const modulecode= req.params.modulecode;
    const result=(await client.query("SELECT * FROM batch where modulecode =$1",[modulecode])).rows
    

    return res.status(201).json(result);
}

const AddBatch=async(req,res)=>{
    const modulecode= req.params.modulecode;

    const batch= parseInt(req.body.batch);
    if(batch){
        await client.query('INSERT INTO batch (modulecode, batch) VALUES ($1, $2)', [modulecode, batch]);
        return res.status(201).json("Successful");
    }
    return res.status(400).json('batch is not valid');


}

module.exports={GetBatches,AddBatch}