# Weilliptic SDK & Icarus Workflow Integration

## Overview

This Smart Autonomous University Agent integrates two powerful systems:

1. **Weilliptic SDK** - Privacy-preserving encryption and workflow management
2. **Icarus** - Real-time workflow visualization and execution tracking

## Architecture

```
Frontend (Next.js)
    ↓
Backend API (Express)
    ↓
Icarus Service → Weilliptic SDK → Blockchain Service
    ↓                ↓                  ↓
Workflow Tracking  Encryption      Smart Contracts
```

## Weilliptic SDK Features

### 1. Privacy-Preserving Hashing
- **SHA-256 hashing** for student IDs before blockchain logging
- Ensures GDPR/FERPA compliance
- Irreversible transformation prevents data exposure

```javascript
const studentHash = weillipticSDK.hashStudentId(studentId);
// Output: "a3c5e8f1..." (64-character hex string)
```

### 2. Data Encryption
- **AES-256-CBC** encryption for sensitive data
- Unique initialization vectors (IV) for each encryption
- Secure key management

```javascript
const encrypted = weillipticSDK.encryptData(data, encryptionKey);
// Returns: { encrypted, iv, algorithm }
```

### 3. Execution Tracking
- Create execution contexts for each workflow run
- Track individual step completions
- Generate cryptographic proofs of execution

```javascript
const context = weillipticSDK.createExecutionContext(workflowName, trigger);
weillipticSDK.logStep(context, stepId, stepData);
const proof = weillipticSDK.generateExecutionProof(context);
```

### 4. Blockchain Integration
- Merkle tree-based execution proofs
- Smart contract compatibility
- Immutable audit trails

## Icarus Workflow System

### Workflow Definition

Workflows are defined in `weilliptic/attendanceWorkflow.js`:

```javascript
{
    name: "Low Attendance Detection & Notification",
    id: "attendance_low_75",
    trigger: "natural_language",
    steps: [
        {
            id: "FETCH_STUDENTS",
            service: "Supabase",
            description: "Fetch all student records",
            action: "database_query"
        },
        {
            id: "HASH_STUDENT_IDS",
            service: "Weilliptic",
            description: "Generate privacy-preserving hashes",
            action: "encryption"
        },
        // ... more steps
    ]
}
```

### Available Workflows

1. **Low Attendance Workflow** (`attendance_low_75`)
   - Threshold: 75% attendance
   - Actions: Notify students via WhatsApp
   - Blockchain logging

2. **Critical Attendance Workflow** (`attendance_critical_60`)
   - Threshold: 60% attendance
   - Actions: Urgent notifications + meeting scheduling
   - Administrator alerts

3. **Assignment Tracking Workflow** (`assignment_tracking`)
   - Track incomplete assignments
   - Send reminders
   - Calendar integration

4. **Performance Review Workflow** (`performance_review`)
   - Comprehensive performance analysis
   - Report generation
   - Review meeting scheduling

### Execution Flow

1. **User Input**: Natural language command
   ```
   "Check attendance and notify students under 75%"
   ```

2. **Command Parsing**: AI-driven parsing identifies workflow
   ```javascript
   { workflowId: 'attendance_low_75', params: { threshold: 75 } }
   ```

3. **Icarus Execution**: Step-by-step tracking
   ```
   FETCH_STUDENTS → HASH_STUDENT_IDS → FILTER_AT_RISK → 
   SEND_NOTIFICATIONS → LOG_DATABASE → LOG_BLOCKCHAIN → GENERATE_PROOF
   ```

4. **Frontend Visualization**: Real-time step display with status

## API Endpoints

### Workflow Execution
```
POST /api/workflow/run
Body: { "command": "Check attendance under 75%" }
Response: {
    "status": "success",
    "executionId": "ICARUS_1737046234_abc123",
    "workflowName": "Low Attendance Detection & Notification",
    "result": { ... }
}
```

### Execution Tracking
```
GET /api/workflow/execution/:executionId
GET /api/workflow/executions/active
GET /api/workflow/executions/history?limit=50
```

### Workflows & Metrics
```
GET /api/workflow/list
GET /api/workflow/metrics
```

## Security Features

### 1. **Privacy by Design**
- Student IDs never stored in plain text on blockchain
- SHA-256 hashing before any blockchain operation
- Zero-knowledge proofs for execution verification

### 2. **End-to-End Encryption**
- AES-256 encryption for data at rest
- TLS for data in transit
- Secure key rotation

### 3. **Audit Trail**
- Every action logged with timestamp
- Blockchain immutability
- Cryptographic proof generation

### 4. **Access Control**
- Role-based permissions
- API key authentication
- Rate limiting

## Example Usage

### Backend: Execute Workflow

```javascript
const icarusService = require('./services/icarusService');
const weillipticSDK = require('../weilliptic/sdk');

// Start execution
const execution = icarusService.startExecution('attendance_low_75', 'manual');

// Execute steps
icarusService.logStep(execution.executionId, 'FETCH_STUDENTS', { 
    status: 'COMPLETED', 
    data: { count: 10 } 
});

// Complete with proof
const result = icarusService.completeExecution(execution.executionId, { 
    success: true 
});
console.log(result.proof); // Cryptographic proof
```

### Frontend: Display Execution

```typescript
import { runWorkflow, getExecutionHistory } from './services/api';

// Run workflow
const result = await runWorkflow(command);

// Get execution history
const history = await getExecutionHistory();

// Display step-by-step visualization
{history[0].steps.map(step => (
    <div key={step.id}>
        {step.id} - {step.status} - {step.service}
    </div>
))}
```

## Blockchain Integration

### Smart Contract Deployment

1. **Deploy WorkflowLog Contract**
   ```bash
   cd smart-contracts
   npx hardhat run scripts/deploy.js --network sepolia
   ```

2. **Update Environment Variables**
   ```env
   WORKFLOW_LOG_CONTRACT_ADDRESS=0x...
   RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   PRIVATE_KEY=your_private_key
   ```

3. **Verify Integration**
   ```bash
   # The backend will automatically use the contract
   # Check logs for: "[BLOCKCHAIN] Connected to WorkflowLog contract"
   ```

### Transaction Structure

Each workflow action creates a blockchain transaction:
- **Student Hash** (bytes32): Privacy-preserving identifier
- **Action** (string): Type of workflow action
- **Execution ID** (string): Unique execution identifier
- **Timestamp** (uint256): Block timestamp

## Monitoring & Metrics

### Icarus Metrics

Access at `/api/workflow/metrics`:

```json
{
    "totalExecutions": 42,
    "activeExecutions": 2,
    "successfulExecutions": 39,
    "failedExecutions": 3,
    "successRate": "92.86%",
    "averageDuration": "2341ms"
}
```

### Execution History

View past executions with full step details:
- Execution ID
- Workflow name
- Start/end time
- Step-by-step status
- Results and proofs

## Development

### Running Locally

1. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Test Workflow**
   - Navigate to http://localhost:3000
   - Enter command: "Check attendance under 75%"
   - View Icarus execution steps in real-time

### Adding New Workflows

1. **Define Workflow** in `weilliptic/attendanceWorkflow.js`
2. **Implement Execution** in `backend/controllers/workflowController.js`
3. **Add Parsing Logic** in `parseCommand()` function
4. **Test End-to-End**

## Future Enhancements

- [ ] Real-time WebSocket updates for execution progress
- [ ] Mermaid diagram visualization in frontend
- [ ] Advanced analytics dashboard
- [ ] Multi-signature workflow approvals
- [ ] Decentralized execution on IPFS

## License

MIT

## Contact

For questions or support, contact the development team.
