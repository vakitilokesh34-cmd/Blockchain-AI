# 📱 Twilio WhatsApp Messaging Workflow

This document explains the complete workflow for sending WhatsApp messages through Twilio in your Blockchain-First Smart University system.

## 🎯 Overview

The Twilio messaging workflow is integrated into multiple attendance and assignment tracking workflows, providing automated WhatsApp notifications to students based on specific conditions.

---

## 📋 Workflow Definitions

### 1. **Low Attendance Workflow** (`attendance_low_75`)
Detects students below 75% attendance and sends notifications.

**Trigger**: Natural language command (e.g., "Check attendance and notify students under 75%")

**Twilio Step**:
```javascript
{
    id: "SEND_NOTIFICATIONS",
    service: "Twilio",
    description: "Send WhatsApp notifications to students",
    action: "send_message",
    parallel: true
}
```

### 2. **Critical Attendance Workflow** (`attendance_critical_60`)
Handles students below 65% attendance with escalated intervention including urgent notifications and scheduled meetings.

**Twilio Steps**:
```javascript
{
    id: "SEND_URGENT_NOTIFICATIONS",
    service: "Twilio",
    description: "Send urgent WhatsApp notifications",
    action: "send_message",
    priority: "high"
},
{
    id: "NOTIFY_ADMINISTRATORS",
    service: "Twilio",
    description: "Alert administrators about critical cases",
    action: "send_message"
}
```

### 3. **Assignment Tracking Workflow** (`assignment_tracking`)
Tracks and notifies students with incomplete assignments.

**Twilio Step**:
```javascript
{
    id: "SEND_REMINDERS",
    service: "Twilio",
    description: "Send assignment reminders",
    action: "send_message"
}
```

---

## 🔧 Technical Implementation

### **Twilio Service** (`backend/services/twilioService.js`)

```javascript
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_WHATSAPP_FROM; // e.g., 'whatsapp:+14155238886'

const client = new twilio(accountSid, authToken);

const sendWhatsAppMessage = async (to, body) => {
    try {
        const messageOptions = {
            body: body,
            from: fromPhone,
            to: `whatsapp:${to}`
        };

        if (process.env.TWILIO_STATUS_CALLBACK_URL) {
            messageOptions.statusCallback = process.env.TWILIO_STATUS_CALLBACK_URL;
        }

        const message = await client.messages.create(messageOptions);
        console.log(`WhatsApp sent to ${to}: ${message.sid}`);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error(`Failed to send WhatsApp to ${to}:`, error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendWhatsAppMessage };
```

---

## 📨 Message Templates

### **Attendance < 75% (Warning)**
```
Alert: Your attendance is ${attendance}%, which is below the 75% requirement. 
Please ensure you attend upcoming classes.
```

### **Attendance < 65% (Critical - Without Meeting)**
```
URGENT: Your attendance is ${attendance}%, which is critically low (<65%). 
Please contact administration immediately to schedule a review.
```

### **Attendance < 65% (Critical - With Meeting)**
```
URGENT: Your attendance is ${attendance}%, which is critically low (<65%). 
A mandatory Google Meet review has been scheduled for ${scheduledTime}. 
Join here: ${meetingLink}
```

### **Assignment Reminder**
```
Reminder: Assignment '${assignmentTitle}' for student ${studentName} is not completed. 
Please submit it soon.
```

---

## 🔄 Complete Workflow Execution Flow

### **Example: Low Attendance Workflow**

```
1. FETCH_STUDENTS
   ├─ Query: SELECT * FROM students WHERE attendance < 75
   └─ Result: List of at-risk students

2. LOG_BLOCKCHAIN (Blockchain-First)
   ├─ Log action to Weil Chain
   └─ Generate transaction hashes

3. HASH_STUDENT_IDS
   ├─ Privacy-preserving SHA-256 hashes
   └─ Protect student identity

4. FILTER_AT_RISK
   └─ Filter students by threshold

5. SCHEDULE_MEETINGS (if attendance < 65%)
   ├─ Create Google Calendar events
   └─ Generate Meet links

6. SEND_NOTIFICATIONS ← TWILIO STEP
   ├─ For each student:
   │  ├─ Build message based on condition
   │  ├─ Call twilioService.sendWhatsAppMessage()
   │  └─ Log result (success/failure)
   └─ Track notification metrics

7. LOG_DATABASE
   └─ Record notification actions

8. GENERATE_PROOF
   └─ Cryptographic execution proof
```

