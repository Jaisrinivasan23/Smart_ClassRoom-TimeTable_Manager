import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testNotifications() {
  try {
    console.log('🧪 Testing Leave Request & Notification Flow\n');

    // Step 1: Get faculty list
    console.log('📋 Step 1: Getting faculty list...');
    const facultyRes = await axios.get(`${API_URL}/faculty`);
    const faculty = facultyRes.data;
    
    if (faculty.length < 2) {
      console.error('❌ Need at least 2 faculty members');
      return;
    }

    const facultyId = faculty[0]._id;
    const substituteId = faculty[1]._id;
    
    console.log(`✅ Faculty 1 (Requester): ${faculty[0].name} (${facultyId})`);
    console.log(`✅ Faculty 2 (Substitute): ${faculty[1].name} (${substituteId})\n`);

    // Step 2: Create leave request
    console.log('📋 Step 2: Creating leave request...');
    const leaveRes = await axios.post(`${API_URL}/leave-requests`, {
      facultyId: facultyId,
      date: '2026-03-20',
      day: 'Friday',
      period: 3,
      reason: 'Medical appointment'
    });

    if (!leaveRes.data.leaveRequest || !leaveRes.data.leaveRequest._id) {
      console.error('❌ Failed to create leave request');
      console.error(leaveRes.data);
      return;
    }

    const leaveRequestId = leaveRes.data.leaveRequest._id;
    console.log(`✅ Leave Request Created: ${leaveRequestId}\n`);

    // Step 3: Approve leave request
    console.log('📋 Step 3: Approving leave request...');
    const approveRes = await axios.put(`${API_URL}/leave-requests/${leaveRequestId}/approve`, {
      substituteId: substituteId,
      approvedBy: 'Admin'
    });

    console.log(`✅ Leave Request Approved!\n`);

    // Step 4: Check notifications sent
    console.log('✅ TEST COMPLETE!\n');
    console.log('📧 Emails should be sent to: jaiisrinivasan2305@gmail.com');
    console.log('📱 SMS should be sent to: +917010107299');
    console.log('\n⏳ Check your email and SMS in 5-10 seconds...');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testNotifications();
