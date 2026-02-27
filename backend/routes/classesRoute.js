import { Router } from "express";
import Class from "../models/Class.js";
import Student from "../models/Student.js";
import Notification from "../models/Notification.js";
import Timetable from "../models/Timetable.js";

console.log("✅ classesRoute.js loaded");

export const classesRouter = Router();

// Get all classes
classesRouter.get("/", async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("department", "name code")
      .sort({ department: 1, year: 1, section: 1 });
    
    // Check if each class has a timetable
    const classesWithTimetableStatus = await Promise.all(
      classes.map(async (classItem) => {
        const timetable = await Timetable.findOne({ class: classItem._id });
        return {
          ...classItem.toObject(),
          timetableStatus: timetable ? timetable.status : null,
          hasTimetable: !!timetable,
        };
      })
    );
    
    res.json(classesWithTimetableStatus);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// Get classes by department
classesRouter.get("/department/:departmentId", async (req, res) => {
  try {
    const classes = await Class.find({ department: req.params.departmentId })
      .populate("department", "name code")
      .sort({ year: 1, section: 1 });
    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// Get classes by semester
classesRouter.get("/semester/:semester", async (req, res) => {
  try {
    const classes = await Class.find({ semester: req.params.semester })
      .populate("department", "name code")
      .sort({ department: 1, year: 1, section: 1 });
    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// Get single class
classesRouter.get("/:id", async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate("department", "name code");
    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }
    res.json(classData);
  } catch (error) {
    console.error("Error fetching class:", error);
    res.status(500).json({ error: "Failed to fetch class" });
  }
});

// Create new class
classesRouter.post("/", async (req, res) => {
  try {
    console.log("=== POST /api/classes ENDPOINT HIT ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const { students, ...classInfo } = req.body;
    
    console.log("=== CREATE CLASS REQUEST ===");
    console.log("Class info:", classInfo);
    console.log("Students array:", students ? `${students.length} students` : "No students");
    console.log("Students data:", students);
    
    // Create the class first
    const classData = new Class(classInfo);
    await classData.save();
    
    // Store the department ID before populate changes it to an object
    const departmentId = classData.department;
    
    await classData.populate("department", "name code");

    // If students array is provided, create Student documents
    if (students && Array.isArray(students) && students.length > 0) {
      console.log(`Processing ${students.length} students...`);
      const createdStudents = [];
      
      for (const studentData of students) {
        const { name, rollNumber, email } = studentData;
        
        if (!name || !rollNumber) {
          console.log(`  Skipping invalid student:`, studentData);
          continue;
        }

        // Check if student already exists
        let student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
        
        if (!student) {
          // Create new student
          try {
            student = await Student.create({
              name: name.trim(),
              rollNumber: rollNumber.toUpperCase().trim(),
              email: email?.trim() || "",
              password: "123",
              class: classData._id,
              department: departmentId, // Use the stored ID, not the populated object
              year: classData.year,
              semester: classData.semester,
            });
            createdStudents.push({
              rollNumber: student.rollNumber,
              name: student.name,
              email: student.email,
            });
            console.log(`  ✓ Created student: ${student.name} (${student.rollNumber})`);
          } catch (error) {
            console.error(`  ✗ Error creating student ${rollNumber}:`, error.message);
          }
        } else if (!student.class) {
          // Student exists but has no class - assign this class
          student.class = classData._id;
          student.department = departmentId;
          student.year = classData.year;
          student.semester = classData.semester;
          await student.save();
          createdStudents.push({
            rollNumber: student.rollNumber,
            name: student.name,
            email: student.email,
          });
          console.log(`  ✓ Assigned existing student: ${student.name} (${student.rollNumber})`);
        } else {
          console.log(`  ⊘ Student ${rollNumber} already has a class, skipping`);
        }
      }

      // Update class with created students and count
      classData.students = createdStudents;
      classData.numberOfStudents = createdStudents.length;
      await classData.save();

      // Send welcome notification
      if (createdStudents.length > 0) {
        await Notification.create({
          title: "Welcome to Your Class",
          message: `You have been assigned to ${classData.name}. You will receive notifications about faculty changes, room changes, and other important updates.`,
          type: "info",
          classId: classData._id,
        });
        console.log(`  ✓ Sent welcome notification to ${createdStudents.length} students`);
      }

      console.log(`✓ Created ${createdStudents.length} students for class ${classData.name}`);
    } else {
      console.log("No students to process");
    }

    // Return response with debug info
    res.status(201).json({
      ...classData.toObject(),
      _debug: {
        studentsReceived: students ? students.length : 0,
        studentsCreated: classData.students?.length || 0,
        studentsArray: students || null
      }
    });
  } catch (error) {
    console.error("Error creating class:", error);
    if (error.code === 11000) {
      res.status(400).json({ error: "Class already exists for this department, year, and section" });
    } else {
      res.status(500).json({ error: "Failed to create class", message: error.message });
    }
  }
});

// Update class
classesRouter.put("/:id", async (req, res) => {
  try {
    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("department", "name code");
    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }
    res.json(classData);
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({ error: "Failed to update class" });
  }
});

// Upload students CSV for a class
classesRouter.post("/:id/students/upload", async (req, res) => {
  try {
    const { students } = req.body; // Array of student objects with rollNumber, name, email
    
    const classData = await Class.findById(req.params.id).populate("department", "name code");
    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }

    const results = {
      assigned: [],
      duplicates: [],
      created: [],
    };

    // Process each student
    for (const studentData of students) {
      const { rollNumber, name, email } = studentData;

      // Find or create student in Student collection
      let student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });

      if (!student) {
        // Student doesn't exist - CREATE NEW STUDENT
        student = await Student.create({
          name: name,
          rollNumber: rollNumber.toUpperCase(),
          email: email,
          password: '123',
          class: classData._id,
          department: classData.department._id,
          year: classData.year,
          semester: classData.semester,
        });
        
        results.created.push({
          rollNumber: student.rollNumber,
          name: student.name,
          email: student.email,
        });
        
        results.assigned.push({
          rollNumber: student.rollNumber,
          name: student.name,
          email: student.email,
        });
        continue;
      }

      // Check if student already has a class assigned (duplicate check)
      if (student.class && student.class.toString() !== classData._id.toString()) {
        // Student is already in another class
        results.duplicates.push({
          rollNumber: student.rollNumber,
          name: student.name,
          email: student.email,
          currentClass: student.class,
        });

        // Send notification about duplicate attempt
        await Notification.create({
          title: "Duplicate Assignment Attempt",
          message: `Student ${student.name} (${student.rollNumber}) is already assigned to another class.`,
          type: "warning",
          classId: student.class,
        });
        continue;
      }

      // Assign existing student to the class
      student.class = classData._id;
      student.department = classData.department._id;
      student.year = classData.year;
      student.semester = classData.semester;
      await student.save();

      results.assigned.push({
        rollNumber: student.rollNumber,
        name: student.name,
        email: student.email,
      });
    }

    // Update class with all assigned students
    classData.students = results.assigned;
    classData.numberOfStudents = results.assigned.length;
    await classData.save();

    // Send welcome notification to all newly assigned students
    if (results.assigned.length > 0) {
      await Notification.create({
        title: "Welcome to Your Class",
        message: `You have been assigned to ${classData.name}. You will receive notifications about faculty changes, room changes, and other important updates.`,
        type: "info",
        classId: classData._id,
      });
    }

    res.json({
      success: true,
      message: `Processed ${students.length} students`,
      results: {
        assigned: results.assigned.length,
        created: results.created.length,
        duplicates: results.duplicates.length,
      },
      details: results,
      class: classData,
    });
  } catch (error) {
    console.error("Error uploading students:", error);
    res.status(500).json({ error: "Failed to upload students", message: error.message });
  }
});

// Delete class
classesRouter.delete("/:id", async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Delete all students in this class
    const studentsDeleted = await Student.deleteMany({ class: req.params.id });
    console.log(`Deleted ${studentsDeleted.deletedCount} students from class ${classData.name}`);

    // Delete timetable for this class
    const timetableDeleted = await Timetable.deleteMany({ class: req.params.id });
    console.log(`Deleted ${timetableDeleted.deletedCount} timetables for class ${classData.name}`);

    // Delete notifications for this class
    const notificationsDeleted = await Notification.deleteMany({ classId: req.params.id });
    console.log(`Deleted ${notificationsDeleted.deletedCount} notifications for class ${classData.name}`);

    // Delete the class itself
    await Class.findByIdAndDelete(req.params.id);

    res.json({ 
      message: "Class and associated data deleted successfully",
      deleted: {
        students: studentsDeleted.deletedCount,
        timetables: timetableDeleted.deletedCount,
        notifications: notificationsDeleted.deletedCount
      }
    });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ error: "Failed to delete class" });
  }
});

export default classesRouter;
