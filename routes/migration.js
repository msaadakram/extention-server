"use strict";

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { migrateBumpCredits } = require('../services/bumpCreditsMigration');

router.get('/bump-credits', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({ error: 'No database connection' });
        }

        const result = await migrateBumpCredits(db);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
