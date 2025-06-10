// backend/models/Kategori.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kategori = sequelize.define('Kategori', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // Contoh: 'Pra Usia Dini', 'Usia Dini', 'Pra Remaja', 'Remaja', 'Dewasa', 'Master'
  nama_kategori: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  // Deskripsi tambahan jika perlu
  // deskripsi: {
  //   type: DataTypes.TEXT,
  //   allowNull: true,
  // }
}, {
  tableName: 'kategori',
  timestamps: true,
});

module.exports = Kategori;