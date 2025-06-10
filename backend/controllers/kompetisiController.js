// backend/controllers/kompetisiController.js
const { Laga, Seni, Kategori, Peserta, sequelize } = require('../models');
const { Op } = require('sequelize');

// Mendapatkan semua kompetisi (Laga dan Seni digabung dan diurutkan)
exports.getAllKompetisi = async (req, res) => {
  try {
    const { page = 1, limit = 20, jenis_perlombaan, search } = req.query; // sortBy akan dihandle manual
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let lagaWhere = {};
    let seniWhere = {};

    if (search) {
        lagaWhere.nama_tanding = { [Op.like]: `%${search}%` };
        seniWhere.nama_seni = { [Op.like]: `%${search}%` };
    }

    let allKompetisi = [];

    if (!jenis_perlombaan || jenis_perlombaan === 'laga') {
        const lagas = await Laga.findAll({
            where: lagaWhere,
            include: [{ model: Kategori, as: 'kategori', attributes: ['nama_kategori'] }],
            attributes: [
                'id', 
                'nama_tanding', 
                'kelas', 
                'jenis_kelamin', 
                'createdAt',
                [sequelize.literal('"laga"'), 'tipe_kompetisi'], // Tambah atribut tipe
                [
                    sequelize.literal(`(
                        SELECT COUNT(DISTINCT pl.idPeserta)
                        FROM peserta_laga AS pl
                        WHERE pl.idLaga = Laga.id
                    )`),
                    'jumlah_peserta'
                ]
            ],
            raw: true, // Untuk mendapatkan hasil plain object
            nest: true, // Untuk hasil include yang benar
        });
        allKompetisi.push(...lagas.map(l => ({...l, nama_kompetisi: l.nama_tanding})));
    }

    if (!jenis_perlombaan || jenis_perlombaan === 'seni') {
        const senis = await Seni.findAll({
            where: seniWhere,
            include: [{ model: Kategori, as: 'kategori', attributes: ['nama_kategori'] }],
            attributes: [
                'id', 
                'nama_seni', 
                'jenis_seni', 
                'jenis_kelamin', 
                'createdAt',
                [sequelize.literal('"seni"'), 'tipe_kompetisi'], // Tambah atribut tipe
                [
                    sequelize.literal(`(
                        SELECT COUNT(DISTINCT ps.idPeserta)
                        FROM peserta_seni AS ps
                        WHERE ps.idSeni = Seni.id
                    )`),
                    'jumlah_peserta'
                ]
            ],
            raw: true,
            nest: true,
        });
        allKompetisi.push(...senis.map(s => ({...s, nama_kompetisi: s.nama_seni})));
    }

    // Urutkan berdasarkan jumlah peserta terbanyak, lalu berdasarkan tanggal pembuatan terbaru
    allKompetisi.sort((a, b) => {
        if (b.jumlah_peserta !== a.jumlah_peserta) {
            return b.jumlah_peserta - a.jumlah_peserta;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const totalItems = allKompetisi.length;
    const paginatedKompetisi = allKompetisi.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      message: "Data kompetisi berhasil diambil.",
      data: paginatedKompetisi,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
    });

  } catch (error) {
    console.error("Error getAllKompetisi:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};