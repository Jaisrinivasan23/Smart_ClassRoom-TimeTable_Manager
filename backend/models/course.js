
import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    departments: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Department",
      required: true 
    }],
    faculty: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Faculty"
    },
    credits: { type: Number, required: true },
    semester: { type: Number, required: true },
    year: { type: Number, required: true, default: new Date().getFullYear() },
    description: { type: String },
    duration: { type: Number , default: 13},
    prerequisites: [{ type: String }],

    
    type: {
      type: String,
      enum: ["lecture", "lab", "practical", "seminar"],
      default: "lecture",
    },
    hoursPerWeek: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", CourseSchema);

export default Course;