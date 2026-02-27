// backend/utils/classTimetableGenerator.js
import { GoogleGenAI } from "@google/genai";
import Course from '../models/course.js';
import Faculty from '../models/Faculty.js';
import Room from '../models/Room.js';
import Timetable from '../models/Timetable.js';
import Class from '../models/Class.js';
import Department from '../models/Department.js';
import Notification from '../models/Notification.js';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Initialize AI client
let genAI;
try {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is not set in environment variables.');
  }
  genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  console.log('Google AI (Gemini) initialized successfully for class timetable generation');
} catch (error) {
  console.error('Failed to initialize Google AI:', error.message);
}

// --- Configuration ---
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { period: 1, start: '09:00', end: '10:00' },
  { period: 2, start: '10:00', end: '11:00' },
  { period: 3, start: '11:00', end: '12:00' },
  { period: 4, start: '12:00', end: '13:00' },
  { period: 5, start: '14:00', end: '15:00' },
  { period: 6, start: '15:00', end: '16:00' },
  { period: 7, start: '16:00', end: '17:00' },
  { period: 8, start: '17:00', end: '18:00' },
];
const LUNCH_BREAK = { start: '13:00', end: '14:00' };

/**
 * Cleans and parses the JSON response from the AI.
 */
function parseAIResponse(text) {
  if (!text || typeof text !== 'string') return [];
  
  // Remove markdown code blocks
  let clean = text.replace(/```(?:json)?\n?/gi, '').replace(/```\n?/g, '');
  
  // Try to extract JSON array from text
  const jsonMatch = clean.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    clean = jsonMatch[0];
  }
  
  try {
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse AI JSON response:', e);
    console.error('Response text:', text.substring(0, 500));
    return [];
  }
}

/**
 * Generates class-specific timetables using Gemini AI.
 * Request: { departmentId, semester, academicYear }
 * Returns: Array of created timetables (one per class)
 */
export async function generateClassTimetablesWithAI(request) {
  console.log('=== STARTING CLASS-BASED AI TIMETABLE GENERATION ===');
  console.log('Request:', request);

  if (!genAI) {
    throw new Error('AI client is not initialized. Check GOOGLE_API_KEY.');
  }

  try {
    const { departmentId, semester, academicYear, constraints, specialActivities } = request;
    if (!departmentId || !semester || !academicYear) {
      throw new Error('Department ID, semester, and academic year are required.');
    }

    // 1. Fetch department details
    console.log('Fetching department details...');
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new Error(`Department with ID "${departmentId}" not found.`);
    }
    console.log(`Department found: ${department.name} (${department.code})`);

    // 2. Fetch all classes for this department and semester
    console.log('Fetching classes...');
    const classes = await Class.find({
      department: departmentId,
      semester: Number(semester)
    }).populate('department', 'name code');

    if (classes.length === 0) {
      throw new Error(`No classes found for ${department.name}, Semester ${semester}.`);
    }
    console.log(`Found ${classes.length} classes:`, classes.map(c => `${c.name} (${c.section})`));

    // 3. Fetch courses for this department and semester
    console.log('Fetching courses...');
    const allCourses = await Course.find({}).populate('departments', 'name code');
    const relevantCourses = allCourses.filter(c => {
      const hasDepartment = Array.isArray(c.departments) && c.departments.some(dept => 
        dept._id.toString() === departmentId
      );
      return hasDepartment && Number(c.semester) === Number(semester);
    });

    if (relevantCourses.length === 0) {
      throw new Error(`No courses found for ${department.name}, Semester ${semester}.`);
    }
    console.log(`Found ${relevantCourses.length} courses`);

    // 4. Fetch faculty who teach courses in this department
    console.log('Fetching faculty...');
    const allFaculty = await Faculty.find({})
      .populate('departments', 'name code')
      .populate('courses', 'name code');
    
    const relevantFaculty = allFaculty.filter(f => {
      return Array.isArray(f.departments) && f.departments.some(dept => 
        dept._id.toString() === departmentId
      );
    });
    console.log(`Found ${relevantFaculty.length} faculty members`);

    // 5. Fetch all available rooms
    const allRooms = await Room.find({});
    console.log(`Found ${allRooms.length} rooms`);

    // 6. Generate timetable for EACH class separately with conflict tracking
    const generatedTimetables = [];
    
    for (const classData of classes) {
      console.log(`\n=== Generating timetable for ${classData.name} (${classData.section}) ===`);
      
      try {
        const timetable = await generateSingleClassTimetable({
          classData,
          department,
          semester,
          academicYear,
          courses: relevantCourses,
          faculty: relevantFaculty,
          rooms: allRooms,
          constraints: constraints || '',
          specialActivities: specialActivities || '',
          existingTimetables: generatedTimetables // Pass already-generated timetables for conflict checking
        });
        
        generatedTimetables.push(timetable);
        console.log(`✓ Timetable generated for ${classData.name} (${classData.section})`);
      } catch (error) {
        console.error(`✗ Failed to generate timetable for ${classData.name}:`, error.message);
        // Continue with other classes
      }
    }

    if (generatedTimetables.length === 0) {
      throw new Error('Failed to generate any timetables. Check logs for details.');
    }

    // Create success notification
    await new Notification({
      title: 'Class Timetables Generated',
      message: `Successfully generated ${generatedTimetables.length} timetables for ${department.name}, Semester ${semester}.`,
      type: 'success',
    }).save();

    console.log(`\n=== GENERATION COMPLETE: ${generatedTimetables.length}/${classes.length} timetables created ===`);
    return generatedTimetables;

  } catch (err) {
    console.error('Error in generateClassTimetablesWithAI:', err);
    await new Notification({
      title: 'Timetable Generation Failed',
      message: err.message || 'An unknown error occurred.',
      type: 'error',
    }).save();
    throw err;
  }
}

