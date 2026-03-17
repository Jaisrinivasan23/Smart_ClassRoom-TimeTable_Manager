import express from "express";
import LeaveRequest from "../models/LeaveRequest.js";
import Faculty from "../models/Faculty.js";
import Timetable from "../models/Timetable.js";
import Notification from "../models/Notification.js";
import { sendCompleteNotification } from "../utils/notificationService.js";
import { sendEmail, emailTemplates, initializeEmailService } from "../utils/emailService.js";
import { sendSMS, smsTemplates, initializeSMSService, formatPhoneNumber } from "../utils/smsService.js";

const router = express.Router();

/**
 * POST /api/leave-requests
 * Faculty creates a new leave/unavailability request
 */
router.post("/", async (req, res) => {
  try {
    const { facultyId, date, day, period, reason } = req.body;

    if (!facultyId || !date || !day || !period || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Find the timetable entry for this faculty at the specified time
    const timetables = await Timetable.find({})
      .populate("class", "name section");
    
    let affectedClass = null;
    let affectedCourse = null;
    let affectedTimetable = null;

    for (const timetable of timetables) {
      const entry = timetable.schedule.find(
        (slot) =>
          String(slot.facultyId) === String(facultyId) &&
          slot.day === day &&
          slot.period === period
      );

      if (entry) {
        affectedClass = timetable.class?._id;
        affectedCourse = entry.courseId;
        affectedTimetable = timetable._id;
        break;
      }
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      faculty: facultyId,
      date: new Date(date),
      day,
      period,
      reason,
      status: "pending",
      affectedClass,
      affectedCourse,
      affectedTimetable,
    });

    await leaveRequest.save();

    // Update faculty's unavailabilityRequests array
    await Faculty.findByIdAndUpdate(facultyId, {
      $push: { unavailabilityRequests: leaveRequest._id },
    });

    // Create notification for admin (no facultyId = admin notification)
    await Notification.create({
      title: "New Leave Request",
      message: `Faculty has requested leave for ${day}, Period ${period}. Reason: ${reason}`,
      type: "info",
    });

    // Send actual email and SMS notifications
    await sendCompleteNotification(
      'leave_request',
      { facultyId },
      `Faculty has requested leave for ${day}, Period ${period}. Reason: ${reason}`
    );

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      leaveRequest,
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create leave request",
      error: error.message,
    });
  }
});

/**
 * GET /api/leave-requests
 * Get all leave requests (admin view)
 */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    const query = status ? { status } : {};

    const leaveRequests = await LeaveRequest.find(query)
      .populate("faculty", "name email employeeId departments")
      .populate("substitute", "name email")
      .populate("affectedClass", "name section")
      .populate("affectedCourse", "name code")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaveRequests.length,
      leaveRequests,
    });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leave requests",
    });
  }
});

/**
 * GET /api/leave-requests/faculty/:facultyId
 * Get leave requests for a specific faculty
 */
router.get("/faculty/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;

    const leaveRequests = await LeaveRequest.find({ faculty: facultyId })
      .populate("substitute", "name email")
      .populate("affectedClass", "name section")
      .populate("affectedCourse", "name code")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaveRequests.length,
      leaveRequests,
    });
  } catch (error) {
    console.error("Error fetching faculty leave requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leave requests",
    });
  }
});

/**
 * PUT /api/leave-requests/:id/approve
 * Admin approves leave request and assigns substitute
 */
