import mongoose from "mongoose";

const ScheduleEntrySchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    courseName: { type: String },
    courseCode: { type: String },
    facultyId: { type: String, required: true },
    facultyName: { type: String },
    roomId: { type: String, required: true },
    roomName: { type: String },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    period: { type: Number, min: 1, max: 8 },  // Period number 1-8
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const TimetableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    semester: { type: String, required: true },
    year: { type: Number, required: true },
    department: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Department",
      required: true 
    },
    class: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Class",
      required: false  // Optional - for class-specific timetables
    },
    schedule: [ScheduleEntrySchema],
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    conflicts: [
      {
        type: { type: String, required: true },
        message: { type: String, required: true },
        entries: [{ type: String }],
      },
    ],
    metadata: {
      totalHours: { type: Number, default: 0 },
      utilizationRate: { type: Number, default: 0 },
      conflictCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Timetable = mongoose.model("Timetable", TimetableSchema);
export default Timetable;
