const client= require('../databasepg.js')


const getAssignments=async(req,res)=>{
    
    const modulecode= req.params.modulecode;
    const batch =req.params.batch;
    



    if(!modulecode || !batch){
        return res.status(400);
    }
    const result= client.query('SELECT * FROM assignments where batch = $1 and modulecode=$2 ',[parseInt(batch,32),modulecode])


    if((await result).rowCount){
        return res.status(200).json(result)
    }
    else{
        return res.status(200).json("no Assignments found")
    }
    
}

const CreateAssignment=async(req,res)=>{

    
}



module.exports={getAssignments}