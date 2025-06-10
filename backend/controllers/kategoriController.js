// backend/controllers/kategoriController.js
const { Kategori, Laga, Seni, Peserta } = require('../models');
const { Op } = require('sequelize');

// Membuat Kategori Usia/Tingkat baru
exports.createKategori = async (req, res) => {
  try {
    const { nama_kategori } = req.body;
    if (!nama_kategori) {
      return res.status(400).json({ message: "Nama kategori tidak boleh kosong." });
    }
    const existingKategori = await Kategori.findOne({ where: { nama_kategori } });
    if (existingKategori) {
      return res.status(400).json({ message: "Nama kategori sudah ada." });
    }
    const kategori = await Kategori.create({ nama_kategori });
    res.status(201).json({ message: "Kategori berhasil ditambahkan.", data: kategori });
  } catch (error) {
    console.error("Error createKategori:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan semua Kategori Usia/Tingkat
exports.getAllKategori = async (req, res) => {
  try {
    const { search, page = 1, limit = 100, sortBy = 'nama_kategori', order = 'ASC' } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = {};
    if (search) {
      whereClause.nama_kategori = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Kategori.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order.toUpperCase()]],
    });
    res.status(200).json({
      message: "Data kategori berhasil diambil.",
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error getAllKategori:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan Kategori by ID
exports.getKategoriById = async (req, res) => {
  try {
    const kategori = await Kategori.findByPk(req.params.id);
    if (!kategori) {
      return res.status(404).json({ message: "Kategori tidak ditemukan." });
    }
    res.status(200).json({ message: "Detail kategori berhasil diambil.", data: kategori });
  } catch (error) {
    console.error("Error getKategoriById:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Update Kategori
exports.updateKategori = async (req, res) => {
  try {
    const { nama_kategori } = req.body;
    const kategori = await Kategori.findByPk(req.params.id);
    if (!kategori) {
      return res.status(404).json({ message: "Kategori tidak ditemukan." });
    }
    if (nama_kategori && nama_kategori !== kategori.nama_kategori) {
        const existingKategori = await Kategori.findOne({ where: { nama_kategori, id: {[Op.ne]: req.params.id} } });
        if (existingKategori) {
          return res.status(400).json({ message: "Nama kategori sudah digunakan." });
        }
    }
    kategori.nama_kategori = nama_kategori ?? kategori.nama_kategori;
    await kategori.save();
    res.status(200).json({ message: "Data kategori berhasil diperbarui.", data: kategori });
  } catch (error) {
    console.error("Error updateKategori:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Delete Kategori
exports.deleteKategori = async (req, res) => {
  try {
    const kategori = await Kategori.findByPk(req.params.id);
    if (!kategori) {
      return res.status(404).json({ message: "Kategori tidak ditemukan." });
    }
    // Cek apakah kategori digunakan di Laga, Seni, atau Peserta
    const inLaga = await Laga.count({ where: { idKategori: req.params.id } });
    const inSeni = await Seni.count({ where: { idKategori: req.params.id } });
    const inPeserta = await Peserta.count({ where: { idKategoriUsia: req.params.id } });

    if (inLaga > 0 || inSeni > 0 || inPeserta > 0) {
      return res.status(400).json({ message: "Kategori tidak bisa dihapus karena masih digunakan." });
    }
    await kategori.destroy();
    res.status(200).json({ message: "Kategori berhasil dihapus." });
  } catch (error) {
    console.error("Error deleteKategori:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};