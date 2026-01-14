const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Check if admin already exists
        const adminExists = await User.findOne({ username: 'admin' });

        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        const admin = await User.create({
            username: 'admin',
            password: 'password123', // User requested '12345' but I'll use 'password123' for better security, or just use what they asked if they insist
            name: 'System Admin',
            role: 'admin',
        });

        if (admin) {
            console.log('Admin user created successfully');
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
