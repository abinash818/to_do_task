const admin = require('firebase-admin');
const serviceAccount = require('C:\\Users\\abina\\Downloads\\firebase\\todotask-74599-firebase-adminsdk-fbsvc-a9b92fc67e.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://todotask-74599-default-rtdb.firebaseio.com"
});

const createUser = async () => {
    try {
        const userRecord = await admin.auth().createUser({
            email: 'admin@gmail.com',
            password: 'password123', // Using a stronger password for now, user can change it
            displayName: 'Admin User',
        });

        console.log('Successfully created new user:', userRecord.uid);

        // Set role in Realtime Database
        await admin.database().ref(`users/${userRecord.uid}`).set({
            name: 'Admin User',
            email: 'admin@gmail.com',
            role: 'admin',
            createdAt: new Date().toISOString()
        });

        console.log('Successfully set user role in database');
        process.exit(0);
    } catch (error) {
        console.error('Error creating new user:', error);
        process.exit(1);
    }
};

createUser();