---

## 🔑 Environment Configuration

Required environment variables in `.env`:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Optional: Status callback for delivery tracking
TWILIO_STATUS_CALLBACK_URL=https://yourdomain.com/twilio/status
```

---

## 💻 Workflow Controller Implementation

### **Sending Notifications** (from `workflowController.js`)

```javascript
// Step 6: Send notifications
const notifyStepId = 'SEND_NOTIFICATIONS';
icarusService.logStep(executionId, notifyStepId, { status: 'RUNNING' });

for (const student of atRiskStudents) {
    let messageBody = '';

    // Condition 2: < 65% -> Notify every student + Meeting
    if (student.attendance < 65) {
        messageBody = `URGENT: Your attendance is ${student.attendance}%, which is critically low (<65%).`;
        if (meetings.has(student.id)) {
            const meeting = meetings.get(student.id);
            messageBody += ` A mandatory Google Meet review has been scheduled for ${meeting.scheduledTime}. Join here: ${meeting.meetingLink}`;
        } else {
            messageBody += ` Please contact administration immediately to schedule a review.`;
        }
    }
    // Condition 1: < 75% -> Notify
    else if (student.attendance < 75) {
        messageBody = `Alert: Your attendance is ${student.attendance}%, which is below the 75% requirement. Please ensure you attend upcoming classes.`;
    }

    console.log(`[DEBUG] Final Message Body for ${student.name}:`, messageBody);

    let notificationResult = { success: false };
    try {
        if (!student.phone) throw new Error('Student has no phone number');

        if (process.env.TWILIO_ACCOUNT_SID) {
            notificationResult = await twilioService.sendWhatsAppMessage(student.phone, messageBody);
        } else {
            console.log(`[MOCK-WA] To: ${student.phone}, Msg: ${messageBody}`);
            notificationResult = { success: true, sid: 'mock-sid' };
        }
    } catch (e) {
        console.error(`[NOTIFICATION] Error for ${student.name}:`, e.message);
        notificationResult = { success: false, error: e.message };
    }

    results.push({
        student: student.name,
        attendance: student.attendance,
        notified: notificationResult.success,
        notificationWarning: notificationResult.warning || null,
        notificationError: notificationResult.error || null,
        meetingScheduled: meetings.get(student.id)?.meetingLink || null,
        hash: student.hash
    });
}

