//to verify token


const jwt=require('jsonwebtoken');


const    jwtMiddleware=(req,res,next)=>{
    console.log('inside jwt middleware');
    

        const token=req.headers['authorization'].split(' ')[1];
        console.log(token);
        try{
            const response=   jwt.verify(token,"superSecretkey123")
            console.log(response);
            req.payload=response.adminId;
            
        }catch(error){
            res.status(401).json('Authorization failed',error)
        }
        next()
        
}   

module.exports=jwtMiddleware