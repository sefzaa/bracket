// backend/routes/matchSeniRoutes.js
const express = require('express');
const router = express.Router();
const matchSeniController = require('../controllers/matchSeniController');

// GET /api/match-seni/:id - Mendapatkan detail MatchSeni by ID
router.get('/:id', matchSeniController.getMatchSeniById);

// PUT /api/match-seni/:matchId/approve - Approve MatchSeni
router.put('/:matchId/approve', matchSeniController.approveMatchSeni);

// PUT /api/match-seni/:matchId/details - Update detail MatchSeni (skor, pemenang, dll)
router.put('/:matchId/details', matchSeniController.updateMatchSeniDetails);

module.exports = router;