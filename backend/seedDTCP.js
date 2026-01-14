const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const Plan = require('./models/planModel');
const User = require('./models/userModel');

const dtcpPlan = {
    name: 'DTCP Approval Process',
    description: 'Complete workflow for DTCP (Directorate of Town and Country Planning) building approval for residential/commercial plots',
    maxDays: 45,
    subtasks: [
        { title: 'Document Collection from Client', maxDays: 3, isMandatory: true },
        { title: 'Site Survey & Measurement', maxDays: 2, isMandatory: true },
        { title: 'Prepare Site Plan & Layout', maxDays: 5, isMandatory: true },
        { title: 'Prepare Building Plan (Ground + Floors)', maxDays: 7, isMandatory: true },
        { title: 'Structural Drawing Preparation', maxDays: 5, isMandatory: true },
        { title: 'Calculate FSI & Plot Coverage', maxDays: 2, isMandatory: true },
        { title: 'Prepare Affidavit & Undertaking', maxDays: 2, isMandatory: true },
        { title: 'Submit Online Application (e-Nagar)', maxDays: 1, isMandatory: true },
        { title: 'Fee Payment & Acknowledgment', maxDays: 1, isMandatory: true },
        { title: 'Physical File Submission to DTCP Office', maxDays: 2, isMandatory: true },
        { title: 'Site Inspection by DTCP Officer', maxDays: 7, isMandatory: true },
        { title: 'Query Response (if any)', maxDays: 5, isMandatory: false },
        { title: 'Final Approval & Permit Collection', maxDays: 3, isMandatory: true },
    ]
};

const seedDTCPPlan = async () => {
    try {
        await connectDB();

        // Find admin user
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('Error: Admin user not found. Please run seed.js first.');
            process.exit(1);
        }

        // Check if plan already exists
        const existingPlan = await Plan.findOne({ name: 'DTCP Approval Process' });
        if (existingPlan) {
            console.log('DTCP Plan already exists. Updating...');
            await Plan.findByIdAndUpdate(existingPlan._id, {
                ...dtcpPlan,
                createdBy: admin._id
            });
            console.log('✅ DTCP Plan updated successfully!');
        } else {
            await Plan.create({
                ...dtcpPlan,
                createdBy: admin._id
            });
            console.log('✅ DTCP Approval Plan created successfully!');
        }

        console.log('\nPlan Details:');
        console.log(`  Name: ${dtcpPlan.name}`);
        console.log(`  Total Days: ${dtcpPlan.maxDays}`);
        console.log(`  Subtasks: ${dtcpPlan.subtasks.length}`);
        console.log('\nSubtasks:');
        dtcpPlan.subtasks.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.title} (${s.maxDays} days)`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

seedDTCPPlan();