router.put("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { substituteId, approvedBy } = req.body;

    if (!substituteId) {
      return res.status(400).json({
        success: false,
        message: "Substitute faculty is required",
      });
    }

    const leaveRequest = await LeaveRequest.findById(id)
      .populate("faculty", "name email")
      .populate("affectedClass", "name section")
      .populate("affectedCourse", "name code type")
      .populate("affectedTimetable");

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    // Get room information from timetable
    let roomName = null;
    if (leaveRequest.affectedTimetable && leaveRequest.affectedTimetable.schedule) {
      const scheduleEntry = leaveRequest.affectedTimetable.schedule.find(
        entry => entry.day === leaveRequest.day && entry.period === leaveRequest.period
      );
      if (scheduleEntry) {
        roomName = scheduleEntry.roomName || null;
      }
    }

    // Update leave request
    leaveRequest.status = "approved";
    leaveRequest.substitute = substituteId;
    leaveRequest.approvedBy = approvedBy || "Admin";
    leaveRequest.approvedAt = new Date();
    await leaveRequest.save();

    // Get substitute faculty details for notifications
    const substitute = await Faculty.findById(substituteId);

    // Safely extract faculty name
    const facultyName = leaveRequest.faculty?.name || 'A faculty member';
    
    // Safely extract class name with section
    let className = leaveRequest.affectedClass?.name || 'a class';
    if (leaveRequest.affectedClass?.section) {
      className += ` - ${leaveRequest.affectedClass.section}`;
    }
    
    // Safely extract course info with type
    let courseInfo = '';
    let isLab = false;
    if (leaveRequest.affectedCourse) {
      const courseName = leaveRequest.affectedCourse.name || '';
      const courseCode = leaveRequest.affectedCourse.code || '';
      const courseType = leaveRequest.affectedCourse.type || '';
      
      isLab = courseType.toLowerCase() === 'lab';
      
      if (courseCode && courseName) {
        courseInfo = ` for ${courseCode} - ${courseName}`;
        if (isLab) {
          courseInfo += ' (Lab)';
        }
      }
    }

    // Build detailed notification message
    let substituteMessage = `You have been assigned to substitute for ${facultyName} on ${leaveRequest.day}, Period ${leaveRequest.period} in ${className}${courseInfo}.`;
    
    // Add room information if available (especially important for labs)
    if (roomName) {
      substituteMessage += ` Room: ${roomName}.`;
    }

    // Notify original faculty
    await Notification.create({
      title: "Leave Request Approved",
      message: `Your leave request for ${leaveRequest.day}, Period ${leaveRequest.period} has been approved. ${substitute?.name || "A substitute"} will cover your class.`,
      type: "success",
      facultyId: leaveRequest.faculty._id || leaveRequest.faculty,
    });

    // Send email/SMS to original faculty
    if (leaveRequest.faculty?.email) {
      initializeEmailService();
      const emailTemplate = emailTemplates.newRequest(
        leaveRequest.faculty?.name || 'Faculty',
        'Leave Approval',
        `Your leave request for ${leaveRequest.day}, Period ${leaveRequest.period} has been approved. ${substitute?.name || "A substitute"} will cover your class.`
      );
      await sendEmail(
        leaveRequest.faculty.email,
        emailTemplate.subject,
        emailTemplate.html
      );
    }
    if (leaveRequest.faculty?.phone) {
      initializeSMSService();
      const smsMessage = `Smart Classroom: Your leave request for ${leaveRequest.day} Period ${leaveRequest.period} has been approved.`;
      await sendSMS(leaveRequest.faculty.phone, smsMessage);
    }

    // Notify substitute faculty with full details
    await Notification.create({
      title: "Substitution Assignment",
      message: substituteMessage,
      type: "info",
      facultyId: substituteId,
    });

    // Send email/SMS to substitute faculty
    if (substitute?.email) {
      initializeEmailService();
      const emailTemplate = emailTemplates.newRequest(
        substitute.name || 'Faculty',
        'Substitution Assignment',
        substituteMessage
      );
      await sendEmail(
        substitute.email,
        emailTemplate.subject,
        emailTemplate.html
      );
    }
    if (substitute?.phone) {
      initializeSMSService();
      const smsMessage = `Smart Classroom: You have been assigned to substitute for ${facultyName} on ${leaveRequest.day}, Period ${leaveRequest.period}.`;
      await sendSMS(substitute.phone, smsMessage);
    }

    // Notify students of the class about substitute faculty
    if (leaveRequest.affectedClass) {
      const substituteName = substitute?.name || "A substitute faculty";
      let studentMessage = `Class Update: ${substituteName} will be taking ${className}${courseInfo} on ${leaveRequest.day}, Period ${leaveRequest.period}`;
      if (roomName) {
        studentMessage += ` in Room ${roomName}`;
      }
      studentMessage += '.';

      await Notification.create({
        title: "Substitute Faculty Assigned",
        message: studentMessage,
        type: "info",
        classId: leaveRequest.affectedClass._id || leaveRequest.affectedClass,
      });
    }

    res.status(200).json({
      success: true,
      message: "Leave request approved and substitute assigned",
      leaveRequest,
    });
  } catch (error) {
    console.error("Error approving leave request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve leave request",
      error: error.message,
    });
  }
});

