import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import dbConnect from './utils/dbConnect.js';
import Student from './models/Student.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath, quiet: true });

async function seedStudents() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'students_sample.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const student = {
        name: values[0].trim(),
        rollNumber: values[1].trim(),
        email: values[2].trim(),
        password: '123', // Default password
      };
      students.push(student);
    }

    console.log(`Parsed ${students.length} students from CSV`);

    // Clear existing students (optional - remove this if you want to keep existing data)
    await Student.deleteMany({});
    console.log('Cleared existing students');

    // Insert students
    const result = await Student.insertMany(students);
    console.log(`Successfully inserted ${result.length} students`);

    // Display first few students
    console.log('\nFirst 3 students:');
    result.slice(0, 3).forEach(s => {
      console.log(`- ${s.rollNumber}: ${s.name} (${s.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding students:', error.message);
    process.exit(1);
  }
}

seedStudents();
