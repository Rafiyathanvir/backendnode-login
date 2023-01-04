// first install all this package npm i init, express, nodemon, cors,jsonwebtoken, bcryptjs, --save, mongoose.

const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());
const bcrypt = require("bcryptjs");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");

const dotenv = require('dotenv').config();
const URL = process.env.DB;
const JWT_SECRET=process.env.JWT_SECRET;
//////////


mongoose.set('strictQuery', false);

//database mongoose connection here
const mongoUrl =URL;

///atlas connection here
mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));

 require('./userSchema')



const Userr = mongoose.model("UserIfo");
////////////////////////////////////////////////////////////////////////////////////
app.post('/register',async(req,res)=>{
   
    try{
        var emailExist= await Userr.findOne({email:req.body.email});
        if(emailExist){
            return res.status(400).json( {message:"email already exsit"})
        }
        //password hashing is here to encript the password 
        var hash= await bcrypt.hash(req.body.password,10)
        const user=new Userr({
            name:req.body.name,
            email:req.body.email,
            password:hash
        })
        var data= await user.save();
        res.json({message:"Registered successfully",data});
   
    }
    catch(err){
     res.status(400).json(err)
    }
    //  res.json(user)
});
 //login create 
app.post('/login',async (req,res) => {
 
    try {
    
        var userData = await Userr.findOne({email:req.body.email});
        if (!userData) {
        return res.status(400).json({message:"Email not  exsist"});
        }
     
       
        
        var validPsw = await bcrypt.compare(req.body.password,userData.password)
    
         if (!validPsw){
            return res.status(400).json({message:"password not valid"});
         }
       //token create here using "jwt"
    var userToken = await jwt.sign({email:userData.email},JWT_SECRET)
    //res.header('auth',userToken).send(userToken);

    res.json({message:"Successfully logged in ",profile:userData.name})
    console.log(userToken)
    
    
    
    
    }catch(err){
      console.log("err",err)
        res.status(400).json(err)
    }
    
    
    })

    // view login
     const validUser= (req,res,next)=>{
        var token =req.header('auth');
        req.token=token;
        next();
     }

     ///////////////// get all user here
    app.get('/getAll',validUser,async(req,res) => {
        jwt.verify(req.token,JWT_SECRET,async(err,data) => {
            if (err){
                res.sendStatus(403)
            }
            //if not to display password can use select here not to visible the password 
            else{
                const data = await Userr.find().select(['-password']);
                res.json(data)
            }
        })
      
    })

 
    //password reset here 
   
app.post("/forgot-password", async (req, res) => {
    const  email  = req.body.email;
    console.log(email)
    try {
       // const connection = await mongoClient.connect(URL)
       // const db = connection.db("mylogin")
        const user = await Userr.findOne({email})
        console.log(user)
    //   const oldUser = await User.findOne({ email });
      if (!user) {
        return res.json({ status: "User Not Exists!!" });
      }
      const secret = JWT_SECRET + user.password;
      console.log(secret)
      const token = jwt.sign({ email: user.email, id: user._id }, secret, {
        expiresIn: "15m",
      });
      console.log(token)
      const link = `https://login-auth-cued.onrender.com/reset-password/${user._id}/${token}`;
      console.log(link)
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "rafiyatariq79@gmail.com",
          pass: "bxuioxjiwzjqejje"
        }
      });

      var mailOptions = {
        from: "rafiyatariq79@gmail.com",
        to: req.body.email,
        subject: "Password Reset",
        text: link
      };
  
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      console.log(link);
      res.json("check your email");
    } catch (error) {
      console.log(error)
    }
  });
  // check the index file in node 
  app.get("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    //const {password}=req.body
   // const connection = await mongoClient.connect(URL)
       // const db = connection.db("password_reset")
       
        const user = await Userr.findOne({ _id: id })
        console.log(user)
        
    
    if (!user) {
      return res.json({ status: "User Not Exists!!" });
    }
   const secret = JWT_SECRET + user.password;
   console.log(secret)
    try {
      const verify = jwt.verify(token,secret);
     
      res.render("index", { email: verify.email ,status: "Not Verified" });
    } catch (error) {
      console.log(error);
      res.send("Not Verified");
    }
  });
  //password update once it was reset here
  app.post("/reset-password/:id/:token", async (req, res) => {
    const { id } = req.params;
   // console.log(token)
    const  password  = req.body;
  
   // const connection = await mongoClient.connect(URL)
    //const db = connection.db("password_reset")
    const user = await Userr.findOne({ _id: id })
    if (!user) {
      return res.json({ status: "User Not Exists!!" });
    }
   const secret = JWT_SECRET + user.password;
   console.log(secret)

    try {
      const verify = jwt.verify( secret);
      console.log(secret)

     // const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash (password,10)
       
       const result= await Userr.findByIdAndUpdate(
          { _id: id }, 

          {password:hash}
           
           );

           result.save();
      
res.status(201).json({status:201,result})    
      
  
     res.render("index", { email: verify.email, status: "verified" });
    } catch (error) {
      console.log(error);
      res.json({ status: "Something Went Wrong" });
    }
  });

  app.get("/", (req, res) =>
  res.send(`Server Active`)
);

app.listen(process.env.PORT || 5000)
