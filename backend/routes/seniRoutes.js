// backend/routes/seniRoutes.js
const express = require('express');
const router = express.Router();
const seniController = require('../controllers/seniController');

router.post('/', seniController.createSeni);
router.get('/', seniController.getAllSeni);
router.get('/:id', seniController.getSeniById);
router.put('/:id', seniController.updateSeni);
router.delete('/:id', seniController.deleteSeni);

module.exports = router;