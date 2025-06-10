// backend/controllers/pesertaController.js
const { Peserta, Kontingen, Kategori, Laga, Seni, PesertaLaga, PesertaSeni, sequelize } = require('../models');
const { Op } = require('sequelize');

// Membuat Peserta baru
exports.createPeserta = async (req, res) => {
  try {
    const { nama, idKontingen, idKategoriUsia, jenis_kelamin } = req.body;

    if (!nama || !idKontingen || !idKategoriUsia || !jenis_kelamin) {
      return res.status(400).json({ message: "Nama, Kontingen, Kategori Usia, dan Jenis Kelamin wajib diisi." });
    }

    // Validasi apakah Kontingen dan Kategori Usia ada
    const kontingen = await Kontingen.findByPk(idKontingen);
    if (!kontingen) return res.status(404).json({ message: "Kontingen tidak ditemukan." });

    const kategoriUsia = await Kategori.findByPk(idKategoriUsia);
    if (!kategoriUsia) return res.status(404).json({ message: "Kategori Usia tidak ditemukan." });

    const peserta = await Peserta.create({
      nama,
      idKontingen,
      idKategoriUsia,
      jenis_kelamin,
    });

    res.status(201).json({ message: "Peserta berhasil ditambahkan.", data: peserta });
  } catch (error) {
    console.error("Error createPeserta:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: "Data tidak valid.", errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan semua Peserta
exports.getAllPeserta = async (req, res) => {
  try {
    const { search, idKontingen, idKategoriUsia, jenis_kelamin, page = 1, limit = 10, sortBy = 'nama', order = 'ASC' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause.nama = { [Op.like]: `%${search}%` };
    }
    if (idKontingen) {
      whereClause.idKontingen = idKontingen;
    }
    if (idKategoriUsia) {
      whereClause.idKategoriUsia = idKategoriUsia;
    }
    if (jenis_kelamin) {
      whereClause.jenis_kelamin = jenis_kelamin;
    }

    const { count, rows } = await Peserta.findAndCountAll({
      where: whereClause,
      include: [
        { model: Kontingen, as: 'kontingen', attributes: ['id', 'nama_kontingen'] },
        { model: Kategori, as: 'kategoriUsiaPeserta', attributes: ['id', 'nama_kategori'] },
        // Opsional: include Laga dan Seni yang diikuti
        // { model: Laga, as: 'lagaYangDiikuti', through: { attributes: [] } },
        // { model: Seni, as: 'seniYangDiikuti', through: { attributes: [] } },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order.toUpperCase()]],
      distinct: true, // Penting jika ada include many-to-many untuk count yang benar
    });

    res.status(200).json({
      message: "Data peserta berhasil diambil.",
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error getAllPeserta:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan Peserta by ID
exports.getPesertaById = async (req, res) => {
  try {
    const peserta = await Peserta.findByPk(req.params.id, {
      include: [
        { model: Kontingen, as: 'kontingen' },
        { model: Kategori, as: 'kategoriUsiaPeserta' },
        { model: Laga, as: 'lagaYangDiikuti', through: { attributes: [] }, include: [{model: Kategori, as: 'kategori'}] },
        { model: Seni, as: 'seniYangDiikuti', through: { attributes: [] }, include: [{model: Kategori, as: 'kategori'}] },
      ]
    });
    if (!peserta) {
      return res.status(404).json({ message: "Peserta tidak ditemukan." });
    }
    res.status(200).json({ message: "Detail peserta berhasil diambil.", data: peserta });
  } catch (error) {
    console.error("Error getPesertaById:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Update Peserta
exports.updatePeserta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, idKontingen, idKategoriUsia, jenis_kelamin } = req.body;

    const peserta = await Peserta.findByPk(id);
    if (!peserta) {
      return res.status(404).json({ message: "Peserta tidak ditemukan." });
    }

    if (idKontingen) {
      const kontingen = await Kontingen.findByPk(idKontingen);
      if (!kontingen) return res.status(404).json({ message: "Kontingen baru tidak ditemukan." });
    }
    if (idKategoriUsia) {
      const kategoriUsia = await Kategori.findByPk(idKategoriUsia);
      if (!kategoriUsia) return res.status(404).json({ message: "Kategori Usia baru tidak ditemukan." });
    }

    peserta.nama = nama ?? peserta.nama;
    peserta.idKontingen = idKontingen ?? peserta.idKontingen;
    peserta.idKategoriUsia = idKategoriUsia ?? peserta.idKategoriUsia;
    peserta.jenis_kelamin = jenis_kelamin ?? peserta.jenis_kelamin;

    await peserta.save();
    res.status(200).json({ message: "Data peserta berhasil diperbarui.", data: peserta });
  } catch (error) {
    console.error("Error updatePeserta:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: "Data tidak valid.", errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Delete Peserta
exports.deletePeserta = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const peserta = await Peserta.findByPk(id, { transaction });
    if (!peserta) {
      await transaction.rollback();
      return res.status(404).json({ message: "Peserta tidak ditemukan." });
    }

    // Hapus dari tabel junction dulu
    await PesertaLaga.destroy({ where: { idPeserta: id }, transaction });
    await PesertaSeni.destroy({ where: { idPeserta: id }, transaction });

    // Cek apakah peserta ada di match (sebagai peserta atau pemenang)
    // Ini perlu penyesuaian jika peserta bisa dihapus meski sudah bertanding
    // Untuk sekarang, kita cegah jika sudah ada di match
    const inMatchLaga = await sequelize.models.MatchLaga.count({
        where: {
            [Op.or]: [
                { idPesertaKubuMerah: id },
                { idPesertaKubuBiru: id },
                { idPemenang: id }
            ]
        },
        transaction
    });
    const inMatchSeni = await sequelize.models.MatchSeni.count({
        where: {
            [Op.or]: [
                { idPesertaKubuMerah: id },
                { idPesertaKubuBiru: id },
                { idPemenang: id }
            ]
        },
        transaction
    });

    if (inMatchLaga > 0 || inMatchSeni > 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "Peserta tidak bisa dihapus karena sudah terdaftar dalam pertandingan." });
    }

    await peserta.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ message: "Peserta berhasil dihapus." });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deletePeserta:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendaftarkan Peserta ke sebuah Laga
exports.registerPesertaToLaga = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { idPeserta, idLaga } = req.body;
    if (!idPeserta || !idLaga) {
      return res.status(400).json({ message: "ID Peserta dan ID Laga wajib diisi." });
    }

    const peserta = await Peserta.findByPk(idPeserta, { include: [{model: Kategori, as: 'kategoriUsiaPeserta'}] , transaction });
    if (!peserta) {
      await transaction.rollback();
      return res.status(404).json({ message: "Peserta tidak ditemukan." });
    }

    const laga = await Laga.findByPk(idLaga, { include: [{model: Kategori, as: 'kategori'}], transaction });
    if (!laga) {
      await transaction.rollback();
      return res.status(404).json({ message: "Kategori Laga tidak ditemukan." });
    }

    // Validasi tambahan: jenis kelamin, kategori usia
    if (peserta.jenis_kelamin !== laga.jenis_kelamin) {
      if (laga.jenis_kelamin !== 'campuran') { // Izinkan jika laga campuran
        await transaction.rollback();
        return res.status(400).json({ message: `Jenis kelamin peserta (${peserta.jenis_kelamin}) tidak sesuai dengan jenis kelamin laga (${laga.jenis_kelamin}).` });
      }
    }
    if (peserta.idKategoriUsia !== laga.idKategori) {
      await transaction.rollback();
      return res.status(400).json({ message: `Kategori usia peserta (${peserta.kategoriUsiaPeserta.nama_kategori}) tidak sesuai dengan kategori laga (${laga.kategori.nama_kategori}).` });
    }

    const existingRegistration = await PesertaLaga.findOne({ where: { idPeserta, idLaga }, transaction });
    if (existingRegistration) {
      await transaction.rollback();
      return res.status(400).json({ message: "Peserta sudah terdaftar di Laga ini." });
    }

    await PesertaLaga.create({ idPeserta, idLaga }, { transaction });
    // Update jumlah peserta di Laga
    await laga.increment('jumlah_peserta_terdaftar', { by: 1, transaction });


    await transaction.commit();
    res.status(201).json({ message: `Peserta ${peserta.nama} berhasil didaftarkan ke Laga ${laga.nama_tanding}.` });
  } catch (error) {
    await transaction.rollback();
    console.error("Error registerPesertaToLaga:", error);
    res.status(500).json({ message: "Gagal mendaftarkan peserta ke Laga.", error: error.message });
  }
};

// Mendaftarkan Peserta ke sebuah Seni
exports.registerPesertaToSeni = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Untuk seni ganda/regu, idPeserta bisa berupa array
    let { idPeserta, idSeni } = req.body;
    const isArrayPeserta = Array.isArray(idPeserta);

    if (!idPeserta || !idSeni) {
      return res.status(400).json({ message: "ID Peserta (atau array ID) dan ID Seni wajib diisi." });
    }

    const seni = await Seni.findByPk(idSeni, { include: [{model: Kategori, as: 'kategori'}], transaction });
    if (!seni) {
      await transaction.rollback();
      return res.status(404).json({ message: "Kategori Seni tidak ditemukan." });
    }

    const pesertaIdsToRegister = isArrayPeserta ? idPeserta : [idPeserta];
    let registeredCount = 0;

    for (const pId of pesertaIdsToRegister) {
      const peserta = await Peserta.findByPk(pId, { include: [{model: Kategori, as: 'kategoriUsiaPeserta'}], transaction });
      if (!peserta) {
        // Lewati atau kembalikan error jika satu peserta tidak ditemukan
        console.warn(`Peserta dengan ID ${pId} tidak ditemukan, dilewati.`);
        continue;
      }

      // Validasi jenis kelamin dan kategori usia
      if (peserta.jenis_kelamin !== seni.jenis_kelamin) {
        if (seni.jenis_kelamin !== 'campuran' && !(seni.jenis_seni === 'ganda' || seni.jenis_seni === 'regu')) { // Ganda/Regu bisa campuran
             await transaction.rollback();
             return res.status(400).json({ message: `Jenis kelamin peserta ${peserta.nama} (${peserta.jenis_kelamin}) tidak sesuai dengan jenis kelamin seni (${seni.jenis_kelamin}).` });
        }
      }
      if (peserta.idKategoriUsia !== seni.idKategori) {
         await transaction.rollback();
         return res.status(400).json({ message: `Kategori usia peserta ${peserta.nama} (${peserta.kategoriUsiaPeserta.nama_kategori}) tidak sesuai dengan kategori seni (${seni.kategori.nama_kategori}).` });
      }

      const existingRegistration = await PesertaSeni.findOne({ where: { idPeserta: pId, idSeni }, transaction });
      if (existingRegistration) {
        console.warn(`Peserta ${peserta.nama} sudah terdaftar di Seni ini, dilewati.`);
        continue;
      }
      await PesertaSeni.create({ idPeserta: pId, idSeni }, { transaction });
      registeredCount++;
    }
    
    if (registeredCount > 0) {
        // Update jumlah peserta di Seni (jika tunggal/solo) atau jumlah tim (jika ganda/regu)
        // Untuk ganda/regu, logika increment mungkin perlu disesuaikan (misal, increment 1 per tim, bukan per peserta)
        // Untuk saat ini, kita increment berdasarkan jumlah peserta yang berhasil didaftarkan
        await seni.increment('jumlah_peserta_terdaftar', { by: registeredCount, transaction });
    } else if (pesertaIdsToRegister.length > 0 && registeredCount === 0) {
        // Jika ada ID peserta yang dikirim tapi tidak ada yang berhasil didaftarkan (misal semua sudah terdaftar)
        await transaction.rollback();
        return res.status(400).json({ message: "Semua peserta yang dipilih sudah terdaftar atau tidak valid." });
    }


    await transaction.commit();
    res.status(201).json({ message: `${registeredCount} peserta berhasil didaftarkan ke Seni ${seni.nama_seni}.` });
  } catch (error) {
    await transaction.rollback();
    console.error("Error registerPesertaToSeni:", error);
    res.status(500).json({ message: "Gagal mendaftarkan peserta ke Seni.", error: error.message });
  }
};