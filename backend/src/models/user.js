const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 50 // Increased slightly: some Google first names can be longer than 20 chars
    }, 
    lastName: {
        type: String,
        minLength: 1,
        maxLength: 50
    }, 
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        immutable: true
    },
    password: {
        type: String,
        required: function() {
            // Password is only required if the user did NOT register via Google
            return !this.googleId;
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows normal email/password users to have null/undefined without collision
    },
    avatar: {
        type: String
    },
    age: {
        type: Number,
        min: 6, 
        max: 80
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    problemSolved: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'problem'
        }],
        default: [],
        validate: {
            validator: function(v) {
                const uniqueIds = new Set(v.map(id => id.toString()));
                return uniqueIds.size === v.length;
            },
            message: 'Problem IDs must be unique in problemSolved array'
        }
    }
}, { timestamps: true });

// Cascade delete submissions when user is deleted
userSchema.post('findOneAndDelete', async function(userInfo) {
    if (userInfo) {
        // Fixed: lowercase 'mongoose' to match the imported module
        await mongoose.model('submission').deleteMany({ userId: userInfo._id });
    }
});

userSchema.methods.addSolvedProblem = function(problemId) {
    const idStr = problemId.toString();
    if (!this.problemSolved.some(id => id.toString() === idStr)) {
        this.problemSolved.push(problemId);
    }
    return this;
};

const User = mongoose.model("user", userSchema);
module.exports = User;