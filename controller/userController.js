const users = require('../modal/userSchema');  // ✅ IMPORTANT
const jwt = require('jsonwebtoken');
const admins=require('../modal/adminSchema');
const bcrypt = require("bcrypt");
const createToken = require("../utils/createToken");
// logic for register
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await users.findOne({ mailId: email });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 🔐 HASH PASSWORD
    //const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new users({
      username:username,
      mailId: email,
      password:password, // ✅ store hashed password
    });

    await newUser.save();

    res.status(200).json({ message: "Registration successful" });

  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

//login

exports.login=async(req,res)=>{
    //console.log('inside login function');
    
    
    const {email,password} =req.body;

   try{const existingUser = await users.findOne({mailId: email, password: password});
   if (existingUser.isBlocked) {
  return res.status(403).json({
    message: "Your account has been blocked. Contact admin.",
  });
}
   if(existingUser){

    //token generation-sign('data','secretkey')
   const token=  jwt.sign({userId:existingUser._id},"superSecretkey123")

    res.status(200).json({existingUser,token})
   }else{
    res.status(406).json("Incorrect email or password")
   }
 }catch(err){
    res.status(401).json('Login request failed due to ',err)
 }
}

//admin login

exports.adminlogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await admins.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ CREATE JWT & SET COOKIE
    createToken(res, admin._id);

    // remove password before sending admin
    const { password: _, ...adminData } = admin._doc;

    res.status(200).json({
      message: "Login successful",
      admin: adminData,
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};


//to get all users

exports.getAllusers = async (req, res) => {
  try {
    // 🔹 Read pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      select: "-password", // exclude password
    };

    // 🔥 Use paginate instead of find
    const result = await users.paginate({}, options);

    res.status(200).json(result);
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};


//blockUser

exports.toggleUserBlock = async (req, res) => {
  const { id } = req.params;
console.log(req.params);
    
  const user = await users.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

   return res.status(200).json({
    message: user.isBlocked
      ? "User blocked successfully"
      : "User unblocked successfully",
    isBlocked: user.isBlocked,
  });
};
