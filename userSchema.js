const mongoose=require('mongoose');
const UserSchema=mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    }
},
    {
        collection: "UserIfo",
      }
)
module.exports=mongoose.model('UserIfo',UserSchema)