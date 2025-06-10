// backend/routes/grupRoutes.js

const express = require('express');
const router = express.Router();
const grupController = require('../controllers/grupController');

router.post('/', grupController.createGrup);
router.get('/', grupController.getAllGrup);
router.get('/:id', grupController.getGrupById);
router.put('/:id', grupController.updateGrup);
router.delete('/:id', grupController.deleteGrup);

module.exports = router;