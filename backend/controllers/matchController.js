// backend/controllers/matchController.js
const { Match, Peserta, Dewan, Bracket, sequelize } = require('../models');
const { Op } = require('sequelize');

// Mendapatkan detail Match by ID
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id, {
      include: [
        { model: Peserta, as: 'peserta_merah', attributes: ['id', 'nama'] },
        { model: Peserta, as: 'peserta_biru', attributes: ['id', 'nama'] },
        { model: Peserta, as: 'pemenang', attributes: ['id', 'nama'] },
        { model: Dewan, as: 'dewan', attributes: ['id', 'nama'] },
        { model: Bracket, as: 'bracket', include: [{model: Grup, as: 'grup'}]}
      ]
    });
    if (!match) {
      return res.status(404).json({ message: "Match tidak ditemukan." });
    }
    res.status(200).json({ message: "Detail match berhasil diambil.", data: match });
  } catch (error) {
    console.error("Error getMatchById:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
  }
};

// Mendapatkan semua match untuk sebuah Bracket ID
exports.getMatchesByBracketId = async (req, res) => {
    try {
        const { bracketId } = req.params;
        const matches = await Match.findAll({
            where: { bracketId },
            include: [
                { model: Peserta, as: 'peserta_merah', attributes: ['id', 'nama'] },
                { model: Peserta, as: 'peserta_biru', attributes: ['id', 'nama'] },
                { model: Peserta, as: 'pemenang', attributes: ['id', 'nama'] },
                { model: Dewan, as: 'dewan', attributes: ['id', 'nama'] },
            ],
            order: [['ronde', 'ASC'], ['match_order_in_round', 'ASC']],
        });
        if (!matches || matches.length === 0) {
            return res.status(404).json({ message: "Tidak ada match ditemukan untuk bracket ini." });
        }
        res.status(200).json({ message: "Data match berhasil diambil.", data: matches });
    } catch (error) {
        console.error("Error getMatchesByBracketId:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
    }
};


// Approve sebuah Match dan set nomor Partai
exports.approveMatch = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { matchId } = req.params;
    const { dewanId } = req.body; // Dewan yang meng-approve

    const match = await Match.findByPk(matchId, { transaction });
    if (!match) {
      await transaction.rollback();
      return res.status(404).json({ message: "Match tidak ditemukan." });
    }
    if (match.is_approved) {
      await transaction.rollback();
      return res.status(400).json({ message: "Match sudah di-approve sebelumnya." });
    }
    if (!match.peserta_merah_id || !match.peserta_biru_id) {
        await transaction.rollback();
        return res.status(400).json({ message: "Kedua peserta dalam match harus terisi sebelum approval (kecuali BYE yang otomatis). Match ini bukan BYE." });
    }

    // Tentukan nomor partai berikutnya
    const lastApprovedMatch = await Match.findOne({
      attributes: [[sequelize.fn('max', sequelize.col('partai')), 'maxPartai']],
      where: { partai: { [Op.not]: null } },
      raw: true,
      transaction
    });
    const nextPartaiNumber = (lastApprovedMatch && lastApprovedMatch.maxPartai ? lastApprovedMatch.maxPartai : 0) + 1;

    match.is_approved = true;
    match.status = 'approved'; // Ubah status menjadi approved
    match.partai = nextPartaiNumber;
    if (dewanId) { // Jika dewan dipilih saat approval
        const dewan = await Dewan.findByPk(dewanId, {transaction});
        if(!dewan){
            await transaction.rollback();
            return res.status(404).json({ message: "Dewan yang dipilih tidak ditemukan." });
        }
        match.dewanId = dewanId;
    }

    await match.save({ transaction });
    await transaction.commit();
    res.status(200).json({ message: `Match berhasil di-approve dengan nomor partai ${nextPartaiNumber}.`, data: match });

  } catch (error) {
    await transaction.rollback();
    console.error("Error approveMatch:", error);
    res.status(500).json({ message: "Gagal approve match.", error: error.message });
  }
};

