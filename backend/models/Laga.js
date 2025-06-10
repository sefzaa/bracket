// backend/models/Laga.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Laga = sequelize.define('Laga', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // idKategori akan ditambahkan melalui asosiasi
  // nama_tanding akan digenerate, contoh: "Laga Dewasa A Pria"
  nama_tanding: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Pastikan kombinasi ini unik
  },
  // Contoh: 'A', 'B', 'C', ... 'OPEN'
  kelas: {
    type: DataTypes.STRING, // Bisa ENUM jika kelas terbatas dan baku
    allowNull: false,
  },
  jenis_kelamin: {
    type: DataTypes.ENUM('pria', 'wanita', 'campuran'), // Tambah 'campuran' jika ada
    allowNull: false,
  },
  // Field untuk menyimpan jumlah peserta terdaftar di laga ini (bisa di-update via trigger atau controller)
  jumlah_peserta_terdaftar: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'laga',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['idKategori', 'kelas', 'jenis_kelamin'] // Kombinasi unik untuk laga
    }
  ]
});

module.exports = Laga;