import { Router } from "express";
import Student from "../models/Student.js";
import Timetable from "../models/Timetable.js";
import Notification from "../models/Notification.js";

export const studentRouter = Router();

/**
 * POST /api/students/login
 * Student login with rollNumber and password
 */
studentRouter.post("/login", async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Roll number and password are required",
      });
    }

    // Find student by roll number
    const student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() })
      .populate({
        path: "class",
        select: "name section department semester year",
        populate: {
          path: "department",
          select: "name code"
        }
      })
      .populate("department", "name code");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check password (simple comparison, in production use bcrypt)
    if (student.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      student: {
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        class: student.class,
        department: student.department,
        semester: student.semester,
        year: student.year,
        phone: student.phone,
      },
    });
  } catch (error) {
    console.error("Error during student login:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

/**
 * GET /api/students/:id
 * Get student details by ID
 */
studentRouter.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate({
        path: "class",
        select: "name section department semester year",
        populate: {
          path: "department",
          select: "name code"
        }
      })
      .populate("department", "name code");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        class: student.class,
        department: student.department,
        semester: student.semester,
        year: student.year,
        phone: student.phone,
        address: student.address,
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student details",
    });
  }
});

/**
 * GET /api/students/:id/timetable
 * Get timetable for student's class
 */
studentRouter.get("/:id/timetable", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("class");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!student.class) {
      return res.status(404).json({
        success: false,
        message: "Student is not assigned to any class",
      });
    }

    // Find timetable for the student's class
    const timetable = await Timetable.findOne({ class: student.class._id })
      .populate("class", "name section year semester")
      .populate("department", "name code");

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "No timetable found for your class. Timetable will appear here once generated.",
        classInfo: {
          name: student.class.name,
          section: student.class.section,
        },
      });
    }

    res.json({
      success: true,
      message: "Timetable fetched successfully",
      timetable: {
        _id: timetable._id,
        name: timetable.name,
        class: timetable.class,
        department: timetable.department,
        semester: timetable.semester,
        year: timetable.year,
        schedule: timetable.schedule,
        status: timetable.status,
      },
    });
  } catch (error) {
    console.error("Error fetching student timetable:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
    });
  }
});

/**
 * GET /api/students/:id/notifications
 * Get notifications for student's class (including global notifications)
 */
studentRouter.get("/:id/notifications", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get notifications for the student's class AND global notifications (classId is null)
    const query = student.class 
      ? { $or: [{ classId: student.class }, { classId: null }] }
      : { classId: null };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications,
      classId: student.class,
    });
  } catch (error) {
    console.error("Error fetching student notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
});

/**
 * PUT /api/students/:studentId/notifications/:notificationId/read
 * Mark a notification as read (student-specific)
 */
studentRouter.put("/:studentId/notifications/:notificationId/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
});

/**
 * PUT /api/students/:studentId/assign-class
 * Assign a student to a class with duplicate checking
 */
studentRouter.put("/:studentId/assign-class", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId, departmentId, year, semester, className } = req.body;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

    // Find the student
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if student already has a class assigned (duplicate check)
    if (student.class) {
      // Send notification about duplicate attempt
      await Notification.create({
        title: "Duplicate Assignment Attempt",
        message: `Student ${student.name} (${student.rollNumber}) is already assigned to another class. Cannot reassign.`,
        type: "warning",
        classId: student.class,
      });

      return res.status(400).json({
        success: false,
        message: "Student already assigned to another class",
        currentClass: student.class,
      });
    }

    // Assign student to the new class
    student.class = classId;
    if (departmentId) student.department = departmentId;
    if (year) student.year = year;
    if (semester) student.semester = semester;
    
    await student.save();

    // Send welcome notification to the student
    await Notification.create({
      title: "Class Assignment Successful",
      message: `You have been assigned to ${className || "your class"}. You will receive notifications about faculty changes, room changes, and other important updates.`,
      type: "info",
      classId: classId,
    });

    res.json({
      success: true,
      message: "Student assigned to class successfully",
      student: {
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        class: student.class,
        department: student.department,
        year: student.year,
        semester: student.semester,
      },
    });
  } catch (error) {
    console.error("Error assigning student to class:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign student to class",
      error: error.message,
    });
  }
});
