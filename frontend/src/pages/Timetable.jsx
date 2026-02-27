import React, { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Trash2,
  Sparkles,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Calendar as CalendarIconLucide,
  BookOpen,
  Users as UsersIcon,
  Home as HomeIcon,
  Bell,
  GraduationCap,
  Search,
} from "lucide-react"

// Axios configuration
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const TIME_SLOTS = [
  { period: 1, time: "09:00-10:00" },
  { period: 2, time: "10:00-11:00" },
  { period: 3, time: "11:00-12:00" },
  { period: 4, time: "12:00-13:00" },
  { period: 5, time: "14:00-15:00" },
  { period: 6, time: "15:00-16:00" },
  { period: 7, time: "16:00-17:00" },
  { period: 8, time: "17:00-18:00" },
]

function ClassTimetableTable({ timetable }) {
  const getEntry = (day, period) => {
    if (!timetable || !timetable.schedule) return null
    return timetable.schedule.find((e) => e.day === day && e.period === period) || null
  }

  const typeColor = (t) => {
    switch (t) {
      case "lecture":
        return "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-200 border border-cyan-500/30"
      case "lab":
        return "bg-gradient-to-br from-emerald-500/20 to-green-600/20 text-emerald-200 border border-emerald-500/30"
      case "tutorial":
        return "bg-gradient-to-br from-purple-500/20 to-violet-600/20 text-purple-200 border border-purple-500/30"
      default:
        return "bg-gradient-to-br from-slate-600/20 to-gray-700/20 text-slate-200 border border-slate-500/30"
    }
  }

  return (
    <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-cyan-500/10">
      <CardHeader className="border-b border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-cyan-100">{timetable.name}</CardTitle>
            <div className="text-sm text-slate-400 mt-1">
              8 Periods × 5 Days Schedule
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Badge
              className={
                timetable.status === "published"
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0"
                  : "bg-slate-700/50 text-slate-300 border border-slate-600/50"
              }
            >
              {timetable.status}
            </Badge>
            <Badge className="bg-slate-700/50 text-slate-300 border border-slate-600/50">
              {timetable.metadata?.utilizationRate || 0}% utilized
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 md:p-4 lg:p-6">
        <div className="overflow-x-auto -mx-2 md:mx-0">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-700/30 backdrop-blur-sm">
                <th className="border border-slate-600/50 p-2 md:p-3 text-cyan-200 font-semibold text-xs md:text-sm">Period / Day</th>
                {DAYS.map((day) => (
                  <th key={day} className="border border-slate-600/50 p-2 md:p-3 text-cyan-200 font-semibold text-xs md:text-sm">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot.period} className="hover:bg-slate-700/20 transition-colors">
                  <td className="border border-slate-600/50 p-2 md:p-3 bg-slate-800/40 text-slate-300 font-medium">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 md:h-4 md:w-4 text-cyan-400" />
                        <span className="text-xs md:text-sm font-bold">P{slot.period}</span>
                      </div>
                      <span className="text-xs text-slate-400">{slot.time}</span>
                    </div>
                  </td>
                  {DAYS.map((day) => {
                    const entry = getEntry(day, slot.period)
                    
                    if (!entry) {
                      return (
                        <td key={`${day}-${slot.period}`} className="border border-slate-600/50 p-1 md:p-2">
                          <div className="h-16 md:h-20 bg-slate-800/20 rounded border-2 border-dashed border-slate-700/50" />
                        </td>
                      )
                    }

                    return (
                      <td key={`${day}-${slot.period}`} className="border border-slate-600/50 p-1 md:p-2">
                        <div className={`p-2 md:p-3 rounded-lg h-full ${typeColor(entry.courseName?.toLowerCase().includes('lab') ? 'lab' : 'lecture')}`}>
                          <div className="font-bold text-xs md:text-sm mb-1 md:mb-2">
                            {entry.courseCode || 'N/A'}
                          </div>
                          <div className="text-[10px] md:text-xs space-y-0.5 md:space-y-1">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                              <span className="font-medium truncate">{entry.courseName || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                              <span className="truncate">{entry.facultyName || 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                              <span className="truncate">{entry.roomName || 'TBD'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lunch Break Info */}
        <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-orange-300 text-sm">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Lunch Break: 13:00 - 14:00 (Between Period 4 & 5)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TimetablePage() {
  const [timetables, setTimetables] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedTimetable, setSelectedTimetable] = useState(null)
  const [departments, setDepartments] = useState([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState("")
  
  const [form, setForm] = useState({
    departmentId: "",
    semester: "5",
    academicYear: new Date().getFullYear(),
    constraints: "",
    specialActivities: "",
  })

  // Available Faculty Search
  const [availableFacultyForm, setAvailableFacultyForm] = useState({
    departmentId: "",
    semester: "5",
    day: "Monday",
    period: "1",
  })
  const [availableFaculty, setAvailableFaculty] = useState([])
  const [searchingFaculty, setSearchingFaculty] = useState(false)

  useEffect(() => {
    fetchDepartments()
    fetchClasses()
  }, [])

  async function fetchDepartments() {
    try {
      const response = await api.get("/departments")
      setDepartments(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error("Error fetching departments:", err)
    }
  }

  async function fetchClasses() {
    try {
      const response = await api.get("/classes")
      setClasses(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error("Error fetching classes:", err)
    }
  }

  async function fetchTimetablesByDepartmentSemester(departmentId, semester) {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/timetables/by-department-semester/${departmentId}/${semester}`)
      setTimetables(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error("Error fetching timetables:", err)
      setError("Failed to load timetables")
      setTimetables([])
    } finally {
      setLoading(false)
    }
  }

  async function generateClassTimetables(e) {
    e.preventDefault()
    
    if (!form.departmentId || !form.semester) {
      setError("Please select department and semester")
      return
    }

    setGenerating(true)
    setError(null)
    setGenerationProgress(0)
    setGenerationStatus("Initializing timetable generation...")
    
    try {
      const payload = {
        departmentId: form.departmentId,
        semester: Number(form.semester),
        academicYear: Number(form.academicYear),
        constraints: form.constraints || "",
        specialActivities: form.specialActivities || "",
      }
      
      console.log("Generating timetables with payload:", payload)
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev
          return prev + 10
        })
      }, 500)
      
      // Update status messages
      setTimeout(() => setGenerationStatus("Fetching classes and courses..."), 500)
      setTimeout(() => setGenerationStatus("Analyzing faculty availability..."), 1500)
      setTimeout(() => setGenerationStatus("Allocating rooms and periods..."), 2500)
      setTimeout(() => setGenerationStatus("Optimizing schedule conflicts..."), 3500)
      setTimeout(() => setGenerationStatus("Finalizing timetables..."), 4500)
      
      const response = await api.post("/timetables/generate-by-class", payload)
      
      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGenerationStatus("Timetables generated successfully!")
      
      setTimeout(() => {
        alert(`Successfully generated ${response.data.length} timetables!`)
        // Reload timetables for this department/semester
        fetchTimetablesByDepartmentSemester(form.departmentId, form.semester)
        setError(null)
        setGenerating(false)
        setGenerationProgress(0)
        setGenerationStatus("")
      }, 1000)
      
    } catch (err) {
      console.error("Error generating timetables:", err)
      const errorMessage = err.response?.data?.error || err.message || "Unknown error"
      setError(`Failed to generate timetables: ${errorMessage}`)
      alert(`Error: ${errorMessage}`)
      setGenerating(false)
      setGenerationProgress(0)
      setGenerationStatus("")
    }
  }

  async function viewClassTimetable(classId) {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/timetables/by-class/${classId}`)
      if (response.data && response.data.length > 0) {
        setSelectedTimetable(response.data[0])
        setSelectedClass(classId)
      } else {
        setError("No timetable found for this class")
        setSelectedTimetable(null)
      }
    } catch (err) {
      console.error("Error fetching class timetable:", err)
      setError("Failed to load class timetable")
    } finally {
      setLoading(false)
    }
  }

  async function searchAvailableFaculty(e) {
    e.preventDefault()
    
    if (!availableFacultyForm.departmentId || !availableFacultyForm.semester || !availableFacultyForm.day || !availableFacultyForm.period) {
      setError("Please fill all fields for faculty search")
      return
    }

    setSearchingFaculty(true)
    setError(null)
    
    try {
      const response = await api.post("/timetables/available-faculty", {
        departmentId: availableFacultyForm.departmentId,
        semester: availableFacultyForm.semester,
        day: availableFacultyForm.day,
        period: Number(availableFacultyForm.period),
      })
      
      setAvailableFaculty(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error("Error searching faculty:", err)
      setError("Failed to search available faculty")
      setAvailableFaculty([])
    } finally {
      setSearchingFaculty(false)
    }
  }

  async function deleteTimetable(timetableId) {
    if (!confirm("Delete this timetable? This cannot be undone.")) return
    
    try {
      await api.delete(`/timetables/${timetableId}`)
      alert("Timetable deleted successfully")
      
      // Reload timetables
      if (form.departmentId && form.semester) {
        await fetchTimetablesByDepartmentSemester(form.departmentId, form.semester)
      }
      
      if (selectedTimetable && selectedTimetable._id === timetableId) {
        setSelectedTimetable(null)
        setSelectedClass(null)
      }
    } catch (err) {
      console.error("Error deleting timetable:", err)
      setError("Failed to delete timetable")
    }
  }

  // Load timetables when department/semester changes
  useEffect(() => {
    if (form.departmentId && form.semester) {
      fetchTimetablesByDepartmentSemester(form.departmentId, form.semester)
    }
  }, [form.departmentId, form.semester])

  const filteredClasses = classes.filter(c => 
    c.department?._id === form.departmentId && c.semester === Number(form.semester)
  )

  // If a timetable is selected, show full-page view
  if (selectedTimetable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
        <div className="max-w-full mx-auto space-y-4">
          {/* Back Button */}
          <Button
            onClick={() => {
              setSelectedTimetable(null)
              setSelectedClass(null)
            }}
            className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/50"
          >
            ← Back to List
          </Button>

          {/* Full-Width Timetable */}
          <ClassTimetableTable timetable={selectedTimetable} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
            Class Timetable Management
          </h1>
          <p className="text-cyan-200 text-lg">
            Generate and manage class-based timetables with AI (8 Periods × 5 Days)
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-300 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Generation & Search */}
          <div className="lg:col-span-1 space-y-6">
            {/* Generation Form */}
            <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-cyan-500/10">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-cyan-300" />
                  Generate Timetables
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={generateClassTimetables} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-200 mb-2">Department</label>
                    <Select 
                      value={form.departmentId} 
                      onValueChange={(value) => setForm({ ...form, departmentId: value })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-200">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800/90 backdrop-blur-xl border-slate-600/50 text-slate-200">
                        {departments.map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {typeof dept.name === 'object' ? dept.name?.name || 'Department' : dept.name} ({typeof dept.code === 'object' ? dept.code?.code || 'N/A' : dept.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyan-200 mb-2">Semester</label>
                    <Select 
                      value={form.semester} 
                      onValueChange={(value) => setForm({ ...form, semester: value })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-200">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800/90 backdrop-blur-xl border-slate-600/50 text-slate-200">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()}>
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyan-200 mb-2">Academic Year</label>
                    <Input
                      type="number"
                      value={form.academicYear}
                      onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                      min="2020"
                      max="2030"
                      className="bg-slate-800/50 border-slate-600/50 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyan-200 mb-2">
                      Special Activities (Optional)
                    </label>
                    <Textarea
                      value={form.specialActivities}
                      onChange={(e) => setForm({ ...form, specialActivities: e.target.value })}
                      placeholder="e.g., Library period on Monday P6, Sports on Wednesday P7-P8, Mentor period on Friday P3"
                      rows={2}
                      className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder-slate-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Specify periods for library, sports, mentor sessions, etc.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyan-200 mb-2">
                      Constraints & Preferences (Optional)
                    </label>
                    <Textarea
                      value={form.constraints}
                      onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                      placeholder="e.g., No lectures after 4 PM, Lab sessions in morning only, Avoid back-to-back theory classes"
                      rows={2}
                      className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder-slate-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Add any scheduling constraints or preferences
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                    disabled={generating}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? "Generating..." : "Generate for All Classes"}
                  </Button>

                  {/* Progress Bar */}
                  {generating && (
                    <div className="mt-4 space-y-3 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-cyan-300 font-medium">{generationStatus}</span>
                        <span className="text-cyan-400 font-bold">{generationProgress}%</span>
                      </div>
                      <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${generationProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-cyan-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-400 border-t-transparent"></div>
                        <span>Please wait while we generate optimized timetables...</span>
                      </div>
                    </div>
                  )}

                  {form.departmentId && form.semester && filteredClasses.length > 0 && !generating && (
                    <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <div className="text-sm text-cyan-300">
                        Will generate timetables for <span className="font-bold">{filteredClasses.length}</span> classes
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Available Staff Search */}
            <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-purple-500/10">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Search className="h-5 w-5 text-purple-300" />
                  Available Staff Search
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={searchAvailableFaculty} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Department</label>
                    <Select 
                      value={availableFacultyForm.departmentId} 
                      onValueChange={(value) => setAvailableFacultyForm({ ...availableFacultyForm, departmentId: value })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-200">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800/90 backdrop-blur-xl border-slate-600/50 text-slate-200">
                        {departments.map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Semester</label>
                    <Select 
                      value={availableFacultyForm.semester} 
                      onValueChange={(value) => setAvailableFacultyForm({ ...availableFacultyForm, semester: value })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800/90 backdrop-blur-xl border-slate-600/50 text-slate-200">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()}>
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Day</label>
                    <Select 
                      value={availableFacultyForm.day} 
                      onValueChange={(value) => setAvailableFacultyForm({ ...availableFacultyForm, day: value })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800/90 backdrop-blur-xl border-slate-600/50 text-slate-200">
                        {DAYS.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Period</label>
                    <Select 
                      value={availableFacultyForm.period} 
                      onValueChange={(value) => setAvailableFacultyForm({ ...availableFacultyForm, period: value })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800/90 backdrop-blur-xl border-slate-600/50 text-slate-200">
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={slot.period} value={slot.period.toString()}>
                            Period {slot.period} ({slot.time})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                    disabled={searchingFaculty}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {searchingFaculty ? "Searching..." : "Find Available Staff"}
                  </Button>
                </form>

                {availableFaculty.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-semibold text-purple-200 mb-2">
                      Available Faculty ({availableFaculty.length}):
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableFaculty.map((faculty) => (
                        <div 
                          key={faculty._id} 
                          className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg"
                        >
                          <div className="font-medium text-purple-200">{typeof faculty.name === 'object' ? faculty.name?.name || 'Faculty' : faculty.name}</div>
                          <div className="text-xs text-purple-300 mt-1">{typeof faculty.email === 'object' ? faculty.email?.email || '' : faculty.email}</div>
                          {faculty.specialization && faculty.specialization.length > 0 && (
                            <div className="text-xs text-purple-400 mt-1">
                              {faculty.specialization.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {availableFaculty.length === 0 && !searchingFaculty && availableFacultyForm.departmentId && (
                  <div className="mt-4 text-center text-slate-400 text-sm">
                    No search performed yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Class List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-cyan-100">
                  Classes & Timetables ({timetables.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-cyan-200">Loading...</p>
                  </div>
                ) : timetables.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No timetables found. Generate timetables to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[800px] overflow-y-auto">
                    {timetables.map((tt) => (
                      <div
                        key={tt._id}
                        className="p-4 rounded-xl border transition-all cursor-pointer bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/40 hover:border-cyan-500/30"
                        onClick={() => {
                          setSelectedTimetable(tt)
                          setSelectedClass(tt.class?._id)
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-semibold text-white">
                              {tt.class ? `${typeof tt.class.name === 'object' ? tt.class.name?.name || 'Class' : tt.class.name} - ${typeof tt.class.section === 'object' ? tt.class.section?.section || 'N/A' : tt.class.section}` : (typeof tt.name === 'object' ? tt.name?.name || 'Timetable' : tt.name)}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                              {typeof tt.department?.name === 'object' ? tt.department?.name?.name || 'Department' : tt.department?.name} • Semester {typeof tt.semester === 'object' ? tt.semester?.semester || 'N/A' : tt.semester}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-slate-700/50 text-slate-300 border border-slate-600/50 text-xs">
                                {tt.metadata?.totalHours || 0} classes
                              </Badge>
                              <Badge
                                className={
                                  tt.status === "published"
                                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 text-xs"
                                    : "bg-slate-700/50 text-slate-300 border border-slate-600/50 text-xs"
                                }
                              >
                                {tt.status}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteTimetable(tt._id)
                            }}
                            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full-Screen Loading Modal */}
        {generating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <Card className="bg-slate-900/95 backdrop-blur-xl border-cyan-500/30 shadow-2xl shadow-cyan-500/20 max-w-md w-full mx-4">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  {/* Animated Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping">
                      <Sparkles className="h-16 w-16 text-cyan-400/50 mx-auto" />
                    </div>
                    <Sparkles className="h-16 w-16 text-cyan-400 mx-auto relative" />
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Generating Timetables</h3>
                    <p className="text-slate-400 text-sm">
                      AI is creating optimized schedules for your classes
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cyan-300 font-medium">{generationStatus}</span>
                      <span className="text-cyan-400 font-bold">{generationProgress}%</span>
                    </div>
                    <div className="relative h-4 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out shadow-lg shadow-cyan-500/50"
                        style={{ width: `${generationProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>

                  {/* Status Messages */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <CalendarIconLucide className="h-5 w-5 text-cyan-400 mx-auto mb-1" />
                      <div className="text-slate-400">Scheduling</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <User className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                      <div className="text-slate-400">Faculty Allocation</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <HomeIcon className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                      <div className="text-slate-400">Room Assignment</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <BookOpen className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                      <div className="text-slate-400">Course Mapping</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 italic">
                    This may take a few moments. Please don't close this window.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