// Update detail pertandingan (skor, pemenang, dewan)
// exports.updateMatchDetails = async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const { matchId } = req.params;
//     let { skor_merah, skor_biru, pemenang_id, dewanId, status, waktu_mulai, waktu_selesai, catatan } = req.body;

//     const match = await Match.findByPk(matchId, {
//         include: [
//             { model: Bracket, as: 'bracket' } // Untuk mendapatkan next_match_id
//         ],
//         transaction
//     });

//     if (!match) {
//       await transaction.rollback();
//       return res.status(404).json({ message: "Match tidak ditemukan." });
//     }
//     if (!match.is_approved && status !== 'pending' && status !== 'approved') { // Hanya status pending/approved yg bisa diubah jika belum di approve
//         // kecuali jika kita ingin mengizinkan input skor tanpa approval eksplisit, maka kondisi ini bisa diubah
//         // await transaction.rollback();
//         // return res.status(400).json({ message: "Match belum di-approve. Tidak bisa input skor/pemenang." });
//     }
//     if (match.status === 'selesai' && pemenang_id && match.pemenang_id !== pemenang_id) {
//         // Logika jika ingin mengubah pemenang yang sudah ada (mungkin perlu reset match berikutnya)
//         // Untuk saat ini, kita cegah jika pemenang sudah ada dan ingin diubah.
//         await transaction.rollback();
//         return res.status(400).json({message: "Match sudah selesai dan pemenang sudah ditentukan. Untuk mengubah, reset match terlebih dahulu."})
//     }


//     // Update data
//     if (skor_merah !== undefined) match.skor_merah = skor_merah;
//     if (skor_biru !== undefined) match.skor_biru = skor_biru;
//     if (dewanId !== undefined) match.dewanId = dewanId; // Bisa ganti dewan
//     if (waktu_mulai !== undefined) match.waktu_mulai = waktu_mulai;
//     if (waktu_selesai !== undefined) match.waktu_selesai = waktu_selesai;
//     if (catatan !== undefined) match.catatan = catatan;

//     let pemenangUpdated = false;
//     if (pemenang_id !== undefined) { // Jika pemenang ditentukan
//       if (pemenang_id !== null && pemenang_id !== match.peserta_merah_id && pemenang_id !== match.peserta_biru_id) {
//         await transaction.rollback();
//         return res.status(400).json({ message: "Pemenang harus salah satu dari peserta merah atau biru." });
//       }
//       match.pemenang_id = pemenang_id;
//       match.status = 'selesai'; // Otomatis set status selesai jika ada pemenang
//       pemenangUpdated = true;
//     } else if (status !== undefined) { // Jika status diubah manual
//         match.status = status;
//     }


//     await match.save({ transaction });

//     // Jika pemenang diupdate dan ada match berikutnya, update peserta di match berikutnya
//     if (pemenangUpdated && match.pemenang_id) {
//         // Cari match berikutnya dimana pemenang dari match ini akan bertanding
//         // Ini menggunakan relasi next_match_id_merah/biru yang sudah kita definisikan (atau bisa query manual)
        
//         // Cek apakah match ini adalah source untuk slot merah di match lain
//         const nextMatchForMerahSlot = await Match.findOne({ 
//             where: { id: match.next_match_id_merah, bracketId: match.bracketId }, // pastikan dalam bracket yang sama
//             transaction 
//         });
//         if (nextMatchForMerahSlot) {
//             nextMatchForMerahSlot.peserta_merah_id = match.pemenang_id;
//             await nextMatchForMerahSlot.save({ transaction });
//         }

//         // Cek apakah match ini adalah source untuk slot biru di match lain
//         const nextMatchForBiruSlot = await Match.findOne({ 
//             where: { id: match.next_match_id_biru, bracketId: match.bracketId }, // pastikan dalam bracket yang sama
//             transaction 
//         });
//         if (nextMatchForBiruSlot) {
//             nextMatchForBiruSlot.peserta_biru_id = match.pemenang_id;
//             await nextMatchForBiruSlot.save({ transaction });
//         }
        
