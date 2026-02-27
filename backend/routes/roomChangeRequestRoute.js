import express from "express";
import RoomChangeRequest from "../models/RoomChangeRequest.js";
import Room from "../models/Room.js";
import Timetable from "../models/Timetable.js";
import Faculty from "../models/Faculty.js";
import Notification from "../models/Notification.js";
import Course from "../models/course.js";

const router = express.Router();

// Faculty submits a room change request
router.post("/", async (req, res) => {
  try {
    const { facultyId, timetableId, day, period, reason, requestedRoomType } = req.body;

    // Validate required fields
    if (!facultyId || !timetableId || !day || !period || !reason) {
      return res.status(400).json({ 
        message: "Missing required fields: facultyId, timetableId, day, period, reason" 
      });
    }

    // Find the timetable and the specific schedule entry
    const timetable = await Timetable.findById(timetableId)
      .populate("class")
      .populate("department");

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // Find the specific schedule entry for this faculty, day, and period
    const scheduleEntry = timetable.schedule.find(
      entry => 
        String(entry.facultyId) === String(facultyId) &&
        entry.day === day &&
        entry.period === period
    );

    if (!scheduleEntry) {
      return res.status(404).json({ 
        message: "No class found for this faculty at the specified day and period" 
      });
    }

    // Get faculty details
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Find the actual room document
    let currentRoom = null;
    try {
      // Try to find by ObjectId first
      currentRoom = await Room.findById(scheduleEntry.roomId);
    } catch (err) {
      // If not an ObjectId, try to find by name
      currentRoom = await Room.findOne({ name: scheduleEntry.roomName });
    }

    if (!currentRoom) {
      // If still not found, try one more time by name from roomId
      currentRoom = await Room.findOne({ name: scheduleEntry.roomId });
    }

    if (!currentRoom) {
      return res.status(404).json({ 
        message: "Current room not found in database. Please ensure the room exists." 
      });
    }

    // Find the actual course document
    let currentCourse = null;
    try {
      // Try to find by ObjectId first
      currentCourse = await Course.findById(scheduleEntry.courseId);
    } catch (err) {
      // If not an ObjectId, try to find by code
      currentCourse = await Course.findOne({ code: scheduleEntry.courseCode });
    }

    if (!currentCourse) {
      // Try to find by name as last resort
      currentCourse = await Course.findOne({ name: scheduleEntry.courseName });
    }

    // Create the room change request
    const roomChangeRequest = new RoomChangeRequest({
      faculty: facultyId,
      timetableId,
      day,
      period,
      currentRoom: currentRoom._id,
      currentRoomName: currentRoom.name,
      requestedRoomType: requestedRoomType || "Any",
      reason,
      affectedClass: timetable.class?._id,
      affectedClassName: timetable.class ? `${timetable.class.name} - ${timetable.class.section}` : "N/A",
      affectedCourse: currentCourse?._id,
      affectedCourseName: scheduleEntry.courseName,
      affectedCourseCode: scheduleEntry.courseCode,
    });

    await roomChangeRequest.save();

    // Create notification for admin (no facultyId = admin notification)
    const adminNotification = new Notification({
      title: "New Room Change Request",
      type: "info",
      message: `${faculty.name} requested a room change for ${scheduleEntry.courseName} (${scheduleEntry.courseCode}) on ${day}, Period ${period}`,
    });

    await adminNotification.save();

    res.status(201).json({ 
      message: "Room change request submitted successfully",
      request: roomChangeRequest 
    });

  } catch (error) {
    console.error("Error creating room change request:", error);
    res.status(500).json({ 
      message: "Failed to create room change request",
      error: error.message 
    });
  }
});

// Get all room change requests (Admin)
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = status && status !== "all" ? { status } : {};
    
    const requests = await RoomChangeRequest.find(filter)
      .populate("faculty", "name email department")
      .populate("currentRoom", "name type capacity")
      .populate("allocatedRoom", "name type capacity")
      .populate("affectedClass", "name section")
      .populate("affectedCourse", "name code")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching room change requests:", error);
    res.status(500).json({ 
      message: "Failed to fetch room change requests",
      error: error.message 
    });
  }
});

// Get room change requests for a specific faculty
router.get("/faculty/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;

    const requests = await RoomChangeRequest.find({ faculty: facultyId })
      .populate("currentRoom", "name type capacity")
      .populate("allocatedRoom", "name type capacity")
      .populate("affectedClass", "name section")
      .populate("affectedCourse", "name code")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching faculty room change requests:", error);
    res.status(500).json({ 
      message: "Failed to fetch room change requests",
      error: error.message 
    });
  }
});

