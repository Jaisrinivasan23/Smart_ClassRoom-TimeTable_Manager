import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import axios from "axios";

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function FacultyForm({ initialData = {}, onSubmit, loading = false }) {
  const [departments, setDepartments] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    departments: [],
    courses: [],
    specialization: [],
    maxHoursPerWeek: 20,
    availability: daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: [{ start: "09:00", end: "17:00" }] }), {}),
    preferences: { preferredTimeSlots: [], avoidTimeSlots: [] }
  });

  const [specializationInput, setSpecializationInput] = useState("");
  const [preferredInput, setPreferredInput] = useState("");
  const [avoidInput, setAvoidInput] = useState("");

  // Set default availability for all days (9 AM to 5 PM)
  const defaultAvailability = daysOfWeek.reduce((acc, day) => ({
    ...acc,
    [day]: [{ start: "09:00", end: "17:00" }]
  }), {});

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/departments");
        setDepartments(response.data);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch courses based on selected departments
  useEffect(() => {
    const fetchCourses = async () => {
      if (formData.departments.length === 0) {
        setAvailableCourses([]);
        return;
      }
      try {
        const response = await axios.get("http://localhost:5000/api/courses");
        const filteredCourses = response.data.filter(course => {
          // Check if course belongs to any of the selected departments
          if (Array.isArray(course.departments)) {
            return course.departments.some(dept => 
              formData.departments.includes(typeof dept === 'object' ? dept._id : dept)
            );
          }
          return false;
        });
        setAvailableCourses(filteredCourses);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    };
    fetchCourses();
  }, [formData.departments]);

  // ✅ FIXED: The useEffect now depends on the unique ID of the faculty member.
  // This prevents it from re-running and overwriting state on every render.
  useEffect(() => {
    if (initialData?._id) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        departments: initialData.departments?.map(d => typeof d === 'object' ? d._id : d) || [],
        courses: initialData.courses?.map(c => typeof c === 'object' ? c._id : c) || [],
        specialization: initialData.specialization || [],
        maxHoursPerWeek: initialData.maxHoursPerWeek || 20,
        // Ensure availability is a complete object - default to 9-5 if not set
        availability: daysOfWeek.reduce((acc, day) => ({
          ...acc,
          [day]: initialData.availability?.[day] || [{ start: "09:00", end: "17:00" }]
        }), {}),
        preferences: initialData.preferences || { preferredTimeSlots: [], avoidTimeSlots: [] }
      });
    } else {
      // Reset form for "Add New" case
       setFormData({
        name: "",
        email: "",
        departments: [],
        courses: [],
        specialization: [],
        maxHoursPerWeek: 20,
        availability: daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: [{ start: "09:00", end: "17:00" }] }), {}),
        preferences: { preferredTimeSlots: [], avoidTimeSlots: [] }
      });
    }
  }, [initialData?._id]); // <-- THE KEY CHANGE IS HERE

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const addSpecialization = () => {
    const spec = specializationInput.trim();
    if (spec && !formData.specialization.includes(spec)) {
      setFormData((prev) => ({ ...prev, specialization: [...prev.specialization, spec] }));
      setSpecializationInput("");
    }
  };

  const removeSpecialization = (spec) => {
    setFormData((prev) => ({ ...prev, specialization: prev.specialization.filter((s) => s !== spec) }));
  };

  const addPreference = (type, value) => {
    if (!value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: [...prev.preferences[type], value.trim()]
      }
    }));
    type === "preferredTimeSlots" ? setPreferredInput("") : setAvoidInput("");
  };

  const removePreference = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: prev.preferences[type].filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData?._id ? "Edit Faculty" : "Add New Faculty"}</CardTitle>
        <CardDescription>Fill in faculty details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
          </div>

          <div>
            <Label>Departments</Label>
            <Select 
              onValueChange={(value) => {
                if (value && !formData.departments.includes(value)) {
                  setFormData({ ...formData, departments: [...formData.departments, value] });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select departments" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.departments.map((deptId) => {
                const dept = departments.find(d => d._id === deptId);
                return dept ? (
                  <Badge key={deptId} className="flex items-center gap-1.5 py-1 px-2">
                    {dept.name} ({dept.code})
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, departments: formData.departments.filter(id => id !== deptId) })} 
                      className="rounded-full hover:bg-black/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          {/* Courses */}
          <div>
            <Label>Courses {formData.departments.length === 0 && <span className="text-xs text-slate-400">(Select departments first)</span>}</Label>
            <Select 
              disabled={formData.departments.length === 0}
              onValueChange={(value) => {
                if (value && !formData.courses.includes(value)) {
                  setFormData({ ...formData, courses: [...formData.courses, value] });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.departments.length === 0 ? "Select departments first" : "Select courses"} />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.courses.map((courseId) => {
                const course = availableCourses.find(c => c._id === courseId);
                return course ? (
                  <Badge key={courseId} className="flex items-center gap-1.5 py-1 px-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    {course.code} - {course.name}
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, courses: formData.courses.filter(id => id !== courseId) })} 
                      className="rounded-full hover:bg-black/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          <div>
            <Label>Max Hours/Week</Label>
            <Input type="number" value={formData.maxHoursPerWeek} onChange={(e) => setFormData({ ...formData, maxHoursPerWeek: Number(e.target.value) })} min={1} max={40} required />
          </div>

          {/* Specialization */}
          <div>
            <Label>Specialization</Label>
            <div className="flex gap-2">
              <Input value={specializationInput} onChange={(e) => setSpecializationInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialization())} />
              <Button type="button" onClick={addSpecialization} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.specialization.map((spec) => (
                <Badge key={spec} className="flex items-center gap-1.5 py-1 px-2">
                    {spec}
                    {/* UX Improvement: Use a button for a larger click target */}
                    <button type="button" onClick={() => removeSpecialization(spec)} className="rounded-full hover:bg-black/20 p-0.5">
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Availability - Hidden, set automatically to 9 AM - 5 PM for all days */}
          <div className="text-sm text-slate-400 bg-slate-800/30 p-3 rounded-lg border border-slate-700">
            <Label className="text-slate-300">Availability</Label>
            <p className="mt-1">Faculty is available Monday-Sunday, 9:00 AM - 5:00 PM (set automatically)</p>
          </div>

          {/* Preferences */}
          <div>
            <Label>Preferred Time Slots (e.g., "Morning", "Afternoon")</Label>
            <div className="flex gap-2">
              <Input value={preferredInput} onChange={(e) => setPreferredInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPreference("preferredTimeSlots", preferredInput))} />
              <Button type="button" onClick={() => addPreference("preferredTimeSlots", preferredInput)} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.preferences.preferredTimeSlots.map((slot, idx) => (
                <Badge key={idx} className="flex items-center gap-1.5 py-1 px-2">{slot}
                    <button type="button" className="rounded-full hover:bg-black/20 p-0.5" onClick={() => removePreference("preferredTimeSlots", idx)}>
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Avoid Time Slots (e.g., "Friday Afternoon")</Label>
            <div className="flex gap-2">
              <Input value={avoidInput} onChange={(e) => setAvoidInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPreference("avoidTimeSlots", avoidInput))} />
              <Button type="button" onClick={() => addPreference("avoidTimeSlots", avoidInput)} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.preferences.avoidTimeSlots.map((slot, idx) => (
                <Badge key={idx} className="flex items-center gap-1.5 py-1 px-2">{slot}
                    <button type="button" className="rounded-full hover:bg-black/20 p-0.5" onClick={() => removePreference("avoidTimeSlots", idx)}>
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">{loading ? "Saving..." : "Save Faculty"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
