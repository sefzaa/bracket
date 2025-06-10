// backend/controllers/dewanController.js
const { Dewan, MatchLaga, MatchSeni } = require('../models'); // Impor MatchLaga dan MatchSeni untuk pengecekan
const { Op } = require('sequelize');

exports.createDewan = async (req, res) => {
  try {
    const { nama } = req.body;
    if (!nama) {
      return res.status(400).json({ message: "Nama dewan tidak boleh kosong." });
    }
    const dewan = await Dewan.create({ nama });
    res.status(201).json({ message: "Dewan berhasil ditambahkan.", data: dewan });
  } catch (error) {
    console.error("Error createDewan:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

exports.getAllDewan = async (req, res) => {
  try {
    const { search, page = 1, limit = 100, sortBy = 'nama', order = 'ASC' } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = {};
    if (search) {
      whereClause.nama = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Dewan.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order.toUpperCase()]],
    });
    res.status(200).json({
      message: "Data dewan berhasil diambil.",
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error getAllDewan:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

exports.getDewanById = async (req, res) => {
  try {
    const dewan = await Dewan.findByPk(req.params.id);
    if (!dewan) {
      return res.status(404).json({ message: "Dewan tidak ditemukan." });
    }
    res.status(200).json({ message: "Detail dewan berhasil diambil.", data: dewan });
  } catch (error) {
    console.error("Error getDewanById:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

exports.updateDewan = async (req, res) => {
  try {
    const { nama } = req.body;
    const dewan = await Dewan.findByPk(req.params.id);
    if (!dewan) {
      return res.status(404).json({ message: "Dewan tidak ditemukan." });
    }
    dewan.nama = nama ?? dewan.nama;
    await dewan.save();
    res.status(200).json({ message: "Data dewan berhasil diperbarui.", data: dewan });
  } catch (error) {
    console.error("Error updateDewan:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

exports.deleteDewan = async (req, res) => {
  try {
    const dewan = await Dewan.findByPk(req.params.id);
    if (!dewan) {
      return res.status(404).json({ message: "Dewan tidak ditemukan." });
    }
    // Cek apakah dewan digunakan di MatchLaga atau MatchSeni
    const inMatchLaga = await MatchLaga.count({ where: { idDewan: req.params.id } });
    const inMatchSeni = await MatchSeni.count({ where: { idDewan: req.params.id } });
    if (inMatchLaga > 0 || inMatchSeni > 0) {
        return res.status(400).json({ message: "Dewan tidak dapat dihapus karena sedang bertugas di pertandingan." });
    }
    await dewan.destroy();
    res.status(200).json({ message: "Dewan berhasil dihapus." });
  } catch (error) {
    console.error("Error deleteDewan:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};