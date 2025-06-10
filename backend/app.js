const express = require('express');
const bodyParser = require('body-parser');
const { syncDatabase } = require('./models');
const cors = require('cors'); // Import the cors middleware
const app = express(); // Inisialisasi app di sini


// Impor semua rute baru
const kategoriRoutes = require('./routes/kategoriRoutes');
const kontingenRoutes = require('./routes/kontingenRoutes');
const dewanRoutes = require('./routes/dewanRoutes');
const pesertaRoutes = require('./routes/pesertaRoutes');
const lagaRoutes = require('./routes/lagaRoutes');
const seniRoutes = require('./routes/seniRoutes');
const kompetisiRoutes = require('./routes/kompetisiRoutes');
const bracketRoutes = require('./routes/bracketRoutes');
const matchLagaRoutes = require('./routes/matchLagaRoutes');
const matchSeniRoutes = require('./routes/matchSeniRoutes');
// Konfigurasi CORS
const corsOptions = {
  origin: 'http://localhost:3001', // Origin frontend Anda
  optionsSuccessStatus: 200 // Untuk beberapa browser lama
};
app.use(cors(corsOptions)); // Gunakan middleware CORS setelah inisialisasi app

// Middleware lainnya
app.use(bodyParser.json());

// Gunakan Rute
app.use('/api/kategori', kategoriRoutes);
app.use('/api/kontingen', kontingenRoutes);
app.use('/api/dewan', dewanRoutes);
app.use('/api/peserta', pesertaRoutes);
app.use('/api/laga', lagaRoutes);
app.use('/api/seni', seniRoutes);
app.use('/api/kompetisi', kompetisiRoutes); // Untuk list gabungan laga & seni
app.use('/api/bracket', bracketRoutes);
app.use('/api/match-laga', matchLagaRoutes);
app.use('/api/match-seni', matchSeniRoutes);

// Sinkronisasi database
syncDatabase();

module.exports = app;