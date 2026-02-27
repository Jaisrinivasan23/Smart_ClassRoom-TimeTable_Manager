import { Router } from "express";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Class from "../models/Class.js";
import Faculty from "../models/Faculty.js";
import Course from "../models/course.js";
import Room from "../models/Room.js";

export const authRouter = Router();

// Login route
authRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Return user data without password
    res.json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Faculty login route
authRouter.post("/faculty/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // Find faculty by email
    const faculty = await Faculty.findOne({ email })
      .populate("departments", "name code")
      .populate("courses", "name code semester");

    if (!faculty) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Check password (simple comparison - hardcoded "123")
    if (password !== faculty.password && password !== "123") {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Return faculty data (excluding password)
    const facultyData = {
      _id: faculty._id,
      name: faculty.name,
      email: faculty.email,
      phone: faculty.phone,
      employeeId: faculty.employeeId,
      departments: faculty.departments,
      courses: faculty.courses,
      specialization: faculty.specialization,
      maxHoursPerWeek: faculty.maxHoursPerWeek,
      role: "faculty", // Add role for frontend
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      faculty: facultyData,
    });
  } catch (error) {
    console.error("Faculty login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during login" 
    });
  }
});

// Seed sample users (for development)
authRouter.post("/seed", async (req, res) => {
  try {
    await User.deleteMany({});

    const sampleUsers = [
      {
        username: "admin",
        password: "admin123",
        role: "admin",
        name: "Admin User",
        email: "admin@smartclass.com"
      },
      {
        username: "faculty",
        password: "faculty123",
        role: "faculty",
        name: "Dr. John Smith",
        email: "john.smith@smartclass.com"
      },
      {
        username: "student",
        password: "student123",
        role: "student",
        name: "Alice Johnson",
        email: "alice.johnson@smartclass.com"
      }
    ];

    await User.insertMany(sampleUsers);

    res.json({ message: "Sample users created successfully", users: sampleUsers.map(u => ({ username: u.username, password: u.password, role: u.role })) });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ error: "Failed to seed users" });
  }
});

