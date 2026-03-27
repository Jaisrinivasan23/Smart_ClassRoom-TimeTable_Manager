import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  BookOpen,
  Users,
  Search,
} from "lucide-react";
import axios from "axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
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

export default function LeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [selectedSubstitute, setSelectedSubstitute] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, statusFilter, searchQuery]);

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/leave-requests");
      setLeaveRequests(response.data.leaveRequests || []);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = leaveRequests;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (req) =>
          req.faculty?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.faculty?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.reason.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const fetchAvailableFaculty = async (request) => {
    try {
      const response = await axios.get("http://localhost:5000/api/leave-requests/available-faculty", {
        params: {
          day: request.day,
          period: request.period,
          departmentId: request.faculty?.departments?.[0] || "",
        },
      });
      setAvailableFaculty(response.data.availableFaculty || []);
    } catch (error) {
      console.error("Error fetching available faculty:", error);
      setAvailableFaculty([]);
    }
  };

  const handleApproveClick = async (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
    await fetchAvailableFaculty(request);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
    setRejectionReason("");
  };

  const handleApprove = async () => {
    if (!selectedSubstitute) {
      alert("Please select a substitute faculty");
      return;
    }

    setProcessing(true);
    try {
      await axios.put(`http://localhost:5000/api/leave-requests/${selectedRequest._id}/approve`, {
        substituteId: selectedSubstitute,
        approvedBy: "Admin",
      });

      alert("Leave request approved! Notifications sent to both faculty members.");
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setSelectedSubstitute("");
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error approving leave request:", error);
      alert("Failed to approve leave request");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setProcessing(true);
    try {
      await axios.put(`http://localhost:5000/api/leave-requests/${selectedRequest._id}/reject`, {
        rejectedReason: rejectionReason,
      });

      alert("Leave request rejected");
      setShowRejectionModal(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      alert("Failed to reject leave request");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: {
        variant: "secondary",
        icon: AlertCircle,
        text: "Pending",
        className: "bg-amber-900/40 text-amber-200 border border-amber-700/60",
      },
      approved: {
        variant: "success",
        icon: CheckCircle,
        text: "Approved",
        className: "bg-green-900/40 text-green-200 border border-green-700/60",
      },
      rejected: {
        variant: "destructive",
        icon: XCircle,
        text: "Rejected",
        className: "bg-red-900/40 text-red-200 border border-red-700/60",
      },
    };

    const config = styles[status] || styles.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 w-fit ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getTimeSlotDisplay = (period) => {
    const slot = TIME_SLOTS.find((t) => t.period === period);
    return slot ? `${slot.start}-${slot.end}` : "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Faculty Leave Requests</h1>
          <p className="text-slate-400 mt-1">Manage faculty unavailability and assign substitutes</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-slate-800 text-slate-100 border border-slate-700">
            {leaveRequests.filter((r) => r.status === "pending").length} Pending
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-slate-300">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search by faculty name, email, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label className="text-slate-300">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <Card key={request._id} className="hover:shadow-md transition-shadow bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  {/* Request Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-900/50 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-indigo-300" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-slate-100">
                            {typeof request.faculty?.name === 'object' ? request.faculty?.name?.name || 'Unknown Faculty' : request.faculty?.name || "Unknown Faculty"}
                          </h3>
                          <p className="text-sm text-slate-400">{typeof request.faculty?.email === 'object' ? request.faculty?.email?.email || '' : request.faculty?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.reason?.includes("(Whole Day Leave)") && (
                          <Badge className="bg-orange-900/40 text-orange-200 border-orange-700">
                            🌅 Whole Day
                          </Badge>
                        )}
                        {getStatusBadge(request.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium text-slate-300">Date:</span>
                        {new Date(request.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium text-slate-300">Time:</span>
                        {request.day}, Period {request.period} ({getTimeSlotDisplay(request.period)})
                      </div>
                      {request.affectedClass && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Users className="w-4 h-4" />
                          <span className="font-medium text-slate-300">Class:</span>
                          {typeof request.affectedClass.name === 'object' ? request.affectedClass.name?.name || 'N/A' : request.affectedClass.name} - {typeof request.affectedClass.section === 'object' ? request.affectedClass.section?.section || 'N/A' : request.affectedClass.section}
                        </div>
                      )}
                      {request.affectedCourse && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <BookOpen className="w-4 h-4" />
                          <span className="font-medium text-slate-300">Course:</span>
                          {typeof request.affectedCourse.code === 'object' ? request.affectedCourse.code?.code || request.affectedCourse.code?.name || 'N/A' : request.affectedCourse.code} - {typeof request.affectedCourse.name === 'object' ? request.affectedCourse.name?.name || 'N/A' : request.affectedCourse.name}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-md">
                      <p className="text-sm">
                        <span className="font-semibold text-slate-300">Reason:</span>{" "}
                        <span className="text-slate-400">{request.reason?.replace(" (Whole Day Leave)", "") || request.reason}</span>
                      </p>
                    </div>

                    {request.status === "approved" && request.substitute && (
                      <div className="bg-green-900/30 p-3 rounded-md border border-green-700/60">
                        <p className="text-sm text-green-200">
                          <span className="font-semibold">Substitute Assigned:</span> {typeof request.substitute.name === 'object' ? request.substitute.name?.name || 'N/A' : request.substitute.name}
                        </p>
                        <p className="text-xs text-green-300">
                          Approved on: {new Date(request.approvedAt).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {request.status === "rejected" && request.rejectedReason && (
                      <div className="bg-red-900/30 p-3 rounded-md border border-red-700/60">
                        <p className="text-sm text-red-200">
                          <span className="font-semibold">Rejection Reason:</span> {request.rejectedReason}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      Submitted: {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {request.status === "pending" && (
                    <div className="flex lg:flex-col gap-2 lg:w-32">
                      <Button
                        onClick={() => handleApproveClick(request)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectClick(request)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No leave requests found matching your filters</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-300">
                <CheckCircle className="w-6 h-6" />
                Approve Leave Request
              </CardTitle>
              <CardDescription className="text-slate-400">Select a substitute faculty to be notified (timetable will not be modified)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Request Summary */}
              <div className="bg-slate-800/60 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-slate-100">Request Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Faculty:</span>
                    <span className="ml-2 font-medium text-slate-200">{typeof selectedRequest.faculty?.name === 'object' ? selectedRequest.faculty?.name?.name || 'Unknown' : selectedRequest.faculty?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Time:</span>
                    <span className="ml-2 font-medium text-slate-200">
                      {selectedRequest.day}, P{selectedRequest.period}
                    </span>
                  </div>
                  {selectedRequest.affectedClass && (
                    <div>
                      <span className="text-slate-400">Class:</span>
                      <span className="ml-2 font-medium text-slate-200">
                        {typeof selectedRequest.affectedClass.name === 'object' ? selectedRequest.affectedClass.name?.name || 'N/A' : selectedRequest.affectedClass.name} - {typeof selectedRequest.affectedClass.section === 'object' ? selectedRequest.affectedClass.section?.section || 'N/A' : selectedRequest.affectedClass.section}
                      </span>
                    </div>
                  )}
                  {selectedRequest.affectedCourse && (
                    <div>
                      <span className="text-slate-400">Course:</span>
                      <span className="ml-2 font-medium text-slate-200">{typeof selectedRequest.affectedCourse.code === 'object' ? selectedRequest.affectedCourse.code?.code || selectedRequest.affectedCourse.code?.name || 'N/A' : selectedRequest.affectedCourse.code}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Faculty */}
              <div className="space-y-2">
                <Label htmlFor="substitute" className="text-slate-300">Select Substitute Faculty *</Label>
                {availableFaculty.length > 0 ? (
                  <Select value={selectedSubstitute} onValueChange={setSelectedSubstitute}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a substitute faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFaculty.map((faculty) => (
                        <SelectItem key={faculty._id} value={faculty._id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{typeof faculty.name === 'object' ? faculty.name?.name || 'Faculty' : faculty.name}</span>
                            <span className="text-xs text-slate-400">{typeof faculty.email === 'object' ? faculty.email?.email || '' : faculty.email}</span>
                            {faculty.courses && faculty.courses.length > 0 && (
                              <span className="text-xs text-slate-500">
                                Teaches: {faculty.courses.map((c) => typeof c === 'object' ? (c?.code || c?.name || 'Course') : c).join(", ")}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-yellow-900/30 border border-yellow-700/60 rounded-md p-3 text-sm text-yellow-200">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    No available faculty found for this time slot. You may need to manually adjust the
                    timetable.
                  </div>
                )}
              </div>

              {/* Information Note */}
              <div className="bg-blue-900/30 border border-blue-700/60 rounded-md p-3 text-sm text-blue-200">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                <strong>Note:</strong> The selected substitute will receive a notification about this assignment. 
                The timetable will remain unchanged and needs to be manually updated if required.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={!selectedSubstitute || processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? "Processing..." : "Confirm Approval"}
                </Button>
                <Button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedRequest(null);
                    setSelectedSubstitute("");
                  }}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-200"
                  disabled={processing}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-300">
                <XCircle className="w-6 h-6" />
                Reject Leave Request
              </CardTitle>
              <CardDescription className="text-slate-400">Provide a reason for rejection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Request Summary */}
              <div className="bg-slate-800/60 p-3 rounded-md text-sm">
                <p>
                  <span className="font-semibold text-slate-300">Faculty:</span> {typeof selectedRequest.faculty?.name === 'object' ? selectedRequest.faculty?.name?.name || 'Unknown' : selectedRequest.faculty?.name}
                </p>
                <p>
                  <span className="font-semibold text-slate-300">Time:</span> {selectedRequest.day}, Period{" "}
                  {selectedRequest.period}
                </p>
              </div>

              {/* Rejection Reason */}
              <div className="space-y-2">
                <Label htmlFor="rejectionReason" className="text-slate-300">Reason for Rejection *</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Please provide a clear reason for rejecting this request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || processing}
                  variant="destructive"
                  className="flex-1"
                >
                  {processing ? "Processing..." : "Confirm Rejection"}
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedRequest(null);
                    setRejectionReason("");
                  }}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-200"
                  disabled={processing}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
