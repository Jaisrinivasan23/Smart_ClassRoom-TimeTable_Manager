import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FacultyHome = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Faculty Portal</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
          </div>
          <Button onClick={onLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Schedule</CardTitle>
              <CardDescription>View your teaching schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Your timetable and class schedules will appear here.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Manage your courses</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View and manage courses you are teaching.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Attendance</CardTitle>
              <CardDescription>Track attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Mark and view student attendance records.
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
              <CardTitle>Room Bookings</CardTitle>
              <CardDescription>Check room availability</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View and book available classrooms.
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
                Role: Faculty
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FacultyHome;
