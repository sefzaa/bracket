// backend/models/Seni.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seni = sequelize.define('Seni', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // idKategori akan ditambahkan melalui asosiasi
  // jenis_seni: 'tunggal', 'ganda', 'regu', 'solo kreatif'
  jenis_seni: {
    type: DataTypes.ENUM('tunggal', 'ganda', 'regu', 'solo kreatif'),
    allowNull: false,
  },
  // nama_seni akan digenerate, contoh: "Seni Tunggal Remaja Wanita"
  nama_seni: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Pastikan kombinasi ini unik
  },
  jenis_kelamin: { // Untuk tunggal/ganda/solo bisa spesifik, untuk regu bisa 'campuran'
    type: DataTypes.ENUM('pria', 'wanita', 'campuran'),
    allowNull: false,
  },
  // Field untuk menyimpan jumlah peserta/tim terdaftar di seni ini
  jumlah_peserta_terdaftar: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'seni',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['idKategori', 'jenis_seni', 'jenis_kelamin'] // Kombinasi unik untuk seni
    }
  ]
});

module.exports = Seni;