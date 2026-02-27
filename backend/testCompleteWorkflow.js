import mongoose from "mongoose";
import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
const API_BASE = "http://localhost:5000/api";

// Import models for direct DB checking
import Class from "./models/Class.js";
import Student from "./models/Student.js";
import Timetable from "./models/Timetable.js";
import Notification from "./models/Notification.js";
import Department from "./models/Department.js";

async function testCompleteWorkflow() {
  console.log("\n==========================================================");
  console.log("COMPREHENSIVE WORKFLOW TEST");
  console.log("==========================================================\n");

  let testClassId = null;
  let testStudentId = null;

  try {
    // Connect to database
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to database\n");

    // Step 1: Clean up test data
    console.log("📋 Step 1: Cleaning up any existing test data...");
    await Class.deleteMany({ name: "Test Class CS-A" });
    await Student.deleteMany({ rollNumber: /^TEST/ });
    await Timetable.deleteMany({ name: /^Test Class/ });
    await Notification.deleteMany({ title: /Test/ });
    console.log("   ✅ Cleanup complete\n");

    // Step 2: Get a department ID
    console.log("📋 Step 2: Getting department...");
    const dept = await Department.findOne();
    if (!dept) {
      console.log("   ❌ No department found. Please create a department first.");
      process.exit(1);
    }
    console.log(`   ✅ Using department: ${dept.name} (${dept._id})\n`);

    // Step 3: Create CSV data
    console.log("📋 Step 3: Preparing test student data...");
    const testStudents = [
      { name: "Test Student 1", rollNumber: "TEST2024001", email: "test1@example.com" },
      { name: "Test Student 2", rollNumber: "TEST2024002", email: "test2@example.com" },
      { name: "Test Student 3", rollNumber: "TEST2024003", email: "test3@example.com" },
      { name: "Test Student 4", rollNumber: "TEST2024004", email: "test4@example.com" },
      { name: "Test Student 5", rollNumber: "TEST2024005", email: "test5@example.com" },
    ];
    console.log(`   ✅ Prepared ${testStudents.length} test students\n`);

    // Step 4: Create class via API
    console.log("📋 Step 4: Creating class via API with students...");
    try {
      const createClassResponse = await axios.post(`${API_BASE}/classes`, {
        name: "Test Class CS-A",
        department: dept._id.toString(),
        year: 2,
        section: "A",
        semester: 3,
        numberOfStudents: testStudents.length,
        students: testStudents
      });
      
      testClassId = createClassResponse.data._id;
      console.log(`   ✅ Class created: ${createClassResponse.data.name} (ID: ${testClassId})`);
      console.log(`   ✅ API Response numberOfStudents: ${createClassResponse.data.numberOfStudents}`);
      
      // Show debug info
      if (createClassResponse.data._debug) {
        console.log(`   📊 DEBUG INFO:`);
        console.log(`      - Students received by API: ${createClassResponse.data._debug.studentsReceived}`);
        console.log(`      - Students created: ${createClassResponse.data._debug.studentsCreated}`);
        console.log(`      - Students array sent: ${JSON.stringify(createClassResponse.data._debug.studentsArray)}`);
      } else {
        console.log(`   ⚠️ No debug info in response - backend may not have reloaded`);
      }
      console.log();
    } catch (error) {
      console.log(`   ❌ Error creating class: ${error.response?.data?.message || error.message}`);
      console.log(`   Response:`, error.response?.data);
      process.exit(1);
    }

    // Step 5: Verify students were created in database
    console.log("📋 Step 5: Verifying students in database...");
    const studentsInDB = await Student.find({ rollNumber: /^TEST/ });
    console.log(`   ✅ Found ${studentsInDB.length} students in Student collection`);
    
    if (studentsInDB.length === 0) {
      console.log("   ❌ ERROR: No students created in database!");
      process.exit(1);
    }
    
    // Check if students have class assigned
    const studentsWithClass = studentsInDB.filter(s => s.class && s.class.toString() === testClassId);
    console.log(`   ✅ Students with class assigned: ${studentsWithClass.length}/${studentsInDB.length}`);
    
    if (studentsWithClass.length !== studentsInDB.length) {
      console.log("   ⚠️  WARNING: Not all students have class assigned!");
    }
    
    // Save a test student ID for login test
    testStudentId = studentsInDB[0]._id;
    console.log(`   ✅ Test student: ${studentsInDB[0].name} (${studentsInDB[0].rollNumber})\n`);

    // Step 6: Generate timetable via API
    console.log("📋 Step 6: Generating timetable...");
    try {
      const timetableResponse = await axios.post(`${API_BASE}/timetables/generate`, {
        name: "Test Class CS-A - Timetable",
        class: testClassId,
        department: dept._id.toString(),
        year: 2026,
        semester: 3
      });
      
      console.log(`   ✅ Timetable generated: ${timetableResponse.data.name}`);
      console.log(`   ✅ Status: ${timetableResponse.data.status}`);
      console.log(`   ✅ Schedule entries: ${timetableResponse.data.schedule.length}\n`);
    } catch (error) {
      console.log(`   ⚠️  Error generating timetable: ${error.response?.data?.message || error.message}`);
      console.log(`   This might be OK if courses/faculty/rooms are not configured\n`);
    }

    // Step 7: Check timetable status via GET /classes API
    console.log("📋 Step 7: Checking timetable status from API...");
    try {
      const classesResponse = await axios.get(`${API_BASE}/classes`);
      const ourClass = classesResponse.data.find(c => c._id === testClassId);
      
      if (ourClass) {
        console.log(`   ✅ Class found in API response`);
        console.log(`   ✅ hasTimetable: ${ourClass.hasTimetable}`);
        console.log(`   ✅ timetableStatus: ${ourClass.timetableStatus || 'null'}`);
        
        if (ourClass.hasTimetable) {
          console.log(`   ✅ SUCCESS: Timetable shows as Generated in Classes section!\n`);
        } else {
          console.log(`   ⚠️  WARNING: Timetable not showing as generated\n`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error fetching classes: ${error.message}\n`);
    }

    // Step 8: Create notification for the class
    console.log("📋 Step 8: Creating notification for the class...");
    try {
      const notificationResponse = await axios.post(`${API_BASE}/notifications`, {
        title: "Test Notification",
        message: "This is a test notification for the class",
        type: "info",
        classId: testClassId
      });
      
      console.log(`   ✅ Notification created: ${notificationResponse.data.title}\n`);
    } catch (error) {
      console.log(`   ❌ Error creating notification: ${error.response?.data?.message || error.message}\n`);
    }

    // Step 9: Test student login and data retrieval
    console.log("📋 Step 9: Testing student login...");
    try {
      const loginResponse = await axios.post(`${API_BASE}/students/login`, {
        rollNumber: "TEST2024001",
        password: "123"
      });
      
      console.log(`   ✅ Login successful for ${loginResponse.data.student.rollNumber}`);
      console.log(`   ✅ Student name: ${loginResponse.data.student.name}`);
      console.log(`   ✅ Class assigned: ${loginResponse.data.student.class ? 'YES' : 'NO'}`);
      
      if (loginResponse.data.student.class) {
        console.log(`   ✅ Class name: ${loginResponse.data.student.class.name}`);
        console.log(`   ✅ Department: ${loginResponse.data.student.class.department?.name || 'N/A'}`);
      }
      console.log();
      
      const studentId = loginResponse.data.student._id;

      // Step 10: Get student's timetable
      console.log("📋 Step 10: Fetching student's timetable...");
      try {
        const timetableResponse = await axios.get(`${API_BASE}/students/${studentId}/timetable`);
        
        if (timetableResponse.data.success && timetableResponse.data.timetable) {
          console.log(`   ✅ Timetable found: ${timetableResponse.data.timetable.name}`);
          console.log(`   ✅ Schedule entries: ${timetableResponse.data.timetable.schedule.length}`);
          console.log(`   ✅ SUCCESS: Student can see timetable!\n`);
        } else {
          console.log(`   ⚠️  No timetable found for student`);
          console.log(`   Message: ${timetableResponse.data.message}\n`);
        }
      } catch (error) {
        console.log(`   ❌ Error fetching student timetable: ${error.response?.data?.message || error.message}\n`);
      }

      // Step 11: Get student's notifications
      console.log("📋 Step 11: Fetching student's notifications...");
      try {
        const notifResponse = await axios.get(`${API_BASE}/students/${studentId}/notifications`);
        
        if (notifResponse.data.success) {
          console.log(`   ✅ Found ${notifResponse.data.notifications.length} notifications`);
          
          const classNotifications = notifResponse.data.notifications.filter(n => n.classId);
          const globalNotifications = notifResponse.data.notifications.filter(n => !n.classId);
          
          console.log(`   ✅ Class notifications: ${classNotifications.length}`);
          console.log(`   ✅ Global notifications: ${globalNotifications.length}`);
          
          if (notifResponse.data.notifications.length > 0) {
            console.log(`   ✅ Recent: "${notifResponse.data.notifications[0].title}"`);
          }
          console.log(`   ✅ SUCCESS: Student can see notifications!\n`);
        }
      } catch (error) {
        console.log(`   ❌ Error fetching notifications: ${error.response?.data?.message || error.message}\n`);
      }

    } catch (error) {
      console.log(`   ❌ Login failed: ${error.response?.data?.message || error.message}\n`);
    }

    // Final Summary
    console.log("\n==========================================================");
    console.log("TEST SUMMARY");
    console.log("==========================================================");
    
    const finalClass = await Class.findById(testClassId);
    const finalStudents = await Student.find({ class: testClassId });
    const finalTimetable = await Timetable.findOne({ class: testClassId });
    const finalNotifications = await Notification.find({ classId: testClassId });
    
    console.log(`\n✅ Class created: ${finalClass?.name || 'N/A'}`);
    console.log(`✅ Students in database: ${finalStudents.length}`);
    console.log(`✅ Students with class assigned: ${finalStudents.filter(s => s.class).length}`);
    console.log(`✅ Timetable exists: ${finalTimetable ? 'YES' : 'NO'}`);
    if (finalTimetable) {
      console.log(`✅ Timetable schedule entries: ${finalTimetable.schedule.length}`);
    }
    console.log(`✅ Class notifications: ${finalNotifications.length}`);
    
    console.log("\n✅ ALL TESTS COMPLETED!");
    console.log("\nTest student login credentials:");
    console.log(`   Roll Number: TEST2024001`);
    console.log(`   Password: 123`);
    console.log("\n==========================================================\n");
    
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Check if backend is running
console.log("Checking if backend is running on http://localhost:5000...\n");
try {
  await axios.get(`${API_BASE}/classes`, { timeout: 3000 });
  console.log("✅ Backend is running\n");
  testCompleteWorkflow();
} catch (error) {
  console.error("❌ Backend is not running!");
  console.error("Please start the backend server with: npm start");
  console.error("Then run this test script again.\n");
  process.exit(1);
}
