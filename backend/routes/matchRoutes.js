// backend/routes/matchRoutes.js

const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Mendapatkan detail Match by ID
router.get('/:id', matchController.getMatchById);

// Mendapatkan semua match untuk sebuah Bracket ID
router.get('/bracket/:bracketId', matchController.getMatchesByBracketId);

// Approve Match dan set nomor partai
router.put('/:matchId/approve', matchController.approveMatch);

// Update detail match (skor, pemenang, dewan, status, dll)
router.put('/:matchId/details', matchController.updateMatchDetails);

// Set pemenang WO
router.put('/:matchId/set-wo', matchController.setWinnerWO);


module.exports = router;