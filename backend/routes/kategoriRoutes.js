// backend/routes/kategoriRoutes.js
const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');

// POST /api/kategori - Membuat Kategori baru
router.post('/', kategoriController.createKategori);

// GET /api/kategori - Mendapatkan semua Kategori
router.get('/', kategoriController.getAllKategori);

// GET /api/kategori/:id - Mendapatkan Kategori by ID
router.get('/:id', kategoriController.getKategoriById);

// PUT /api/kategori/:id - Update Kategori
router.put('/:id', kategoriController.updateKategori);

// DELETE /api/kategori/:id - Delete Kategori
router.delete('/:id', kategoriController.deleteKategori);

module.exports = router;