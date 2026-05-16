const mongoose = require('mongoose');

const SubjectGroupSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    day: { type: String, required: true },
    time: { type: String, required: true },
    teacher: { type: String, required: true },
    studentIds: [{ type: String }]
});

// Index for fast group matching during timetable save
SubjectGroupSchema.index({ courseName: 1, day: 1, time: 1, teacher: 1 }, { unique: true });
// Index for finding all groups a student belongs to (leaderboard scoping)
SubjectGroupSchema.index({ studentIds: 1 });

module.exports = mongoose.models.SubjectGroup || mongoose.model('SubjectGroup', SubjectGroupSchema);
