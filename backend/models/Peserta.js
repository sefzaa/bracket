// backend/models/Peserta.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Peserta = sequelize.define('Peserta', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // idKontingen akan ditambahkan melalui asosiasi
  // idKategori (usia) akan ditambahkan melalui asosiasi
  jenis_kelamin: {
    type: DataTypes.ENUM('pria', 'wanita'),
    allowNull: false,
  },
  // Kelas dan jenis_seni akan ditentukan saat pendaftaran ke Laga/Seni spesifik,
  // tapi bisa disimpan di sini sebagai preferensi atau data umum jika diperlukan.
  // Untuk saat ini, kita akan mengandalkan pendaftaran ke Laga/Seni untuk detail ini.
  // tanggal_lahir: {
  //   type: DataTypes.DATEONLY,
  //   allowNull: true,
  // },
  // berat_badan: { // Untuk validasi kelas laga
  //   type: DataTypes.FLOAT,
  //   allowNull: true,
  // }
}, {
  tableName: 'peserta',
  timestamps: true,
});

// Junction table untuk Peserta dan Laga (Many-to-Many)
const PesertaLaga = sequelize.define('PesertaLaga', {
  id: { // Opsional, bisa tanpa ID jika hanya sebagai junction
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // idPeserta dan idLaga akan otomatis dibuat oleh Sequelize
  // Tambahkan atribut spesifik untuk pendaftaran ini jika ada, misal:
  // nomor_punggung: DataTypes.STRING,
  // status_pendaftaran: DataTypes.ENUM('pending', 'confirmed', 'rejected'),
}, { timestamps: false, tableName: 'peserta_laga' });

// Junction table untuk Peserta dan Seni (Many-to-Many)
// Untuk seni ganda/regu, satu entri Seni bisa memiliki banyak Peserta.
// Untuk seni tunggal/solo, satu entri Seni memiliki satu Peserta.
// Kita bisa handle ini dengan Many-to-Many dan validasi di controller.
const PesertaSeni = sequelize.define('PesertaSeni', {
   id: { // Opsional
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // idPeserta dan idSeni akan otomatis dibuat
  // peran_dalam_tim: DataTypes.STRING, // Misal untuk regu
}, { timestamps: false, tableName: 'peserta_seni' });


module.exports = { Peserta, PesertaLaga, PesertaSeni };