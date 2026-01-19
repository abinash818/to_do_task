const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Plan = require('./models/planModel');

dotenv.config({ path: './backend/.env' });

const seedBuildingPlan = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const variants = [
            {
                name: 'Self',
                duration: 5,
                subtasks: [{ title: 'Self Subtask 1', maxDays: 2 }, { title: 'Self Subtask 2', maxDays: 3 }]
            },
            {
                name: 'Online',
                duration: 7,
                subtasks: [{ title: 'Online Application', maxDays: 2 }, { title: 'Document Upload', maxDays: 5 }]
            },
            {
                name: 'High raised',
                duration: 20,
                subtasks: [{ title: 'Site Inspection', maxDays: 5 }, { title: 'Structural Analysis', maxDays: 15 }]
            },
            {
                name: 'Non High raised',
                duration: 15,
                subtasks: [{ title: 'Site Visit', maxDays: 5 }, { title: 'Approval Processing', maxDays: 10 }]
            }
        ];

        // Find existing 'BUILDING PLAN' or create new
        // We use regex to match case-insensitive
        let plan = await Plan.findOne({ name: { $regex: new RegExp('^BUILDING PLAN$', 'i') } });

        if (plan) {
            console.log('Updating existing BUILDING PLAN...');
            plan.variants = variants;
            // Ensure default subtasks exist if empty
            if (!plan.subtasks || plan.subtasks.length === 0) {
                plan.subtasks = [{ title: 'Initial Assessment', maxDays: 1, isMandatory: true }];
            }
            await plan.save();
        } else {
            console.log('Creating new BUILDING PLAN...');
            plan = await Plan.create({
                name: 'BUILDING PLAN',
                description: 'Standard building plan approval process',
                maxDays: 30,
                subtasks: [{ title: 'Initial Assessment', maxDays: 1, isMandatory: true }],
                variants: variants,
                // Assuming a valid user ID is needed for createdBy, but schema might not strictly enforce reference integrity check on simple save if validation logic allows.
                // However, the model schema says createdBy is ObjectId ref User.
                // We'll try to find an admin user first.
            });
            // Need to handle createdBy if it's required.
            // Let's assume there is at least one user or the schema doesn't strictly enforce existence of the ID for now, 
            // OR find the first user.
            const User = require('./models/userModel');
            const admin = await User.findOne({ role: 'admin' });
            if (admin) {
                plan.createdBy = admin._id;
                await plan.save();
            }
        }

        console.log('Building Plan updated/created successfully with variants:');
        variants.forEach(v => console.log(`- ${v.name} (${v.duration} days)`));

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedBuildingPlan();
