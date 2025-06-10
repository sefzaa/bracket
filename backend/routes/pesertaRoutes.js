// backend/routes/pesertaRoutes.js
const express = require('express');
const router = express.Router();
const pesertaController = require('../controllers/pesertaController');

router.post('/', pesertaController.createPeserta);
router.get('/', pesertaController.getAllPeserta);
router.get('/:id', pesertaController.getPesertaById);
router.put('/:id', pesertaController.updatePeserta);
router.delete('/:id', pesertaController.deletePeserta);

// Rute untuk mendaftarkan peserta ke Laga atau Seni
router.post('/register-laga', pesertaController.registerPesertaToLaga);
router.post('/register-seni', pesertaController.registerPesertaToSeni);
// Anda mungkin ingin rute yang lebih RESTful seperti:
// POST /api/laga/:idLaga/peserta/:idPeserta
// POST /api/seni/:idSeni/peserta/:idPeserta (atau dengan body jika peserta array)

module.exports = router;