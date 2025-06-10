// backend/models/Bracket.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bracket = sequelize.define('Bracket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // Bracket ini untuk kategori Laga atau Seni mana?
  // Salah satu dari idLaga atau idSeni akan diisi.
  idLaga: { // Foreign Key ke tabel Laga
    type: DataTypes.INTEGER,
    allowNull: true, // Bisa NULL jika ini bracket untuk Seni
    references: {
      model: 'laga', // Nama tabel
      key: 'id',
    }
  },
  idSeni: { // Foreign Key ke tabel Seni
    type: DataTypes.INTEGER,
    allowNull: true, // Bisa NULL jika ini bracket untuk Laga
    references: {
      model: 'seni', // Nama tabel
      key: 'id',
    }
  },
  // Menyimpan tipe bracket agar mudah diidentifikasi
  tipe_kompetisi: {
    type: DataTypes.ENUM('laga', 'seni'),
    allowNull: false,
  },
  nama_bracket: { // Contoh: "Bracket Laga Dewasa A Pria" atau "Bracket Seni Tunggal Remaja Wanita"
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('belum dibuat', 'pending', 'berjalan', 'selesai'),
    defaultValue: 'belum dibuat',
  },
}, {
  tableName: 'bracket',
  timestamps: true,
  // Tambahkan validasi custom untuk memastikan hanya salah satu idLaga atau idSeni yang diisi
  validate: {
    eitherLagaOrSeni() {
      if (this.idLaga && this.idSeni) {
        throw new Error('Bracket hanya bisa untuk Laga atau Seni, tidak keduanya.');
      }
      if (!this.idLaga && !this.idSeni) {
        throw new Error('Bracket harus memiliki referensi ke Laga atau Seni.');
      }
      if (this.idLaga && this.tipe_kompetisi !== 'laga') {
        throw new Error('Jika idLaga diisi, tipe_kompetisi harus laga.');
      }
      if (this.idSeni && this.tipe_kompetisi !== 'seni') {
        throw new Error('Jika idSeni diisi, tipe_kompetisi harus seni.');
      }
    }
  }
});

module.exports = Bracket;