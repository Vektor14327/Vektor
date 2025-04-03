require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/error');

const app = express();

app.use(express.json());

// Database connection
require('./config/db')();

// Middleware
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    console.error(err.stack); // Log the actual error
    res.status(500).json({
        error: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Something went wrong'
    });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/stripe', require('./routes/stripeRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});