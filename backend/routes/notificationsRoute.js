import { Router } from "express";
import Notification from "../models/Notification.js";

export const notificationsRouter = Router();


notificationsRouter.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find({ facultyId: null }).sort({ createdAt: -1 }); 
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get notifications for a specific faculty
notificationsRouter.get("/faculty/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;
    const notifications = await Notification.find({ facultyId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching faculty notifications:", error);
    res.status(500).json({ error: "Failed to fetch faculty notifications" });
  }
});

// Mark all notifications as read for a faculty
notificationsRouter.put("/faculty/:facultyId/read-all", async (req, res) => {
  try {
    const { facultyId } = req.params;
    await Notification.updateMany({ facultyId, isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});


notificationsRouter.post("/", async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save(); 
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});


notificationsRouter.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});


notificationsRouter.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});