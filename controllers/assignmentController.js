const client= require('../databasepg.js')


const getAssignments=async(req,res)=>{
    
    const modulecode= req.params.modulecode;
    const batch =req.params.batch;
    console.log(req.body)

    console.log(modulecode)

    if(!modulecode || !batch){
        return res.status(400);
    }
    const result= client.query("SELECT * FROM assignments where batch = $1 and modulecode=$2 ",[batch,modulecode])


    if((await result).rowCount){
        return res.sendStatus(200).json(result)
    }
    else{
        return res.sendStatus(200).json("no modules found")
    }

}


module.exports={getAssignments}