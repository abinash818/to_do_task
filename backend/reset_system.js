const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');
const Task = require('./models/taskModel');
const Plan = require('./models/planModel');

dotenv.config({ path: './backend/.env' });

const resetSystem = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔥 MongoDB Connected. Starting System Reset...');

        // 1. Wipe Data
        await User.deleteMany({});
        await Task.deleteMany({});
        await Plan.deleteMany({});
        console.log('❌ All Users, Tasks, Plans deleted.');

        // 2. Create Users
        // NOTE: The User model has a pre-save hook that hashes the password.
        // So we must provide the PLAIN TEXT password here.

        const admin = await User.create({
            name: 'System Admin',
            username: 'admin',
            email: 'admin@gmail.com',
            password: '12345',
            role: 'admin'
        });

        const rajesh = await User.create({
            name: 'Rajesh',
            username: 'rajesh',
            email: 'rajesh@gmail.com',
            password: '12345',
            role: 'staff'
        });

        console.log('✅ Users Created: Admin & Rajesh');

        // 3. Create Plans
        const plans = [
            {
                name: 'VALUATION WORK',
                description: 'Property valuation services for banks.',
                maxDays: 2,
                subtasks: [{ title: 'Site Inspection', maxDays: 1, isMandatory: true }, { title: 'Report Generation', maxDays: 1, isMandatory: true }],
                variants: [
                    { name: 'LIC', duration: 2, subtasks: [] },
                    { name: 'SBI', duration: 2, subtasks: [] },
                    { name: 'IOB', duration: 2, subtasks: [] },
                    { name: 'Indian Bank', duration: 2, subtasks: [] },
                    { name: 'CUB', duration: 2, subtasks: [] },
                    { name: 'TMP', duration: 2, subtasks: [] },
                    { name: 'Repco', duration: 2, subtasks: [] },
                    { name: 'TIC', duration: 2, subtasks: [] },
                    { name: 'Union Bank', duration: 2, subtasks: [] },
                    { name: 'Info Bank', duration: 2, subtasks: [] },
                    { name: 'Other', duration: 2, subtasks: [] }
                ]
            },
            {
                name: 'INCOME TAX',
                description: 'Income Tax filing and related services.',
                maxDays: 2,
                subtasks: [{ title: 'Document Collection', maxDays: 1, isMandatory: true }, { title: 'Filing', maxDays: 1, isMandatory: true }],
                variants: []
            },
            {
                name: 'LAYOUT',
                description: 'Layout approval and drawing.',
                maxDays: 7,
                subtasks: [{ title: 'Survey', maxDays: 2, isMandatory: true }, { title: 'Drawing', maxDays: 3, isMandatory: true }, { title: 'Approval', maxDays: 2, isMandatory: true }],
                variants: []
            },
            {
                name: 'SUBDIVISION',
                description: 'Land subdivision services.',
                maxDays: 7,
                subtasks: [{ title: 'Site Measurement', maxDays: 2 }, { title: 'FMB Sketch', maxDays: 3 }, { title: 'Application', maxDays: 2 }],
                variants: []
            },
            {
                name: 'BUILDING PLAN',
                description: 'Building plan approval process.',
                maxDays: 30, // Default fallback
                subtasks: [{ title: 'Initial Assessment', maxDays: 1 }],
                variants: [
                    { name: 'Online', duration: 7, subtasks: [] },
                    { name: 'High raised', duration: 20, subtasks: [] },
                    { name: 'Non High raised', duration: 15, subtasks: [] }
                ]
            }
        ];

        for (const p of plans) {
            p.createdBy = admin._id;
            await Plan.create(p);
        }

        console.log('✅ Plans Created: Valuation, Income Tax, Layout, Subdivision, Building Plan');
        console.log('🚀 SYSTEM RESET COMPLETE');
        process.exit();

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

resetSystem();
