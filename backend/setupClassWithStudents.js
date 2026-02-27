import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import dbConnect from './utils/dbConnect.js';
import Student from './models/Student.js';
import Class from './models/Class.js';
import Department from './models/Department.js';
import Notification from './models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

async function setupClassWithStudents() {
  try {
    await dbConnect();
    console.log('✅ Connected to database\n');
    console.log('='.repeat(60));
    console.log('CLASS & STUDENT SETUP HELPER');
    console.log('='.repeat(60));

    // Step 1: Read CSV
    console.log('\n1️⃣  Reading students from CSV...');
    const csvPath = path.join(__dirname, '..', 'students_sample.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    const studentData = [];
    for (let i = 1; i < lines.length; i++) {
      const [name, rollNumber, email] = lines[i].split(',');
      studentData.push({
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        email: email.trim(),
        password: '123'
      });
    }
    console.log(`   ✓ Parsed ${studentData.length} students from CSV`);

    // Step 2: Create students in database (without class assignment)
    console.log('\n2️⃣  Creating student records...');
    await Student.deleteMany({});  // Clear existing
    const createdStudents = await Student.insertMany(studentData);
    console.log(`   ✓ Created ${createdStudents.length} student records`);
    createdStudents.slice(0, 3).forEach(s => {
      console.log(`      - ${s.rollNumber}: ${s.name}`);
    });
    console.log(`      ... and ${createdStudents.length - 3} more`);

    // Step 3: Show department options
    console.log('\n3️⃣  Fetching departments...');
    const departments = await Department.find();
    if (departments.length === 0) {
      console.log('   ⚠️  No departments found! Please create a department first.');
      console.log('   You can create departments via the admin panel.');
      process.exit(1);
    }
    
    console.log(`   ✓ Found ${departments.length} departments:`);
    departments.forEach((dept, idx) => {
      console.log(`      ${idx + 1}. ${dept.name} (${dept.code})`);
    });

    // Use first department for this demo
    const selectedDept = departments[0];
    console.log(`\n   Using: ${selectedDept.name} (${selectedDept.code})`);

    // Step 4: Create a class
    console.log('\n4️⃣  Creating class...');
    const newClass = await Class.create({
      name: 'CS First Year 2024',
      department: selectedDept._id,
      year: 1,
      section: 'A',
      semester: 2,
      numberOfStudents: 0,  // Will be updated when students are assigned
      students: []
    });
    console.log(`   ✓ Created class: ${newClass.name}`);
    console.log(`      - ID: ${newClass._id}`);
    console.log(`      - Department: ${selectedDept.name}`);
    console.log(`      - Year: ${newClass.year}, Semester: ${newClass.semester}, Section: ${newClass.section}`);

    // Step 5: Assign students to class
    console.log('\n5️⃣  Assigning students to class...');
    let assignedCount = 0;
    const assignedStudentsList = [];
    
    for (const student of createdStudents) {
      student.class = newClass._id;
      student.department = selectedDept._id;
      student.year = newClass.year;
      student.semester = newClass.semester;
      await student.save();
      
      assignedStudentsList.push({
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email
      });
      assignedCount++;
    }
    
    console.log(`   ✓ Assigned ${assignedCount} students to ${newClass.name}`);

    // Step 6: Update class with student list
    console.log('\n6️⃣  Updating class with student list...');
    newClass.students = assignedStudentsList;
    newClass.numberOfStudents = assignedCount;
    await newClass.save();
    console.log(`   ✓ Class updated with ${newClass.numberOfStudents} students`);

    // Step 7: Send welcome notification
    console.log('\n7️⃣  Sending welcome notification...');
    const notification = await Notification.create({
      title: 'Welcome to Your Class',
      message: `You have been assigned to ${newClass.name}. You will receive notifications about faculty changes, room changes, and other important updates.`,
      type: 'info',
      classId: newClass._id,
    });
    console.log(`   ✓ Notification sent to all students`);

    // Step 8: Verification
    console.log('\n8️⃣  Verification...');
    const studentsInClass = await Student.countDocuments({ class: newClass._id });
    const updatedClass = await Class.findById(newClass._id);
    console.log(`   ✓ Students with class reference: ${studentsInClass}`);
    console.log(`   ✓ Class numberOfStudents: ${updatedClass.numberOfStudents}`);
    
    if (studentsInClass === updatedClass.numberOfStudents) {
      console.log(`   ✅ MATCH! Everything is synced correctly!`);
    } else {
      console.log(`   ⚠️  MISMATCH! Something went wrong!`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📝 WHAT TO DO NEXT:');
    console.log('  1. Go to Timetable page');
    console.log('  2. Select department and semester');
    console.log('  3. Click "Generate for All Classes"');
    console.log('  4. Wait for timetable generation to complete');
    console.log('  5. Test student login:');
    console.log('     - Roll Number: CS2024001');
    console.log('     - Password: 123');
    console.log('  6. Check student dashboard for:');
    console.log('     - My Details (should show class assignment)');
    console.log('     - My Timetable (should show schedule)');
    console.log('     - Notifications (should show welcome message)');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupClassWithStudents();