/**
 * PUT /api/leave-requests/:id/reject
 * Admin rejects leave request
 */
router.put("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedReason } = req.body;

    const leaveRequest = await LeaveRequest.findById(id)
      .populate("faculty", "name email");

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    leaveRequest.status = "rejected";
    leaveRequest.rejectedReason = rejectedReason || "No reason provided";
    await leaveRequest.save();

    // Notify faculty
    await Notification.create({
      title: "Leave Request Rejected",
      message: `Your leave request for ${leaveRequest.day}, Period ${leaveRequest.period} has been rejected. Reason: ${leaveRequest.rejectedReason}`,
      type: "error",
      facultyId: typeof leaveRequest.faculty === 'object' ? leaveRequest.faculty._id : leaveRequest.faculty,
    });

    // Send email/SMS to faculty
    if (leaveRequest.faculty?.email) {
      initializeEmailService();
      const emailTemplate = emailTemplates.newRequest(
        leaveRequest.faculty?.name || 'Faculty',
        'Leave Request Rejection',
        `Your leave request for ${leaveRequest.day}, Period ${leaveRequest.period} has been rejected. Reason: ${leaveRequest.rejectedReason}`
      );
      await sendEmail(
        leaveRequest.faculty.email,
        emailTemplate.subject,
        emailTemplate.html
      );
    }
    if (leaveRequest.faculty?.phone) {
      initializeSMSService();
      const smsMessage = `Smart Classroom: Your leave request for ${leaveRequest.day} Period ${leaveRequest.period} has been rejected.`;
      await sendSMS(leaveRequest.faculty.phone, smsMessage);
    }

    res.status(200).json({
      success: true,
      message: "Leave request rejected",
      leaveRequest,
    });
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject leave request",
    });
  }
});

/**
 * GET /api/leave-requests/available-faculty
 * Get available faculty for substitution
 * Query params: day, period, departmentId
 */
router.get("/available-faculty", async (req, res) => {
  try {
    const { day, period, departmentId } = req.query;

    if (!day || !period || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "Day, period, and departmentId are required",
      });
    }

    // Get all timetables
    const timetables = await Timetable.find({});

    // Find faculty who are busy at this time
    const busyFacultyIds = new Set();
    timetables.forEach((tt) => {
      tt.schedule.forEach((slot) => {
        if (slot.day === day && slot.period === parseInt(period)) {
          busyFacultyIds.add(String(slot.facultyId));
        }
      });
    });

    // Find available faculty from the same department
    // Use $in operator to check if departmentId is in the departments array
    const availableFaculty = await Faculty.find({
      departments: { $in: [departmentId] },
      _id: { $nin: Array.from(busyFacultyIds) },
    })
      .populate("courses", "name code")
      .select("name email employeeId courses specialization");

    res.status(200).json({
      success: true,
      count: availableFaculty.length,
      availableFaculty,
    });
  } catch (error) {
    console.error("Error fetching available faculty:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available faculty",
    });
  }
});

export default router;