//         // Logika alternatif jika next_match_id hanya satu:
//         // const nextMatch = await Match.findByPk(match.next_match_id, {transaction});
//         // if (nextMatch) {
//         //    if (match.winner_goes_to_slot === 'merah') nextMatch.peserta_merah_id = match.pemenang_id;
//         //    else if (match.winner_goes_to_slot === 'biru') nextMatch.peserta_biru_id = match.pemenang_id;
//         //    await nextMatch.save({transaction});
//         // }
//     }


//     await transaction.commit();
//     res.status(200).json({ message: "Detail match berhasil diperbarui.", data: match });

//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error updateMatchDetails:", error);
//     if (error.name === 'SequelizeValidationError') {
//       return res.status(400).json({ message: "Data tidak valid.", errors: error.errors.map(e => e.message) });
//     }
//     res.status(500).json({ message: "Gagal update detail match.", error: error.message });
//   }
// };

// backend/controllers/matchController.js

// ... (impor dan fungsi lainnya) ...

exports.updateMatchDetails = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { matchId } = req.params;
    // Ambil pemenang_id sebagai let agar bisa diubah
    let { skor_merah, skor_biru, pemenang_id, dewanId, status, waktu_mulai, waktu_selesai, catatan } = req.body;

    const match = await Match.findByPk(matchId, {
        include: [ { model: Bracket, as: 'bracket' } ],
        transaction
    });

    if (!match) {
      await transaction.rollback();
      return res.status(404).json({ message: "Match tidak ditemukan." });
    }
    // ... (validasi lainnya jika ada) ...

    // Update data
    if (skor_merah !== undefined) match.skor_merah = parseInt(skor_merah, 10); // Pastikan skor juga integer
    if (skor_biru !== undefined) match.skor_biru = parseInt(skor_biru, 10);   // Pastikan skor juga integer
    if (dewanId !== undefined) match.dewanId = dewanId;
    if (waktu_mulai !== undefined) match.waktu_mulai = waktu_mulai;
    if (waktu_selesai !== undefined) match.waktu_selesai = waktu_selesai;
    if (catatan !== undefined) match.catatan = catatan;

    let pemenangUpdated = false;
    if (pemenang_id !== undefined) {
      // *** AWAL PERUBAHAN PENTING ***
      if (pemenang_id !== null && pemenang_id !== '') {
        pemenang_id = parseInt(pemenang_id, 10); // Konversi ke integer
      } else if (pemenang_id === '') { // Jika string kosong dikirim untuk "tidak ada pemenang"
        pemenang_id = null;
      }
      // *** AKHIR PERUBAHAN PENTING ***

      // Sekarang pemenang_id adalah angka atau null, siap untuk dibandingkan
      if (pemenang_id !== null && pemenang_id !== match.peserta_merah_id && pemenang_id !== match.peserta_biru_id) {
        await transaction.rollback();
        return res.status(400).json({ message: "Pemenang harus salah satu dari peserta merah atau biru." });
      }

      match.pemenang_id = pemenang_id;
      if (pemenang_id !== null) { // Hanya set status selesai jika ada pemenang
        match.status = 'selesai';
      }
      pemenangUpdated = true;
    } else if (status !== undefined) {
        match.status = status;
    }

    await match.save({ transaction });

    // ... (logika progresi pemenang tetap sama) ...
    if (pemenangUpdated && match.pemenang_id) {
        const nextMatchForMerahSlot = await Match.findOne({ where: { id: match.next_match_id_merah, bracketId: match.bracketId }, transaction });
        if (nextMatchForMerahSlot && nextMatchForMerahSlot.peserta_merah_id === null) { // Hanya update jika slot kosong
            nextMatchForMerahSlot.peserta_merah_id = match.pemenang_id;
            await nextMatchForMerahSlot.save({ transaction });
        }
        const nextMatchForBiruSlot = await Match.findOne({ where: { id: match.next_match_id_biru, bracketId: match.bracketId }, transaction });
        if (nextMatchForBiruSlot && nextMatchForBiruSlot.peserta_biru_id === null) { // Hanya update jika slot kosong
            nextMatchForBiruSlot.peserta_biru_id = match.pemenang_id;
            await nextMatchForBiruSlot.save({ transaction });
        }
    }

    await transaction.commit();
    res.status(200).json({ message: "Detail match berhasil diperbarui.", data: match });

  } catch (error) {
    await transaction.rollback();
    console.error("Error updateMatchDetails:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: "Data tidak valid.", errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: "Gagal update detail match.", error: error.message });
  }
};

