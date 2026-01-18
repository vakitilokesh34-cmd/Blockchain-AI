/**
 * Weilliptic SDK - Workflow Encryption & Privacy Layer
 * Provides end-to-end encryption for sensitive student data
 * Integrates with Icarus for workflow visualization
 */

const crypto = require('crypto');

class WeillipticSDK {
  constructor() {
    this.encryptionAlgorithm = 'aes-256-cbc';
    this.hashAlgorithm = 'sha256';
  }

  /**
   * Generate a secure hash for student identification
   * Used for privacy-preserving blockchain logs
   */
  hashStudentId(studentId) {
    return crypto
      .createHash(this.hashAlgorithm)
      .update(studentId.toString())
      .digest('hex');
  }

  /**
   * Encrypt sensitive data before transmission
   */
  encryptData(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.encryptionAlgorithm,
      Buffer.from(key.padEnd(32, '0').substring(0, 32)),
      iv
    );

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      algorithm: this.encryptionAlgorithm
    };
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv(
      this.encryptionAlgorithm,
      Buffer.from(key.padEnd(32, '0').substring(0, 32)),
      Buffer.from(iv, 'hex')
    );

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Create a workflow execution context
   * This tracks the workflow through Icarus
   */
  createExecutionContext(workflowName, trigger) {
    const executionId = `ICARUS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      executionId,
      workflowName,
      trigger,
      startTime: new Date().toISOString(),
      status: 'RUNNING',
      steps: []
    };
  }

  /**
   * Log a step execution in the workflow
   */
  logStep(context, stepId, stepData) {
    const step = {
      id: stepId,
      timestamp: new Date().toISOString(),
      status: stepData.status || 'COMPLETED',
      data: stepData.data || {},
      error: stepData.error || null
    };

    context.steps.push(step);
    return step;
  }

  /**
   * Complete a workflow execution
   */
  completeExecution(context, result) {
    context.status = result.success ? 'COMPLETED' : 'FAILED';
    context.endTime = new Date().toISOString();
    context.result = result;

    return context;
  }

  /**
   * Generate a blockchain-compatible proof
   * Creates a merkle root of the workflow execution
   */
  generateExecutionProof(context) {
    const stepHashes = context.steps.map(step => {
      return crypto
        .createHash(this.hashAlgorithm)
        .update(JSON.stringify(step))
        .digest('hex');
    });

    // Simple merkle root (for production, use proper merkle tree)
    const proof = crypto
      .createHash(this.hashAlgorithm)
      .update(stepHashes.join(''))
      .digest('hex');

    return {
      proof,
      stepCount: stepHashes.length,
      algorithm: this.hashAlgorithm,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format workflow for Icarus visualization
   */
  formatForIcarus(workflow, executionContext) {
    return {
      name: workflow.name,
      executionId: executionContext.executionId,
      trigger: workflow.trigger,
      steps: workflow.steps.map((step, index) => {
        const execution = executionContext.steps[index];
        return {
          id: step.id,
          service: step.service,
          description: step.description,
          condition: step.condition || null,
          status: execution ? execution.status : 'PENDING',
          executedAt: execution ? execution.timestamp : null,
          error: execution ? execution.error : null
        };
      }),
      status: executionContext.status,
      startTime: executionContext.startTime,
      endTime: executionContext.endTime || null
    };
  }
}

module.exports = new WeillipticSDK();
