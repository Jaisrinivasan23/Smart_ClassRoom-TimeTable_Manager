import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      default: "123",
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    year: {
      type: Number,
      min: 1,
      max: 4,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
StudentSchema.index({ rollNumber: 1 });
StudentSchema.index({ class: 1 });
StudentSchema.index({ department: 1, year: 1 });

const Student = mongoose.model("Student", StudentSchema);

export default Student;