icarusService.logStep(executionId, notifyStepId, {
    status: 'COMPLETED',
    data: {
        sent: results.filter(r => r.notified).length,
        failed: results.filter(r => !r.notified).length
    }
});
```

---

## 📊 Tracking & Monitoring

### **Status Callback Webhook**

The server includes a webhook endpoint for Twilio delivery status tracking:

```javascript
// server.js
app.post("/twilio/status", (req, res) => {
  const { MessageSid, MessageStatus, To } = req.body;
  console.log(`[Twilio Webhook] Status Update: SID=${MessageSid}, Status=${MessageStatus}, To=${To}`);
  res.sendStatus(200);
});
```

### **Icarus Integration**

All Twilio notifications are tracked through Icarus for real-time visualization:

- **Step Start**: `icarusService.logStep(executionId, 'SEND_NOTIFICATIONS', { status: 'RUNNING' })`
- **Step Complete**: `icarusService.logStep(executionId, 'SEND_NOTIFICATIONS', { status: 'COMPLETED', data: {...} })`

---

## 🎯 Workflow Triggers

### **Natural Language Commands**

Users can trigger workflows via the dashboard with commands like:

- "Check attendance and notify students under 75%"
- "Identify at-risk students and run governance"
- "Send assignment reminders to students"
- "Check for overdue assignments and send reminders"

### **LLM Parsing**

The system uses `llmService.parseCommand()` to match natural language to specific workflows:

```javascript
const workflowMatch = await llmService.parseCommand(command, workflows);
// Returns: { workflowId: 'attendance_low_75', params: {...} }
```

---

## 🔍 Key Features

### ✅ **Privacy-Preserving**
- Student IDs are hashed using SHA-256 before logging
- WhatsApp numbers are protected

### ✅ **Blockchain-First**
- All actions are logged to Weil Chain BEFORE notifications
- Immutable audit trail for compliance

### ✅ **Conditional Logic**
- Different messages based on attendance thresholds
- Escalated interventions for critical cases

### ✅ **Meeting Integration**
- Automatic Google Meet scheduling for < 65% attendance
- Meeting links included in WhatsApp messages

### ✅ **Error Handling**
- Graceful fallback to mock mode if Twilio not configured
- Individual student failures don't stop the workflow
- Detailed error logging

---

## 📱 Testing

### **Mock Mode** (Without Twilio Credentials)

If `TWILIO_ACCOUNT_SID` is not set, the system runs in mock mode:

```javascript
console.log(`[MOCK-WA] To: ${student.phone}, Msg: ${messageBody}`);
notificationResult = { success: true, sid: 'mock-sid' };
```

### **Testing with Real Credentials**

1. Set up Twilio WhatsApp sandbox or production number
2. Add credentials to `.env`
3. Use test phone numbers from Twilio console
4. Monitor delivery via Twilio dashboard

---

## 🚀 Usage Example

### **Via API**

```bash
POST http://localhost:3002/api/workflow/run
Content-Type: application/json

{
  "command": "Check attendance and notify students under 75%"
}
```

### **Response**

```json
{
  "status": "success",
  "executionId": "exec_1705561920123_abc123",
  "workflowName": "Low Attendance Detection & Notification",
  "result": {
    "action": "Attendance monitoring (threshold: 75%)",
    "affectedCount": 3,
    "successCount": 3,
    "failureCount": 0,
    "blockchainTxHashes": ["0xabc...", "0xdef..."],
    "proof": "proof_xyz...",
    "details": [
      {
        "student": "Bob Smith",
        "attendance": 62,
        "notified": true,
        "meetingScheduled": "https://meet.google.com/xyz-abc-def",
        "hash": "a1b2c3..."
      }
    ]
  },
  "visualizationUrl": "/api/workflow/execution/exec_1705561920123_abc123"
}
```

---

## 🛠️ Troubleshooting

### **Common Issues**

1. **"Failed to send WhatsApp"**
   - Verify Twilio credentials in `.env`
   - Check phone number format: `+1234567890`
   - Ensure WhatsApp sandbox is approved (for testing)

2. **"Student has no phone number"**
   - Update student record in database with valid phone

3. **Status callback not working**
   - Verify `TWILIO_STATUS_CALLBACK_URL` is publicly accessible
   - Check webhook logs in Twilio console

---

## 📚 Related Files

- **Workflow Definitions**: `weilliptic/attendanceWorkflow.cjs`
- **Twilio Service**: `backend/services/twilioService.js`
- **Workflow Controller**: `backend/controllers/workflowController.js`
- **Icarus Service**: `backend/services/icarusService.js`
- **Server Webhook**: `backend/server.js`

---

## 📝 Summary

The Twilio WhatsApp workflow provides:

1. **Automated notifications** based on attendance and assignment conditions
2. **Blockchain-first audit trail** for all communications
3. **Privacy-preserving** student identity protection
4. **Real-time tracking** via Icarus visualization
5. **Conditional messaging** with escalation support
6. **Meeting integration** with Google Calendar/Meet

This workflow is a critical component of the Blockchain-First Smart University system, ensuring students are promptly notified of academic issues while maintaining full transparency and auditability.
