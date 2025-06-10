// backend/controllers/grupController.js

const { Grup, Peserta, sequelize } = require('../models'); // Sesuaikan path
const { Op } = require('sequelize');

// Membuat Grup baru (opsional, karena grup bisa otomatis terbentuk saat pengelompokan peserta)
exports.createGrup = async (req, res) => {
  try {
    const { nama_grup, jenis_kelamin, jenis, kategori, kelas } = req.body;
    if (!nama_grup || !jenis_kelamin || !jenis || !kategori || !kelas) {
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }
    const grup = await Grup.create({ nama_grup, jenis_kelamin, jenis, kategori, kelas });
    res.status(201).json({ message: "Grup berhasil ditambahkan.", data: grup });
  } catch (error)
  {
    console.error("Error createGrup:", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Data tidak valid atau duplikat.", errors: error.errors?.map(e => e.message) || error.message });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan semua Grup, diurutkan berdasarkan jumlah peserta (terbanyak di atas)
exports.getAllGrup = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'jumlah_peserta', order = 'DESC' } = req.query; // Default sort by jumlah_peserta
    const offset = (page - 1) * limit;

    // Menggunakan subquery untuk menghitung jumlah peserta per grup
    const { count, rows } = await Grup.findAndCountAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM peserta AS p
              WHERE
                p.grupId = Grup.id
            )`),
            'jumlah_peserta'
          ]
        ]
      },
      include: [
        {
          model: Peserta,
          as: 'pesertas',
          attributes: [], // Tidak perlu mengambil semua data peserta di sini, hanya untuk count
          duplicating: false, // Penting untuk count yang benar dengan include
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sequelize.col(sortBy), order.toUpperCase()]], // Urutkan berdasarkan alias jumlah_peserta
      group: ['Grup.id'] // Group by Grup.id agar count benar
    });

    const totalItems = count.length; // findAndCountAll dengan group mengembalikan array of objects for count

    res.status(200).json({
      message: "Data grup berhasil diambil.",
      data: rows,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error getAllGrup:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan Grup by ID beserta pesertanya
exports.getGrupById = async (req, res) => {
  try {
    const grup = await Grup.findByPk(req.params.id, {
      include: [{
        model: Peserta,
        as: 'pesertas',
        attributes: ['id', 'nama', 'jenis_kelamin', 'jenis', 'kategori', 'kelas'] // Pilih field peserta yang relevan
      }],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM peserta AS p
              WHERE
                p.grupId = Grup.id
            )`),
            'jumlah_peserta'
          ]
        ]
      }
    });
    if (!grup) {
      return res.status(404).json({ message: "Grup tidak ditemukan." });
    }
    res.status(200).json({ message: "Detail grup berhasil diambil.", data: grup });
  } catch (error) {
    console.error("Error getGrupById:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Update Grup
exports.updateGrup = async (req, res) => {
  try {
    const { nama_grup, jenis_kelamin, jenis, kategori, kelas } = req.body;
    const grup = await Grup.findByPk(req.params.id);
    if (!grup) {
      return res.status(404).json({ message: "Grup tidak ditemukan." });
    }
    grup.nama_grup = nama_grup ?? grup.nama_grup;
    grup.jenis_kelamin = jenis_kelamin ?? grup.jenis_kelamin;
    grup.jenis = jenis ?? grup.jenis;
    grup.kategori = kategori ?? grup.kategori;
    grup.kelas = kelas ?? grup.kelas;
    await grup.save();
    res.status(200).json({ message: "Data grup berhasil diperbarui.", data: grup });
  } catch (error) {
    console.error("Error updateGrup:", error);
     if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Data tidak valid atau duplikat.", errors: error.errors?.map(e => e.message) || error.message });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Delete Grup
exports.deleteGrup = async (req, res) => {
  try {
    const grup = await Grup.findByPk(req.params.id);
    if (!grup) {
      return res.status(404).json({ message: "Grup tidak ditemukan." });
    }
    // Perlu pertimbangan: apa yang terjadi dengan peserta di grup ini?
    // Berdasarkan model, Peserta.grupId akan jadi NULL (onDelete: 'SET NULL')
    await grup.destroy();
    res.status(200).json({ message: "Grup berhasil dihapus." });
  } catch (error) {
    console.error("Error deleteGrup:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};