const { Kontingen, Peserta } = require('../models'); // Pastikan path ke models benar
const { Op } = require('sequelize');

exports.createKontingen = async (req, res) => {
  try {
    const { nama_kontingen, kabupaten, provinsi } = req.body;
    if (!nama_kontingen) {
      return res.status(400).json({ message: "Nama kontingen tidak boleh kosong." });
    }
    const existing = await Kontingen.findOne({ where: { nama_kontingen } });
    if (existing) {
        return res.status(400).json({ message: "Nama kontingen sudah ada." });
    }
    const kontingen = await Kontingen.create({ nama_kontingen, kabupaten, provinsi });
    res.status(201).json({ message: "Kontingen berhasil ditambahkan.", data: kontingen });
  } catch (error) {
    console.error("Error createKontingen:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

exports.getAllKontingen = async (req, res) => {
  try {
    const { search, page = 1, limit = 100, sortBy = 'nama_kontingen', order = 'ASC' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = {};
    if (search) {
      whereClause.nama_kontingen = { [Op.like]: `%${search}%` };
    }
    const { count, rows } = await Kontingen.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order.toUpperCase()]],
      attributes: ['id', 'nama_kontingen', 'kabupaten', 'provinsi'] // Pilih atribut yang dibutuhkan
    });
    res.status(200).json({
      message: "Data kontingen berhasil diambil.",
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error getAllKontingen:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

exports.getKontingenById = async (req, res) => {
  try {
    const kontingen = await Kontingen.findByPk(req.params.id, {
        include: [{ 
            model: Peserta, 
            as: 'pesertas', 
            attributes: ['id', 'nama', 'jenis_kelamin'] // Ambil hanya data peserta yang relevan
        }]
    });
    if (!kontingen) {
      return res.status(404).json({ message: "Kontingen tidak ditemukan." });
    }
    res.status(200).json({ message: "Detail kontingen berhasil diambil.", data: kontingen });
  } catch (error) {
    console.error("Error getKontingenById:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

exports.updateKontingen = async (req, res) => {
  try {
    const { nama_kontingen, kabupaten, provinsi } = req.body;
    const kontingen = await Kontingen.findByPk(req.params.id);
    if (!kontingen) {
      return res.status(404).json({ message: "Kontingen tidak ditemukan." });
    }
    if (nama_kontingen && nama_kontingen !== kontingen.nama_kontingen) {
        const existing = await Kontingen.findOne({ where: { nama_kontingen, id: {[Op.ne]: req.params.id} } });
        if (existing) {
            return res.status(400).json({ message: "Nama kontingen sudah digunakan." });
        }
    }
    kontingen.nama_kontingen = nama_kontingen ?? kontingen.nama_kontingen;
    kontingen.kabupaten = kabupaten ?? kontingen.kabupaten;
    kontingen.provinsi = provinsi ?? kontingen.provinsi;
    await kontingen.save();
    res.status(200).json({ message: "Data kontingen berhasil diperbarui.", data: kontingen });
  } catch (error) {
    console.error("Error updateKontingen:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

exports.deleteKontingen = async (req, res) => {
  try {
    const kontingen = await Kontingen.findByPk(req.params.id);
    if (!kontingen) {
      return res.status(404).json({ message: "Kontingen tidak ditemukan." });
    }
    const pesertaCount = await Peserta.count({ where: { idKontingen: req.params.id }});
    if (pesertaCount > 0) {
        return res.status(400).json({ message: "Kontingen tidak bisa dihapus karena memiliki peserta terdaftar." });
    }
    await kontingen.destroy();
    res.status(200).json({ message: "Kontingen berhasil dihapus." });
  } catch (error) {
    console.error("Error deleteKontingen:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};