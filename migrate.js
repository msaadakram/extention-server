#!/usr/bin/env node
/**
 * Migrate all per-student collections into the shared 'grades' collection,
 * then drop the per-student collections.
 *
 * Usage: node migrate.js [--dry-run] [--migrate-earn-credits]
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const DRY_RUN = process.argv.includes('--dry-run');
const MIGRATE_EARN_CREDITS = process.argv.includes('--migrate-earn-credits');

const EARN_USER_COURSE = '__earn_user__';
const CREDITS_COURSE = '__credits__';
const CREDITS_DEFAULT = 10;

function normalizeCredits(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

async function migrateEarnCredits(db) {
    console.log('');
    console.log('=== Earn Credits Migration (earn_user -> credits) ===');

    const gradesColl = db.collection('grades');
    const earnUsers = await gradesColl.find({ courseName: EARN_USER_COURSE }).toArray();

    console.log(`Found ${earnUsers.length} earn user records`);

    let migrated = 0;
    let skippedMissingUser = 0;
    let skippedZeroCredits = 0;
    let skippedAlreadyMigrated = 0;
    let failed = 0;

    for (const doc of earnUsers) {
        const userId = doc.userId || doc.studentId;
        if (!userId) {
            skippedMissingUser++;
            continue;
        }

        if (doc.migratedToCredits) {
            skippedAlreadyMigrated++;
            continue;
        }

        const creditsToMove = normalizeCredits(doc.credits, 0);
        if (!creditsToMove || creditsToMove <= 0) {
            skippedZeroCredits++;
            continue;
        }

        if (DRY_RUN) {
            migrated++;
            console.log(`  DRY RUN: would move ${creditsToMove} credits for ${userId}`);
            continue;
        }

        try {
            const existing = await gradesColl.findOne({ studentId: userId, courseName: CREDITS_COURSE });
            const baseCredits = existing
                ? normalizeCredits(existing.credits, CREDITS_DEFAULT)
                : CREDITS_DEFAULT;
            const newCredits = baseCredits + creditsToMove;

            if (!existing) {
                await gradesColl.insertOne({
                    studentId: userId,
                    courseName: CREDITS_COURSE,
                    overallPercentage: 0,
                    grade: 'N/A',
                    credits: newCredits,
                    timestamp: new Date()
                });
            } else {
                await gradesColl.updateOne(
                    { _id: existing._id },
                    { $set: { credits: newCredits, timestamp: new Date() } }
                );
            }

            await gradesColl.updateOne(
                { _id: doc._id },
                {
                    $set: {
                        migratedToCredits: true,
                        migratedAt: new Date(),
                        migratedCredits: creditsToMove,
                        migratedTarget: CREDITS_COURSE,
                        migratedCreditTotal: newCredits
                    }
                }
            );

            migrated++;
        } catch (err) {
            failed++;
            console.error(`  ERROR migrating ${userId}:`, err.message);
        }
    }

    console.log('');
    console.log('=== Earn Credits Migration Summary ===');
    console.log(`Earn users found: ${earnUsers.length}`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped (missing userId): ${skippedMissingUser}`);
    console.log(`Skipped (already migrated): ${skippedAlreadyMigrated}`);
    console.log(`Skipped (zero credits): ${skippedZeroCredits}`);
    console.log(`Failed: ${failed}`);
    if (DRY_RUN) {
        console.log('DRY RUN — no changes made.');
    }
}

async function migrate() {
    if (!MONGODB_URI) {
        console.error('Missing MONGODB_URI in environment.');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000
    });

    const db = mongoose.connection.db;
    const allCollections = await db.listCollections().toArray();
    const allNames = allCollections.map(c => c.name);

    // Per-student collections: L<digits><letter><digits>...
    const studentPattern = /^L\d+[A-Z]\d+/;
    const studentCollections = allNames.filter(n => studentPattern.test(n));

    console.log(`Found ${studentCollections.length} per-student collections`);
    console.log(`Shared collections: ${allNames.filter(n => !studentPattern.test(n)).join(', ')}`);

    if (studentCollections.length === 0) {
        console.log('No per-student collections to migrate.');
        if (!MIGRATE_EARN_CREDITS) {
            console.log('Nothing else to do. Exiting.');
            process.exit(0);
        }
    }

    const gradesColl = db.collection('grades');
    let totalMigrated = 0;
    let totalSkipped = 0;
    let failedCollections = [];

    for (const collName of studentCollections) {
        try {
            const docs = await db.collection(collName).find({}).toArray();
            console.log(`  ${collName}: ${docs.length} docs`);

            for (const doc of docs) {
                const { _id, ...docData } = doc;

                // Skip docs that don't have courseName (required for grades collection)
                if (!docData.courseName) {
                    totalSkipped++;
                    continue;
                }

                if (!DRY_RUN) {
                    await gradesColl.updateOne(
                        {
                            studentId: docData.studentId || collName,
                            courseName: docData.courseName
                        },
                        {
                            $set: {
                                ...docData,
                                studentId: docData.studentId || collName,
                                timestamp: docData.timestamp || new Date()
                            }
                        },
                        { upsert: true }
                    );
                }
                totalMigrated++;
            }

            if (!DRY_RUN) {
                // Verify docs exist in grades before dropping
                const sampleDoc = docs[0];
                if (sampleDoc && sampleDoc.courseName) {
                    const verifyStudentId = sampleDoc.studentId || collName;
                    const countInGrades = await gradesColl.countDocuments({
                        studentId: verifyStudentId,
                        courseName: sampleDoc.courseName
                    });
                    if (countInGrades > 0) {
                        await db.collection(collName).drop();
                        console.log(`    -> Migrated and dropped ${collName}`);
                    } else {
                        console.log(`    -> WARNING: Verification failed for ${collName}, not dropping`);
                        failedCollections.push(collName);
                    }
                } else {
                    // No valid docs — safe to drop
                    if (docs.length === 0) {
                        await db.collection(collName).drop();
                        console.log(`    -> Dropped empty collection ${collName}`);
                    }
                }
            }
        } catch (err) {
            console.error(`  ERROR processing ${collName}:`, err.message);
            failedCollections.push(collName);
        }
    }

    console.log('');
    console.log('=== Migration Summary ===');
    console.log(`Per-student collections found: ${studentCollections.length}`);
    console.log(`Total docs migrated: ${totalMigrated}`);
    console.log(`Docs skipped (no courseName): ${totalSkipped}`);
    console.log(`Failed collections: ${failedCollections.length}`);
    if (failedCollections.length > 0) {
        console.log('  Failed:', failedCollections.join(', '));
    }

    if (DRY_RUN) {
        console.log('DRY RUN — no changes made. Run without --dry-run to execute.');
    } else {
        // Show remaining collections count
        const remaining = await db.listCollections().toArray();
        console.log(`Total collections now: ${remaining.length}`);

        // Show which student collections still remain
        const stillRemaining = remaining
            .map(c => c.name)
            .filter(n => studentPattern.test(n));
        if (stillRemaining.length > 0) {
            console.log(`Still remaining (${stillRemaining.length}):`, stillRemaining.join(', '));
        }
    }

    if (MIGRATE_EARN_CREDITS) {
        await migrateEarnCredits(db);
    }

    await mongoose.disconnect();
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
