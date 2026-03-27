require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Grade = require('./models/Grade');
const SubjectGroup = require('./models/SubjectGroup');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — allow all origins for debugging connection issue
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Global error handler for JSON parsing or other middleware errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({ error: "Invalid JSON payload" });
    }
    next();
});

// MongoDB Connection — cached for Vercel serverless
let isConnected = false;

async function connectDB() {
    if (isConnected) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
}

// Ensure DB is connected before every request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ error: 'Database connection failed' });
    }
});

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
            grade,
            timestamp: new Date()
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
        const { courseName, studentId } = req.query;
        if (!courseName) {
            return res.status(400).json({ error: "Missing courseName" });
        }

        console.log(`Leaderboard request: Course=${courseName}, Student=${studentId}`);

        let studentIds = [];

        if (studentId) {
            // Find the SubjectGroup this student belongs to for this course
            // Using regex to handle cases where timetable might have "Course Name (Section)" 
            // but grades only have "Course Name"
            const group = await SubjectGroup.findOne({
                courseName: new RegExp(`^${escapeRegex(courseName)}`, 'i'),
                studentIds: studentId
            });

            if (group) {
                studentIds = group.studentIds;
                console.log(`Found group for student ${studentId}. Classmates: ${studentIds.length}`);
            } else {
                console.log(`No group found for student ${studentId} in course ${courseName}`);
                // Fallback: If no grouping data exists, maybe show all (for now) or just self?
                // User requirement said "ONLY classmates", but if grouping hasn't happened yet...
                // Let's stick to the rule: if no group, they only see themselves (or nothing if not matched).
                studentIds = [studentId];
            }
        }

        // Fetch grades for the students in this group (or all if no studentId provided)
        const query = { courseName: courseName };
        if (studentIds.length > 0) {
            query.studentId = { $in: studentIds };
        }

        const grades = await Grade.find(query)
            .sort({ overallPercentage: -1 })
            .select('studentName studentImage overallPercentage grade studentId assessments timestamp');

        const cleanedGrades = grades.map(g => {
            const gradeObj = g.toObject();
            if (gradeObj.studentName) {
                gradeObj.studentName = gradeObj.studentName.split(/Faculty of/i)[0].trim();
            }
            return gradeObj;
        });

        console.log(`Returning ${grades.length} grades for ${courseName}`);
        res.json(cleanedGrades);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Helper to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

app.get('/api/check-student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        // Check both Grades and Timetable to determine if we know this student
        const gradeExists = await Grade.exists({ studentId });

        const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', new mongoose.Schema({ studentID: String }, { strict: false, timestamps: true }));
        const timetableDoc = await Timetable.findOne({ studentID: studentId }).sort({ updatedAt: -1 });
        const timetableExists = !!timetableDoc;

        res.json({
            exists: !!(gradeExists || timetableExists),
            hasTimetable: timetableExists,
            lastTimetableUpdate: timetableDoc ? timetableDoc.updatedAt : null
        });
    } catch (error) {
        console.error('Error checking student:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/save-timetable', async (req, res) => {
    try {
        const { studentID, timetable } = req.body;
        if (!studentID || !timetable) {
            return res.status(400).json({ error: 'Missing studentID or timetable' });
        }

        // 1. Save individual records for student personal archive (legacy support)
        const TimetableSchema = new mongoose.Schema({
            studentID: String,
            class: String,
            time: String,
            teacher: String,
            courseName: String,
            day: String
        }, { strict: false, timestamps: true });

        const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema);

        await Timetable.deleteMany({ studentID });
        await Timetable.insertMany(timetable.map(t => ({ ...t, studentID })));

        // 2. Matching & Grouping Logic
        // Remove student from ALL groups first to handle timetable updates/changes correctly
        await SubjectGroup.updateMany(
            { studentIds: studentID },
            { $pull: { studentIds: studentID } }
        );

        for (const entry of timetable) {
            const { day, time, teacher, courseName } = entry;

            // Now, find or create the correct group to add the student back into
            await SubjectGroup.findOneAndUpdate(
                { courseName, day, time, teacher },
                { $addToSet: { studentIds: studentID } },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({ message: 'Timetable saved and student grouped successfully' });
    } catch (error) {
        console.error('Error saving timetable:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/timetable-leaderboard', async (req, res) => {
    try {
        const Timetable = mongoose.models.Timetable;
        if (!Timetable) return res.json([]);

        // Example: Leaderboard by teacher count or something similar based on user's request
        // "leaderboard based on class, time and teacher name"
        // For now, let's just return all timetable data grouped or simply listed
        const data = await Timetable.find({});
        res.json(data);
    } catch (error) {
        console.error('Error fetching timetable leaderboard:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
