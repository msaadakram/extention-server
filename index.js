require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Grade = require('./models/Grade');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/save-grades', async (req, res) => {
    try {
        const { studentID, studentName, studentImage, courseName, courseCode, assessments, classAverage, overallPercentage, grade } = req.body;

        // Basic validation: CourseName is required. StudentID can default.
        if (!courseName) {
            console.log("Missing courseName", req.body);
            return res.status(400).json({ error: 'Missing required field: courseName' });
        }

        // 1. SINGLE COLLECTION: Save to 'grades' for Leaderboard
        const newGradeData = {
            studentId: studentID || 'unknown',
            studentName,
            studentImage,
            courseName,
            courseCode,
            assessments,
            classAverage,
            overallPercentage,
            grade
        };

        await Grade.findOneAndUpdate(
            { courseName: courseName, studentId: studentID },
            newGradeData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 2. DYNAMIC COLLECTION: Save to [studentID] for Personal Archive
        const collectionName = studentID || 'unknown_student';
        const StudentGradeModel = mongoose.model('Grade', Grade.schema, collectionName);

        await StudentGradeModel.findOneAndUpdate(
            { courseName: courseName },
            newGradeData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`Saved grade for ${courseName} in 'grades' AND '${collectionName}'`);

        console.log(`Saved grade for ${courseName} - ${studentID}`);
        res.status(201).json({ message: "Saved successfully" });
    } catch (error) {
        console.error('Error saving grade:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const { courseName } = req.query;
        if (!courseName) {
            return res.status(400).json({ error: "Missing courseName" });
        }

        // Find all grades for this course, sorted by percentage descending
        const grades = await Grade.find({ courseName: courseName })
            .sort({ overallPercentage: -1 })
            .select('studentName studentImage overallPercentage grade studentId assessments');

        res.json(grades);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.get('/', (req, res) => {
    res.send('UCP Grade Server is Running');
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
