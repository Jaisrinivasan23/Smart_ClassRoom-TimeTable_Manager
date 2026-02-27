import express from "express";
import dotenv from "dotenv";
import dbConnect from "./utils/dbConnect.js";
import cors from "cors";

import { coursesRouter, } from "./routes/coursesRoute.js";
import { facultyRouter, } from "./routes/facultyRoute.js";
import { roomsRouter, } from "./routes/roomsRoute.js";
import { timetablesRouter, } from "./routes/timetableRoute.js";
import { aiRouter, } from "./routes/aiRoute.js";
import { notificationsRouter, } from "./routes/notificationsRoute.js";
import { authRouter, } from "./routes/authRoute.js";
import { departmentsRouter, } from "./routes/departmentsRoute.js";
import { classesRouter, } from "./routes/classesRoute.js";
import leaveRequestRouter from "./routes/leaveRequestRoute.js";
import roomChangeRequestRouter from "./routes/roomChangeRequestRoute.js";
import { studentRouter } from "./routes/studentRoute.js";

dotenv.config({ quiet: true });

const app = express();

app.use(express.json());

app.use(cors());

dbConnect();

app.use("/api/courses", coursesRouter);
app.use("/api/faculty", facultyRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/timetables", timetablesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/auth", authRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/classes", classesRouter);
app.use("/api/leave-requests", leaveRequestRouter);
app.use("/api/room-change-requests", roomChangeRequestRouter);
app.use("/api/students", studentRouter);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
