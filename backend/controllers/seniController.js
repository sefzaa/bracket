// backend/controllers/seniController.js
const { Seni, Kategori, Peserta, PesertaSeni, Bracket, sequelize } = require('../models');
const { Op } = require('sequelize');

// Membuat Kategori Seni baru
exports.createSeni = async (req, res) => {
  try {
    const { idKategori, jenis_seni, jenis_kelamin } = req.body;
    if (!idKategori || !jenis_seni || !jenis_kelamin) {
      return res.status(400).json({ message: "ID Kategori Usia, Jenis Seni, dan Jenis Kelamin wajib diisi." });
    }

    const kategori = await Kategori.findByPk(idKategori);
    if (!kategori) {
      return res.status(404).json({ message: "Kategori Usia/Tingkat tidak ditemukan." });
    }

    // Generate nama_seni
    const nama_seni = `Seni ${jenis_seni.charAt(0).toUpperCase() + jenis_seni.slice(1)} ${kategori.nama_kategori} ${jenis_kelamin.charAt(0).toUpperCase() + jenis_kelamin.slice(1)}`;

    const existingSeni = await Seni.findOne({ where: { nama_seni } });
    if (existingSeni) {
      return res.status(400).json({ message: `Kategori Seni "${nama_seni}" sudah ada.` });
    }

    const seni = await Seni.create({
      idKategori,
      jenis_seni,
      jenis_kelamin,
      nama_seni,
    });
    res.status(201).json({ message: "Kategori Seni berhasil ditambahkan.", data: seni });
  } catch (error) {
    console.error("Error createSeni:", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Data tidak valid atau duplikat.", errors: error.errors?.map(e => e.message) || error.message });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan semua Kategori Seni
exports.getAllSeni = async (req, res) => {
  try {
    const { search, idKategori, jenis_seni, jenis_kelamin, page = 1, limit = 20, sortBy = 'nama_seni', order = 'ASC' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause.nama_seni = { [Op.like]: `%${search}%` };
    }
    if (idKategori) whereClause.idKategori = idKategori;
    if (jenis_seni) whereClause.jenis_seni = jenis_seni;
    if (jenis_kelamin) whereClause.jenis_kelamin = jenis_kelamin;

    const { count, rows } = await Seni.findAndCountAll({
      where: whereClause,
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama_kategori'] },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(DISTINCT ps.idPeserta) -- Atau COUNT(*) jika menghitung entri pendaftaran
              FROM peserta_seni AS ps
              WHERE
                ps.idSeni = Seni.id
            )`),
            'jumlah_peserta' // Alias untuk jumlah peserta
          ]
        ]
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy === 'jumlah_peserta' ? sequelize.col('jumlah_peserta') : sortBy, order.toUpperCase()]],
      group: ['Seni.id']
    });

    const totalItems = Array.isArray(count) ? count.length : count;

    res.status(200).json({
      message: "Data Kategori Seni berhasil diambil.",
      data: rows,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error getAllSeni:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan Kategori Seni by ID
exports.getSeniById = async (req, res) => {
  try {
    const seni = await Seni.findByPk(req.params.id, {
      include: [
        { model: Kategori, as: 'kategori' },
        { 
          model: Peserta, 
          as: 'pesertaTerdaftarDiSeni', 
          attributes: ['id', 'nama', 'jenis_kelamin'],
          through: { attributes: [] } 
        },
        { model: Bracket, as: 'bracketUntukSeni' }
      ]
    });
    if (!seni) {
      return res.status(404).json({ message: "Kategori Seni tidak ditemukan." });
    }
    res.status(200).json({ message: "Detail Kategori Seni berhasil diambil.", data: seni });
  } catch (error) {
    console.error("Error getSeniById:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Update Kategori Seni
exports.updateSeni = async (req, res) => {
  try {
    const { id } = req.params;
    const { idKategori, jenis_seni, jenis_kelamin } = req.body;

    const seni = await Seni.findByPk(id, { include: [{model: Kategori, as: 'kategori'}]});
    if (!seni) {
      return res.status(404).json({ message: "Kategori Seni tidak ditemukan." });
    }

    let newNamaSeni = seni.nama_seni;
    let kategoriNama = seni.kategori.nama_kategori;

    if (idKategori && idKategori !== seni.idKategori) {
        const newKategori = await Kategori.findByPk(idKategori);
        if (!newKategori) return res.status(404).json({ message: "Kategori Usia/Tingkat baru tidak ditemukan." });
        kategoriNama = newKategori.nama_kategori;
    }
    
    const newJenisSeni = jenis_seni ?? seni.jenis_seni;
    const newJenisKelamin = jenis_kelamin ?? seni.jenis_kelamin;
    newNamaSeni = `Seni ${newJenisSeni.charAt(0).toUpperCase() + newJenisSeni.slice(1)} ${kategoriNama} ${newJenisKelamin.charAt(0).toUpperCase() + newJenisKelamin.slice(1)}`;

    if (newNamaSeni !== seni.nama_seni) {
        const existingSeni = await Seni.findOne({ where: { nama_seni: newNamaSeni, id: {[Op.ne]: id} } });
        if (existingSeni) {
          return res.status(400).json({ message: `Kategori Seni "${newNamaSeni}" sudah ada.` });
        }
    }

    seni.idKategori = idKategori ?? seni.idKategori;
    seni.jenis_seni = newJenisSeni;
    seni.jenis_kelamin = newJenisKelamin;
    seni.nama_seni = newNamaSeni;

    await seni.save();
    res.status(200).json({ message: "Data Kategori Seni berhasil diperbarui.", data: seni });
  } catch (error) {
    console.error("Error updateSeni:", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Data tidak valid atau duplikat.", errors: error.errors?.map(e => e.message) || error.message });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Delete Kategori Seni
exports.deleteSeni = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const seni = await Seni.findByPk(id, { transaction });
    if (!seni) {
      await transaction.rollback();
      return res.status(404).json({ message: "Kategori Seni tidak ditemukan." });
    }

    const pesertaCount = await PesertaSeni.count({ where: { idSeni: id }, transaction });
    if (pesertaCount > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Kategori Seni tidak bisa dihapus karena memiliki peserta terdaftar." });
    }

    await seni.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ message: "Kategori Seni berhasil dihapus." });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleteSeni:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};