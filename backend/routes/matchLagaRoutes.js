// backend/routes/matchLagaRoutes.js
const express = require('express');
const router = express.Router();
const matchLagaController = require('../controllers/matchLagaController');

// GET /api/match-laga/:id - Mendapatkan detail MatchLaga by ID
router.get('/:id', matchLagaController.getMatchLagaById);

// PUT /api/match-laga/:matchId/approve - Approve MatchLaga
router.put('/:matchId/approve', matchLagaController.approveMatchLaga);

// PUT /api/match-laga/:matchId/details - Update detail MatchLaga (skor, pemenang, dll)
router.put('/:matchId/details', matchLagaController.updateMatchLagaDetails);

// Anda bisa menambahkan rute lain jika diperlukan, misalnya GET semua match untuk bracket tertentu
// GET /api/match-laga/bracket/:bracketId (ini sudah ada di bracketController.getBracketDetails)

module.exports = router;