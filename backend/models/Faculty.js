import mongoose from "mongoose";

const TimeSlotSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false } 
);

const FacultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: "123" }, // Hardcoded default password
    phone: { type: String, trim: true },
    employeeId: { type: String, unique: true, sparse: true, trim: true },
    departments: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Department",
      required: true 
    }],
    courses: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Course"
    }],
    specialization: [{ type: String }],
    availability: {
      monday: [TimeSlotSchema],
      tuesday: [TimeSlotSchema],
      wednesday: [TimeSlotSchema],
      thursday: [TimeSlotSchema],
      friday: [TimeSlotSchema],
      saturday: [TimeSlotSchema],
      sunday: [TimeSlotSchema],
    },
    maxHoursPerWeek: { type: Number, required: true },
    preferences: {
      preferredTimeSlots: [{ type: String }],
      avoidTimeSlots: [{ type: String }],
    },
    unavailabilityRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveRequest"
    }],
  },
  {
    timestamps: true, 
  }
);

const Faculty = mongoose.model("Faculty", FacultySchema);

export default Faculty;
