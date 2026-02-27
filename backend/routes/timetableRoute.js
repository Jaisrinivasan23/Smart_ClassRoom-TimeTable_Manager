import { Router } from "express";
import Timetable from "../models/Timetable.js";
import { generateTimetableWithAI} from "../utils/timetableGenerator.js";
import { generateClassTimetablesWithAI, getAvailableFaculty } from "../utils/classTimetableGenerator.js";

export const timetablesRouter = Router();

// Get all timetables
timetablesRouter.get("/", async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate('department', 'name code')
      .populate('class', 'name section year semester');
    res.json(timetables);
  } catch (error) {
    console.error("Error fetching timetables:", error);
    res.status(500).json({ error: "Failed to fetch timetables" });
  }
});

// Get timetables by class ID (must be before /:id route)
timetablesRouter.get("/by-class/:classId", async (req, res) => {
  try {
    const timetables = await Timetable.find({ class: req.params.classId })
      .populate('department', 'name code')
      .populate('class', 'name section year semester');
    res.json(timetables);
  } catch (error) {
    console.error("Error fetching class timetables:", error);
    res.status(500).json({ error: "Failed to fetch class timetables" });
  }
});

// Get timetables by department and semester (must be before /:id route)
timetablesRouter.get("/by-department-semester/:departmentId/:semester", async (req, res) => {
  try {
    const timetables = await Timetable.find({ 
      department: req.params.departmentId,
      semester: req.params.semester 
    })
      .populate('department', 'name code')
      .populate('class', 'name section year semester')
      .sort({ 'class.name': 1, 'class.section': 1 });
    res.json(timetables);
  } catch (error) {
    console.error("Error fetching timetables:", error);
    res.status(500).json({ error: "Failed to fetch timetables" });
  }
});

// Get faculty schedule (all classes they teach) (must be before /:id route)
timetablesRouter.get("/faculty/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { semester, department } = req.query;
    
    // Build query
    const query = {};
    if (semester) query.semester = semester;
    if (department) query.department = department;
    
    // Find all timetables containing this faculty
    const timetables = await Timetable.find(query)
      .populate('department', 'name code')
      .populate('class', 'name section year semester');
    
    // Extract schedule entries for this faculty
    const facultySchedule = [];
    timetables.forEach(timetable => {
      const facultyEntries = timetable.schedule.filter(
        entry => entry.facultyId === facultyId
      );
      
      facultyEntries.forEach(entry => {
        facultySchedule.push({
          ...entry.toObject(),
          className: timetable.class ? `${timetable.class.name} - ${timetable.class.section}` : 'N/A',
          timetableId: timetable._id,
          timetableName: timetable.name
        });
      });
    });
    
    res.json({
      facultyId,
      schedule: facultySchedule,
      totalClasses: facultySchedule.length
    });
  } catch (error) {
    console.error("Error fetching faculty schedule:", error);
    res.status(500).json({ error: "Failed to fetch faculty schedule" });
  }
});

// Get timetable by ID (this must come AFTER specific routes like /by-class, /by-department-semester, /faculty)
timetablesRouter.get("/:id", async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ error: "Timetable not found" });
    res.json(timetable);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({ error: "Failed to fetch timetable" });
  }
});

// Create new timetable
timetablesRouter.post("/", async (req, res) => {
  try {
    const timetable = new Timetable(req.body);
    await timetable.save();
    res.status(201).json(timetable);
  } catch (error) {
    console.error("Error creating timetable:", error);
    res.status(500).json({ error: "Failed to create timetable" });
  }
});

// Update timetable
timetablesRouter.put("/:id", async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!timetable) return res.status(404).json({ error: "Timetable not found" });
    res.json(timetable);
  } catch (error) {
    console.error("Error updating timetable:", error);
    res.status(500).json({ error: "Failed to update timetable" });
  }
});

// Delete timetable
timetablesRouter.delete("/:id", async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) return res.status(404).json({ error: "Timetable not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting timetable:", error);
    res.status(500).json({ error: "Failed to delete timetable" });
  }
});

// Generate timetable using AI
timetablesRouter.post("/generate", async (req, res) => {
  try {
    const createdTimetable = await generateTimetableWithAI(req.body);
    res.json(createdTimetable);
  } catch (error) {
    console.error("Error generating timetable:", error);
    res.status(500).json({ error: "Failed to generate timetable" });
  }
});

// Generate class-based timetables using AI
timetablesRouter.post("/generate-by-class", async (req, res) => {
  try {
    const createdTimetables = await generateClassTimetablesWithAI(req.body);
    res.json(createdTimetables);
  } catch (error) {
    console.error("Error generating class timetables:", error);
    res.status(500).json({ 
      error: error.message || "Failed to generate class timetables" 
    });
  }
});

// Find available faculty for a specific time slot
timetablesRouter.post("/available-faculty", async (req, res) => {
  try {
    const availableFaculty = await getAvailableFaculty(req.body);
    res.json(availableFaculty);
  } catch (error) {
    console.error("Error finding available faculty:", error);
    res.status(500).json({ 
      error: error.message || "Failed to find available faculty" 
    });
  }
});

// Optimize timetable using AI
// timetablesRouter.post("/:id/optimize", async (req, res) => {
//   try {
//     const timetable = await Timetable.findById(req.params.id);
//     if (!timetable) return res.status(404).json({ error: "Timetable not found" });

//     const optimizedTimetable = await optimizeTimetableWithAI(timetable);
//     res.json(optimizedTimetable);
//   } catch (error) {
//     console.error("Error optimizing timetable:", error);
//     res.status(500).json({ error: "Failed to optimize timetable" });
//   }
// });

