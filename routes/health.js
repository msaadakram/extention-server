const express = require('express');
const router = express.Router();

/**
 * GET /
 * Simple health check endpoint.
 */
router.get('/', (req, res) => {
    res.send('UCP Grade Server is Running');
});

module.exports = router;