// Fungsi untuk menentukan pemenang WO (Walk Out)
exports.setWinnerWO = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { matchId } = req.params;
        const { pemenang_wo_id, alasan_wo } = req.body; // ID peserta yang dinyatakan menang WO

        const match = await Match.findByPk(matchId, { transaction });
        if (!match) {
            await transaction.rollback();
            return res.status(404).json({ message: "Match tidak ditemukan." });
        }
        if (match.status === 'selesai' || match.status === 'bye') {
             await transaction.rollback();
            return res.status(400).json({ message: `Match sudah ${match.status}.` });
        }
        if (!match.is_approved) {
            // Bisa dipertimbangkan apakah WO bisa diset sebelum approval
            // await transaction.rollback();
            // return res.status(400).json({ message: "Match belum di-approve." });
        }
        if (pemenang_wo_id !== match.peserta_merah_id && pemenang_wo_id !== match.peserta_biru_id) {
            await transaction.rollback();
            return res.status(400).json({ message: "Pemenang WO harus salah satu dari peserta match tersebut." });
        }

        match.pemenang_id = pemenang_wo_id;
        match.status = 'selesai'; // Anggap selesai
        match.catatan = match.catatan ? `${match.catatan}\nWO: ${alasan_wo || 'Peserta lawan tidak hadir/mengundurkan diri'}` : `WO: ${alasan_wo || 'Peserta lawan tidak hadir/mengundurkan diri'}`;
        // Skor bisa diset default untuk WO, misal 3-0 atau sesuai aturan
        if (pemenang_wo_id === match.peserta_merah_id) {
            match.skor_merah = match.skor_merah === null ? 3 : match.skor_merah; // Default skor WO
            match.skor_biru = match.skor_biru === null ? 0 : match.skor_biru;
        } else {
            match.skor_merah = match.skor_merah === null ? 0 : match.skor_merah;
            match.skor_biru = match.skor_biru === null ? 3 : match.skor_biru; // Default skor WO
        }

        await match.save({ transaction });

        // Logika progresi pemenang ke match berikutnya (sama seperti di updateMatchDetails)
        if (match.pemenang_id) {
            const nextMatchForMerahSlot = await Match.findOne({ where: { id: match.next_match_id_merah, bracketId: match.bracketId }, transaction });
            if (nextMatchForMerahSlot) {
                nextMatchForMerahSlot.peserta_merah_id = match.pemenang_id;
                await nextMatchForMerahSlot.save({ transaction });
            }
            const nextMatchForBiruSlot = await Match.findOne({ where: { id: match.next_match_id_biru, bracketId: match.bracketId }, transaction });
            if (nextMatchForBiruSlot) {
                nextMatchForBiruSlot.peserta_biru_id = match.pemenang_id;
                await nextMatchForBiruSlot.save({ transaction });
            }
        }

        await transaction.commit();
        res.status(200).json({ message: `Pemenang WO berhasil ditentukan untuk match ${matchId}.`, data: match });

    } catch (error) {
        await transaction.rollback();
        console.error("Error setWinnerWO:", error);
        res.status(500).json({ message: "Gagal menentukan pemenang WO.", error: error.message });
    }
};