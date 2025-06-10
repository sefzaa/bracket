// backend/models/MatchSeni.js
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const MatchSeni = sequelize.define('MatchSeni', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // idBracket akan ditambahkan melalui asosiasi
  // idSeni akan ditambahkan melalui asosiasi
  nama_match_seni: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Untuk seni, 'kubu' mungkin tidak selalu 2. Bisa 1 (tunggal/solo) atau banyak (komparasi).
  // Untuk bracket, kita asumsikan tetap ada 2 'kubu' yang bertanding per match.
  // idPesertaKubuMerah (atau idTimKubuMerah jika seni beregu)
  // idPesertaKubuBiru (atau idTimKubuBiru)
  // Untuk seni tunggal/solo, kubu_biru_id bisa NULL jika formatnya penampilan individu lalu ranking.
  // Namun, jika format bracket, maka akan ada lawan.
  // Kita akan tetap gunakan idPesertaKubuMerah dan idPesertaKubuBiru untuk konsistensi dengan Laga.
  // Untuk seni beregu, ini bisa merujuk ke ID Tim (model Tim belum ada, bisa dikembangkan)
  // atau kita bisa menyimpan array JSON dari ID Peserta di sini (kurang ideal untuk relasi).
  // Untuk saat ini, kita asumsikan merujuk ke Peserta (jika tunggal/ganda)
  // atau perlu penyesuaian lebih lanjut untuk regu.

  // idPesertaKubuMerah akan ditambahkan melalui asosiasi
  // idPesertaKubuBiru akan ditambahkan melalui asosiasi

  // Skor untuk seni bisa lebih kompleks (juri 1, juri 2, total, dll.)
  // Untuk penyederhanaan awal, kita gunakan skor tunggal per kubu.
  skor_merah: { // Atau skor_penampil_1
    type: DataTypes.FLOAT, // Skor seni bisa desimal
    allowNull: true,
  },
  skor_biru: { // Atau skor_penampil_2
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  // idPemenang (Peserta) akan ditambahkan melalui asosiasi
  // idDewan (atau idJuriPanel) akan ditambahkan melalui asosiasi
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
  partai: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  waktu_tampil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  catatan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // next_match_seni_id_merah akan ditambahkan melalui asosiasi
  // next_match_seni_id_biru akan ditambahkan melalui asosiasi
}, {
  tableName: 'match_seni',
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

module.exports = MatchSeni;