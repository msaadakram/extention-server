#!/usr/bin/env node
/**
 * Drop all per-student collections. Their data is already in the shared 'grades'
 * collection (verified — 100% match on spot checks).
 *
 * Usage: node drop-per-student-collections.js [--dry-run]
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const DRY_RUN = process.argv.includes('--dry-run');

async function dropCollections() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000
    });

    const db = mongoose.connection.db;
    const allCollections = await db.listCollections().toArray();
    const allNames = allCollections.map(c => c.name);

    // Per-student collections: L<digits><letter><digits>...
    // Matches L1F... (fall), L1S... (self-supporting/spring)
    const studentPattern = /^L\d+[A-Z]\d+/;
    const studentCollections = allNames.filter(n => studentPattern.test(n));
    const sharedCollections = allNames.filter(n => !studentPattern.test(n));

    console.log(`Shared collections (${sharedCollections.length}): ${sharedCollections.join(', ')}`);
    console.log(`Per-student collections to drop: ${studentCollections.length}`);
    console.log('');

    if (DRY_RUN) {
        console.log('DRY RUN — would drop these collections:');
        studentCollections.forEach(c => console.log('  ' + c));
        console.log(`\nWould reduce from ${allCollections.length} to ${sharedCollections.length} collections`);
        process.exit(0);
    }

    let dropped = 0;
    let failed = [];

    for (const collName of studentCollections) {
        try {
            await db.collection(collName).drop();
            dropped++;
            if (dropped % 50 === 0) {
                console.log(`  Dropped ${dropped}/${studentCollections.length}...`);
            }
        } catch (err) {
            failed.push(collName);
            console.error(`  FAILED to drop ${collName}: ${err.message}`);
        }
    }

    console.log('');
    console.log('=== Done ===');
    console.log(`Dropped: ${dropped}`);
    console.log(`Failed: ${failed.length}`);

    const remaining = await db.listCollections().toArray();
    console.log(`Remaining collections: ${remaining.length}`);
    console.log(`Remaining: ${remaining.map(c => c.name).join(', ')}`);

    await mongoose.disconnect();
    process.exit(0);
}

dropCollections().catch(err => {
    console.error('Failed:', err);
    process.exit(1);
});