// Get available rooms for a specific day and period
router.get("/available-rooms", async (req, res) => {
  try {
    const { day, period, roomType } = req.query;

    if (!day || !period) {
      return res.status(400).json({ message: "Day and period are required" });
    }

    // Get all rooms
    let roomsQuery = Room.find({});
    if (roomType && roomType !== "Any") {
      roomsQuery = roomsQuery.where("type").equals(roomType);
    }
    const allRooms = await roomsQuery;

    // Get all timetables to check which rooms are occupied
    const timetables = await Timetable.find({ status: "published" });

    // Find occupied room IDs for this day and period
    const occupiedRoomIds = new Set();
    timetables.forEach(timetable => {
      if (timetable.schedule && Array.isArray(timetable.schedule)) {
        timetable.schedule.forEach(entry => {
          if (entry.day === day && entry.period === parseInt(period)) {
            occupiedRoomIds.add(String(entry.roomId));
          }
        });
      }
    });

    // Filter available rooms
    const availableRooms = allRooms.filter(
      room => !occupiedRoomIds.has(String(room._id))
    );

    res.json(availableRooms);
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    res.status(500).json({ 
      message: "Failed to fetch available rooms",
      error: error.message 
    });
  }
});

// Approve room change request and allocate room
router.put("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { allocatedRoomId } = req.body;

    if (!allocatedRoomId) {
      return res.status(400).json({ message: "Allocated room ID is required" });
    }

    // Find the request
    const request = await RoomChangeRequest.findById(id)
      .populate("faculty", "name email");

    if (!request) {
      return res.status(404).json({ message: "Room change request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    // Get the allocated room details
    const allocatedRoom = await Room.findById(allocatedRoomId);
    if (!allocatedRoom) {
      return res.status(404).json({ message: "Allocated room not found" });
    }

    // Update the timetable with the new room
    const timetable = await Timetable.findById(request.timetableId);
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // Find and update the specific schedule entry
    const scheduleEntry = timetable.schedule.find(
      entry =>
        String(entry.facultyId) === String(request.faculty._id) &&
        entry.day === request.day &&
        entry.period === request.period
    );

    if (scheduleEntry) {
      scheduleEntry.roomId = allocatedRoom._id.toString();
      scheduleEntry.roomName = allocatedRoom.name;
      await timetable.save();
    }

    // Update the request status
    request.status = "approved";
    request.allocatedRoom = allocatedRoomId;
    request.allocatedRoomName = allocatedRoom.name;
    await request.save();

    // Create notification for the faculty
    const facultyNotification = new Notification({
      title: "Room Change Request Approved",
      type: "success",
      message: `Your room change request for ${request.affectedCourseName} (${request.affectedCourseCode}) on ${request.day}, Period ${request.period} has been approved. New room: ${allocatedRoom.name}`,
      facultyId: typeof request.faculty === 'object' ? request.faculty._id : request.faculty,
    });

    await facultyNotification.save();

    // Create notification for students of the affected class
    if (request.affectedClass) {
      const studentNotification = new Notification({
        title: "Room Change Update",
        type: "info",
        message: `Room changed for ${request.affectedCourseName} (${request.affectedCourseCode}) on ${request.day}, Period ${request.period}. New room: ${allocatedRoom.name}`,
        classId: typeof request.affectedClass === 'object' ? request.affectedClass._id : request.affectedClass,
      });

      await studentNotification.save();
    }

    res.json({ 
      message: "Room change request approved successfully",
      request,
      updatedTimetable: timetable
    });

  } catch (error) {
    console.error("Error approving room change request:", error);
    res.status(500).json({ 
      message: "Failed to approve room change request",
      error: error.message 
    });
  }
});

// Reject room change request
router.put("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    // Find the request
    const request = await RoomChangeRequest.findById(id)
      .populate("faculty", "name email");

    if (!request) {
      return res.status(404).json({ message: "Room change request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    // Update the request status
    request.status = "rejected";
    request.rejectionReason = rejectionReason;
    await request.save();

    // Create notification for the faculty
    const facultyNotification = new Notification({
      title: "Room Change Request Rejected",
      type: "error",
      message: `Your room change request for ${request.affectedCourseName} (${request.affectedCourseCode}) on ${request.day}, Period ${request.period} has been rejected. Reason: ${rejectionReason}`,
      facultyId: typeof request.faculty === 'object' ? request.faculty._id : request.faculty,
    });

    await facultyNotification.save();

    res.json({ 
      message: "Room change request rejected",
      request 
    });

  } catch (error) {
    console.error("Error rejecting room change request:", error);
    res.status(500).json({ 
      message: "Failed to reject room change request",
      error: error.message 
    });
  }
});

export default router;
