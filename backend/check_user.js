const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

dotenv.config({ path: './backend/.env' });

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const user = await User.findOne({ name: 'rajesh' });
        // Also check by email if name match fails, just in case 'rajesh' is being sent as email, 
        // though the log said "Attempting login for: rajesh", usually login uses email.
        const userByEmail = await User.findOne({ email: 'rajesh@example.com' });
        // We don't know the email, but assuming the login form might accept username or email?
        // Let's check the controller logic too.

        if (user) {
            console.log('User found by name:', user.name);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
        } else {
            console.log('User "rajesh" NOT found by name.');
        }

        if (userByEmail) {
            console.log('User found by email (rajesh@example.com):', userByEmail.name);
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        process.exit();
    }
};

checkUser();
