import { Schema, Types, model } from "mongoose";
import pkj from "jsonwebtoken";
const { sign } = pkj;

const googleAccountSchema = new Schema({
  googleId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique:true,
    required: true
  },
  name: {
    type: String,
    required:true
  },
  image: {
    type: String,
  },
  birthday: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Active', 'Blocked'],
    default: 'Active'
  },
}, { timestamps: true });

googleAccountSchema.pre(/^find/, function (next) {
  this.select("-__v -createdAt -updatedAt");
  next()
});

googleAccountSchema.methods.createJWTForAuthorization = function () {
  return sign({
    userId: this._id,
  },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d'
    }
  )
};

export default model('GoogleAccount', googleAccountSchema);