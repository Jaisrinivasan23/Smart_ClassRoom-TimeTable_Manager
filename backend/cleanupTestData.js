import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "./models/Student.js";
import Class from "./models/Class.js";
import Timetable from "./models/Timetable.js";
import Notification from "./models/Notification.js";
import Department from "./models/Department.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

async function cleanupTestData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to database\n");

    console.log("🧹 Cleaning up test data...");
    
    // Delete test students
    const testStudents = await Student.deleteMany({ rollNumber: /^TEST/ });
    console.log(`   Deleted ${testStudents.deletedCount} test students`);
    
    // Delete test class
    const testClasses = await Class.deleteMany({ name: "Test Class CS-A" });
    console.log(`   Deleted ${testClasses.deletedCount} test classes`);
    
    // Delete test notifications
    const testNotifs = await Notification.deleteMany({ title: "Test Notification" });
    console.log(`   Deleted ${testNotifs.deletedCount} test notifications`);
    
    // Clean orphaned timetables (where class doesn't exist)
    const allTimetables = await Timetable.find();
    for (const tt of allTimetables) {
      if (tt.class) {
        const classExists = await Class.findById(tt.class);
        if (!classExists) {
          await Timetable.findByIdAndDelete(tt._id);
          console.log(`   Deleted orphaned timetable: ${tt.name}`);
        }
      }
    }

    console.log("\n✅ Cleanup complete!\n");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

cleanupTestData();
