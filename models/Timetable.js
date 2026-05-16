const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema(
    {
        studentID: { type: String, required: true },
        class: { type: String, required: false },
        time: { type: String, required: true },
        teacher: { type: String, required: true },
        courseName: { type: String, required: true },
        day: { type: String, required: true },
        room: { type: String, required: false }
    },
    { strict: false, timestamps: true }
);

// Index for fast student lookup
TimetableSchema.index({ studentID: 1 });
// Compound index for group matching
TimetableSchema.index({ courseName: 1, day: 1, time: 1, teacher: 1 });

// The 'class' field is a reserved word in strict-mode JavaScript, but Mongoose
// handles it safely via `schema.path('class')`. This schema maintains backward
// compatibility with the original inline schema from index.js.
// `strict: false` allows extra fields beyond the schema definition.

module.exports = mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema);
