require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

// Middleware
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Config
const { connectDB } = require('./config/db');

// Routes
const healthRoutes = require('./routes/health');
const gradesRoutes = require('./routes/grades');
const timetableRoutes = require('./routes/timetable');
const studentsRoutes = require('./routes/students');
const creditRoutes = require('./routes/credits');
const privacyRoutes = require('./routes/privacy');
const earnRoutes = require('./routes/earn');
const tokenPageRoutes = require('./routes/tokenPage');
const migrationRoutes = require('./routes/migration');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

// Helmet security headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https:"],
                imgSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
    })
);

// CORS: Allow all chrome-extension origins and known frontend origins
const allowedOrigins = [
    'https://horizon.ucp.edu.pk',
    'https://extenstion-token-frontend.vercel.app',
    'https://gradeserver-rho.vercel.app'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, server-to-server, Postman)
        if (!origin) return callback(null, true);
        // Allow all chrome-extension origins
        if (origin.startsWith('chrome-extension://')) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // In development, also allow localhost
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        var corsErr = new Error("Origin " + origin + " not allowed by CORS");
        corsErr.status = 403;
        callback(corsErr);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------

// Limit request body to 10mb (reduced from 50mb for safety)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ---------------------------------------------------------------------------
// Request logging
// ---------------------------------------------------------------------------

app.use(requestLogger);

// ---------------------------------------------------------------------------
// Routes that do NOT require DB (placed first)
// ---------------------------------------------------------------------------

app.use('/', healthRoutes);

// ---------------------------------------------------------------------------
// Database connection middleware (after health route)
// ---------------------------------------------------------------------------

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({
            error: 'Database connection failed',
            code: 'DB_CONNECTION_ERROR'
        });
    }
});

// ---------------------------------------------------------------------------
// API routes (require DB)
// ---------------------------------------------------------------------------

app.use('/api', gradesRoutes);
app.use('/api', timetableRoutes);
app.use('/api', studentsRoutes);
app.use('/api', creditRoutes);
app.use('/api', privacyRoutes);
app.use('/api/earn', earnRoutes);
app.use('/token', tokenPageRoutes);
app.use('/migrate', migrationRoutes);

// Global error handler (must be last)
// ---------------------------------------------------------------------------

app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server (only when run directly, not on Vercel)
// ---------------------------------------------------------------------------

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
