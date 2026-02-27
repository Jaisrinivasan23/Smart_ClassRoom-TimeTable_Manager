import { useState, useEffect } from "react"
import Dashboard from "./pages/Dashboard"
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import CoursesPage from "./pages/Courses"
import FacultyPage from "./pages/Faculty"
import RoomPage from "./pages/Rooms"
import TimetablePage from "./pages/Timetable"
import NotificationsPage from "./pages/Notifications"
import DepartmentsPage from "./pages/Departments"
import ClassesPage from "./pages/Classes"
import Login from "./pages/Login"
import AdminLogin from "./pages/AdminLogin"
import FacultyHome from "./pages/FacultyHome"
import StudentHome from "./pages/StudentHome"
import FacultyLogin from "./pages/FacultyLogin"
import FacultyDashboard from "./pages/FacultyDashboard"
import StudentLogin from "./pages/StudentLogin"
import StudentDashboard from "./pages/StudentDashboard"
import LeaveRequests from "./pages/LeaveRequests"
import RoomChangeRequests from "./pages/RoomChangeRequests"
import Layout from "./components/Layout"

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const facultyUser = localStorage.getItem('faculty');
    const studentUser = localStorage.getItem('student');
    const userRole = localStorage.getItem('userRole');
    
    if (facultyUser && userRole === 'faculty') {
      // Faculty is logged in, skip admin check
      setLoading(false);
      return;
    }
    
    if (studentUser && userRole === 'student') {
      // Student is logged in, skip admin check
      setLoading(false);
      return;
    }
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Portal Selection */}
        <Route path="/" element={<Login />} />
        
        {/* Faculty Portal Routes */}
        <Route path="/faculty/login" element={<FacultyLogin />} />
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />

        {/* Student Portal Routes */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />

        {/* Admin Portal Routes */}
        <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
        
        {/* Admin Dashboard Routes */}
        {user && user.role === 'admin' && (
          <>
            <Route path="/dashboard" element={
              <Layout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </Layout>
            } />
            <Route path="/departments" element={
              <Layout user={user} onLogout={handleLogout}>
                <DepartmentsPage />
              </Layout>
            } />
            <Route path="/classes" element={
              <Layout user={user} onLogout={handleLogout}>
                <ClassesPage />
              </Layout>
            } />
            <Route path="/courses" element={
              <Layout user={user} onLogout={handleLogout}>
                <CoursesPage />
              </Layout>
            } />
            <Route path="/faculty" element={
              <Layout user={user} onLogout={handleLogout}>
                <FacultyPage />
              </Layout>
            } />
            <Route path="/rooms" element={
              <Layout user={user} onLogout={handleLogout}>
                <RoomPage />
              </Layout>
            } />
            <Route path="/timetables" element={
              <Layout user={user} onLogout={handleLogout}>
                <TimetablePage />
              </Layout>
            } />
            <Route path="/notifications" element={
              <Layout user={user} onLogout={handleLogout}>
                <NotificationsPage />
              </Layout>
            } />
            <Route path="/leave-requests" element={
              <Layout user={user} onLogout={handleLogout}>
                <LeaveRequests />
              </Layout>
            } />
            <Route path="/room-change-requests" element={
              <Layout user={user} onLogout={handleLogout}>
                <RoomChangeRequests />
              </Layout>
            } />
          </>
        )}
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>  
  )
}

export default App
