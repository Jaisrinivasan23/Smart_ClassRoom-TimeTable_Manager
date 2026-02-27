import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ClassForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState(initialData || {
    name: "",
    department: "",
    year: 1,
    section: "",
    semester: 1,
    numberOfStudents: 0,
    students: []
  });
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split('\n');
        const students = [];
        
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (row) {
            const [name, rollNumber, email] = row.split(',');
            if (name) {
              students.push({
                name: name.trim(),
                rollNumber: rollNumber?.trim() || "",
                email: email?.trim() || ""
              });
            }
          }
        }
        
        setFormData(prev => ({
          ...prev,
          students: students,
          numberOfStudents: students.length
        }));
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Class" : "Add New Class"}</CardTitle>
        <CardDescription>
          {initialData ? "Update class information" : "Enter class details to add to the system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="CSE Year 1 Section A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, year: parseInt(value) }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Year 1</SelectItem>
                  <SelectItem value="2">Year 2</SelectItem>
                  <SelectItem value="3">Year 3</SelectItem>
                  <SelectItem value="4">Year 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Input
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                placeholder="A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Select
                value={formData.semester.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, semester: parseInt(value) }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfStudents">Number of Students</Label>
            <Input
              id="numberOfStudents"
              name="numberOfStudents"
              type="number"
              value={formData.numberOfStudents}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvFile">Upload Student List (CSV)</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
            />
            <p className="text-xs text-gray-500">
              CSV format: name, rollNumber, email (one student per line with header)
            </p>
            {formData.students.length > 0 && (
              <p className="text-sm text-green-600">
                {formData.students.length} students loaded from CSV
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {initialData ? "Update Class" : "Add Class"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClassForm;
