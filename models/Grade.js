const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
    name: String,
    totalMarks: Number,
    obtainedMarks: Number,
    percentage: Number,
    weightage: Number,
    classAverage: Number
});

const GradeSchema = new mongoose.Schema({
    studentId: { type: String, required: false },
    studentName: { type: String, required: false },
    studentImage: { type: String, required: false },
    courseName: { type: String, required: true },
    courseCode: { type: String, required: false },
    assessments: [AssessmentSchema],
    classAverage: { type: Number, required: false },
    overallPercentage: { type: Number, required: true },
    grade: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Grade', GradeSchema);
