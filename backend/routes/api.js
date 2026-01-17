const router = require('express').Router();
const workflowController = require('../controllers/workflowController');

// Workflow execution
router.post('/workflow/run', workflowController.runWorkflow);

// Data endpoints
router.get('/students', workflowController.getStudents);
router.get('/logs', workflowController.getLogs);
router.get('/assignments', workflowController.getAssignments);

// Icarus visualization endpoints
router.get('/workflow/execution/:executionId', workflowController.getExecutionStatus);
router.get('/workflow/executions/active', workflowController.getActiveExecutions);
router.get('/workflow/executions/history', workflowController.getExecutionHistory);
router.get('/workflow/list', workflowController.getWorkflows);
router.get('/workflow/metrics', workflowController.getMetrics);

module.exports = router;
