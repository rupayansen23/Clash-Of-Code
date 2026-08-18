const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    firstName : {
        type : String,
        required : true,
        minLength : 3,
        maxLength : 20
    }, 
    lastName: {
        type : String,
        //required : true,
        minLength : 2,
        maxLength : 20
    }, 
    emailId : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        immutable : true
    },
    password:{
        type: String,
        required: true
    },
    age : {
        type : Number,
        min : 6, 
        max : 80
    },
    role : {
        type : String,
        enum : ['user', 'admin'],
        default : 'user'
    },
    problemSolved : {
        type : [{
            type:Schema.Types.ObjectId,
            ref:'problem'
        }],
        default: [],
        // REMOVE: unique: true
        // Add custom validation to ensure uniqueness
        validate: {
            validator: function(v) {
                const uniqueIds = new Set(v.map(id => id.toString()));
                return uniqueIds.size === v.length;
            },
            message: 'Problem IDs must be unique in problemSolved array'
        }
    }
}, {timestamps:true})
userSchema.post('findOneAndDelete', async function(userInfo){
    if(userInfo) {
        await Mongoose.model('submission').deleteMany({userId: userInfo._id});
    }
})

userSchema.methods.addSolvedProblem = function(problemId) {
    const idStr = problemId.toString();
    // Check if problem already exists in the array
    if (!this.problemSolved.some(id => id.toString() === idStr)) {
        this.problemSolved.push(problemId);
    }
    return this;
};


const User = mongoose.model("user", userSchema);
module.exports = User;