import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Bell,
  LogOut,
  User,
  Menu,
  X,
  BookOpen,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
} from "lucide-react";
import axios from "axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const TIME_SLOTS = [
  { period: 1, start: "09:00", end: "10:00" },
  { period: 2, start: "10:00", end: "11:00" },
  { period: 3, start: "11:00", end: "12:00" },
  { period: 4, start: "12:00", end: "13:00" },
  { period: 5, start: "14:00", end: "15:00" },
  { period: 6, start: "15:00", end: "16:00" },
  { period: 7, start: "16:00", end: "17:00" },
  { period: 8, start: "17:00", end: "18:00" },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("timetable");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const studentData = JSON.parse(localStorage.getItem("student"));
    const userRole = localStorage.getItem("userRole");

    if (!studentData || userRole !== "student") {
      navigate("/student/login");
      return;
    }

    setStudent(studentData);
    fetchTimetable(studentData._id);
    fetchNotifications(studentData._id);
  }, [navigate]);

  const fetchTimetable = async (studentId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/students/${studentId}/timetable`);
      if (response.data.success) {
        setTimetable(response.data.timetable);
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (studentId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/students/${studentId}/notifications`);
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:5000/api/students/${student._id}/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("student");
    localStorage.removeItem("userRole");
    navigate("/student/login");
  };

  // Build timetable grid from schedule
  const timetableGrid = {};
  DAYS.forEach(day => {
    timetableGrid[day] = {};
  });

  if (timetable && timetable.schedule) {
    timetable.schedule.forEach(entry => {
      if (!timetableGrid[entry.day]) {
        timetableGrid[entry.day] = {};
      }
      timetableGrid[entry.day][entry.period] = entry;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-cyan-100">Loading...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navigationItems = [
    { id: "details", label: "My Details", icon: User },
    { id: "timetable", label: "My Timetable", icon: Calendar },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 transition-all duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="text-xl font-bold text-white">Student Portal</h2>
                <p className="text-xs text-slate-400 mt-1">{student?.name}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? "text-cyan-400" : ""}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <>
                    <span className={`font-medium flex-1 text-left ${isActive ? "text-cyan-300" : ""}`}>
                      {item.label}
                    </span>
                    {item.badge > 0 && (
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700/50">
          {student && sidebarOpen && (
            <div className="mb-3 px-4 py-2 bg-slate-800/50 rounded-xl">
              <p className="text-sm font-medium text-white">{student.name}</p>
              <p className="text-xs text-slate-400">{student.rollNumber}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut className="h-5 w-5 mr-2" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          {/* Student Details Section */}
          {activeSection === "details" && (
            <Card className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-100">
                  <User className="w-5 h-5 text-cyan-400" />
                  Student Profile
                </CardTitle>
                <CardDescription className="text-slate-300">Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Full Name</p>
                    <p className="text-white font-medium">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Roll Number</p>
                    <p className="text-white font-medium">{student.rollNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Email</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      {student.email}
                    </p>
                  </div>
                  {student.phone && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Phone</p>
                      <p className="text-white font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-cyan-400" />
                        {student.phone}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Class</p>
                    {student.class ? (
                      <p className="text-white font-medium">
                        {student.class.name} - Section {student.class.section}
                      </p>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        Not Assigned
                      </Badge>
                    )}
                  </div>
                  {student.class && (
                    <>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Year & Semester</p>
                        <p className="text-white font-medium">
                          Year {student.class.year}, Sem {student.class.semester}
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Department</p>
                    {student.department ? (
                      <p className="text-white font-medium">{student.department.name}</p>
                    ) : student.class?.department ? (
                      <p className="text-white font-medium">{student.class.department.name}</p>
                    ) : (
                      <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                        N/A
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timetable Section */}
          {activeSection === "timetable" && (
            <Card className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-100">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  My Class Timetable
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {timetable ? (
                    <span className="flex items-center gap-2">
                      {timetable.class?.name} - {timetable.class?.section}
                      {timetable.status === 'published' && (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Published</Badge>
                      )}
                      {timetable.status === 'draft' && (
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Draft</Badge>
                      )}
                    </span>
                  ) : (
                    "Your weekly class schedule"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timetable ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-900/50">
                          <th className="border border-slate-700 p-3 text-sm font-semibold text-cyan-300">Period</th>
                          {DAYS.map((day) => (
                            <th key={day} className="border border-slate-700 p-3 text-sm font-semibold text-cyan-300">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERIODS.map((period) => {
                          const timeSlot = TIME_SLOTS.find((t) => t.period === period);
                          return (
                            <tr key={period} className="hover:bg-slate-900/30 transition-colors">
                              <td className="border border-slate-700 p-3 text-center bg-slate-900/30">
                                <div className="font-semibold text-sm text-cyan-300">P{period}</div>
                                <div className="text-xs text-slate-400">
                                  {timeSlot?.start}-{timeSlot?.end}
                                </div>
                              </td>
                              {DAYS.map((day) => {
                                const entry = timetableGrid[day][period];
                                return (
                                  <td key={`${day}-${period}`} className="border border-slate-700 p-3 text-center">
                                    {entry ? (
                                      <div className="space-y-1">
                                        <div className="font-semibold text-sm text-orange-300">
                                          {entry.courseCode}
                                        </div>
                                        <div className="text-xs text-slate-300">{entry.courseName}</div>
                                        <div className="text-xs text-cyan-400">{entry.facultyName}</div>
                                        <div className="text-xs text-slate-400">{entry.roomName}</div>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-600">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg font-medium mb-2">No Timetable Generated Yet</p>
                    <p className="text-slate-500 text-sm">
                      {student?.class 
                        ? "Your class timetable will appear here once it's generated by the admin."
                        : "You need to be assigned to a class first to view your timetable."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notifications Section */}
          {activeSection === "notifications" && (
            <Card className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-100">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  Notifications
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Updates about substitute faculty and room changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notification) => {
                      const typeConfig = {
                        info: { icon: Bell, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
                        success: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
                        warning: { icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
                        error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
                      };
                      const config = typeConfig[notification.type] || typeConfig.info;
                      const NotifIcon = config.icon;

                      return (
                        <div
                          key={notification._id}
                          className={`p-4 rounded-xl border ${config.border} ${config.bg} ${
                            !notification.isRead ? "ring-1 ring-cyan-500/20" : "opacity-75"
                          } transition-all duration-200 cursor-pointer hover:opacity-100`}
                          onClick={() => !notification.isRead && markNotificationRead(notification._id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${config.color}`}>
                              <NotifIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className={`font-semibold text-sm ${!notification.isRead ? "text-cyan-100" : "text-slate-300"}`}>
                                  {notification.title}
                                </h4>
                                <div className="flex items-center gap-2 shrink-0">
                                  {!notification.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                                  )}
                                  <Badge className={`text-xs ${config.bg} ${config.color} border ${config.border}`}>
                                    {notification.type}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-slate-300 mt-1">{notification.message}</p>
                              <p className="text-xs text-slate-500 mt-2">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">No notifications yet</p>
                    <p className="text-xs text-slate-600 mt-1">You'll be notified about class updates</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
