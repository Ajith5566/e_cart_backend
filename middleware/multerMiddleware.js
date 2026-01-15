//import multer
const multer =require('multer');


//create storage space
const storage =multer.diskStorage({
    destination:(req,file,callback)=>{

        callback(null,'./uploads')/* location where uploaded files should be locally loaded */
    },
    filename:(req,file,callback)=>{
        /* Date.now() returns time in milli sec */
        const filename=`image-${Date.now()}-${file.originalname}`;
        callback(null,filename)
    }
})

//file filter
const fileFilter=(req,file,callback)=>{
    if(file.mimetype=='image/png'  || file.mimetype=='image/jpeg' || file.mimetype=='image/jpg' || file.mimetype=='image/avif' || file.mimetype=='image/webp')  {
        callback(null,true)
    }else{
        callback(null,false)
        return callback(new Error("Only png,jpeg,jpg are allowed"))
    }
}

//crate multer configuration

const multerconfig=multer({
    storage,
    fileFilter
})

module.exports=multerconfig