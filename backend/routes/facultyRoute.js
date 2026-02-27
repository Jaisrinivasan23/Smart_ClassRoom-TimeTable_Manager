import { Router } from "express";
import Faculty from "../models/Faculty.js";
import User from "../models/User.js";

export const facultyRouter = Router();


facultyRouter.get("/", async (req, res) => {
  try {
    const faculty = await Faculty.find()
      .populate("departments", "name code")
      .populate("courses", "code name"); 
    res.json(faculty);
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).json({ error: "Failed to fetch faculty" });
  }
});


facultyRouter.get("/:id", async (req, res) => {
  try {
    const facultyMember = await Faculty.findById(req.params.id)
      .populate("departments", "name code")
      .populate("courses", "code name");
    if (!facultyMember) {
      return res.status(404).json({ error: "Faculty member not found" });
    }
    res.json(facultyMember);
  } catch (error) {
    console.error("Error fetching faculty member:", error);
    res.status(500).json({ error: "Failed to fetch faculty member" });
  }
});


facultyRouter.post("/", async (req, res) => {
  try {
    const facultyMember = new Faculty(req.body);
    await facultyMember.save();
    await facultyMember.populate("departments", "name code");
    await facultyMember.populate("courses", "code name");
    
    // Auto-generate login credentials
    const username = facultyMember.email.split('@')[0]; // Use email prefix
    const password = Math.random().toString(36).slice(-8); // Generate random password
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: facultyMember.email });
    
    if (!existingUser) {
      const user = new User({
        username: username,
        password: password,
        role: 'faculty',
        name: facultyMember.name,
        email: facultyMember.email
      });
      await user.save();
      
      // Return faculty with credentials
      res.status(201).json({
        faculty: facultyMember,
        credentials: {
          username: username,
          password: password,
          message: "Login credentials generated. Please share with the faculty member."
        }
      });
    } else {
      res.status(201).json({
        faculty: facultyMember,
        credentials: {
          message: "Faculty already has login credentials."
        }
      });
    }
  } catch (error) {
    console.error("Error creating faculty member:", error);
    res.status(500).json({ error: "Failed to create faculty member" });
  }
});


facultyRouter.put("/:id", async (req, res) => {
  try {
    const facultyMember = await Faculty.findByIdAndUpdate(req.params.id, req.body, {
      new: true, 
      runValidators: true, 
    })
      .populate("departments", "name code")
      .populate("courses", "code name");
    if (!facultyMember) {
      return res.status(404).json({ error: "Faculty member not found" });
    }
    res.json(facultyMember);
  } catch (error) {
    console.error("Error updating faculty member:", error);
    res.status(500).json({ error: "Failed to update faculty member" });
  }
});


facultyRouter.delete("/:id", async (req, res) => {
  try {
    const facultyMember = await Faculty.findByIdAndDelete(req.params.id);
    if (!facultyMember) {
      return res.status(404).json({ error: "Faculty member not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting faculty member:", error);
    res.status(500).json({ error: "Failed to delete faculty member" });
  }
});
