const verifyRole =(... allowedRoles)=>{
    return (req,res,next)=>{
        if(!req.role) return res.sendStatus(401);
        const roles=[... allowedRoles];
       
        const result = roles.includes(req.role)
        
        if(!result) return res.sendStatus(401);
        next();

    }

}

 module.exports=verifyRole

