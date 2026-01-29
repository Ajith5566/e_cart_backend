const jwt=require('jsonwebtoken');

const createToken =(res,userId)=>{
    const toten=jwt.sign({userId},process.env.MY_SECRET,{expiresIn:'30d'})

    res.cookie('jwt',toten,{
        httpOnly:true,
        secure:process.env.NODE_ENV!=='development',
        sameSite:'strict',
        maxAge:30*24*60*1000
    })
}

export default createToken;