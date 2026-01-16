const mongoose = require('mongoose');
const { User } = require('./models');
require('dotenv').config();
const initAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); 
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        role: 'admin',
        password: 'admin',
        profile: {
          fullName: 'System Administrator',
          email: 'admin@university.com'
        }
      });
      console.log('✨ Admin created!');
    } else {
      console.log('✅ Admin already exists.');
    }
    process.exit(0); // Close the process when done
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

initAdmin(); // Call it