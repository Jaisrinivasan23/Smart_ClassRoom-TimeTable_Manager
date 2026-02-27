

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DataTable } from "@/components/Data-table"
import { Plus, Building, Users, Calendar, LayoutDashboard, BookOpen, Home, Bell, Edit, X, Clock } from "lucide-react"
import { Link } from "react-router-dom"

export default function RoomPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [activeNavItem, setActiveNavItem] = useState("rooms")
  const [editingRoom, setEditingRoom] = useState(null)
  const [timetables, setTimetables] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showAllocationModal, setShowAllocationModal] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    building: "",
    floor: "",
    capacity: "",
    type: "",
    equipment: "",
  })

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { id: "courses", label: "Courses", icon: BookOpen, path: "/courses" },
    { id: "faculty", label: "Faculty", icon: Users, path: "/faculty" },
    { id: "rooms", label: "Rooms", icon: Home, path: "/rooms" },
    { id: "timetables", label: "Timetables", icon: Calendar, path: "/timetables" },
    { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications" },
  ]

  const roomTypes = [
    { value: "lab", label: "Laboratory" },
    { value: "seminar_room", label: "Seminar Room" },
    { value: "auditorium", label: "Auditorium" },
  ]

  const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  // Reset form function
  const resetForm = () => {
    setFormData({
      name: "",
      building: "",
      floor: "",
      capacity: "",
      type: "",
      equipment: "",
    })
    setEditingRoom(null)
  }

  // Fetch rooms
  const fetchRooms = async () => {
    setLoading(true)
    try {
      const res = await axios.get("http://localhost:5000/api/rooms")
      setRooms(res.data)
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all timetables
  const fetchTimetables = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/timetables")
      setTimetables(res.data)
    } catch (error) {
      console.error("Error fetching timetables:", error)
    }
  }

  useEffect(() => {
    fetchRooms()
    fetchTimetables()
  }, [])

  // Get room allocation schedule
  const getRoomAllocation = (roomId) => {
    const allocation = {}
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    const periods = [1, 2, 3, 4, 5, 6, 7, 8]

    // Initialize empty schedule
    days.forEach(day => {
      allocation[day] = {}
      periods.forEach(period => {
        allocation[day][period] = null
      })
    })

    // Fill with allocations from timetables
    timetables.forEach(timetable => {
      if (timetable.schedule && Array.isArray(timetable.schedule)) {
        timetable.schedule.forEach(entry => {
          if (entry.roomId === roomId) {
            const day = entry.day
            const period = entry.period
            if (allocation[day] && allocation[day][period] !== undefined) {
              allocation[day][period] = {
                courseName: entry.courseName || 'Unknown',
                courseCode: entry.courseCode || 'N/A',
                className: timetable.class ? `${typeof timetable.class.name === 'object' ? timetable.class.name?.name || 'Class' : timetable.class.name} - ${typeof timetable.class.section === 'object' ? timetable.class.section?.section || 'N/A' : timetable.class.section}` : (typeof timetable.name === 'object' ? timetable.name?.name || 'Timetable' : timetable.name),
                facultyName: entry.facultyName || 'TBD'
              }
            }
          }
        })
      }
    })

    return allocation
  }

  // Get room utilization percentage
  const getRoomUtilization = (roomId) => {
    const allocation = getRoomAllocation(roomId)
    let allocatedSlots = 0
    const totalSlots = 40 // 8 periods × 5 days

    Object.values(allocation).forEach(daySchedule => {
      Object.values(daySchedule).forEach(slot => {
        if (slot !== null) allocatedSlots++
      })
    })

    return Math.round((allocatedSlots / totalSlots) * 100)
  }

  // Load room data for editing
  const handleEditRoom = (room) => {
    setFormData({
      name: room.name || "",
      building: room.building || "",
      floor: room.floor?.toString() || "",
      capacity: room.capacity?.toString() || "",
      type: room.type || "",
      equipment: room.equipment?.join(", ") || "",
    })
    setEditingRoom(room)
    setShowForm(true)
  }

  // Create or update room
  const handleSubmitRoom = async (e) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        floor: Number(formData.floor),
        equipment: formData.equipment
          ? formData.equipment
              .split(",")
              .map((e) => e.trim())
              .filter((e) => e)
          : [],
      }

      if (editingRoom) {
        await axios.put(`http://localhost:5000/api/rooms/${editingRoom._id}`, payload)
      } else {
        await axios.post("http://localhost:5000/api/rooms", payload)
      }

      resetForm()
      setShowForm(false)
      fetchRooms()
    } catch (error) {
      console.error("Error saving room:", error)
    } finally {
      setFormLoading(false)
    }
  }

  // Delete room
  const handleDeleteRoom = async (room) => {
    const id = typeof room === 'object' ? room._id : room;
    if (!confirm("Are you sure you want to delete this room?")) return

    try {
      await axios.delete(`http://localhost:5000/api/rooms/${id}`)
      if (editingRoom && editingRoom._id === id) {
        resetForm()
        setShowForm(false)
      }
      fetchRooms()
      alert("Room deleted successfully")
    } catch (error) {
      console.error("Error deleting room:", error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to delete room";
      alert(errorMessage);
    }
  }



  // Table columns
  const columns = [
    {
      key: "name",
      label: "Room Details",
      render: (room) => (
        <div className="space-y-1">
          <div className="font-medium text-cyan-100">{typeof room.name === 'object' ? room.name?.name || 'Room' : room.name}</div>
          <div className="text-sm text-slate-400">
            {typeof room.building === 'object' ? room.building?.building || room.building?.name || 'N/A' : room.building}, Floor {typeof room.floor === 'object' ? room.floor?.floor || 'N/A' : room.floor}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (room) => (
        <Badge className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:from-emerald-500/30 hover:to-emerald-600/30 transition-all duration-300">
          {typeof room.type === 'object' ? (room.type?.type || room.type?.name || 'N/A') : room.type?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>
      ),
    },
    {
      key: "capacity",
      label: "Capacity",
      render: (room) => (
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="h-3 w-3 text-cyan-400" />
          {typeof room.capacity === 'object' ? room.capacity?.capacity || 'N/A' : room.capacity}
        </div>
      ),
    },
    {
      key: "equipment",
      label: "Equipment",
      render: (room) => (
        <div className="flex flex-wrap gap-1 max-w-32">
          {room.equipment?.slice(0, 2).map((eq, index) => (
            <Badge
              key={index}
              className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/30 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 text-xs"
            >
              {eq}
            </Badge>
          ))}
          {room.equipment?.length > 2 && (
            <Badge className="bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-500/30 hover:from-slate-500/30 hover:to-slate-600/30 transition-all duration-300 text-xs">
              +{room.equipment.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "utilization",
      label: "Utilization",
      render: (room) => {
        const utilization = getRoomUtilization(room._id)
        const color = utilization > 70 ? 'red' : utilization > 40 ? 'yellow' : 'green'
        const colorClasses = {
          red: 'from-red-500/20 to-red-600/20 text-red-300 border-red-500/30',
          yellow: 'from-yellow-500/20 to-yellow-600/20 text-yellow-300 border-yellow-500/30',
          green: 'from-green-500/20 to-green-600/20 text-green-300 border-green-500/30'
        }
        return (
          <Badge className={`bg-gradient-to-r ${colorClasses[color]} transition-all duration-300 text-xs`}>
            {utilization}% Used
          </Badge>
        )
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (room) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-gradient-to-r from-violet-500/20 to-violet-600/20 hover:from-violet-500/30 hover:to-violet-600/30 text-violet-300 border border-violet-500/30 hover:border-violet-400/50 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            onClick={() => {
              setSelectedRoom(room)
              setShowAllocationModal(true)
            }}
          >
            <Calendar className="h-3 w-3 mr-1" />
            Schedule
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 hover:from-cyan-500/30 hover:to-cyan-600/30 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            onClick={() => handleEditRoom(room)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-300 border border-red-500/30 hover:border-red-400/50 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            onClick={() => handleDeleteRoom(room._id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-cyan-300 text-lg">Loading rooms...</div>
      </div>
    )

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>
      {/* </CHANGE> */}

      <div className="p-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent leading-tight">
              Rooms
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
              Manage classrooms, labs, and other facilities. Room availability is managed through timetable allocation.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setShowForm(!showForm)
            }}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 px-6 py-3 flex items-center gap-2 hover:scale-105 border border-cyan-500/30"
          >
            <Plus className="h-5 w-5" /> Add Room
          </Button>
        </div>

        {/* Add/Edit Room Form */}
        {showForm && (
          <Card className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
            <CardHeader className="border-b border-cyan-500/20 p-6">
              <CardTitle className="text-xl font-semibold text-cyan-100">
                {editingRoom ? "Edit Room" : "Add New Room"}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Fill in the room details. Availability is based on timetable allocation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmitRoom} className="space-y-6">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300 font-medium">Room Name *</Label>
                    <Input
                      className="mt-1 bg-slate-800/50 border-slate-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-slate-200 placeholder-slate-500 backdrop-blur-sm transition-all duration-300 hover:border-slate-500/70"
                      placeholder="e.g., Room A101"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 font-medium">Building *</Label>
                    <Input
                      className="mt-1 bg-slate-800/50 border-slate-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-slate-200 placeholder-slate-500 backdrop-blur-sm transition-all duration-300 hover:border-slate-500/70"
                      placeholder="e.g., Main Building"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-300 font-medium">Floor *</Label>
                    <Input
                      className="mt-1 bg-slate-800/50 border-slate-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-slate-200 placeholder-slate-500 backdrop-blur-sm transition-all duration-300 hover:border-slate-500/70"
                      type="number"
                      min="0"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 font-medium">Capacity *</Label>
                    <Input
                      className="mt-1 bg-slate-800/50 border-slate-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-slate-200 placeholder-slate-500 backdrop-blur-sm transition-all duration-300 hover:border-slate-500/70"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 font-medium">Room Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600/50 focus:border-cyan-500 text-slate-200 backdrop-blur-sm transition-all duration-300 hover:border-slate-500/70">
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800/90 backdrop-blur-xl border-slate-600/50 text-slate-200">
                        {roomTypes.map((type) => (
                          <SelectItem
                            key={type.value}
                            value={type.value}
                            className="hover:bg-slate-700/50 focus:bg-slate-700/50"
                          >
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 font-medium">Equipment (comma separated)</Label>
                  <Textarea
                    className="mt-1 bg-slate-800/50 border-slate-600/50 focus:border-cyan-500 focus:ring-cyan-500/20 text-slate-200 placeholder-slate-500 backdrop-blur-sm transition-all duration-300 hover:border-slate-500/70"
                    placeholder="e.g., Projector, Whiteboard, Sound System"
                    rows={2}
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  />
                </div>

                {/* Availability Info */}
                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm">
                      Room availability will be determined by timetable allocation. Labs are allocated for lab sessions, other room types for lectures and seminars.
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 border border-cyan-500/30"
                  >
                    {formLoading ? "Saving..." : editingRoom ? "Update Room" : "Save Room"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      resetForm()
                      setShowForm(false)
                    }}
                    className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/50 hover:border-slate-500/70 backdrop-blur-sm transition-all duration-300"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Rooms List */}
        <Card className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
          <CardHeader className="border-b border-cyan-500/20 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-cyan-100">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/30 backdrop-blur-sm">
                    <Building className="h-5 w-5 text-cyan-400" />
                  </div>
                  All Rooms
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {rooms.length} rooms available in the system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-slate-800/20 rounded-xl border border-slate-600/30 overflow-hidden backdrop-blur-sm">
              <DataTable data={rooms} columns={columns} searchKey="name" loading={loading} />
            </div>
          </CardContent>
        </Card>

        {/* Room Allocation Modal */}
        {showAllocationModal && selectedRoom && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <CardHeader className="border-b border-cyan-500/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-cyan-100">
                      {typeof selectedRoom.name === 'object' ? selectedRoom.name?.name || 'Room' : selectedRoom.name} - Allocation Schedule
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-1">
                      {typeof selectedRoom.type === 'object' ? selectedRoom.type?.type || selectedRoom.type?.name || 'N/A' : selectedRoom.type} • Floor {typeof selectedRoom.floor === 'object' ? selectedRoom.floor?.floor || 'N/A' : selectedRoom.floor} • Capacity: {typeof selectedRoom.capacity === 'object' ? selectedRoom.capacity?.capacity || 'N/A' : selectedRoom.capacity}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setShowAllocationModal(false)
                      setSelectedRoom(null)
                    }}
                    className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-700/30 backdrop-blur-sm">
                        <th className="border border-slate-600/50 p-3 text-cyan-200 font-semibold text-sm">Period / Day</th>
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                          <th key={day} className="border border-slate-600/50 p-3 text-cyan-200 font-semibold text-sm">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => {
                        const timeSlots = [
                          "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00",
                          "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00"
                        ]
                        const allocation = getRoomAllocation(selectedRoom._id)
                        
                        return (
                          <tr key={period} className="hover:bg-slate-700/20 transition-colors">
                            <td className="border border-slate-600/50 p-3 bg-slate-800/40 text-slate-300 font-medium">
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-cyan-400" />
                                  <span className="font-bold">P{period}</span>
                                </div>
                                <span className="text-xs text-slate-400">{timeSlots[period - 1]}</span>
                              </div>
                            </td>
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                              const slot = allocation[day]?.[period]
                              
                              if (!slot) {
                                return (
                                  <td key={`${day}-${period}`} className="border border-slate-600/50 p-2">
                                    <div className="h-20 bg-slate-800/20 rounded border-2 border-dashed border-slate-700/50 flex items-center justify-center">
                                      <span className="text-slate-500 text-xs">Free</span>
                                    </div>
                                  </td>
                                )
                              }

                              return (
                                <td key={`${day}-${period}`} className="border border-slate-600/50 p-2">
                                  <div className="p-3 rounded-lg h-full bg-gradient-to-br from-emerald-500/20 to-green-600/20 text-emerald-200 border border-emerald-500/30">
                                    <div className="font-bold text-sm mb-2">
                                      {slot.courseCode}
                                    </div>
                                    <div className="text-xs space-y-1">
                                      <div className="font-medium truncate">{slot.courseName}</div>
                                      <div className="truncate text-emerald-300">{slot.className}</div>
                                      <div className="truncate text-emerald-400">{slot.facultyName}</div>
                                    </div>
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
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

                {/* Utilization Summary */}
                <div className="mt-4 p-4 bg-slate-800/30 border border-slate-600/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">Room Utilization:</span>
                    <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border-cyan-500/30 text-sm px-3 py-1">
                      {getRoomUtilization(selectedRoom._id)}% of available time slots
                    </Badge>
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
