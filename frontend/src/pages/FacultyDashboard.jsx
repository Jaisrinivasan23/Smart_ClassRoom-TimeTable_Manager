import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Bell, 
  LogOut, 
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  Menu,
  X,
  DoorOpen
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

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [roomChangeRequests, setRoomChangeRequests] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("timetable");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Leave request form state
  const [leaveForm, setLeaveForm] = useState({
    date: "",
    day: "",
    period: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Room change request form state
  const [roomChangeForm, setRoomChangeForm] = useState({
    day: "",
    period: "",
    reason: "",
    requestedRoomType: "Any",
  });
  const [submittingRoomChange, setSubmittingRoomChange] = useState(false);

  useEffect(() => {
    const facultyData = JSON.parse(localStorage.getItem("faculty"));
    const userRole = localStorage.getItem("userRole");

    if (!facultyData || userRole !== "faculty") {
      navigate("/faculty/login");
      return;
    }

    setFaculty(facultyData);
    fetchSchedule(facultyData._id);
    fetchLeaveRequests(facultyData._id);
    fetchRoomChangeRequests(facultyData._id);
    fetchTimetables(facultyData._id);
    fetchNotifications(facultyData._id);
  }, [navigate]);

  const fetchSchedule = async (facultyId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/timetables/faculty/${facultyId}`);
      setSchedule(response.data.schedule || []);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async (facultyId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/leave-requests/faculty/${facultyId}`);
      setLeaveRequests(response.data.leaveRequests || []);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
  };

  const fetchRoomChangeRequests = async (facultyId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/room-change-requests/faculty/${facultyId}`);
      setRoomChangeRequests(response.data || []);
    } catch (error) {
      console.error("Error fetching room change requests:", error);
    }
  };

  const fetchTimetables = async (facultyId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/timetables`);
      // Filter timetables where this faculty teaches
      const facultyTimetables = response.data.filter(tt => 
        tt.schedule && tt.schedule.some(entry => String(entry.facultyId) === String(facultyId))
      );
      setTimetables(facultyTimetables);
    } catch (error) {
      console.error("Error fetching timetables:", error);
    }
  };

  const fetchNotifications = async (facultyId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/notifications/faculty/${facultyId}`);
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/faculty/${faculty._id}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("faculty");
    localStorage.removeItem("userRole");
    navigate("/faculty/login");
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Check if "Whole Day" is selected
      if (leaveForm.period === "all") {
        // Get all allocated periods for the selected day
        const allocatedPeriods = PERIODS.filter(period => {
          return timetableGrid[leaveForm.day] && timetableGrid[leaveForm.day][period];
        });

        if (allocatedPeriods.length === 0) {
          alert("No classes scheduled on this day");
          setSubmitting(false);
          return;
        }

        // Submit a leave request for each allocated period
        const requests = allocatedPeriods.map(period =>
          axios.post("http://localhost:5000/api/leave-requests", {
            facultyId: faculty._id,
            date: leaveForm.date,
            day: leaveForm.day,
            period: period,
            reason: `${leaveForm.reason} (Whole Day Leave)`,
          })
        );

        await Promise.all(requests);
        alert(`Leave request submitted successfully for ${allocatedPeriods.length} period(s)!`);
      } else {
        // Single period request
        await axios.post("http://localhost:5000/api/leave-requests", {
          facultyId: faculty._id,
          ...leaveForm,
        });
        alert("Leave request submitted successfully!");
      }

      setLeaveForm({ date: "", day: "", period: "", reason: "" });
      fetchLeaveRequests(faculty._id);
    } catch (error) {
      console.error("Error submitting leave request:", error);
      alert("Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoomChangeSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRoomChange(true);

    try {
      // Find the timetable entry for this day and period
      let timetableId = null;
      for (const tt of timetables) {
        const entry = tt.schedule.find(s => 
          String(s.facultyId) === String(faculty._id) && 
          s.day === roomChangeForm.day && 
          s.period === parseInt(roomChangeForm.period)
        );
        if (entry) {
          timetableId = tt._id;
          break;
        }
      }

      if (!timetableId) {
        alert("No class found for the selected day and period");
        setSubmittingRoomChange(false);
        return;
      }

      await axios.post("http://localhost:5000/api/room-change-requests", {
        facultyId: faculty._id,
        timetableId,
        ...roomChangeForm,
        period: parseInt(roomChangeForm.period),
      });

      alert("Room change request submitted successfully!");
      setRoomChangeForm({ day: "", period: "", reason: "", requestedRoomType: "Any" });
      fetchRoomChangeRequests(faculty._id);
    } catch (error) {
      console.error("Error submitting room change request:", error);
      alert(error.response?.data?.message || "Failed to submit room change request");
    } finally {
      setSubmittingRoomChange(false);
    }
  };

  // Build timetable grid
  const buildTimetableGrid = () => {
    const grid = {};
    DAYS.forEach((day) => {
      grid[day] = {};
      PERIODS.forEach((period) => {
        const entry = schedule.find((s) => s.day === day && s.period === period);
        grid[day][period] = entry || null;
      });
    });
    return grid;
  };

  const timetableGrid = buildTimetableGrid();

  const getStatusBadge = (status) => {
    const styles = {
      pending: { className: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30", icon: AlertCircle, text: "Pending" },
      approved: { className: "bg-green-500/20 text-green-300 border-green-400/30", icon: CheckCircle, text: "Approved" },
      rejected: { className: "bg-red-500/20 text-red-300 border-red-400/30", icon: XCircle, text: "Rejected" },
    };

    const config = styles[status] || styles.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

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
    { id: "timetable", label: "My Timetable", icon: Calendar },
    { id: "courses", label: "My Courses", icon: BookOpen },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "leave-request", label: "Request Unavailability", icon: Clock },
    { id: "room-change", label: "Request Room Change", icon: DoorOpen },
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
                <h2 className="text-xl font-bold text-white">Faculty Portal</h2>
                <p className="text-xs text-slate-400 mt-1">{typeof faculty?.name === 'object' ? faculty?.name?.name || 'Faculty' : faculty?.name}</p>
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
                  <span className={`font-medium flex-1 text-left ${isActive ? "text-cyan-300" : ""}`}>
                    {item.label}
                  </span>
                )}
                {sidebarOpen && item.badge > 0 && (
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700/50">
          {faculty && sidebarOpen && (
            <div className="mb-3 px-4 py-2 bg-slate-800/50 rounded-xl">
              <p className="text-sm font-medium text-white">{typeof faculty.name === 'object' ? faculty.name?.name || 'Faculty' : faculty.name}</p>
              <p className="text-xs text-slate-400">{typeof faculty.email === 'object' ? faculty.email?.email || '' : faculty.email}</p>
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
          {/* My Timetable Section */}
          {activeSection === "timetable" && (
            <Card className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-100">
              <Calendar className="w-5 h-5 text-cyan-400" />
              My Weekly Timetable
            </CardTitle>
            <CardDescription className="text-slate-300">Your class schedule for the week</CardDescription>
          </CardHeader>
          <CardContent>
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
                                  <div className="text-xs text-cyan-400">{entry.className}</div>
                                  <div className="text-xs text-slate-400">{entry.roomName}</div>
                                </div>
                              ) : (
                                <span className="text-slate-600 text-sm">Free</span>
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
          </CardContent>
        </Card>
          )}

          {/* My Courses Section */}
          {activeSection === "courses" && (
            <Card className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-100">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                My Courses
              </CardTitle>
              <CardDescription className="text-slate-300">Courses assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              {faculty?.courses && faculty.courses.length > 0 ? (
                <div className="space-y-3">
                  {faculty.courses.map((course) => (
                    <div key={course._id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:bg-slate-900/70 transition-colors">
                      <div className="font-semibold text-orange-300 text-lg">{typeof course.code === 'object' ? course.code?.code || course.code?.name || 'N/A' : course.code}</div>
                      <div className="text-sm text-slate-300 mt-1">{typeof course.name === 'object' ? course.name?.name || 'N/A' : course.name}</div>
                      <div className="text-xs text-slate-400 mt-2">Semester {typeof course.semester === 'object' ? course.semester?.semester || 'N/A' : course.semester}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No courses assigned yet</p>
              )}
            </CardContent>
          </Card>
          )}

          {/* Request Unavailability Section */}
          {activeSection === "leave-request" && (
            <div className="space-y-6">
              <Card className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-100">
                <Clock className="w-5 h-5 text-cyan-400" />
                Request Unavailability
              </CardTitle>
              <CardDescription className="text-slate-300">Submit leave request for a specific slot</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-cyan-100">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={leaveForm.date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })}
                    required
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="day" className="text-cyan-100">Day</Label>
                  <Select value={leaveForm.day} onValueChange={(value) => setLeaveForm({ ...leaveForm, day: value, period: "" })}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day} className="text-white hover:bg-slate-800">
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period" className="text-cyan-100">Period</Label>
                  <Select
                    value={leaveForm.period}
                    onValueChange={(value) => setLeaveForm({ ...leaveForm, period: value })}
                    disabled={!leaveForm.day}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                      <SelectValue placeholder={leaveForm.day ? "Select period" : "Select day first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {leaveForm.day && (
                        <>
                          {/* Whole Day Option */}
                          {PERIODS.filter(period => timetableGrid[leaveForm.day] && timetableGrid[leaveForm.day][period]).length > 0 && (
                            <SelectItem value="all" className="text-white hover:bg-slate-800 font-semibold border-b border-slate-700">
                              🌅 Whole Day ({PERIODS.filter(period => timetableGrid[leaveForm.day] && timetableGrid[leaveForm.day][period]).length} periods)
                            </SelectItem>
                          )}
                          
                          {/* Individual Periods */}
                          {PERIODS.filter(period => {
                            return timetableGrid[leaveForm.day] && timetableGrid[leaveForm.day][period];
                          }).map((period) => {
                            const timeSlot = TIME_SLOTS.find((t) => t.period === period);
                            const entry = timetableGrid[leaveForm.day][period];
                            return (
                              <SelectItem key={period} value={period.toString()} className="text-white hover:bg-slate-800">
                                Period {period} ({timeSlot?.start}-{timeSlot?.end}) - {entry?.courseCode}
                              </SelectItem>
                            );
                          })}
                        </>
                      )}
                      {leaveForm.day && PERIODS.filter(period => timetableGrid[leaveForm.day] && timetableGrid[leaveForm.day][period]).length === 0 && (
                        <div className="px-2 py-3 text-sm text-slate-400 text-center">
                          No classes scheduled on {leaveForm.day}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-cyan-100">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a reason for your unavailability"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    required
                    rows={3}
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600" disabled={submitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* My Leave Requests */}
          <Card className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-100">
              <Bell className="w-5 h-5 text-cyan-400" />
              My Leave Requests
            </CardTitle>
            <CardDescription className="text-slate-300">Track your unavailability requests</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveRequests.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  // Group requests by date and day to identify whole day leaves
                  const groupedRequests = leaveRequests.reduce((acc, request) => {
                    const key = `${request.date}-${request.day}`;
                    if (!acc[key]) {
                      acc[key] = [];
                    }
                    acc[key].push(request);
                    return acc;
                  }, {});

                  return Object.entries(groupedRequests).map(([key, requests]) => {
                    const isWholeDayLeave = requests.length > 1 && requests.some(r => r.reason?.includes("(Whole Day Leave)"));
                    
                    if (isWholeDayLeave) {
                      // Display as grouped whole day leave
                      const firstRequest = requests[0];
                      const allApproved = requests.every(r => r.status === "approved");
                      const allRejected = requests.every(r => r.status === "rejected");
                      const anyPending = requests.some(r => r.status === "pending");
                      
                      return (
                        <div key={key} className="p-4 bg-slate-900/50 rounded-lg border-2 border-orange-500/30">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-orange-300 flex items-center gap-2">
                                🌅 {firstRequest.day} - Whole Day Leave
                                <span className="text-xs text-slate-400">({requests.length} periods)</span>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                {new Date(firstRequest.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Periods: {requests.map(r => r.period).sort((a, b) => a - b).join(", ")}
                              </div>
                            </div>
                            {allApproved ? getStatusBadge("approved") : 
                             allRejected ? getStatusBadge("rejected") : 
                             <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">
                               {anyPending ? "Partially Approved" : "Pending"}
                             </Badge>}
                          </div>
                          <div className="text-sm text-slate-300 mb-2">
                            <span className="font-semibold">Reason:</span> {firstRequest.reason.replace(" (Whole Day Leave)", "")}
                          </div>
                          {requests.some(r => r.substitute) && (
                            <div className="text-sm text-green-400 mt-2">
                              <span className="font-semibold">Substitutes:</span>
                              <div className="ml-4 mt-1 space-y-1">
                                {requests.filter(r => r.substitute).map(r => (
                                  <div key={r._id} className="text-xs">
                                    Period {r.period}: {typeof r.substitute.name === 'object' ? r.substitute.name?.name || 'N/A' : r.substitute.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-2">
                            Submitted: {new Date(firstRequest.createdAt).toLocaleString()}
                          </div>
                        </div>
                      );
                    } else {
                      // Display individual requests
                      return requests.map((request) => (
                        <div key={request._id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-cyan-100">
                                {request.day}, Period {request.period}
                              </div>
                              <div className="text-sm text-slate-400">
                                {new Date(request.date).toLocaleDateString()}
                              </div>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="text-sm text-slate-300 mb-2">
                            <span className="font-semibold">Reason:</span> {request.reason}
                          </div>
                          {request.substitute && (
                            <div className="text-sm text-green-400">
                              <span className="font-semibold">Substitute:</span> {typeof request.substitute.name === 'object' ? request.substitute.name?.name || 'N/A' : request.substitute.name}
                            </div>
                          )}
                          {request.rejectedReason && (
                            <div className="text-sm text-red-400">
                              <span className="font-semibold">Rejection Reason:</span> {request.rejectedReason}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-2">
                            Submitted: {new Date(request.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ));
                    }
                  });
                })()}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No leave requests yet</p>
            )}
          </CardContent>
        </Card>
            </div>
          )}

          {/* Room Change Request Section */}
          {activeSection === "room-change" && (
            <div className="space-y-6">
              <Card className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-100">
                <DoorOpen className="w-5 h-5 text-cyan-400" />
                Request Room Change
              </CardTitle>
              <CardDescription className="text-slate-300">Request a different lab/room for your class</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRoomChangeSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="room-day" className="text-cyan-100">Day</Label>
                  <Select
                    value={roomChangeForm.day}
                    onValueChange={(value) =>
                      setRoomChangeForm({ ...roomChangeForm, day: value, period: "" })
                    }
                    required
                  >
                    <SelectTrigger id="room-day" className="bg-slate-900/50 border-slate-700 text-white mt-2">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day} className="text-white hover:bg-slate-800">
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="room-period" className="text-cyan-100">Period</Label>
                  <Select
                    value={roomChangeForm.period}
                    onValueChange={(value) =>
                      setRoomChangeForm({ ...roomChangeForm, period: value })
                    }
                    required
                    disabled={!roomChangeForm.day}
                  >
                    <SelectTrigger id="room-period" className="bg-slate-900/50 border-slate-700 text-white mt-2">
                      <SelectValue placeholder={roomChangeForm.day ? "Select period" : "Select day first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {roomChangeForm.day && PERIODS.filter(period => {
                        // Only show periods where faculty has a class on the selected day
                        return timetableGrid[roomChangeForm.day] && timetableGrid[roomChangeForm.day][period];
                      }).map((period) => {
                        const timeSlot = TIME_SLOTS.find((t) => t.period === period);
                        const entry = timetableGrid[roomChangeForm.day][period];
                        return (
                          <SelectItem key={period} value={period.toString()} className="text-white hover:bg-slate-800">
                            Period {period} ({timeSlot?.start} - {timeSlot?.end}) - {entry?.courseCode}
                          </SelectItem>
                        );
                      })}
                      {roomChangeForm.day && PERIODS.filter(period => timetableGrid[roomChangeForm.day] && timetableGrid[roomChangeForm.day][period]).length === 0 && (
                        <div className="px-2 py-3 text-sm text-slate-400 text-center">
                          No classes scheduled on {roomChangeForm.day}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="room-type" className="text-cyan-100">Preferred Room Type</Label>
                  <Select
                    value={roomChangeForm.requestedRoomType}
                    onValueChange={(value) =>
                      setRoomChangeForm({ ...roomChangeForm, requestedRoomType: value })
                    }
                  >
                    <SelectTrigger id="room-type" className="bg-slate-900/50 border-slate-700 text-white mt-2">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="Any" className="text-white hover:bg-slate-800">Any Available</SelectItem>
                      <SelectItem value="Lab" className="text-white hover:bg-slate-800">Lab</SelectItem>
                      <SelectItem value="Classroom" className="text-white hover:bg-slate-800">Classroom</SelectItem>
                      <SelectItem value="Auditorium" className="text-white hover:bg-slate-800">Auditorium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="room-reason" className="text-cyan-100">Reason</Label>
                  <Textarea
                    id="room-reason"
                    placeholder="Explain why you need a room change..."
                    value={roomChangeForm.reason}
                    onChange={(e) =>
                      setRoomChangeForm({ ...roomChangeForm, reason: e.target.value })
                    }
                    required
                    rows={4}
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 mt-2"
                  />
                </div>

                <Button type="submit" disabled={submittingRoomChange} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                  <Send className="w-4 h-4 mr-2" />
                  {submittingRoomChange ? "Submitting..." : "Submit Room Change Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* My Room Change Requests */}
          <Card className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-100">
                <Clock className="w-5 h-5 text-cyan-400" />
                My Room Change Requests
              </CardTitle>
              <CardDescription className="text-slate-300">Track your room change requests</CardDescription>
            </CardHeader>
            <CardContent>
              {roomChangeRequests.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {roomChangeRequests.map((request) => (
                    <div key={request._id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-cyan-100">
                            {request.day}, Period {request.period}
                          </div>
                          <div className="text-sm text-slate-400">
                            {request.affectedCourseName} ({request.affectedCourseCode})
                          </div>
                          <div className="text-sm text-slate-400">
                            {request.affectedClassName}
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-slate-300 mb-2">
                        <span className="font-semibold">Current Room:</span> {request.currentRoomName}
                      </div>
                      {request.allocatedRoom && (
                        <div className="text-sm text-green-400 mb-2">
                          <span className="font-semibold">New Room:</span> {request.allocatedRoomName}
                        </div>
                      )}
                      <div className="text-sm text-slate-300 mb-2">
                        <span className="font-semibold">Reason:</span> {request.reason}
                      </div>
                      {request.rejectionReason && (
                        <div className="text-sm text-red-400">
                          <span className="font-semibold">Rejection Reason:</span> {request.rejectionReason}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-2">
                        Requested: {new Date(request.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No room change requests yet</p>
              )}
            </CardContent>
          </Card>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === "notifications" && (
            <Card className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-cyan-100">
                      <Bell className="w-5 h-5 text-cyan-400" />
                      Notifications
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Stay updated with class allocations, leave approvals, and more
                    </CardDescription>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      onClick={markAllNotificationsRead}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark All Read
                    </Button>
                  )}
                </div>
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
                    <p className="text-xs text-slate-600 mt-1">You'll be notified when classes are allocated to you</p>
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
