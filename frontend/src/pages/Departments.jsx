import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/Data-table";
import DepartmentForm from "@/components/Department-Form";
import { Plus, Building2, LayoutDashboard, GraduationCap, BookOpen, Users, Home, Calendar, Bell } from "lucide-react";
import { Link } from "react-router-dom";

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [activeNavItem, setActiveNavItem] = useState("departments");

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { id: "departments", label: "Departments", icon: Building2, path: "/departments" },
    { id: "classes", label: "Classes", icon: GraduationCap, path: "/classes" },
    { id: "courses", label: "Courses", icon: BookOpen, path: "/courses" },
    { id: "faculty", label: "Faculty", icon: Users, path: "/faculty" },
    { id: "rooms", label: "Rooms", icon: Home, path: "/rooms" },
    { id: "timetables", label: "Timetables", icon: Calendar, path: "/timetables" },
    { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications" },
  ];

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/departments");
      setDepartments(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setLoading(false);
    }
  };

  const handleAddDepartment = async (data) => {
    try {
      await axios.post("http://localhost:5000/api/departments", data);
      fetchDepartments();
      setShowForm(false);
    } catch (error) {
      console.error("Error adding department:", error);
      alert("Failed to add department");
    }
  };

  const handleEditDepartment = async (data) => {
    try {
      await axios.put(`http://localhost:5000/api/departments/${editingDepartment._id}`, data);
      fetchDepartments();
      setEditingDepartment(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error updating department:", error);
      alert("Failed to update department");
    }
  };

  const handleDeleteDepartment = async (department) => {
    const id = typeof department === 'object' ? department._id : department;
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/${id}`);
        fetchDepartments();
        alert("Department deleted successfully");
      } catch (error) {
        console.error("Error deleting department:", error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to delete department";
        alert(errorMessage);
      }
    }
  };

  const columns = [
    { header: "Code", accessor: "code" },
    { header: "Name", accessor: "name" },
    { header: "Head of Department", accessor: "headOfDepartment" },
    { header: "Description", accessor: "description" },
  ];

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setShowForm(true);
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
    <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent leading-tight">
                Departments
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
                Manage academic departments and their details.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingDepartment(null);
                setShowForm(!showForm);
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 px-6 py-3 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Department
            </Button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <DepartmentForm
                initialData={editingDepartment}
                onSubmit={editingDepartment ? handleEditDepartment : handleAddDepartment}
                onCancel={() => {
                  setShowForm(false);
                  setEditingDepartment(null);
                }}
              />
            </div>
          )}

          {/* Departments Table */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <DataTable
              data={departments}
              columns={columns}
              onEdit={handleEdit}
              onDelete={handleDeleteDepartment}
            />
          </div>
    </div>
  );
};

export default DepartmentsPage;
