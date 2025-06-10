// backend/routes/lagaRoutes.js
const express = require('express');
const router = express.Router();
const lagaController = require('../controllers/lagaController');

router.post('/', lagaController.createLaga);
router.get('/', lagaController.getAllLaga);
router.get('/:id', lagaController.getLagaById);
router.put('/:id', lagaController.updateLaga);
router.delete('/:id', lagaController.deleteLaga);

module.exports = router;