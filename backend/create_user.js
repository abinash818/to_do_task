const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');

dotenv.config({ path: './backend/.env' });

const createUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check again to be sure
        const userExists = await User.findOne({ username: 'rajesh' });

        if (userExists) {
            console.log('User already exists');
            // Reset password just in case
            // Note: The pre-save hook in userModel hashes the password if modified.
            // So we should just set it to the plain text '12345' and let the hook handle hashing
            // OR if we manually hash, we must ensure the hook doesn't double hash.
            // Looking at model: if (!this.isModified('password')) next(); ... this.password = await bcrypt.hash...
            // So if we set plain text, it will hash.

            userExists.password = '12345';
            await userExists.save();
            console.log('Password reset to 12345');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('12345', salt);

        const user = await User.create({
            name: 'rajesh',
            username: 'rajesh', // Added username
            email: 'rajesh@gmail.com',
            password: hashedPassword,
            role: 'staff',
            isAdmin: true
        });

        console.log('User created:', user.name);
        console.log('Email: rajesh@gmail.com');
        console.log('Password: 12345');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

createUser();
