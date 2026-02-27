import mongoose from "mongoose";

const LeaveRequestSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      required: true,
    },
    period: {
      type: Number,
      min: 1,
      max: 8,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    substitute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },
    affectedClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    affectedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    affectedTimetable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      default: null,
    },
    approvedBy: {
      type: String, // Admin email or ID
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
LeaveRequestSchema.index({ faculty: 1, status: 1 });
LeaveRequestSchema.index({ date: 1, day: 1, period: 1 });

const LeaveRequest = mongoose.model("LeaveRequest", LeaveRequestSchema);

export default LeaveRequest;
