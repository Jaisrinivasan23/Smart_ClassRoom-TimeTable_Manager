import { Router } from "express";
import Class from "../models/Class.js";
import Student from "../models/Student.js";
import Notification from "../models/Notification.js";
import Timetable from "../models/Timetable.js";

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
    const classData = new Class(req.body);
    await classData.save();
    await classData.populate("department", "name code");
    res.status(201).json(classData);
  } catch (error) {
    console.error("Error creating class:", error);
    if (error.code === 11000) {
      res.status(400).json({ error: "Class already exists for this department, year, and section" });
    } else {
      res.status(500).json({ error: "Failed to create class" });
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
      notFound: [],
    };

    // Process each student
    for (const studentData of students) {
      const { rollNumber, name, email } = studentData;

      // Find student in Student collection
      const student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });

      if (!student) {
        // Student doesn't exist in database
        results.notFound.push({
          rollNumber,
          name,
          email,
          reason: "Student not found in database",
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

      // Assign student to the class
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
        duplicates: results.duplicates.length,
        notFound: results.notFound.length,
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
    const classData = await Class.findByIdAndDelete(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }
    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ error: "Failed to delete class" });
  }
});

export default classesRouter;
