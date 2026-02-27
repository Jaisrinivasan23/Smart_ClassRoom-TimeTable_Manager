import mongoose from "mongoose";
import Class from "./models/Class.js";
import Timetable from "./models/Timetable.js";
import Department from "./models/Department.js";

const MONGO_URI = "mongodb+srv://root:2005@cluster0.ijbszlr.mongodb.net/?appName=Cluster0";

async function testClassesAPI() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to database\n");

    const classes = await Class.find()
      .populate("department", "name code")
      .sort({ department: 1, year: 1, section: 1 });
    
    // Check if each class has a timetable (same logic as API endpoint)
    const classesWithTimetableStatus = await Promise.all(
      classes.map(async (classItem) => {
        const timetable = await Timetable.findOne({ class: classItem._id });
        return {
          name: classItem.name,
          section: classItem.section,
          timetableStatus: timetable ? timetable.status : null,
          hasTimetable: !!timetable,
          timetableId: timetable?._id,
          timetableName: timetable?.name,
        };
      })
    );
    
    console.log("Classes with timetable status:");
    console.log(JSON.stringify(classesWithTimetableStatus, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testClassesAPI();
