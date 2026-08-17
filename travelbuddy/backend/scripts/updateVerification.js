import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Profile from '../models/Profile.js';

dotenv.config();

const updateVerification = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update Dipesh Sherchan
    const dipesh = await Profile.findOneAndUpdate(
      { 
        $or: [
          { username: /dipesh/i }, 
          { nickname: /dipesh/i }
        ] 
      },
      { isVerified: true },
      { new: true }
    );
    if (dipesh) {
      console.log(`Updated ${dipesh.username} to verified`);
    } else {
      console.log('Dipesh Sherchan not found');
    }

    const ajit = await Profile.findOneAndUpdate(
      { 
        $or: [
          { username: /ajit/i }, 
          { nickname: /ajit/i }
        ] 
      },
      { isVerified: false }, // explicitly set to false as requested
      { new: true }
    );
    if (ajit) {
      console.log(`Updated ${ajit.username} to unverified`);
    } else {
      console.log('Ajit Shrestha not found');
    }

    console.log('Verification update complete');
    process.exit();
  } catch (err) {
    console.error('Error updating verification:', err);
    process.exit(1);
  }
};

updateVerification();
