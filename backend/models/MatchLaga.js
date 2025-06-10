// backend/models/MatchLaga.js
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const MatchLaga = sequelize.define('MatchLaga', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // idBracket akan ditambahkan melalui asosiasi
  // idLaga akan ditambahkan melalui asosiasi (untuk tahu ini match dari kategori laga mana)
  nama_match_laga: { // Bisa digenerate: "Partai X: Kubu Merah vs Kubu Biru" atau "Final Laga Dewasa A Pria"
    type: DataTypes.STRING,
    allowNull: true,
  },
  // idPesertaKubuMerah akan ditambahkan melalui asosiasi
  // idPesertaKubuBiru akan ditambahkan melalui asosiasi
  skor_merah: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  skor_biru: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // idPemenang (Peserta) akan ditambahkan melalui asosiasi
  // idDewan akan ditambahkan melalui asosiasi
  ronde: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  match_order_in_round: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'berjalan', 'selesai', 'bye'),
    defaultValue: 'pending',
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  partai: { // Nomor urut pertandingan
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  waktu_mulai: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  catatan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Untuk progresi bracket
  // next_match_laga_id_merah akan ditambahkan melalui asosiasi (self-reference)
  // next_match_laga_id_biru akan ditambahkan melalui asosiasi (self-reference)
}, {
  tableName: 'match_laga',
  timestamps: true,
  indexes: [
    {
      fields: ['idBracket', 'ronde', 'match_order_in_round'],
    },
    {
      fields: ['partai'],
      unique: true,
      where: { partai: { [Op.ne]: null } }
    }
  ]
});

module.exports = MatchLaga;