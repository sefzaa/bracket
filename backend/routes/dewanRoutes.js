// backend/routes/dewanRoutes.js
const express = require('express');
const router = express.Router();
const dewanController = require('../controllers/dewanController');

router.post('/', dewanController.createDewan);
router.get('/', dewanController.getAllDewan);
router.get('/:id', dewanController.getDewanById);
router.put('/:id', dewanController.updateDewan);
router.delete('/:id', dewanController.deleteDewan);

module.exports = router;