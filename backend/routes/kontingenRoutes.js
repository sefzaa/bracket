const express = require('express');
const router = express.Router();
// Pastikan path ini benar dan file kontingenController.js ada di lokasi tersebut
const kontingenController = require('../controllers/kontingenController'); 

router.post('/', kontingenController.createKontingen);
router.get('/', kontingenController.getAllKontingen);
router.get('/:id', kontingenController.getKontingenById);
router.put('/:id', kontingenController.updateKontingen);
router.delete('/:id', kontingenController.deleteKontingen);

module.exports = router;
