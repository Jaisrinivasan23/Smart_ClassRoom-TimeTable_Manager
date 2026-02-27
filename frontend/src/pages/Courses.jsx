

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CourseForm } from "@/components/CourseForm"
import { DataTable } from "@/components/Data-table"
import { Plus, BookOpen, Users, Calendar, LayoutDashboard, Home, Bell } from "lucide-react"
import { Link } from "react-router-dom"

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [activeNavItem, setActiveNavItem] = useState("courses")
  const [editingCourse, setEditingCourse] = useState(null)

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

  // Fetch courses from backend
  const fetchCourses = async () => {
    try {
      setLoading(true)
      const res = await axios.get("http://localhost:5000/api/courses/")
      setCourses(res.data)
    } catch (err) {
      console.error("Failed to fetch courses:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  // Create a new course
  const handleCreateCourse = async (courseData) => {
    try {
      setFormLoading(true)
      await axios.post("http://localhost:5000/api/courses/", courseData)
      setShowForm(false)
      setEditingCourse(null)
      fetchCourses()
    } catch (error) {
      console.error("Failed to create course:", error)
    } finally {
      setFormLoading(false)
    }
  }

  // Update a course
  const handleUpdateCourse = async (id, courseData) => {
    try {
      setFormLoading(true)
      await axios.put(`http://localhost:5000/api/courses/${id}`, courseData)
      setEditingCourse(null)
      setShowForm(false)
      fetchCourses()
    } catch (error) {
      console.error("Failed to update course:", error)
    } finally {
      setFormLoading(false)
    }
  }

  // Delete a course
  const handleDeleteCourse = async (course) => {
    const id = typeof course === 'object' ? course._id : course;
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/courses/${id}`)
      // if deleting the currently editing course, clear form
      if (editingCourse && editingCourse._id === id) {
        setEditingCourse(null)
        setShowForm(false)
      }
      fetchCourses()
      alert("Course deleted successfully")
    } catch (error) {
      console.error("Failed to delete course:", error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to delete course";
      alert(errorMessage);
    }
  }

  // DataTable columns (note: key for semester is "semester")
  const columns = [
    {
      key: "code",
      label: "Course Code",
      sortable: true,
      render: (course) => (
        <div className="font-mono font-semibold text-cyan-100 bg-slate-800/50 px-3 py-1 rounded-lg border border-cyan-500/20">
          {typeof course.code === 'object' ? course.code?.code || course.code?.name || 'N/A' : course.code}
        </div>
      ),
    },
    {
      key: "name",
      label: "Course Name",
      sortable: true,
      render: (course) => <div className="font-medium text-slate-100">{typeof course.name === 'object' ? course.name?.name || 'Course' : course.name}</div>,
    },
    {
      key: "departments",
      label: "Departments",
      sortable: true,
      render: (course) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(course.departments) && course.departments.length > 0 ? (
            course.departments.map((dept) => (
              <Badge
                key={typeof dept === 'object' ? dept._id : dept}
                className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border border-purple-400/30 hover:from-purple-500/30 hover:to-violet-500/30 transition-all duration-300"
              >
                {typeof dept === 'object' && dept?.name 
                  ? `${dept.name} (${dept.code})` 
                  : dept}
              </Badge>
            ))
          ) : (
            <div className="text-slate-400">N/A</div>
          )}
        </div>
      ),
    },
    {
      key: "credits",
      label: "Credits",
      render: (course) => (
        <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 backdrop-blur-sm">
          {typeof course.credits === 'object' ? course.credits?.credits || 'N/A' : course.credits}
        </Badge>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (course) => (
        <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30 hover:from-emerald-500/30 hover:to-teal-500/30 backdrop-blur-sm">
          {typeof course.type === 'object' ? course.type?.type || course.type?.name || 'N/A' : course.type}
        </Badge>
      ),
    },
    {
      key: "hoursPerWeek",
      label: "Hours per Week",
      render: (course) => (
        <Badge className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30 hover:from-violet-500/30 hover:to-purple-500/30 backdrop-blur-sm">
          {typeof course.hoursPerWeek === 'object' ? course.hoursPerWeek?.hoursPerWeek || 'N/A' : course.hoursPerWeek}
        </Badge>
      ),
    },
    {
      key: "semester",
      label: "Semester",
      render: (course) => (
        <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 backdrop-blur-sm">
          Sem {typeof course.semester === 'object' ? course.semester?.semester || 'N/A' : course.semester}
        </Badge>
      ),
    },
    {
      key: "year",
      label: "Year",
      render: (course) => (
        <Badge className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30 hover:from-pink-500/30 hover:to-rose-500/30 backdrop-blur-sm">
          {typeof course.year === 'object' ? course.year?.year || 'N/A' : course.year}
        </Badge>
      ),
    },
    {
      key: "prerequisites",
      label: "Prerequisites",
      render: (course) => (
        <div className="flex flex-wrap gap-1 max-w-32">
          {course.prerequisites?.length > 0 ? (
            course.prerequisites.map((prereq, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs bg-slate-800/30 text-slate-300 border-slate-600/50 backdrop-blur-sm"
              >
                {prereq}
              </Badge>
            ))
          ) : (
            <span className="text-slate-500 text-sm">None</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (course) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-500/30 bg-slate-800/50 hover:bg-cyan-500/10 text-cyan-300 hover:border-cyan-400/50 hover:text-cyan-200 transition-all duration-300 backdrop-blur-sm"
            onClick={() => {
              setEditingCourse(course)
              setShowForm(true)
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/30 bg-slate-800/50 hover:bg-red-500/10 text-red-400 hover:border-red-400/50 hover:text-red-300 transition-all duration-300 backdrop-blur-sm"
            onClick={() => handleDeleteCourse(course._id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="h-12 bg-slate-700/50 animate-pulse rounded-xl w-80" />
        <div className="h-6 bg-slate-700/30 animate-pulse rounded-lg w-96" />
        <div className="h-96 bg-slate-800/50 animate-pulse rounded-2xl shadow-sm backdrop-blur-sm" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent leading-tight">
                Courses
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
                Manage academic courses and their details. Add, edit, and organize course information efficiently.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingCourse(null)
                setShowForm(!showForm)
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 px-6 py-3 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Course
            </Button>
          </div>

          {/* Add/Edit Course Form */}
          {showForm && (
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-cyan-500/5">
              <CardHeader className="border-b border-slate-700/50 p-6">
                <CardTitle className="text-xl font-semibold text-slate-100">
                  {editingCourse ? "Edit Course" : "Add New Course"}
                </CardTitle>
                <CardDescription className="text-slate-400">Fill in the course details below</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <CourseForm
                  initialData={editingCourse}
                  onSubmit={(data) => {
                    if (editingCourse) {
                      handleUpdateCourse(editingCourse._id, data)
                    } else {
                      handleCreateCourse(data)
                    }
                  }}
                  loading={formLoading}
                />
              </CardContent>
            </Card>
          )}

          {/* Courses List */}
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-cyan-500/5">
            <CardHeader className="border-b border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-100">
                    <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/20 backdrop-blur-sm">
                      <BookOpen className="h-5 w-5 text-cyan-300" />
                    </div>
                    All Courses
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {courses.length} courses registered in the system
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-slate-900/30 rounded-xl border border-slate-700/30 overflow-hidden backdrop-blur-sm">
                <DataTable data={courses} columns={columns} searchKey="name" loading={loading} />
              </div>
            </CardContent>
          </Card>
    </div>
  )
}
