import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, GraduationCap, Users } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  const portals = [
    {
      id: 'admin',
      title: 'Admin Portal',
      description: 'Manage courses, faculty, rooms, and timetables',
      icon: Shield,
      color: 'from-blue-500 to-indigo-600',
      path: '/admin/login',
    },
    {
      id: 'faculty',
      title: 'Faculty Portal',
      description: 'View schedule, request leave, and manage classes',
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      path: '/faculty/login',
    },
    {
      id: 'student',
      title: 'Student Portal',
      description: 'View timetable, notifications, and class updates',
      icon: GraduationCap,
      color: 'from-cyan-500 to-blue-600',
      path: '/student/login',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          Smart Classroom System
        </h1>
        <p className="text-slate-300 text-lg">
          Select your portal to continue
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
        {portals.map((portal) => {
          const Icon = portal.icon;
          return (
            <Card
              key={portal.id}
              className="bg-slate-800/95 backdrop-blur-xl border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group"
              onClick={() => navigate(portal.path)}
            >
              <CardHeader className="text-center space-y-4">
                <div className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-r ${portal.color} flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300`}>
                  <Icon className="w-12 h-12 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white mb-2">
                    {portal.title}
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    {portal.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <Button
                  className={`w-full bg-gradient-to-r ${portal.color} hover:opacity-90 transition-opacity`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(portal.path);
                  }}
                >
                  Login as {portal.title.replace(' Portal', '')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 max-w-2xl w-full">
        <h3 className="text-sm font-semibold text-cyan-300 mb-3">Demo Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div>
            <p className="font-semibold text-blue-400 mb-1">Admin</p>
            <p>Username: admin</p>
            <p>Password: admin123</p>
          </div>
          <div>
            <p className="font-semibold text-purple-400 mb-1">Faculty</p>
            <p>Email: (any faculty email)</p>
            <p>Password: 123</p>
          </div>
          <div>
            <p className="font-semibold text-cyan-400 mb-1">Student</p>
            <p>Roll No: CS2024001</p>
            <p>Password: 123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
