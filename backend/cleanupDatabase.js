import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConnect from './utils/dbConnect.js';
import Student from './models/Student.js';
import Class from './models/Class.js';
import Timetable from './models/Timetable.js';
import Notification from './models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath, quiet: true });

async function cleanupDatabase() {
  try {
    await dbConnect();
    console.log('✅ Connected to database\n');
    console.log('='.repeat(60));
    console.log('DATABASE CLEANUP UTILITY');
    console.log('='.repeat(60));

    // Show current state
    const studentCount = await Student.countDocuments();
    const classCount = await Class.countDocuments();
    const timetableCount = await Timetable.countDocuments();
    const notificationCount = await Notification.countDocuments();

    console.log('\n📊 CURRENT DATABASE STATE:');
    console.log(`  Students: ${studentCount}`);
    console.log(`  Classes: ${classCount}`);
    console.log(`  Timetables: ${timetableCount}`);
    console.log(`  Notifications: ${notificationCount}`);

    console.log('\n⚠️  WARNING: This will perform the following actions:');
    console.log('  1. DELETE all students from Student collection');
    console.log('  2. DELETE all classes from Class collection');
    console.log('  3. DELETE all timetables from Timetable collection');
    console.log('  4. DELETE all notifications from Notification collection');
    console.log('\n  This action CANNOT be undone!');
    console.log('  You will need to:');
    console.log('    - Recreate classes manually');
    console.log('    - Re-upload students CSV');
    console.log('    - Regenerate timetables');

    // Since this is a script, we'll proceed with cleanup
    console.log('\n🧹 Starting cleanup in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n1️⃣  Deleting all students...');
    const deletedStudents = await Student.deleteMany({});
    console.log(`   ✓ Deleted ${deletedStudents.deletedCount} students`);

    console.log('\n2️⃣  Deleting all classes...');
    const deletedClasses = await Class.deleteMany({});
    console.log(`   ✓ Deleted ${deletedClasses.deletedCount} classes`);

    console.log('\n3️⃣  Deleting all timetables...');
    const deletedTimetables = await Timetable.deleteMany({});
    console.log(`   ✓ Deleted ${deletedTimetables.deletedCount} timetables`);

    console.log('\n4️⃣  Deleting all notifications...');
    const deletedNotifications = await Notification.deleteMany({});
    console.log(`   ✓ Deleted ${deletedNotifications.deletedCount} notifications`);

    console.log('\n✅ CLEANUP COMPLETE!');
    console.log('\n📝 NEXT STEPS:');
    console.log('  1. Create a new class using the Classes page');
    console.log('  2. Upload students CSV for that class');
    console.log('  3. Generate timetable for the class');
    console.log('  4. Test student login with roll number + password "123"');

    console.log('\n' + '='.repeat(60));
    console.log('Database is now clean and ready for fresh start!');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

cleanupDatabase();
