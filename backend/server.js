const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    // Serve static files from the dist directory (root/dist)
    app.use(express.static(path.join(__dirname, '../dist')));

    // SPA Fallback: Any route not handled by API or static files returns index.html
    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
