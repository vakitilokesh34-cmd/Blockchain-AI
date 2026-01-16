/**
 * Icarus Service - Workflow Visualization & Execution
 * Provides real-time workflow execution tracking and visualization
 */

const weillipticSDK = require('../../weilliptic/sdk');
const { getWorkflow } = require('../../weilliptic/attendanceWorkflow');

class IcarusService {
  constructor() {
    this.activeExecutions = new Map();
    this.executionHistory = [];
  }

  /**
   * Start a new workflow execution
   */
  startExecution(workflowId, trigger = 'manual', metadata = {}) {
    const workflow = getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const context = weillipticSDK.createExecutionContext(workflow.name, trigger);
    context.workflow = workflow;
    context.metadata = metadata;

    this.activeExecutions.set(context.executionId, context);

    console.log(`[ICARUS] Started execution: ${context.executionId} for workflow: ${workflow.name}`);

    return context;
  }

  /**
   * Log a step's execution in the workflow
   */
  logStep(executionId, stepId, stepData) {
    const context = this.activeExecutions.get(executionId);

    if (!context) {
      console.warn(`[ICARUS] Execution not found: ${executionId}`);
      return null;
    }

    const step = weillipticSDK.logStep(context, stepId, stepData);

    console.log(`[ICARUS] Step completed: ${stepId} in ${executionId} - Status: ${step.status}`);

    return step;
  }

  /**
   * Complete a workflow execution
   */
  completeExecution(executionId, result) {
    const context = this.activeExecutions.get(executionId);

    if (!context) {
      console.warn(`[ICARUS] Execution not found: ${executionId}`);
      return null;
    }

    const completedContext = weillipticSDK.completeExecution(context, result);

    // Generate execution proof
    const proof = weillipticSDK.generateExecutionProof(completedContext);
    completedContext.proof = proof;

    // Move to history
    this.executionHistory.push(completedContext);
    this.activeExecutions.delete(executionId);

    console.log(`[ICARUS] Execution completed: ${executionId} - Status: ${completedContext.status}`);

    return completedContext;
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId) {
    // Check active executions first
    const active = this.activeExecutions.get(executionId);
    if (active) {
      return {
        ...this.formatExecutionForFrontend(active),
        isActive: true
      };
    }

    // Check history
    const historical = this.executionHistory.find(e => e.executionId === executionId);
    if (historical) {
      return {
        ...this.formatExecutionForFrontend(historical),
        isActive: false
      };
    }

    return null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions() {
    return Array.from(this.activeExecutions.values()).map(context =>
      this.formatExecutionForFrontend(context)
    );
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit = 50) {
    return this.executionHistory
      .slice(-limit)
      .reverse()
      .map(context => this.formatExecutionForFrontend(context));
  }

  /**
   * Format execution context for frontend consumption
   */
  formatExecutionForFrontend(context) {
    const workflow = context.workflow;

    return {
      executionId: context.executionId,
      workflowName: context.workflowName,
      workflowId: workflow?.id,
      trigger: context.trigger,
      status: context.status,
      startTime: context.startTime,
      endTime: context.endTime,
      duration: context.endTime ?
        new Date(context.endTime) - new Date(context.startTime) :
        Date.now() - new Date(context.startTime).getTime(),
      steps: context.steps.map((step, index) => {
        const workflowStep = workflow?.steps.find(s => s.id === step.id);
        return {
          id: step.id,
          service: workflowStep?.service,
          description: workflowStep?.description,
          status: step.status,
          timestamp: step.timestamp,
          data: step.data,
          error: step.error
        };
      }),
      result: context.result,
      proof: context.proof,
      metadata: context.metadata
    };
  }

  /**
   * Visualize workflow in mermaid diagram format
   */
  generateMermaidDiagram(workflowId) {
    const workflow = getWorkflow(workflowId);

    if (!workflow) {
      return null;
    }

    let diagram = 'graph TD\n';
    diagram += `    Start([${workflow.name}])\n`;

    workflow.steps.forEach((step, index) => {
      const nodeId = `Step${index + 1}`;
      const prevNode = index === 0 ? 'Start' : `Step${index}`;

      // Add step node
      diagram += `    ${nodeId}[${step.id}<br/>${step.service}]\n`;

      // Add connection
      if (step.condition) {
        diagram += `    ${prevNode} -->|${step.condition}| ${nodeId}\n`;
      } else {
        diagram += `    ${prevNode} --> ${nodeId}\n`;
      }
    });

    diagram += `    Step${workflow.steps.length} --> End([Complete])\n`;

    return diagram;
  }

  /**
   * Get workflow execution metrics
   */
  getMetrics() {
    const total = this.executionHistory.length;
    const active = this.activeExecutions.size;
    const successful = this.executionHistory.filter(e => e.status === 'COMPLETED').length;
    const failed = this.executionHistory.filter(e => e.status === 'FAILED').length;

    const avgDuration = this.executionHistory.length > 0 ?
      this.executionHistory.reduce((sum, e) => {
        return sum + (e.endTime ? new Date(e.endTime) - new Date(e.startTime) : 0);
      }, 0) / this.executionHistory.length :
      0;

    return {
      totalExecutions: total,
      activeExecutions: active,
      successfulExecutions: successful,
      failedExecutions: failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) + '%' : '0%',
      averageDuration: Math.round(avgDuration) + 'ms'
    };
  }

  /**
   * Clear history (for testing/maintenance)
   */
  clearHistory() {
    this.executionHistory = [];
    console.log('[ICARUS] Execution history cleared');
  }
}

module.exports = new IcarusService();
