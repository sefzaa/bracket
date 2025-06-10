// backend/controllers/lagaController.js
const { Laga, Kategori, Peserta, PesertaLaga, Bracket, sequelize } = require('../models');
const { Op } = require('sequelize');

// Membuat Kategori Laga baru
exports.createLaga = async (req, res) => {
  try {
    const { idKategori, kelas, jenis_kelamin } = req.body;
    if (!idKategori || !kelas || !jenis_kelamin) {
      return res.status(400).json({ message: "ID Kategori Usia, Kelas, dan Jenis Kelamin wajib diisi." });
    }

    const kategori = await Kategori.findByPk(idKategori);
    if (!kategori) {
      return res.status(404).json({ message: "Kategori Usia/Tingkat tidak ditemukan." });
    }

    // Generate nama_tanding
    const nama_tanding = `Laga ${kategori.nama_kategori} ${kelas.toUpperCase()} ${jenis_kelamin.charAt(0).toUpperCase() + jenis_kelamin.slice(1)}`;

    const existingLaga = await Laga.findOne({ where: { nama_tanding } });
    if (existingLaga) {
      return res.status(400).json({ message: `Kategori Laga "${nama_tanding}" sudah ada.` });
    }

    const laga = await Laga.create({
      idKategori,
      kelas,
      jenis_kelamin,
      nama_tanding,
    });
    res.status(201).json({ message: "Kategori Laga berhasil ditambahkan.", data: laga });
  } catch (error) {
    console.error("Error createLaga:", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Data tidak valid atau duplikat.", errors: error.errors?.map(e => e.message) || error.message });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan semua Kategori Laga
exports.getAllLaga = async (req, res) => {
  try {
    const { search, idKategori, kelas, jenis_kelamin, page = 1, limit = 20, sortBy = 'nama_tanding', order = 'ASC' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause.nama_tanding = { [Op.like]: `%${search}%` };
    }
    if (idKategori) whereClause.idKategori = idKategori;
    if (kelas) whereClause.kelas = { [Op.like]: `%${kelas}%` };
    if (jenis_kelamin) whereClause.jenis_kelamin = jenis_kelamin;

    const { count, rows } = await Laga.findAndCountAll({
      where: whereClause,
      include: [
        { model: Kategori, as: 'kategori', attributes: ['id', 'nama_kategori'] },
        // Untuk menghitung peserta, bisa dilakukan dengan subquery atau join terpisah
        // Untuk performa, lebih baik dihitung saat mengambil detail atau di endpoint khusus
      ],
      attributes: {
        include: [
          // Menghitung jumlah peserta yang terdaftar di setiap laga
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM peserta_laga AS pl
              WHERE
                pl.idLaga = Laga.id
            )`),
            'jumlah_peserta' // Alias untuk jumlah peserta
          ]
        ]
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy === 'jumlah_peserta' ? sequelize.col('jumlah_peserta') : sortBy, order.toUpperCase()]],
      group: ['Laga.id'] // Diperlukan jika ada agregasi dan include
    });
    
    // findAndCountAll dengan group mengembalikan array of objects for count
    const totalItems = Array.isArray(count) ? count.length : count;


    res.status(200).json({
      message: "Data Kategori Laga berhasil diambil.",
      data: rows,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error getAllLaga:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan Kategori Laga by ID
exports.getLagaById = async (req, res) => {
  try {
    const laga = await Laga.findByPk(req.params.id, {
      include: [
        { model: Kategori, as: 'kategori' },
        { 
          model: Peserta, 
          as: 'pesertaTerdaftarDiLaga', 
          attributes: ['id', 'nama', 'jenis_kelamin'],
          through: { attributes: [] } // Tidak perlu data dari junction table
        },
        { model: Bracket, as: 'bracketUntukLaga' }
      ]
    });
    if (!laga) {
      return res.status(404).json({ message: "Kategori Laga tidak ditemukan." });
    }
    res.status(200).json({ message: "Detail Kategori Laga berhasil diambil.", data: laga });
  } catch (error) {
    console.error("Error getLagaById:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Update Kategori Laga
exports.updateLaga = async (req, res) => {
  try {
    const { id } = req.params;
    const { idKategori, kelas, jenis_kelamin } = req.body;

    const laga = await Laga.findByPk(id, { include: [{model: Kategori, as: 'kategori'}]});
    if (!laga) {
      return res.status(404).json({ message: "Kategori Laga tidak ditemukan." });
    }

    let newNamaTanding = laga.nama_tanding;
    let kategoriNama = laga.kategori.nama_kategori;

    if (idKategori && idKategori !== laga.idKategori) {
        const newKategori = await Kategori.findByPk(idKategori);
        if (!newKategori) return res.status(404).json({ message: "Kategori Usia/Tingkat baru tidak ditemukan." });
        kategoriNama = newKategori.nama_kategori;
    }
    
    const newKelas = kelas ?? laga.kelas;
    const newJenisKelamin = jenis_kelamin ?? laga.jenis_kelamin;
    newNamaTanding = `Laga ${kategoriNama} ${newKelas.toUpperCase()} ${newJenisKelamin.charAt(0).toUpperCase() + newJenisKelamin.slice(1)}`;

    if (newNamaTanding !== laga.nama_tanding) {
        const existingLaga = await Laga.findOne({ where: { nama_tanding: newNamaTanding, id: {[Op.ne]: id} } });
        if (existingLaga) {
          return res.status(400).json({ message: `Kategori Laga "${newNamaTanding}" sudah ada.` });
        }
    }

    laga.idKategori = idKategori ?? laga.idKategori;
    laga.kelas = newKelas;
    laga.jenis_kelamin = newJenisKelamin;
    laga.nama_tanding = newNamaTanding;

    await laga.save();
    res.status(200).json({ message: "Data Kategori Laga berhasil diperbarui.", data: laga });
  } catch (error) {
    console.error("Error updateLaga:", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Data tidak valid atau duplikat.", errors: error.errors?.map(e => e.message) || error.message });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Delete Kategori Laga
exports.deleteLaga = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const laga = await Laga.findByPk(id, { transaction });
    if (!laga) {
      await transaction.rollback();
      return res.status(404).json({ message: "Kategori Laga tidak ditemukan." });
    }

    // Cek apakah ada peserta terdaftar atau bracket terkait
    const pesertaCount = await PesertaLaga.count({ where: { idLaga: id }, transaction });
    if (pesertaCount > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Kategori Laga tidak bisa dihapus karena memiliki peserta terdaftar." });
    }
    // Bracket akan terhapus otomatis jika onDelete: 'CASCADE' di asosiasi
    // Atau hapus manual jika perlu: await Bracket.destroy({ where: { idLaga: id }, transaction });

    await laga.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ message: "Kategori Laga berhasil dihapus." });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleteLaga:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};