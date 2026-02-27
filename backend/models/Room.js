import mongoose from "mongoose";

const TimeSlotSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false } 
);

const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: Number, required: true },
    capacity: { type: Number, required: true },
    type: { 
      type: String, 
      enum: ["lab", "seminar_room", "auditorium"], 
      required: true 
    },
    equipment: [{ type: String }],
    availability: {
      type: {
        monday: [TimeSlotSchema],
        tuesday: [TimeSlotSchema],
        wednesday: [TimeSlotSchema],
        thursday: [TimeSlotSchema],
        friday: [TimeSlotSchema],
        saturday: [TimeSlotSchema],
        sunday: [TimeSlotSchema],
      },
      default: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      }
    },
  },
  {
    timestamps: true, 
  }
);

const Room = mongoose.model("Room", RoomSchema);

export default Room;
