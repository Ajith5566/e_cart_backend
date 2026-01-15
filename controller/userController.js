const users = require('../modal/userSchema');  // ✅ IMPORTANT
const jwt = require('jsonwebtoken');
const admins=require('../modal/adminSchema');
const bcrypt = require("bcrypt");

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
    const admin = await admins.findOne({ email: email });

    if (!admin) {
      return res.status(406).json("Invalid email or password");
    }

    // 🔐 Compare entered password with hash
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(406).json("Invalid email or password");
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { adminId: admin._id },
      "superSecretkey123",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      admin,
      token,
    });

  } catch (err) {
    res.status(500).json("Login failed");
  }
};


//to get all users

exports.getAllusers =async(req,res)=>{
    try{
        const Allusers=await users.find().select("-password");
        res.status(200).json(Allusers)
    }catch(error){
        res.status(401).json(`failed due to ${error}`)
    }
}

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
