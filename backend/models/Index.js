// backend/models/index.js
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Impor semua model baru - PASTIKAN CASING SESUAI NAMA FILE AKTUAL
const Kategori = require('./Kategori');       // Asumsi nama file: Kategori.js
const Kontingen = require('./Kontingen');     // Asumsi nama file: Kontingen.js
const Laga = require('./Laga');             // Asumsi nama file: Laga.js
const Seni = require('./Seni');             // Asumsi nama file: Seni.js
const { Peserta, PesertaLaga, PesertaSeni } = require('./Peserta'); // Asumsi nama file: Peserta.js
const MatchLaga = require('./MatchLaga');     // Asumsi nama file: MatchLaga.js
const MatchSeni = require('./MatchSeni');     // Asumsi nama file: MatchSeni.js
const Dewan = require('./Dewan');           // Asumsi nama file: Dewan.js
const Bracket = require('./Bracket');       // Asumsi nama file: Bracket.js

// === Definisikan Asosiasi ===
// (Asosiasi tetap sama seperti kode yang sudah saya berikan sebelumnya)

// Kategori <-> Laga
Kategori.hasMany(Laga, { foreignKey: 'idKategori', as: 'lagas' });
Laga.belongsTo(Kategori, { foreignKey: 'idKategori', as: 'kategori' });

// Kategori <-> Seni
Kategori.hasMany(Seni, { foreignKey: 'idKategori', as: 'senis' });
Seni.belongsTo(Kategori, { foreignKey: 'idKategori', as: 'kategori' });

// Kontingen <-> Peserta
Kontingen.hasMany(Peserta, { foreignKey: 'idKontingen', as: 'pesertas' });
Peserta.belongsTo(Kontingen, { foreignKey: 'idKontingen', as: 'kontingen' });

// Peserta <-> Kategori (Usia)
Kategori.hasMany(Peserta, { foreignKey: 'idKategoriUsia', as: 'pesertaDenganKategoriUsiaIni' });
Peserta.belongsTo(Kategori, { foreignKey: 'idKategoriUsia', as: 'kategoriUsiaPeserta' });

// Peserta <-> Laga (Many-to-Many)
Peserta.belongsToMany(Laga, { through: PesertaLaga, foreignKey: 'idPeserta', as: 'lagaYangDiikuti' });
Laga.belongsToMany(Peserta, { through: PesertaLaga, foreignKey: 'idLaga', as: 'pesertaTerdaftarDiLaga' });

// Peserta <-> Seni (Many-to-Many)
Peserta.belongsToMany(Seni, { through: PesertaSeni, foreignKey: 'idPeserta', as: 'seniYangDiikuti' });
Seni.belongsToMany(Peserta, { through: PesertaSeni, foreignKey: 'idSeni', as: 'pesertaTerdaftarDiSeni' });

// Laga <-> Bracket
Laga.hasOne(Bracket, { foreignKey: 'idLaga', as: 'bracketUntukLaga', constraints: false, onDelete: 'CASCADE' });
Bracket.belongsTo(Laga, { foreignKey: 'idLaga', as: 'infoLagaBracket', constraints: false });

// Seni <-> Bracket
Seni.hasOne(Bracket, { foreignKey: 'idSeni', as: 'bracketUntukSeni', constraints: false, onDelete: 'CASCADE' });
Bracket.belongsTo(Seni, { foreignKey: 'idSeni', as: 'infoSeniBracket', constraints: false });

// Bracket <-> MatchLaga
Bracket.hasMany(MatchLaga, { foreignKey: 'idBracket', as: 'daftarMatchLaga', onDelete: 'CASCADE' });
MatchLaga.belongsTo(Bracket, { foreignKey: 'idBracket', as: 'bracketIndukLaga' });

// Bracket <-> MatchSeni
Bracket.hasMany(MatchSeni, { foreignKey: 'idBracket', as: 'daftarMatchSeni', onDelete: 'CASCADE' });
MatchSeni.belongsTo(Bracket, { foreignKey: 'idBracket', as: 'bracketIndukSeni' });

// MatchLaga Associations
MatchLaga.belongsTo(Peserta, { foreignKey: 'idPesertaKubuMerah', as: 'pesertaMerah', constraints: false, onDelete: 'SET NULL' });
MatchLaga.belongsTo(Peserta, { foreignKey: 'idPesertaKubuBiru', as: 'pesertaBiru', constraints: false, onDelete: 'SET NULL' });
MatchLaga.belongsTo(Peserta, { foreignKey: 'idPemenang', as: 'pemenangLaga', constraints: false, onDelete: 'SET NULL' });
MatchLaga.belongsTo(Dewan, { foreignKey: 'idDewan', as: 'dewanPertandinganLaga', onDelete: 'SET NULL' });
MatchLaga.belongsTo(MatchLaga, { foreignKey: 'next_match_laga_id_merah', as: 'nextMatchUntukSlotMerahLaga', constraints: false, onDelete: 'SET NULL' });
MatchLaga.belongsTo(MatchLaga, { foreignKey: 'next_match_laga_id_biru', as: 'nextMatchUntukSlotBiruLaga', constraints: false, onDelete: 'SET NULL' });

// MatchSeni Associations
MatchSeni.belongsTo(Peserta, { foreignKey: 'idPesertaKubuMerah', as: 'pesertaMerahSeni', constraints: false, onDelete: 'SET NULL' });
MatchSeni.belongsTo(Peserta, { foreignKey: 'idPesertaKubuBiru', as: 'pesertaBiruSeni', constraints: false, onDelete: 'SET NULL' });
MatchSeni.belongsTo(Peserta, { foreignKey: 'idPemenang', as: 'pemenangSeni', constraints: false, onDelete: 'SET NULL' });
MatchSeni.belongsTo(Dewan, { foreignKey: 'idDewan', as: 'dewanPenilaiSeni', onDelete: 'SET NULL' });
MatchSeni.belongsTo(MatchSeni, { foreignKey: 'next_match_seni_id_merah', as: 'nextMatchUntukSlotMerahSeni', constraints: false, onDelete: 'SET NULL' });
MatchSeni.belongsTo(MatchSeni, { foreignKey: 'next_match_seni_id_biru', as: 'nextMatchUntukSlotBiruSeni', constraints: false, onDelete: 'SET NULL' });


const syncDatabase = async (forceDrop = false) => {
  try {
    await sequelize.sync({ force: forceDrop, alter: !forceDrop });
    console.log('Database & tabel berhasil disinkronkan.');
  } catch (error) {
    console.error('Gagal sinkronisasi database:', error);
  }
};

module.exports = {
  sequelize,
  Op,
  Kategori,
  Kontingen,
  Laga,
  Seni,
  Peserta,
  PesertaLaga,
  PesertaSeni,
  MatchLaga,
  MatchSeni,
  Dewan,
  Bracket,
  syncDatabase,
};