
import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FacultyForm } from "@/components/Faculty-Form"
import { DataTable } from "@/components/Data-table"
import { Plus, Users, Mail, Clock, Calendar, LayoutDashboard, BookOpen, Home, Bell, Eye, X } from "lucide-react"
import { Link } from "react-router-dom"

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

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [activeNavItem, setActiveNavItem] = useState("faculty")
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [timetables, setTimetables] = useState([])
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { id: "courses", label: "Courses", icon: BookOpen, path: "/courses" },
    { id: "faculty", label: "Faculty", icon: Users, path: "/faculty" },
    { id: "rooms", label: "Rooms", icon: Home, path: "/rooms" },
    {
      id: "timetables",
      label: "Timetables",
      icon: Calendar,
      path: "/timetables",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      path: "/notifications",
    },
  ]

  const fetchFaculty = async () => {
    setLoading(true)
    try {
      const res = await axios.get("http://localhost:5000/api/faculty")
      setFaculty(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
      setFaculty([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTimetables = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/timetables")
      setTimetables(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error("Error fetching timetables:", error)
      setTimetables([])
    }
  }

  const getFacultySchedule = (facultyId) => {
    const schedule = {};
    
    // Initialize empty schedule
    DAYS.forEach(day => {
      schedule[day] = {};
      PERIODS.forEach(period => {
        schedule[day][period] = null;
      });
    });

    // Fill schedule from timetables
    timetables.forEach(timetable => {
      if (timetable.schedule && Array.isArray(timetable.schedule)) {
        timetable.schedule.forEach(entry => {
          if (String(entry.facultyId) === String(facultyId)) {
            schedule[entry.day][entry.period] = {
              ...entry,
              className: timetable.class ? `${typeof timetable.class.name === 'object' ? timetable.class.name?.name || 'Class' : timetable.class.name} - ${typeof timetable.class.section === 'object' ? timetable.class.section?.section || 'N/A' : timetable.class.section}` : 'N/A',
              timetableName: typeof timetable.name === 'object' ? timetable.name?.name || 'Timetable' : timetable.name
            };
          }
        });
      }
    });

    return schedule;
  }

  const getFacultyUtilization = (facultyId) => {
    const schedule = getFacultySchedule(facultyId);
    let allocatedSlots = 0;
    
    DAYS.forEach(day => {
      PERIODS.forEach(period => {
        if (schedule[day][period]) {
          allocatedSlots++;
        }
      });
    });

    const totalSlots = DAYS.length * PERIODS.length;
    return Math.round((allocatedSlots / totalSlots) * 100);
  }

  useEffect(() => {
    fetchFaculty()
    fetchTimetables()
  }, [])

  const handleCreateFaculty = async (data) => {
    setFormLoading(true)
    try {
      if (editingFaculty) {
        await axios.put(`http://localhost:5000/api/faculty/${editingFaculty._id}`, data)
      } else {
        await axios.post("http://localhost:5000/api/faculty", data)
      }
      setShowForm(false)
      setEditingFaculty(null)
      fetchFaculty()
    } catch (error) {
      console.error(error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (facultyMember) => {
    const id = typeof facultyMember === 'object' ? facultyMember._id : facultyMember;
    if (!window.confirm(`Are you sure you want to delete ${facultyMember.name || 'this faculty member'}?`)) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/faculty/${id}`)
      if (editingFaculty && editingFaculty._id === id) {
        setEditingFaculty(null)
        setShowForm(false)
      }
      fetchFaculty()
      alert("Faculty member deleted successfully")
    } catch (error) {
      console.error("Error deleting faculty:", error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to delete faculty member";
      alert(errorMessage);
    }
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (f) => (
        <div className="space-y-1">
          <div className="font-medium text-cyan-100">{f.name}</div>
          <div className="text-sm text-slate-300 flex items-center gap-2">
            <Mail className="h-3 w-3 text-cyan-400" /> {f.email}
          </div>
        </div>
      ),
    },
    {
      key: "departments",
      label: "Departments",
      render: (f) => (
        <div className="flex flex-wrap gap-1">
          {f.departments && Array.isArray(f.departments) ? (
            f.departments.map((dept) => (
              <Badge
                key={dept._id}
                className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-400/30 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300"
              >
                {typeof dept === 'object' && dept?.name ? `${dept.name} (${dept.code})` : dept}
              </Badge>
            ))
          ) : (
            <div className="text-slate-400">N/A</div>
          )}
        </div>
      ),
    },
    {
      key: "courses",
      label: "Courses",
      render: (f) => (
        <div className="flex flex-wrap gap-1">
          {f.courses && Array.isArray(f.courses) && f.courses.length > 0 ? (
            f.courses.slice(0, 3).map((course) => (
              <Badge
                key={typeof course === 'object' ? course._id : course}
                className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-400/30 hover:from-orange-500/30 hover:to-amber-500/30 transition-all duration-300"
              >
                {typeof course === 'object' ? (course?.code || course?.name || 'Course') : course}
              </Badge>
            ))
          ) : (
            <div className="text-slate-400">N/A</div>
          )}
          {f.courses && f.courses.length > 3 && (
            <Badge className="bg-gradient-to-r from-slate-600/20 to-slate-700/20 text-slate-300 border border-slate-500/30 hover:from-slate-600/30 hover:to-slate-700/30 transition-all duration-300">
              +{f.courses.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "designation",
      label: "Designation",
      render: (f) => <div className="text-slate-200">{f.designation || "N/A"}</div>,
    },
    {
      key: "specialization",
      label: "Specialization",
      render: (f) => (
        <div className="flex flex-wrap gap-1">
          {f.specialization?.slice(0, 2).map((s) => (
            <Badge
              key={s}
              className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 border border-emerald-400/30 hover:from-emerald-500/30 hover:to-emerald-600/30 transition-all duration-300"
            >
              {s}
            </Badge>
          ))}
          {f.specialization?.length > 2 && (
            <Badge className="bg-gradient-to-r from-slate-600/20 to-slate-700/20 text-slate-300 border border-slate-500/30 hover:from-slate-600/30 hover:to-slate-700/30 transition-all duration-300">
              +{f.specialization.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "maxHoursPerWeek",
      label: "Max Hours/Week",
      render: (f) => (
        <div className="flex items-center gap-2 text-slate-200">
          <Clock className="h-3 w-3 text-cyan-400" /> {f.maxHoursPerWeek}h
        </div>
      ),
    },
    {
      key: "availability",
      label: "Availability",
      render: (f) => (
        <div className="text-sm text-slate-300">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span>Mon-Sun: 9 AM - 5 PM</span>
          </div>
        </div>
      ),
    },
    {
      key: "preferences",
      label: "Preferences",
      render: (f) => (
        <div className="flex flex-col gap-1 text-sm">
          {f.preferences?.preferredTimeSlots?.length > 0 && (
            <div className="text-slate-300">
              <span className="text-green-300 font-medium">Preferred:</span>{" "}
              {f.preferences.preferredTimeSlots.join(", ")}
            </div>
          )}
          {f.preferences?.avoidTimeSlots?.length > 0 && (
            <div className="text-slate-300">
              <span className="text-red-300 font-medium">Avoid:</span> {f.preferences.avoidTimeSlots.join(", ")}
            </div>
          )}
        </div>
      ),
    },

    {
      key: "schedule",
      label: "Schedule",
      render: (f) => {
        const utilization = getFacultyUtilization(f._id);
        return (
          <div className="flex flex-col gap-2">
            <Badge 
              className={`w-fit ${
                utilization === 0 
                  ? 'bg-red-500/20 text-red-300 border-red-400/30' 
                  : utilization < 40 
                  ? 'bg-green-500/20 text-green-300 border-green-400/30'
                  : utilization < 70
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                  : 'bg-red-500/20 text-red-300 border-red-400/30'
              }`}
            >
              {utilization === 0 ? 'Not Allocated' : `${utilization}% Utilized`}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:border-cyan-300 transition-all duration-300"
              onClick={() => {
                setSelectedFaculty(f);
                setShowScheduleModal(true);
              }}
            >
              <Eye className="h-3 w-3 mr-1" /> View Schedule
            </Button>
          </div>
        );
      },
    },

    {
      key: "actions",
      label: "Actions",
      render: (f) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:border-cyan-300 hover:text-cyan-200 transition-all duration-300 backdrop-blur-sm"
            onClick={() => {
              setEditingFaculty(f)
              setShowForm(true)
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-400/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:border-red-300 hover:text-red-200 transition-all duration-300 backdrop-blur-sm"
            onClick={() => handleDelete(f)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (loading)
    return (
      <div className="p-8 text-center text-slate-300 flex items-center justify-center min-h-screen">
        <div className="space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-xl">Loading faculty...</p>
        </div>
      </div>
    )

  return (
    <div className="p-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent leading-tight">
              Faculty
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
              Manage faculty members and their information. Add, edit, and organize teaching staff.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingFaculty(null)
              setShowForm(!showForm)
            }}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/25 hover:shadow-xl hover:shadow-cyan-600/30 transition-all duration-300 px-6 py-3 flex items-center gap-2 border border-cyan-500/30 backdrop-blur-sm hover:scale-105"
          >
            <Plus className="h-5 w-5" /> Add Faculty
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-cyan-500/10">
            <CardHeader className="border-b border-slate-700/50 p-6">
              <CardTitle className="text-xl font-semibold text-cyan-100">
                {editingFaculty ? "Edit Faculty" : "Add New Faculty"}
              </CardTitle>
              <CardDescription className="text-slate-300">Fill in the faculty details below</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <FacultyForm initialData={editingFaculty} onSubmit={handleCreateFaculty} loading={formLoading} />
            </CardContent>
          </Card>
        )}

        {/* Faculty List */}
        <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-cyan-500/10">
          <CardHeader className="border-b border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-cyan-100">
                  <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-400/30 backdrop-blur-sm">
                    <Users className="h-5 w-5 text-cyan-300" />
                  </div>
                  All Faculty
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {faculty.length} faculty members registered
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <DataTable data={faculty} columns={columns} searchKey="name" loading={loading} />
            </div>
          </CardContent>
        </Card>

        {/* Schedule Modal */}
        {showScheduleModal && selectedFaculty && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
              <CardHeader className="border-b border-slate-700/50 sticky top-0 bg-slate-800/95 backdrop-blur-xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-cyan-100 flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-cyan-400" />
                      {selectedFaculty.name}'s Schedule
                    </CardTitle>
                    <CardDescription className="text-slate-300 mt-2">
                      Weekly teaching schedule for {selectedFaculty.email}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowScheduleModal(false);
                      setSelectedFaculty(null);
                    }}
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="mt-4">
                  <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-400/30 text-lg px-4 py-2">
                    Utilization: {getFacultyUtilization(selectedFaculty._id)}% ({
                      Object.values(getFacultySchedule(selectedFaculty._id))
                        .flatMap(day => Object.values(day))
                        .filter(slot => slot !== null).length
                    }/40 slots)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {getFacultyUtilization(selectedFaculty._id) === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-xl text-slate-400 font-semibold">Not Allocated</p>
                    <p className="text-slate-500 mt-2">This faculty member has no classes assigned yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-900/50">
                          <th className="border border-slate-700 p-3 text-left text-cyan-300 font-semibold w-32">
                            Period / Day
                          </th>
                          {DAYS.map(day => (
                            <th key={day} className="border border-slate-700 p-3 text-center text-cyan-300 font-semibold">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERIODS.map(period => {
                          const timeSlot = TIME_SLOTS.find(t => t.period === period);
                          const schedule = getFacultySchedule(selectedFaculty._id);
                          
                          return (
                            <tr key={period} className="hover:bg-slate-900/30 transition-colors">
                              <td className="border border-slate-700 p-3 bg-slate-900/30">
                                <div className="font-semibold text-cyan-300">Period {period}</div>
                                <div className="text-xs text-slate-400">
                                  {timeSlot?.start} - {timeSlot?.end}
                                </div>
                              </td>
                              {DAYS.map(day => {
                                const slot = schedule[day][period];
                                return (
                                  <td key={`${day}-${period}`} className="border border-slate-700 p-3">
                                    {slot ? (
                                      <div className="space-y-1">
                                        <div className="font-semibold text-sm text-orange-300">
                                          {slot.courseCode}
                                        </div>
                                        <div className="text-xs text-slate-300">
                                          {slot.courseName}
                                        </div>
                                        <div className="text-xs text-cyan-400">
                                          {slot.className}
                                        </div>
                                        {slot.roomName && (
                                          <div className="text-xs text-slate-400">
                                            Room: {slot.roomName}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-center text-slate-600 text-sm">Free</div>
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
                )}
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  )
}
