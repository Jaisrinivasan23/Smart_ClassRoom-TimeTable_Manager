import mongoose from "mongoose";

const RoomChangeRequestSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      required: true,
    },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    period: {
      type: Number,
      min: 1,
      max: 8,
      required: true,
    },
    currentRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    currentRoomName: { type: String },
    requestedRoomType: {
      type: String,
      enum: ["Lab", "Classroom", "Auditorium", "Any"],
      default: "Any",
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    allocatedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    allocatedRoomName: { type: String },
    rejectionReason: { type: String },
    // For tracking the specific class/course affected
    affectedClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    affectedClassName: { type: String },
    affectedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    affectedCourseName: { type: String },
    affectedCourseCode: { type: String },
  },
  { timestamps: true }
);

// Index for faster queries
RoomChangeRequestSchema.index({ faculty: 1, status: 1 });
RoomChangeRequestSchema.index({ status: 1, createdAt: -1 });
RoomChangeRequestSchema.index({ day: 1, period: 1, status: 1 });

const RoomChangeRequest = mongoose.model("RoomChangeRequest", RoomChangeRequestSchema);

export default RoomChangeRequest;
