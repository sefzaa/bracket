// backend/routes/kompetisiRoutes.js
const express = require('express');
const router = express.Router();
const kompetisiController = require('../controllers/kompetisiController');

// GET /api/kompetisi - Mendapatkan semua Laga dan Seni digabung dan diurutkan
router.get('/', kompetisiController.getAllKompetisi);

module.exports = router;