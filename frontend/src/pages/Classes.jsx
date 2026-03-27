import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/Data-table";
import ClassForm from "@/components/Class-Form";
import { Plus, Users, LayoutDashboard, GraduationCap, BookOpen, Home, Calendar, Bell, Building2, Clock } from "lucide-react";

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [activeNavItem, setActiveNavItem] = useState("classes");
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "departments", label: "Departments", icon: Building2, path: "/departments" },
    { id: "classes", label: "Classes", icon: Users, path: "/classes" },
    { id: "courses", label: "Courses", icon: BookOpen, path: "/courses" },
    { id: "faculty", label: "Faculty", icon: GraduationCap, path: "/faculty" },
    { id: "rooms", label: "Rooms", icon: Home, path: "/rooms" },
    { id: "timetable", label: "Timetable", icon: Calendar, path: "/timetable" },
    { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications" },
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/classes");
      setClasses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setLoading(false);
    }
  };

  const handleAddClass = async (data) => {
    try {
      await axios.post("http://localhost:5000/api/classes", data);
      fetchClasses();
      setShowForm(false);
    } catch (error) {
      console.error("Error adding class:", error);
      alert("Failed to add class");
    }
  };

  const handleEditClass = async (data) => {
    try {
      await axios.put(`http://localhost:5000/api/classes/${editingClass._id}`, data);
      fetchClasses();
      setEditingClass(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error updating class:", error);
      alert("Failed to update class");
    }
  };

  const handleDeleteClass = async (classItem) => {
    const id = typeof classItem === 'object' ? classItem._id : classItem;
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await axios.delete(`http://localhost:5000/api/classes/${id}`);
        fetchClasses();
        alert("Class deleted successfully");
      } catch (error) {
        console.error("Error deleting class:", error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to delete class";
        alert(errorMessage);
      }
    }
  };

  const columns = [
    { header: "Name", accessor: "name" },
    { 
      header: "Department", 
      accessor: (row) => row.department?.name || "N/A"
    },
    { 
      header: "Year", 
      accessor: (row) => `Year ${row.year}`
    },
    { header: "Section", accessor: "section" },
    { 
      header: "Semester", 
      accessor: (row) => `Sem ${row.semester}`
    },
    { header: "Students", accessor: "numberOfStudents" },
    {
      header: "Timetable",
      accessor: (row) => {
        const hasTimetable = row.timetableStatus;
        return hasTimetable ? (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Generated
          </Badge>
        ) : (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
            Not Created
          </Badge>
        );
      }
    },
  ];

  const handleEdit = (classData) => {
    setEditingClass(classData);
    setShowForm(true);
  };

  const handleViewDetails = async (classData) => {
    try {
      // Fetch timetable for this class
      const timetableResponse = await axios.get(`http://localhost:5000/api/timetables`);
      const classTimetable = timetableResponse.data.find(t => t.class?._id === classData._id);
      
      setSelectedClass({
        ...classData,
        timetable: classTimetable || null
      });
      setShowDetails(true);
    } catch (error) {
      console.error("Error fetching class details:", error);
      setSelectedClass(classData);
      setShowDetails(true);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="h-12 bg-slate-700/50 animate-pulse rounded-xl w-80" />
        <div className="h-96 bg-slate-800/50 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent leading-tight">
                Classes
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
                Manage class sections and student enrollment.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingClass(null);
                setShowForm(!showForm);
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 px-6 py-3 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Class
            </Button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <ClassForm
                initialData={editingClass}
                onSubmit={editingClass ? handleEditClass : handleAddClass}
                onCancel={() => {
                  setShowForm(false);
                  setEditingClass(null);
                }}
              />
            </div>
          )}

          {/* Classes Table */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <DataTable
              data={classes}
              columns={columns}
              onEdit={handleEdit}
              onDelete={handleDeleteClass}
              onView={handleViewDetails}
            />
          </div>

          {/* Class Details Modal */}
          {showDetails && selectedClass && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader className="border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl text-cyan-100 flex items-center gap-2">
                        <Users className="w-6 h-6 text-cyan-400" />
                        {selectedClass.name}
                      </CardTitle>
                      <CardDescription className="text-slate-300 mt-2">
                        {selectedClass.department?.name} - Year {selectedClass.year}, Sem {selectedClass.semester}, Section {selectedClass.section}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setShowDetails(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Class Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                      <p className="text-sm text-slate-400 mb-1">Total Students</p>
                      <p className="text-2xl font-bold text-cyan-300">{selectedClass.numberOfStudents}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                      <p className="text-sm text-slate-400 mb-1">Timetable Status</p>
                      {selectedClass.timetableStatus ? (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          <Clock className="w-4 h-4 mr-1" />
                          {selectedClass.timetableStatus === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                          Not Generated
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Timetable Info */}
                  {selectedClass.timetable && (
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-4 rounded-xl border border-cyan-500/20">
                      <h3 className="text-lg font-semibold text-cyan-100 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Timetable Details
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-400">Name:</p>
                          <p className="text-white font-medium">{selectedClass.timetable.name}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Total Classes:</p>
                          <p className="text-white font-medium">{selectedClass.timetable.schedule?.length || 0} periods</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Status:</p>
                          <Badge className={selectedClass.timetable.status === 'published' 
                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          }>
                            {selectedClass.timetable.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-slate-400">Conflicts:</p>
                          <p className="text-white font-medium">{selectedClass.timetable.metadata?.conflictCount || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Students List */}
                  {selectedClass.students && selectedClass.students.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-cyan-100 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Enrolled Students ({selectedClass.students.length})
                      </h3>
                      <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full">
                            <thead className="bg-slate-800/50 sticky top-0">
                              <tr>
                                <th className="text-left p-3 text-sm text-slate-400 font-medium">Roll Number</th>
                                <th className="text-left p-3 text-sm text-slate-400 font-medium">Name</th>
                                <th className="text-left p-3 text-sm text-slate-400 font-medium">Email</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedClass.students.map((student, index) => (
                                <tr key={index} className="border-t border-slate-700/30 hover:bg-slate-800/30">
                                  <td className="p-3 text-sm text-cyan-300 font-mono">{student.rollNumber}</td>
                                  <td className="p-3 text-sm text-slate-200">{student.name}</td>
                                  <td className="p-3 text-sm text-slate-400">{student.email}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-700/50">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetails(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Close
                    </Button>
                    {selectedClass.timetableStatus && (
                      <Button
                        onClick={() => window.location.href = '/timetable'}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        View Timetable
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
    </div>
  );
};

export default ClassesPage;
