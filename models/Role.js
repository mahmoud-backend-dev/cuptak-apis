import { model, Schema } from "mongoose";

const roleSchema = new Schema({
  name: {
    type: String,
    required: [true, 'name role required']
  },
  permissions: {
    type: [{
      type: String,
      enum: [
        'owner',
        'admin',
        'manage videos',
        'manage sounds',
        'manage hashtags',
        'manage reports',
        'manage gifts',
        'manage categories',
        'manage wallet',
        'manage roles',
        'manage users'
      ],
      required: true
    }],
  },
}, { timestamps: true });

roleSchema.pre(/^find/, function (next) {
  this.select('-__v -CreatedAt -UpdatedAt');
  next();
});

export default model('Role', roleSchema);