import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    phone:    { type: String, default: '' },
    role:     { type: String, enum: ['rider', 'driver', 'admin'], default: 'rider' },
    rating:   { type: Number, default: 5.0, min: 1, max: 5 },
    avatar:   { type: String, default: '' },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare entered password with stored hash
userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;