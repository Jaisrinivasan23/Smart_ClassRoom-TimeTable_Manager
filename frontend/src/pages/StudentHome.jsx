import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const StudentHome = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Student Portal</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
          </div>
          <Button onClick={onLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Timetable</CardTitle>
              <CardDescription>View your class schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Your weekly class timetable will appear here.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Enrolled courses</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View your enrolled courses and course materials.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Track your attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View your attendance records for all courses.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>Pending tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View and submit your assignments.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Important updates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View notifications and announcements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Email: {user?.email}
              </p>
              <p className="text-sm text-gray-600">
                Role: Student
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
