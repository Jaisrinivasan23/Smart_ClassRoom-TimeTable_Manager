import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  section: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  numberOfStudents: {
    type: Number,
    required: true,
    min: 0
  },
  students: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    rollNumber: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Create compound index for uniqueness
classSchema.index({ department: 1, year: 1, section: 1 }, { unique: true });

const Class = mongoose.model("Class", classSchema);
export default Class;
