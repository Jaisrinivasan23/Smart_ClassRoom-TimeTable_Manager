import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConnect from './utils/dbConnect.js';
import Class from './models/Class.js';
import Student from './models/Student.js';
import Department from './models/Department.js';
import Notification from './models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath, quiet: true });

async function setupClassAndStudents() {
  try {
    await dbConnect();
    console.log('Connected to database\n');

    // Get all departments
    const departments = await Department.find();
    console.log('Available Departments:');
    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} (ID: ${dept._id})`);
    });

    if (departments.length === 0) {
      console.log('\n⚠️  No departments found. Please create a department first.');
      process.exit(1);
    }

    // For this script, let's use the first department (Computer Science assumed)
    const department = departments[0];
    console.log(`\nUsing Department: ${department.name} (${department._id})\n`);

    // Create a new class
    const newClass = new Class({
      name: 'CS 2024 Batch - Section A',
      department: department._id,
      year: 1,
      section: 'A',
      semester: 2,
      numberOfStudents: 15,
      students: []
    });

    await newClass.save();
    console.log(`✅ Created class: ${newClass.name} (ID: ${newClass._id})\n`);

    // Get all students from database
    const students = await Student.find();
    console.log(`Found ${students.length} students in database\n`);

    if (students.length === 0) {
      console.log('⚠️  No students found. Please run seedStudents.js first.');
      process.exit(1);
    }

    // Update each student with the class ID and department
    let updatedCount = 0;
    const classStudents = [];

    for (const student of students) {
      // Check if student already has a class
      if (student.class) {
        console.log(`⚠️  Duplicate: ${student.rollNumber} (${student.name}) already in class ${student.class}`);
        
        // Send notification about duplicate
        await Notification.create({
          title: 'Duplicate Student Assignment',
          message: `Student ${student.name} (${student.rollNumber}) is already assigned to another class.`,
          type: 'warning',
          classId: student.class,
        });
        continue;
      }

      // Assign student to the new class
      student.class = newClass._id;
      student.department = department._id;
      student.year = 1;
      student.semester = 2;
      await student.save();

      // Add to class students array
      classStudents.push({
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email
      });

      updatedCount++;
      console.log(`✅ Assigned: ${student.rollNumber} - ${student.name} to class ${newClass.name}`);
    }

    // Update the class with students array
    newClass.students = classStudents;
    newClass.numberOfStudents = classStudents.length;
    await newClass.save();

    console.log(`\n✅ Successfully assigned ${updatedCount} students to ${newClass.name}`);

    // Send welcome notification to all students in the class
    const notification = await Notification.create({
      title: 'Welcome to Your Class',
      message: `You have been assigned to ${newClass.name}. You will receive notifications about faculty changes, room changes, and other updates for your class.`,
      type: 'info',
      classId: newClass._id,
    });

    console.log(`\n✅ Sent welcome notification to all students in ${newClass.name}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Class: ${newClass.name}`);
    console.log(`   - Department: ${department.name}`);
    console.log(`   - Year: ${newClass.year}, Semester: ${newClass.semester}, Section: ${newClass.section}`);
    console.log(`   - Students Assigned: ${updatedCount}`);
    console.log(`   - Notification Sent: ${notification.title}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupClassAndStudents();