/**
 * Generates a timetable for a single class using Gemini AI
 */
async function generateSingleClassTimetable({ classData, department, semester, academicYear, courses, faculty, rooms, constraints, specialActivities, existingTimetables = [] }) {
  // Build faculty and room conflict maps from existing timetables
  const facultyConflicts = {};
  const roomConflicts = {};
  
  existingTimetables.forEach(tt => {
    if (tt.schedule && Array.isArray(tt.schedule)) {
      tt.schedule.forEach(entry => {
        const key = `${entry.day}-P${entry.period}`;
        
        // Track faculty conflicts
        if (!facultyConflicts[key]) {
          facultyConflicts[key] = [];
        }
        facultyConflicts[key].push({
          facultyId: entry.facultyId,
          facultyName: entry.facultyName,
          className: tt.name,
          courseName: entry.courseName
        });
        
        // Track room conflicts
        if (!roomConflicts[key]) {
          roomConflicts[key] = [];
        }
        roomConflicts[key].push({
          roomId: entry.roomId,
          roomName: entry.roomName,
          className: tt.name,
          courseName: entry.courseName
        });
      });
    }
  });
  
  // Build faculty conflict section for prompt
  const facultyConflictSection = Object.keys(facultyConflicts).length > 0 ? `\n**🚨 FACULTY ALREADY SCHEDULED (MUST AVOID CONFLICTS):**\n\nThe following faculty are ALREADY teaching other classes at these times. DO NOT assign them again at these slots:\n\n${Object.entries(facultyConflicts).map(([slot, conflicts]) => {
    return `❌ ${slot}: ${conflicts.map(c => `${c.facultyName} (ID: ${c.facultyId})`).join(', ')} - UNAVAILABLE`;
  }).join('\n')}\n\n⚠️ CRITICAL INSTRUCTION: When assigning a faculty at a specific day/period:\n1. CHECK if that faculty's ID appears in the list above for that slot\n2. If YES → Choose a DIFFERENT faculty who is NOT in that slot\n3. If NO → You can safely assign that faculty\n\nREMEMBER: A faculty can teach the SAME course to DIFFERENT classes if they have no conflict, but cannot teach TWO classes at the SAME time.\n` : '';
  
  // Build room conflict section for prompt
  const roomConflictSection = Object.keys(roomConflicts).length > 0 ? `\n**🚨 ROOMS ALREADY OCCUPIED (MUST AVOID CONFLICTS):**\n\nThe following rooms are ALREADY occupied by other classes at these times. DO NOT assign them again at these slots:\n\n${Object.entries(roomConflicts).map(([slot, conflicts]) => {
    return `❌ ${slot}: ${conflicts.map(c => `${c.roomName} (ID: ${c.roomId})`).join(', ')} - OCCUPIED`;
  }).join('\n')}\n\n⚠️ CRITICAL: Choose DIFFERENT rooms that are NOT in this occupied list for that time slot.\n` : '';
  // Build faculty-course mapping for the prompt
  const facultyCourseMap = faculty.map(f => {
    const coursesList = Array.isArray(f.courses) 
      ? f.courses.map(c => `${c.name} (${c.code})`).join(', ')
      : 'No courses assigned';
    return `  - ${f.name} (ID: ${f._id}): Teaches [${coursesList}]`;
  }).join('\n');

  // Build room list with types
  const roomList = rooms.map(r => 
    `  - ${r.name} (ID: ${r._id}, Type: ${r.type}, Capacity: ${r.capacity})`
  ).join('\n');

  // Build course list with details
  const courseList = courses.map(c => 
    `  - ${c.name} (Code: ${c.code}, ID: ${c._id}, Type: ${c.type || 'lecture'}, Hours/Week: ${c.hoursPerWeek || 3})`
  ).join('\n');

  // Parse special activities if provided
  const specialActivitiesSection = specialActivities ? `\n**SPECIAL ACTIVITIES TO SCHEDULE (MANDATORY):**\n${specialActivities}\n\n🎯 **HOW TO SCHEDULE SPECIAL ACTIVITIES:**\n\n1. **Parse the requirement**: Extract number and type of activities (e.g., "2 library periods", "2 sports periods", "1 mentor period")\n\n2. **Allocate specific time slots**: Reserve specific day/period combinations for these activities\n   - Spread them across the week (different days if possible)\n   - Try to place Library periods consecutively for continuity\n   - Place Sports periods later in the day when possible\n\n3. **IMPORTANT - Use these EXACT courseId values for special activities:**\n   - For Library periods → courseId: "LIBRARY_PERIOD"\n   - For Sports periods → courseId: "SPORTS_PERIOD"\n   - For Mentor periods → courseId: "MENTOR_PERIOD"\n   - For any other activities → courseId: "SPECIAL_ACTIVITY"\n\n4. **For each special activity entry, create a schedule object with:**\n   - courseId: Use the special markers above (NOT real course IDs)\n   - facultyId: Pick ANY available faculty ID from the faculty list above (any free faculty)\n   - roomId: \n     * For Library → Use "seminar_room" or any available room\n     * For Sports → Use "auditorium" or any large room\n     * For Mentor → Use "seminar_room" or any available room\n   - day: Any day Monday-Friday\n   - period: Any period 1-8 (avoid lunch period 4)\n   - startTime & endTime: Use the correct time slot for that period\n\n5. **Include these in your 40-slot count**: Course slots + Special activity slots = 40 total\n\nExample: If "Include 2 library periods" → Create 2 entries with courseId="LIBRARY_PERIOD"\n\n` : '';

  const constraintsSection = constraints ? `\n**ADDITIONAL CONSTRAINTS & PREFERENCES:**\n${constraints}\n\nNote: Try to honor these constraints, but if they conflict with filling all 40 slots, PRIORITIZE filling all slots.\n` : '';

  const prompt = `You are an expert university timetable scheduler. Generate a complete weekly timetable for a specific class.

**Class Information:**
- Class Name: ${classData.name}
- Section: ${classData.section}
- Department: ${department.name} (${department.code})
- Semester: ${semester}
- Number of Students: ${classData.numberOfStudents}
- Academic Year: ${academicYear}

**Schedule Structure:**
- Days: ${DAYS.join(', ')} (5 days)
- Periods per Day: EXACTLY 8 periods (TOTAL: 40 SLOTS)
- **VALID PERIODS: 1, 2, 3, 4, 5, 6, 7, 8 ONLY** (period 9 or higher is INVALID)
- Time Slots:
${TIME_SLOTS.map(slot => `  Period ${slot.period}: ${slot.start}-${slot.end}`).join('\n')}
- Lunch Break (NO CLASSES): ${LUNCH_BREAK.start}-${LUNCH_BREAK.end} (between Period 4 and Period 5)

**Available Courses to Schedule:**
${courseList}

**Available Faculty:**
${facultyCourseMap}

**Available Rooms:**
${roomList}
${facultyConflictSection}
${roomConflictSection}
${specialActivitiesSection}
${constraintsSection}

**═══════════════════════════════════════════════════════════════════**
**ABSOLUTE MANDATORY REQUIREMENTS - NON-NEGOTIABLE:**
**═══════════════════════════════════════════════════════════════════**

🔴 **REQUIREMENT #1: EXACTLY 40 ENTRIES - NO EXCEPTIONS**
   - You MUST return EXACTLY 40 JSON objects in the array
   - One entry for EVERY period (1-8) on EVERY day (Mon-Fri)
   - ZERO empty slots allowed
   - If you return less than 40 entries, the generation is INVALID

🔴 **REQUIREMENT #2: HOW TO FILL ALL 40 SLOTS**
   After scheduling all required course hours, you MUST fill remaining slots with:
   
   A) **Special Activities (HIGHEST PRIORITY - if specified in Special Activities section above):**
      - Use the EXACT courseId markers: "LIBRARY_PERIOD", "SPORTS_PERIOD", "MENTOR_PERIOD"
      - Schedule the exact number requested (e.g., "2 library periods" = 2 entries with courseId="LIBRARY_PERIOD")
      - Assign real facultyId and roomId from the available lists
      - These will display as "Library Period", "Sports", "Mentor Session" with the assigned faculty name
   
   B) **Repeat Important Courses** (2-3 extra sessions per week):
      - Core subjects that need reinforcement
      - Subjects students find difficult
      - Practical/lab subjects that need more practice
   
   C) **Tutorial/Practice Sessions** (if no special activities specified):
      - Extra problem-solving sessions for math/technical subjects
      - Programming practice for CS/IT subjects
      - Language practice for communication courses
      - Study Hall, Project Work sessions

🔴 **REQUIREMENT #3: FACULTY & ROOM ASSIGNMENT**
   - Lab courses → MUST use "lab" type rooms
   - Lecture courses → Use "seminar_room" or "auditorium"
   - Faculty CAN teach the same course multiple times per week
   - For special activities, use ANY available faculty and room
   - NEVER leave a slot unfilled due to "no perfect match" - use best available

🔴 **REQUIREMENT #4: NO CONFLICTS - ABSOLUTELY CRITICAL**
   
   **BEFORE assigning ANY faculty or room to a time slot:**
   
   A) **CHECK "FACULTY ALREADY SCHEDULED" section above**:
      - If you see a faculty ID listed at a specific day/period (e.g., Monday-P3)
      - That faculty is UNAVAILABLE and CANNOT be assigned to that slot
      - You MUST choose a DIFFERENT faculty from the available list
      - Example: If "Staff 4 (ID: 123)" is listed at Monday-P6, DO NOT use facultyId "123" at Monday-P6
   
   B) **CHECK "ROOMS ALREADY OCCUPIED" section above**:
      - If you see a room ID listed at a specific day/period
      - That room is OCCUPIED and CANNOT be assigned to that slot
      - You MUST choose a DIFFERENT room from the available list
   
   C) **General Rules**:
      - Same faculty CANNOT teach 2 different classes at same time
      - Same room CANNOT host 2 different classes at same time
      - Faculty CAN teach same class multiple periods in a day
      - Faculty CAN teach different sections of same course if no time conflict

🔴 **REQUIREMENT #5: DISTRIBUTION**
   - Spread courses across the week when possible
   - But FILLING ALL 40 SLOTS is priority #1
   - Perfect distribution is secondary

**═══════════════════════════════════════════════════════════════════**

**OUTPUT FORMAT - CRITICAL:**
Return ONLY a JSON array with EXACTLY 40 objects. NO markdown, NO explanations, ONLY the JSON array.

Each object structure:
{
  "courseId": "exact course ID from above (or any ID for special activities)",
  "facultyId": "exact faculty ID from above",
  "roomId": "exact room ID from above",
  "day": "Monday|Tuesday|Wednesday|Thursday|Friday",
  "period": 1-8 ONLY (NEVER use 9 or higher),
  "startTime": "HH:MM",
  "endTime": "HH:MM"
}

**CRITICAL VALIDATION BEFORE RETURNING:**
✓ Array has EXACTLY 40 entries? (Not 39, not 41, EXACTLY 40)
✓ All periods 1-8 covered for all 5 days? (5 days × 8 periods = 40)
✓ EVERY entry has period between 1-8? (NO period 9 or higher allowed)
✓ All required courses scheduled for their minimum hours?
✓ Remaining slots filled with extras/activities?
✓ **NO FACULTY CONFLICTS**: Every facultyId/day/period combination checked against "FACULTY ALREADY SCHEDULED" section?
✓ **NO ROOM CONFLICTS**: Every roomId/day/period combination checked against "ROOMS ALREADY OCCUPIED" section?
✓ Lab courses in lab rooms, lectures in appropriate rooms?

NOW GENERATE THE COMPLETE 40-ENTRY TIMETABLE:`;

  console.log('Sending request to Gemini AI...');
  
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  
  const responseText = result.text;
  console.log('AI Response received');
  
  const schedule = parseAIResponse(responseText);

  if (schedule.length === 0) {
    throw new Error(`AI failed to generate a valid schedule for ${classData.name}. Response was empty or invalid JSON.`);
  }
  
  console.log(`AI generated ${schedule.length} schedule entries for ${classData.name}`);

  // Validate and filter schedule entries
  const validSchedule = schedule.filter(entry => {
    // Check if period is valid (1-8 only)
    if (!entry.period || entry.period < 1 || entry.period > 8) {
      console.warn(`⚠️ Filtering out invalid entry with period ${entry.period}`);
      return false;
    }
    // Check if day is valid
    if (!DAYS.includes(entry.day)) {
      console.warn(`⚠️ Filtering out invalid entry with day ${entry.day}`);
      return false;
    }
    return true;
  });

  console.log(`Validated ${validSchedule.length} valid entries (filtered ${schedule.length - validSchedule.length} invalid)`);

  // If we got more than 40, take only first 40
  const finalSchedule = validSchedule.slice(0, 40);

  if (finalSchedule.length < 40) {
    console.warn(`⚠️ WARNING: Only ${finalSchedule.length} valid entries generated (expected 40)`);
  }

  // Enrich schedule with names and codes
  const enrichedSchedule = finalSchedule.map(entry => {
    // Check if this is a special activity (using special courseId markers)
    const specialActivityMap = {
      'LIBRARY_PERIOD': { name: 'Library Period', code: 'LIB' },
      'SPORTS_PERIOD': { name: 'Sports', code: 'SPT' },
      'MENTOR_PERIOD': { name: 'Mentor Session', code: 'MNT' },
      'SPECIAL_ACTIVITY': { name: 'Special Activity', code: 'ACT' }
    };
    
    const isSpecialActivity = specialActivityMap[entry.courseId];
    
    let courseName, courseCode;
    if (isSpecialActivity) {
      // Use special activity name
      courseName = isSpecialActivity.name;
      courseCode = isSpecialActivity.code;
    } else {
      // Regular course - look up from courses
      const course = courses.find(c => String(c._id) === entry.courseId);
      courseName = course ? course.name : 'Unknown';
      courseCode = course ? course.code : 'N/A';
    }
    
    const facultyMember = faculty.find(f => String(f._id) === entry.facultyId);
    const room = rooms.find(r => String(r._id) === entry.roomId);
    
    return {
      ...entry,
      courseName,
      courseCode,
      facultyName: facultyMember ? facultyMember.name : 'Unknown',
      roomName: room ? room.name : 'Unknown',
    };
  });

  // Detect and log conflicts with existing timetables (faculty and room)
  const detectedConflicts = [];
  enrichedSchedule.forEach(entry => {
    const slot = `${entry.day}-P${entry.period}`;
    
    // Check faculty conflicts
    const conflictingFaculty = facultyConflicts[slot];
    if (conflictingFaculty) {
      const conflict = conflictingFaculty.find(c => c.facultyId === entry.facultyId);
      if (conflict) {
        const conflictMsg = `${entry.facultyName} assigned to ${entry.courseName} at ${slot}, but already teaching ${conflict.courseName} in ${conflict.className}`;
        console.warn(`⚠️ FACULTY CONFLICT: ${conflictMsg}`);
        detectedConflicts.push({
          type: 'faculty_conflict',
          message: conflictMsg,
          entries: [entry.facultyId, slot]
        });
      }
    }
    
    // Check room conflicts
    const conflictingRooms = roomConflicts[slot];
    if (conflictingRooms) {
      const conflict = conflictingRooms.find(c => c.roomId === entry.roomId);
      if (conflict) {
        const conflictMsg = `${entry.roomName} assigned to ${entry.courseName} at ${slot}, but already occupied by ${conflict.courseName} in ${conflict.className}`;
        console.warn(`⚠️ ROOM CONFLICT: ${conflictMsg}`);
        detectedConflicts.push({
          type: 'room_conflict',
          message: conflictMsg,
          entries: [entry.roomId, slot]
        });
      }
    }
  });
  
  if (detectedConflicts.length > 0) {
    console.warn(`\n🚨 DETECTED ${detectedConflicts.length} CONFLICTS:\n${detectedConflicts.map(c => c.message).join('\n')}\n`);
  } else {
    console.log('✓ No conflicts detected');
  }

  // Calculate metadata
  const totalHours = enrichedSchedule.length;
  const availableSlots = DAYS.length * TIME_SLOTS.length;
  const utilizationRate = Math.round((totalHours / availableSlots) * 100);

  // Create and save timetable
  const timetableData = {
    name: `${classData.name} - ${classData.section} - Sem ${semester}`,
    department: department._id,
    class: classData._id,
    semester: String(semester),
    year: parseInt(academicYear),
    schedule: enrichedSchedule,
    conflicts: detectedConflicts,
    status: detectedConflicts.length > 0 ? 'draft' : 'draft',
    metadata: {
      totalHours,
      utilizationRate,
      conflictCount: detectedConflicts.length
    }
  };

  const timetable = new Timetable(timetableData);
  const created = await timetable.save();

  // Create notifications for each faculty assigned to this class timetable
  const facultyAllocations = {};
  enrichedSchedule.forEach(entry => {
    if (entry.facultyId) {
      if (!facultyAllocations[entry.facultyId]) {
        facultyAllocations[entry.facultyId] = {
          facultyName: entry.facultyName,
          courses: new Set(),
          slots: [],
        };
      }
      facultyAllocations[entry.facultyId].courses.add(entry.courseName || entry.courseCode);
      facultyAllocations[entry.facultyId].slots.push(`${entry.day} P${entry.period}`);
    }
  });

  for (const [fId, alloc] of Object.entries(facultyAllocations)) {
    try {
      await new Notification({
        title: "Class Allocated",
        message: `You have been allocated ${alloc.courses.size} course(s) (${[...alloc.courses].join(', ')}) in ${classData.name} - ${classData.section} across ${alloc.slots.length} period(s).`,
        type: "info",
        facultyId: fId,
      }).save();
    } catch (e) {
      console.warn(`Failed to create allocation notification for faculty ${fId}:`, e.message);
    }
  }
  
  return created;
}

