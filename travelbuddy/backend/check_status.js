import mongoose from 'mongoose';
import Profile from './models/Profile.js';
import dotenv from 'dotenv';

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await Profile.findOne({ username: 'dipesh' });
  if (user) {
    console.log(JSON.stringify({
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    }, null, 2));
  } else {
    console.log('User dipesh not found');
  }
} catch (err) {
  console.error(err);
} finally {
  await mongoose.disconnect();
}
