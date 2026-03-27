import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  DoorOpen, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  MapPin,
  Calendar,
  Book,
  X
} from "lucide-react";
import axios from "axios";

export default function RoomChangeRequests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [approving, setApproving] = useState(false);

  // Rejection modal state
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/room-change-requests");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching room change requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async (day, period, roomType) => {
    try {
      const response = await axios.get("http://localhost:5000/api/room-change-requests/available-rooms", {
        params: { day, period, roomType }
      });
      setAvailableRooms(response.data);
    } catch (error) {
      console.error("Error fetching available rooms:", error);
      alert("Failed to fetch available rooms");
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.faculty?.name.toLowerCase().includes(term) ||
          req.affectedCourseName?.toLowerCase().includes(term) ||
          req.affectedCourseCode?.toLowerCase().includes(term) ||
          req.currentRoomName?.toLowerCase().includes(term)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApprove = async () => {
    if (!selectedRoom) {
      alert("Please select a room");
      return;
    }

    setApproving(true);
    try {
      await axios.put(
        `http://localhost:5000/api/room-change-requests/${selectedRequest._id}/approve`,
        { allocatedRoomId: selectedRoom }
      );

      alert("Room change request approved successfully!");
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setSelectedRoom("");
      setAvailableRooms([]);
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error.response?.data?.message || "Failed to approve request");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setRejecting(true);
    try {
      await axios.put(
        `http://localhost:5000/api/room-change-requests/${selectedRequest._id}/reject`,
        { rejectionReason }
      );

      alert("Room change request rejected");
      setShowRejectionModal(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(error.response?.data?.message || "Failed to reject request");
    } finally {
      setRejecting(false);
    }
  };

  const openApprovalModal = async (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
    await fetchAvailableRooms(request.day, request.period, request.requestedRoomType);
  };

  const openRejectionModal = (request) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: {
        className: "bg-amber-900/40 text-amber-200 border border-amber-700/60",
        icon: Clock,
        text: "Pending",
      },
      approved: {
        className: "bg-green-900/40 text-green-200 border border-green-700/60",
        icon: CheckCircle,
        text: "Approved",
      },
      rejected: {
        className: "bg-red-900/40 text-red-200 border border-red-700/60",
        icon: XCircle,
        text: "Rejected",
      },
    };

    const config = styles[status] || styles.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room change requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 md:px-6 py-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <DoorOpen className="w-6 h-6 text-indigo-300" />
            Room Change Requests
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage faculty room change requests and allocate available rooms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by faculty, course, or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                  <SelectValue placeholder="Filter by status" />
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

          {/* Requests List */}
          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request._id} className="border-l-4 border-l-indigo-500 bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-lg text-slate-100">{typeof request.faculty?.name === 'object' ? request.faculty?.name?.name || 'Faculty' : request.faculty?.name}</span>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300">
                              {request.day}, Period {request.period}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Book className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300">
                              {request.affectedCourseName} ({request.affectedCourseCode})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300">
                              Current: <span className="font-semibold text-slate-100">{request.currentRoomName}</span>
                            </span>
                          </div>

                          {request.allocatedRoom && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-green-400" />
                              <span className="text-green-300">
                                New: <span className="font-semibold text-green-200">{request.allocatedRoomName}</span>
                              </span>
                            </div>
                          )}

                          <div className="text-slate-300">
                            <span className="font-semibold text-slate-200">Class:</span> {request.affectedClassName}
                          </div>

                          <div className="text-slate-300">
                            <span className="font-semibold text-slate-200">Preferred:</span> {request.requestedRoomType}
                          </div>
                        </div>

                        <div className="bg-slate-800/60 p-3 rounded-md">
                          <p className="text-sm text-slate-300">
                            <span className="font-semibold text-slate-200">Reason:</span> {request.reason}
                          </p>
                        </div>

                        {request.rejectionReason && (
                          <div className="bg-red-900/30 p-3 rounded-md border border-red-700/60">
                            <p className="text-sm text-red-200">
                              <span className="font-semibold">Rejection Reason:</span> {request.rejectionReason}
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-slate-500">
                          Requested: {new Date(request.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {request.status === "pending" && (
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => openApprovalModal(request)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => openRejectionModal(request)}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DoorOpen className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No room change requests found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  Approve Room Change Request
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-slate-100"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedRequest(null);
                    setSelectedRoom("");
                    setAvailableRooms([]);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-slate-800/60 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Faculty:</span> {typeof selectedRequest.faculty?.name === 'object' ? selectedRequest.faculty?.name?.name || 'Faculty' : selectedRequest.faculty?.name}
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Course:</span> {selectedRequest.affectedCourseName} (
                    {selectedRequest.affectedCourseCode})
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Class:</span> {selectedRequest.affectedClassName}
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Time:</span> {selectedRequest.day}, Period{" "}
                    {selectedRequest.period}
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Current Room:</span> {selectedRequest.currentRoomName}
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Preferred Type:</span> {selectedRequest.requestedRoomType}
                  </p>
                </div>

                <div>
                  <Label htmlFor="available-rooms" className="text-slate-300">Select Available Room</Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger id="available-rooms" className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectValue placeholder="Choose a room to allocate" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.length > 0 ? (
                        availableRooms.map((room) => (
                          <SelectItem key={room._id} value={room._id}>
                            {typeof room.name === 'object' ? room.name?.name || 'Room' : room.name} - {typeof room.type === 'object' ? room.type?.type || room.type?.name || 'N/A' : room.type} (Capacity: {typeof room.capacity === 'object' ? room.capacity?.capacity || 'N/A' : room.capacity})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No rooms available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {availableRooms.length === 0 && (
                    <p className="text-sm text-red-300 mt-2">
                      No rooms are available for this time slot
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleApprove}
                    disabled={approving || !selectedRoom || availableRooms.length === 0}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {approving ? "Approving..." : "Confirm Approval"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedRequest(null);
                      setSelectedRoom("");
                      setAvailableRooms([]);
                    }}
                    className="border-slate-700 text-slate-200"
                    disabled={approving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <XCircle className="w-5 h-5 text-red-300" />
                  Reject Room Change Request
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-slate-100"
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedRequest(null);
                    setRejectionReason("");
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-slate-800/60 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Faculty:</span> {selectedRequest.faculty?.name}
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Course:</span> {selectedRequest.affectedCourseName} (
                    {selectedRequest.affectedCourseCode})
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">Time:</span> {selectedRequest.day}, Period{" "}
                    {selectedRequest.period}
                  </p>
                </div>

                <div>
                  <Label htmlFor="rejection-reason" className="text-slate-300">Rejection Reason</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Explain why this request is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="mt-2 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleReject}
                    disabled={rejecting || !rejectionReason.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {rejecting ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectionModal(false);
                      setSelectedRequest(null);
                      setRejectionReason("");
                    }}
                    className="border-slate-700 text-slate-200"
                    disabled={rejecting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
