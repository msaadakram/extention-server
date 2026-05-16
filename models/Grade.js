const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    weightage: { type: Number, required: true },
    classAverage: { type: Number, required: false }
});

const GradeSchema = new mongoose.Schema({
    studentId: { type: String, required: false },
    studentName: { type: String, required: false },
    studentImage: { type: String, required: false },
    privacyMode: { type: Boolean, default: false },
    courseName: { type: String, required: true },
    courseCode: { type: String, required: false },
    assessments: { type: [AssessmentSchema], required: false },
    classAverage: { type: Number, required: false },
    overallPercentage: { type: Number, required: true },
    grade: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Indexes for leaderboard queries: find by courseName, sorted by overallPercentage descending
GradeSchema.index({ courseName: 1, overallPercentage: -1 });
// Compound index for the most common lookup: find a specific student's grade in a course
GradeSchema.index({ courseName: 1, studentId: 1 }, { unique: true });
// Index for checking student existence
GradeSchema.index({ studentId: 1 });

module.exports = mongoose.models.Grade || mongoose.model('Grade', GradeSchema);
