const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/userModel');
const Plan = require('./models/planModel');
const Task = require('./models/taskModel');

const staffMembers = [
    { username: 'rajesh', password: 'password123', name: 'Rajesh Kumar', role: 'staff' },
    { username: 'priya', password: 'password123', name: 'Priya Sharma', role: 'staff' },
    { username: 'vijay', password: 'password123', name: 'Vijay Anand', role: 'staff' },
    { username: 'lakshmi', password: 'password123', name: 'Lakshmi Devi', role: 'staff' },
    { username: 'karthik', password: 'password123', name: 'Karthik Rajan', role: 'staff' },
];

const seedTestData = async () => {
    try {
        await connectDB();

        // Find admin user
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('Error: Admin user not found. Please run seed.js first.');
            process.exit(1);
        }

        // Find DTCP Plan
        const dtcpPlan = await Plan.findOne({ name: 'DTCP Approval Process' });
        if (!dtcpPlan) {
            console.log('Error: DTCP Plan not found. Please run seedDTCP.js first.');
            process.exit(1);
        }

        console.log('Creating 5 staff members...\n');

        const createdStaff = [];
        for (const staff of staffMembers) {
            let user = await User.findOne({ username: staff.username });
            if (!user) {
                user = await User.create(staff);
                console.log(`✅ Created: ${staff.name} (${staff.username})`);
            } else {
                console.log(`⏭️  Exists: ${staff.name} (${staff.username})`);
            }
            createdStaff.push(user);
        }

        console.log('\nCreating sample tasks with different statuses...\n');

        // Delete existing test tasks
        await Task.deleteMany({ title: { $regex: /^DTCP - / } });

        const today = new Date();
        const taskData = [
            {
                title: 'DTCP - Plot #101 Residential',
                description: 'Building approval for residential plot in Anna Nagar',
                assignedTo: createdStaff[0]._id,
                plan: dtcpPlan._id,
                subtasks: dtcpPlan.subtasks.map(s => ({ title: s.title, completed: true, reason: 'Done' })),
                status: 'completed',
                deadline: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                assignedBy: admin._id,
            },
            {
                title: 'DTCP - Plot #202 Commercial',
                description: 'Commercial building approval in T.Nagar',
                assignedTo: createdStaff[1]._id,
                plan: dtcpPlan._id,
                subtasks: dtcpPlan.subtasks.map((s, i) => ({
                    title: s.title,
                    completed: i < 7, // First 7 completed
                    reason: i < 7 ? 'In progress' : ''
                })),
                status: 'processing',
                deadline: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
                assignedBy: admin._id,
            },
            {
                title: 'DTCP - Plot #303 Villa',
                description: 'Villa construction approval in ECR',
                assignedTo: createdStaff[2]._id,
                plan: dtcpPlan._id,
                subtasks: dtcpPlan.subtasks.map(s => ({ title: s.title, completed: false, reason: '' })),
                status: 'pending',
                deadline: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                assignedBy: admin._id,
            },
            {
                title: 'DTCP - Plot #404 Apartment',
                description: 'Multi-story apartment approval in Velachery',
                assignedTo: createdStaff[3]._id,
                plan: dtcpPlan._id,
                subtasks: dtcpPlan.subtasks.map((s, i) => ({
                    title: s.title,
                    completed: i < 3,
                    reason: ''
                })),
                status: 'overdue',
                deadline: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (overdue)
                assignedBy: admin._id,
            },
            {
                title: 'DTCP - Plot #505 Industrial',
                description: 'Industrial building approval in Ambattur',
                assignedTo: createdStaff[4]._id,
                plan: dtcpPlan._id,
                subtasks: dtcpPlan.subtasks.map((s, i) => ({
                    title: s.title,
                    completed: i < 5,
                    reason: ''
                })),
                status: 'processing',
                deadline: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
                assignedBy: admin._id,
            },
        ];

        for (const task of taskData) {
            await Task.create(task);
            const statusEmoji = {
                'completed': '✅',
                'processing': '⚙️',
                'pending': '📋',
                'overdue': '⚠️'
            };
            console.log(`${statusEmoji[task.status]} ${task.title} - ${task.status.toUpperCase()}`);
        }

        console.log('\n========== SUMMARY ==========');
        console.log('Staff Created: 5');
        console.log('Tasks Created: 5');
        console.log('  - Completed: 1');
        console.log('  - Processing: 2');
        console.log('  - Pending: 1');
        console.log('  - Overdue: 1');
        console.log('\nTest credentials:');
        staffMembers.forEach(s => {
            console.log(`  ${s.name}: ${s.username} / password123`);
        });
        console.log('==============================\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

seedTestData();
