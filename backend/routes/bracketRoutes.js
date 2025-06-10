// backend/routes/bracketRoutes.js
const express = require('express');
const router = express.Router();
const bracketController = require('../controllers/bracketController');

// POST /api/bracket/generate - Generate bracket untuk Laga atau Seni
// Body: { idKompetisi, tipeKompetisi: 'laga' | 'seni' }
router.post('/generate', bracketController.generateBracket);

// GET /api/bracket/:bracketId - Mendapatkan detail bracket beserta match-nya
router.get('/:bracketId', bracketController.getBracketDetails);

// PUT /api/bracket/:bracketId/status - Update status bracket
router.put('/:bracketId/status', bracketController.updateBracketStatus);

module.exports = router;