import mongoose from "mongoose";
import Student from "./models/Student.js";
import Class from "./models/Class.js";
import Department from "./models/Department.js";

const MONGO_URI = "mongodb+srv://root:2005@cluster0.ijbszlr.mongodb.net/?appName=Cluster0";

async function directTest() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to database\n");

    // Step 1: Find a department and class
    const dept = await Department.findOne();
    if (!dept) {
      console.log("❌ No department found");
      process.exit(1);
    }
    console.log(`Department: ${dept.name} (${dept._id})`);

    const classData = await Class.findOne();
    if (!classData) {
      console.log("❌ No class found");
      process.exit(1);
    }
    console.log(`Class: ${classData.name} (${classData._id})`);

    // Step 2: Delete any test student first
    await Student.deleteOne({ rollNumber: "DIRECTTEST001" });
    console.log("\nCleaned up any existing test student");

    // Step 3: Try to create a student DIRECTLY in the database
    console.log("\n=== DIRECT STUDENT CREATION TEST ===");
    
    try {
      const newStudent = await Student.create({
        name: "Direct Test Student",
        rollNumber: "DIRECTTEST001",
        email: "directtest@example.com",
        password: "123",
        class: classData._id,
        department: dept._id,
        year: classData.year,
        semester: classData.semester,
      });
      
      console.log("✅ Student created successfully!");
      console.log(`   ID: ${newStudent._id}`);
      console.log(`   Name: ${newStudent.name}`);
      console.log(`   Roll: ${newStudent.rollNumber}`);
      console.log(`   Class: ${newStudent.class}`);
      
    } catch (error) {
      console.log("❌ ERROR creating student:");
      console.log(`   Message: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Full error:`, error);
    }

    // Step 4: Verify student was created
    console.log("\n=== VERIFICATION ===");
    const verifyStudent = await Student.findOne({ rollNumber: "DIRECTTEST001" });
    if (verifyStudent) {
      console.log("✅ Student found in database!");
      console.log(`   ID: ${verifyStudent._id}`);
      console.log(`   Name: ${verifyStudent.name}`);
    } else {
      console.log("❌ Student NOT found in database!");
    }

    // Cleanup
    await Student.deleteOne({ rollNumber: "DIRECTTEST001" });
    console.log("\n✅ Test student cleaned up");

    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

directTest();
