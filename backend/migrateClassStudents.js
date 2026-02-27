import mongoose from "mongoose";
import dotenv from "dotenv";
import Class from "./models/Class.js";
import Student from "./models/Student.js";
import Notification from "./models/Notification.js";
import Department from "./models/Department.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

async function migrateClassStudents() {
  try {
    // Connect to database
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to database\n");

    console.log("============================================================");
    console.log("MIGRATING CLASS STUDENTS");
    console.log("============================================================\n");

    // Get all classes
    const classes = await Class.find().populate("department", "name code");
    
    if (classes.length === 0) {
      console.log("ℹ️  No classes found in database");
      process.exit(0);
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const classData of classes) {
      console.log(`\n📋 Processing class: ${classData.name}`);
      console.log(`   Students in Class.students array: ${classData.students.length}`);

      if (classData.students.length === 0) {
        console.log("   ⏭️  No students to migrate");
        continue;
      }

      const createdStudents = [];
      
      for (const studentData of classData.students) {
        const { name, rollNumber, email } = studentData;
        
        if (!name || !rollNumber) {
          console.log(`   ⚠️  Skipping invalid student data: ${JSON.stringify(studentData)}`);
          totalSkipped++;
          continue;
        }

        // Check if student already exists in Student collection
        let student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
        
        if (student) {
          console.log(`   ℹ️  Student ${rollNumber} already exists, skipping`);
          totalSkipped++;
          continue;
        }

        // Create new Student document
        try {
          student = await Student.create({
            name: name.trim(),
            rollNumber: rollNumber.toUpperCase().trim(),
            email: email?.trim() || "",
            password: "123",
            class: classData._id,
            department: classData.department._id,
            year: classData.year,
            semester: classData.semester,
          });

          createdStudents.push({
            rollNumber: student.rollNumber,
            name: student.name,
            email: student.email,
          });

          console.log(`   ✅ Created student: ${student.name} (${student.rollNumber})`);
          totalCreated++;
        } catch (error) {
          console.log(`   ❌ Error creating student ${rollNumber}: ${error.message}`);
          totalSkipped++;
        }
      }

      // Send welcome notification if any students were created
      if (createdStudents.length > 0) {
        try {
          await Notification.create({
            title: "Welcome to Your Class",
            message: `You have been assigned to ${classData.name}. You will receive notifications about faculty changes, room changes, and other important updates.`,
            type: "info",
            classId: classData._id,
          });
          console.log(`   📧 Sent welcome notification to class`);
        } catch (error) {
          console.log(`   ⚠️  Error sending notification: ${error.message}`);
        }
      }
    }

    console.log("\n============================================================");
    console.log("MIGRATION COMPLETE");
    console.log("============================================================");
    console.log(`✅ Created: ${totalCreated} students`);
    console.log(`⏭️  Skipped: ${totalSkipped} students\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
}

migrateClassStudents();
