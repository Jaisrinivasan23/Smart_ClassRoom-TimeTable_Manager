import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConnect from './utils/dbConnect.js';
import Student from './models/Student.js';
import Class from './models/Class.js';
import Timetable from './models/Timetable.js';
import Notification from './models/Notification.js';
import Department from './models/Department.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath, quiet: true });

async function diagnoseDatabaseIssues() {
  try {
    await dbConnect();
    console.log('✅ Connected to database\n');
    console.log('='.repeat(60));
    console.log('DATABASE DIAGNOSTIC REPORT');
    console.log('='.repeat(60));

    // 1. Check Students
    console.log('\n📚 STUDENTS ANALYSIS:');
    console.log('-'.repeat(60));
    const allStudents = await Student.find();
    console.log(`Total students in database: ${allStudents.length}`);
    
    const studentsWithClass = allStudents.filter(s => s.class);
    const studentsWithoutClass = allStudents.filter(s => !s.class);
    
    console.log(`  ✓ Students assigned to class: ${studentsWithClass.length}`);
    console.log(`  ✗ Students NOT assigned to class: ${studentsWithoutClass.length}`);
    
    if (studentsWithoutClass.length > 0) {
      console.log('\n  Students without class assignment:');
      studentsWithoutClass.slice(0, 5).forEach(s => {
        console.log(`    - ${s.rollNumber}: ${s.name}`);
      });
      if (studentsWithoutClass.length > 5) {
        console.log(`    ... and ${studentsWithoutClass.length - 5} more`);
      }
    }

    if (studentsWithClass.length > 0) {
      console.log('\n  Students with class assignment (sample):');
      for (const s of studentsWithClass.slice(0, 3)) {
        const classDoc = await Class.findById(s.class);
        console.log(`    - ${s.rollNumber}: ${s.name} → Class: ${classDoc?.name || 'INVALID CLASS ID'}`);
      }
    }

    // 2. Check Classes
    console.log('\n\n📋 CLASSES ANALYSIS:');
    console.log('-'.repeat(60));
    const allClasses = await Class.find().populate('department', 'name code');
    console.log(`Total classes in database: ${allClasses.length}`);
    
    if (allClasses.length > 0) {
      for (const cls of allClasses) {
        const studentsInClass = await Student.countDocuments({ class: cls._id });
        const timetableForClass = await Timetable.findOne({ class: cls._id });
        
        console.log(`\n  Class: ${cls.name} (${cls.section})`);
        console.log(`    Department: ${cls.department?.name || 'N/A'}`);
        console.log(`    Year: ${cls.year}, Semester: ${cls.semester}`);
        console.log(`    Students in Class model: ${cls.numberOfStudents}`);
        console.log(`    Students in Student collection with this class: ${studentsInClass}`);
        console.log(`    Timetable exists: ${timetableForClass ? '✓ YES' : '✗ NO'}`);
        
        if (timetableForClass) {
          console.log(`      - Timetable ID: ${timetableForClass._id}`);
          console.log(`      - Timetable name: ${timetableForClass.name}`);
          console.log(`      - Schedule entries: ${timetableForClass.schedule?.length || 0}`);
          console.log(`      - Status: ${timetableForClass.status}`);
        }
        
        // Check mismatch
        if (cls.numberOfStudents !== studentsInClass) {
          console.log(`    ⚠️  MISMATCH: Class says ${cls.numberOfStudents} students, but ${studentsInClass} students reference this class`);
        }
      }
    } else {
      console.log('  ℹ️  No classes found in database');
    }

    // 3. Check Timetables
    console.log('\n\n📅 TIMETABLES ANALYSIS:');
    console.log('-'.repeat(60));
    const allTimetables = await Timetable.find().populate('class', 'name section').populate('department', 'name');
    console.log(`Total timetables in database: ${allTimetables.length}`);
    
    if (allTimetables.length > 0) {
      allTimetables.forEach(tt => {
        console.log(`\n  Timetable: ${tt.name}`);
        console.log(`    ID: ${tt._id}`);
        console.log(`    Class: ${tt.class ? `${tt.class.name} (${tt.class.section})` : 'NO CLASS ASSIGNED'}`);
        console.log(`    Department: ${tt.department?.name || 'N/A'}`);
        console.log(`    Semester: ${tt.semester}, Year: ${tt.year}`);
        console.log(`    Schedule entries: ${tt.schedule?.length || 0}`);
        console.log(`    Status: ${tt.status}`);
        
        if (!tt.class) {
          console.log(`    ⚠️  WARNING: Timetable not linked to any class!`);
        }
      });
    } else {
      console.log('  ℹ️  No timetables found in database');
    }

    // 4. Check Notifications
    console.log('\n\n🔔 NOTIFICATIONS ANALYSIS:');
    console.log('-'.repeat(60));
    const allNotifications = await Notification.find().sort({ createdAt: -1 });
    console.log(`Total notifications in database: ${allNotifications.length}`);
    
    const notificationsWithClassId = allNotifications.filter(n => n.classId);
    const globalNotifications = allNotifications.filter(n => !n.classId && !n.facultyId);
    const facultyNotifications = allNotifications.filter(n => n.facultyId);
    
    console.log(`  ✓ Class notifications: ${notificationsWithClassId.length}`);
    console.log(`  ✓ Faculty notifications: ${facultyNotifications.length}`);
    console.log(`  ✓ Global notifications: ${globalNotifications.length}`);
    
    if (notificationsWithClassId.length > 0) {
      console.log('\n  Recent class notifications:');
      for (const notif of notificationsWithClassId.slice(0, 3)) {
        const classDoc = await Class.findById(notif.classId);
        console.log(`    - "${notif.title}" → Class: ${classDoc?.name || 'INVALID CLASS ID'}`);
        console.log(`      Type: ${notif.type}, Created: ${notif.createdAt?.toLocaleDateString()}`);
      }
    }

    // 5. Check Data Integrity Issues
    console.log('\n\n⚠️  DATA INTEGRITY ISSUES:');
    console.log('-'.repeat(60));
    let issuesFound = false;

    // Check for invalid class references in students
    console.log('\nChecking for invalid class references in students...');
    for (const student of studentsWithClass) {
      const classExists = await Class.findById(student.class);
      if (!classExists) {
        console.log(`  ❌ Student ${student.rollNumber} references non-existent class ID: ${student.class}`);
        issuesFound = true;
      }
    }

    // Check for invalid class references in notifications
    console.log('\nChecking for invalid class references in notifications...');
    for (const notif of notificationsWithClassId) {
      const classExists = await Class.findById(notif.classId);
      if (!classExists) {
        console.log(`  ❌ Notification "${notif.title}" references non-existent class ID: ${notif.classId}`);
        issuesFound = true;
      }
    }

    // Check for orphaned timetables
    console.log('\nChecking for orphaned timetables...');
    for (const tt of allTimetables) {
      if (tt.class) {
        const classExists = await Class.findById(tt.class);
        if (!classExists) {
          console.log(`  ❌ Timetable "${tt.name}" references non-existent class ID: ${tt.class}`);
          issuesFound = true;
        }
      }
    }

    if (!issuesFound) {
      console.log('  ✅ No data integrity issues found!');
    }

    // 6. Recommendations
    console.log('\n\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(60));
    
    if (studentsWithoutClass.length > 0) {
      console.log('  1. Assign students to classes using the class upload feature');
    }
    
    if (allClasses.length === 0) {
      console.log('  2. Create classes first before uploading students');
    }
    
    if (allTimetables.some(tt => !tt.class)) {
      console.log('  3. Ensure all timetables are linked to a specific class');
    }
    
    if (notificationsWithClassId.length === 0 && allClasses.length > 0) {
      console.log('  4. Test creating a notification for a class');
    }

    console.log('\n' + '='.repeat(60));
    console.log('END OF DIAGNOSTIC REPORT');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

diagnoseDatabaseIssues();