/**
 * Get available (free) faculty for a specific time slot
 * Request: { departmentId, semester, day, period }
 * Returns: Array of available faculty members
 */
export async function getAvailableFaculty(request) {
  try {
    const { departmentId, semester, day, period } = request;
    
    if (!departmentId || !semester || !day || !period) {
      throw new Error('Department ID, semester, day, and period are required.');
    }

    // Get all faculty in the department
    const allFaculty = await Faculty.find({
      departments: departmentId
    }).populate('courses', 'name code');

    // Get all timetables for this department and semester
    const timetables = await Timetable.find({
      department: departmentId,
      semester: String(semester),
      status: { $in: ['draft', 'published'] }
    });

    // Find faculty who are teaching at the requested time slot
    const busyFacultyIds = new Set();
    
    timetables.forEach(timetable => {
      timetable.schedule.forEach(entry => {
        if (entry.day === day && entry.period === Number(period)) {
          busyFacultyIds.add(entry.facultyId);
        }
      });
    });

    // Filter available faculty (those not in the busy set)
    const availableFaculty = allFaculty.filter(f => 
      !busyFacultyIds.has(f._id.toString())
    );

    return availableFaculty.map(f => ({
      _id: f._id,
      name: f.name,
      email: f.email,
      specialization: f.specialization,
      courses: f.courses
    }));

  } catch (error) {
    console.error('Error finding available faculty:', error);
    throw error;
  }
}
