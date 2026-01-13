const router = require('express').Router();
const workflowController = require('../controllers/workflowController');

router.post('/workflow/run', workflowController.runWorkflow);
router.get('/students', workflowController.getStudents);
router.get('/logs', workflowController.getLogs);

module.exports = router;