// Comprehensive seed endpoint for all data
authRouter.post("/seed-all", async (req, res) => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Class.deleteMany({}),
      Faculty.deleteMany({}),
      Course.deleteMany({}),
      Room.deleteMany({})
    ]);

    // Seed Departments
    const departments = await Department.insertMany([
      { name: "Computer Science & Engineering", code: "CSE", headOfDepartment: "Dr. Robert Johnson", description: "Department of Computer Science and Engineering" },
      { name: "Electrical Engineering", code: "EEE", headOfDepartment: "Dr. Maria Garcia", description: "Department of Electrical and Electronics Engineering" },
      { name: "Mechanical Engineering", code: "MECH", headOfDepartment: "Dr. David Lee", description: "Department of Mechanical Engineering" },
      { name: "Civil Engineering", code: "CIVIL", headOfDepartment: "Dr. Sarah Brown", description: "Department of Civil Engineering" }
    ]);

    // Seed Rooms
    const rooms = await Room.insertMany([
      { name: "Room 101", building: "Main Block", floor: 1, capacity: 60, type: "lecture_hall", equipment: ["Projector", "Whiteboard"] },
      { name: "Room 102", building: "Main Block", floor: 1, capacity: 60, type: "lecture_hall", equipment: ["Projector", "Whiteboard"] },
      { name: "Lab 201", building: "Tech Block", floor: 2, capacity: 30, type: "lab", equipment: ["Computers", "Projector"] },
      { name: "Lab 202", building: "Tech Block", floor: 2, capacity: 30, type: "lab", equipment: ["Computers", "Projector"] },
      { name: "Seminar Hall", building: "Main Block", floor: 3, capacity: 100, type: "auditorium", equipment: ["Projector", "Sound System", "Whiteboard"] }
    ]);

    // Seed Faculty with departments
    const faculty = await Faculty.insertMany([
      {
        name: "Dr. John Smith",
        email: "john.smith@smartclass.com",
        phone: "1234567890",
        employeeId: "FAC001",
        departments: [departments[0]._id],
        specialization: ["Data Structures", "Algorithms"],
        maxHoursPerWeek: 20
      },
      {
        name: "Dr. Emily Davis",
        email: "emily.davis@smartclass.com",
        phone: "1234567891",
        employeeId: "FAC002", 
        departments: [departments[0]._id],
        specialization: ["Database Systems", "Web Development"],
        maxHoursPerWeek: 18
      },
      {
        name: "Dr. Michael Chen",
        email: "michael.chen@smartclass.com",
        phone: "1234567892",
        employeeId: "FAC003",
        departments: [departments[1]._id],
        specialization: ["Circuit Theory", "Electronics"],
        maxHoursPerWeek: 20
      },
      {
        name: "Dr. Anna Williams",
        email: "anna.williams@smartclass.com",
        phone: "1234567893",
        employeeId: "FAC004",
        departments: [departments[2]._id],
        specialization: ["Thermodynamics", "Mechanics"],
        maxHoursPerWeek: 18
      }
    ]);

    // Create faculty users
    const facultyUsers = [
      { username: "john.smith", password: "faculty123", role: "faculty", name: "Dr. John Smith", email: "john.smith@smartclass.com" },
      { username: "emily.davis", password: "faculty123", role: "faculty", name: "Dr. Emily Davis", email: "emily.davis@smartclass.com" },
      { username: "michael.chen", password: "faculty123", role: "faculty", name: "Dr. Michael Chen", email: "michael.chen@smartclass.com" },
      { username: "anna.williams", password: "faculty123", role: "faculty", name: "Dr. Anna Williams", email: "anna.williams@smartclass.com" }
    ];

    // Seed Courses
    const courses = await Course.insertMany([
      {
        name: "Data Structures",
        code: "CSE201",
        department: departments[0]._id,
        faculty: faculty[0]._id,
        credits: 4,
        semester: 3,
        year: 2026,
        type: "lecture",
        hoursPerWeek: 4
      },
      {
        name: "Database Management Systems",
        code: "CSE301",
        department: departments[0]._id,
        faculty: faculty[1]._id,
        credits: 4,
        semester: 5,
        year: 2026,
        type: "lecture",
        hoursPerWeek: 4
      },
      {
        name: "DBMS Lab",
        code: "CSE302",
        department: departments[0]._id,
        faculty: faculty[1]._id,
        credits: 2,
        semester: 5,
        year: 2026,
        type: "lab",
        hoursPerWeek: 3
      },
      {
        name: "Circuit Theory",
        code: "EEE201",
        department: departments[1]._id,
        faculty: faculty[2]._id,
        credits: 4,
        semester: 3,
        year: 2026,
        type: "lecture",
        hoursPerWeek: 4
      },
      {
        name: "Thermodynamics",
        code: "MECH201",
        department: departments[2]._id,
        faculty: faculty[3]._id,
        credits: 3,
        semester: 3,
        year: 2026,
        type: "lecture",
        hoursPerWeek: 3
      }
    ]);

    // Seed Classes
    const classes = await Class.insertMany([
      {
        name: "CSE Year 2 Section A",
        department: departments[0]._id,
        year: 2,
        section: "A",
        semester: 3,
        numberOfStudents: 50,
        students: [
          { name: "Student 1", rollNumber: "CSE001", email: "student1@smartclass.com" },
          { name: "Student 2", rollNumber: "CSE002", email: "student2@smartclass.com" }
        ]
      },
      {
        name: "CSE Year 3 Section A",
        department: departments[0]._id,
        year: 3,
        section: "A",
        semester: 5,
        numberOfStudents: 45,
        students: []
      },
      {
        name: "EEE Year 2 Section A",
        department: departments[1]._id,
        year: 2,
        section: "A",
        semester: 3,
        numberOfStudents: 40,
        students: []
      },
      {
        name: "MECH Year 2 Section A",
        department: departments[2]._id,
        year: 2,
        section: "A",
        semester: 3,
        numberOfStudents: 42,
        students: []
      }
    ]);

    // Seed Users
    const users = await User.insertMany([
      { username: "admin", password: "admin123", role: "admin", name: "Admin User", email: "admin@smartclass.com" },
      ...facultyUsers,
      { username: "student", password: "student123", role: "student", name: "Alice Johnson", email: "alice.johnson@smartclass.com" }
    ]);

    res.json({
      message: "All sample data created successfully",
      summary: {
        departments: departments.length,
        rooms: rooms.length,
        faculty: faculty.length,
        courses: courses.length,
        classes: classes.length,
        users: users.length
      }
    });
  } catch (error) {
    console.error("Comprehensive seed error:", error);
    res.status(500).json({ error: "Failed to seed data", details: error.message });
  }
});

export default authRouter;
