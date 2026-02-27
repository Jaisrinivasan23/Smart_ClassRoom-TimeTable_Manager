import { Router } from "express";
import Department from "../models/Department.js";
import Course from "../models/course.js";
import Faculty from "../models/Faculty.js";
import Class from "../models/Class.js";

export const departmentsRouter = Router();

// Get all departments
departmentsRouter.get("/", async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

// Get single department
departmentsRouter.get("/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.json(department);
  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json({ error: "Failed to fetch department" });
  }
});

// Create new department
departmentsRouter.post("/", async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    console.error("Error creating department:", error);
    if (error.code === 11000) {
      res.status(400).json({ error: "Department name or code already exists" });
    } else {
      res.status(500).json({ error: "Failed to create department" });
    }
  }
});

// Update department
departmentsRouter.put("/:id", async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.json(department);
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ error: "Failed to update department" });
  }
});

// Delete department
departmentsRouter.delete("/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Check if department is being used by courses
    const coursesUsingDept = await Course.countDocuments({ 
      departments: req.params.id 
    });
    
    // Check if department is being used by faculty
    const facultyUsingDept = await Faculty.countDocuments({ 
      departments: req.params.id 
    });
    
    // Check if department is being used by classes
    const classesUsingDept = await Class.countDocuments({ 
      department: req.params.id 
    });

    if (coursesUsingDept > 0 || facultyUsingDept > 0 || classesUsingDept > 0) {
      return res.status(400).json({ 
        error: "Cannot delete department",
        message: `This department is currently being used by ${coursesUsingDept} course(s), ${facultyUsingDept} faculty member(s), and ${classesUsingDept} class(es). Please remove these references first.`,
        references: {
          courses: coursesUsingDept,
          faculty: facultyUsingDept,
          classes: classesUsingDept
        }
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ error: "Failed to delete department", details: error.message });
  }
});

export default departmentsRouter;
