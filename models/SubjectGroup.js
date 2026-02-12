const mongoose = require('mongoose');

const SubjectGroupSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    day: { type: String, required: true },
    time: { type: String, required: true },
    teacher: { type: String, required: true },
    studentIds: [{ type: String }] // Array of student IDs in this group
});

// Index for fast matching
SubjectGroupSchema.index({ courseName: 1, day: 1, time: 1, teacher: 1 }, { unique: true });
// Index for finding a student's groups
SubjectGroupSchema.index({ studentIds: 1 });

module.exports = mongoose.model('SubjectGroup', SubjectGroupSchema);
