import { Schema, Types, model } from "mongoose";
import pkj from "jsonwebtoken";
const { sign } = pkj;
import bcrypt from 'bcryptjs';

const userSchema = new Schema({
  name: [
    {
      _id: false,
      name: String,
      date: {
        type: Date,
        default: Date.now
      },
    }
  ],
  userName: [
    {
      _id: false,
      userName: { type: String, unique: true },
      date: {
        type: Date,
        default: Date.now
      },
    }
  ],
  email: [
    {
      _id: false,
      email: { type: String, unique: true },
      date: {
        type: Date,
        default: Date.now
      },
    }
  ],
  password: {
    type: String,
    minlength: [8, 'Too short password'],
  },
  image: {
    type: String,
  },
  role: {
    type: Types.ObjectId,
    ref: 'Role',
    default: null
  },
  birthday: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Active', 'Blocked'],
    default: 'Active'
  },

  // Send Otp
  resetCodeForSignup: Number,
  resetCodeExpiredForSignup: Date,
  resetVerifyForSignup: {
    type: Boolean,
    default: false
  },
  resetCodeForPassword: Number,
  resetCodeExpiredForPassword: Date,
  resetVerifyForPassword: Boolean,

  banExpired: Date,
  isBanned: {
    type: Boolean,
    default: false
  },

  banForever: {
    type: Boolean,
    default: false
  },
  wallet: {
    type: Number,
    default: 0
  },
  videos: [{ type: Types.ObjectId, ref: 'Video' }]
}, { timestamps: true });

userSchema.pre(/^find/, function (next) {
  this.select("-__v -createdAt -updatedAt");
  next()
});

userSchema.pre('find', function (next) {
  this.select('-password');
  next();
});


userSchema.methods.createJWTForAuthorization = function () {
  return sign({
    userId: this._id,
  },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d'
    }
  )
};

userSchema.methods.comparePass = async function (checkPass) {
  return await bcrypt.compare(checkPass, this.password);
};

userSchema.methods.hashedPass = async function () {
  this.password = await bcrypt.hash(this.password, 10);
};

export default model('User', userSchema);