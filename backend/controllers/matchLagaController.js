// backend/controllers/matchLagaController.js
const { MatchLaga, Peserta, Dewan, Bracket, Laga, Kategori, sequelize, Op } = require('../models');

// Fungsi helper untuk mendapatkan nomor partai berikutnya secara global (Laga & Seni)
async function getNextPartaiNumber(transaction) {
    const lastLagaPartai = await MatchLaga.max('partai', { transaction });
    const lastSeniPartai = await sequelize.models.MatchSeni.max('partai', { transaction }); // Akses MatchSeni via sequelize.models

    const maxLaga = lastLagaPartai || 0;
    const maxSeni = lastSeniPartai || 0;

    return Math.max(maxLaga, maxSeni) + 1;
}

// Mendapatkan detail MatchLaga by ID
exports.getMatchLagaById = async (req, res) => {
    try {
        const { id } = req.params;
        const match = await MatchLaga.findByPk(id, {
            include: [
                { model: Bracket, as: 'bracketIndukLaga', include: [{ model: Laga, as: 'infoLagaBracket', include: [{model: Kategori, as: 'kategori'}]}] },
                { model: Peserta, as: 'pesertaMerah', attributes: ['id', 'nama'] },
                { model: Peserta, as: 'pesertaBiru', attributes: ['id', 'nama'] },
                { model: Peserta, as: 'pemenangLaga', attributes: ['id', 'nama'] },
                { model: Dewan, as: 'dewanPertandinganLaga', attributes: ['id', 'nama'] },
            ]
        });
        if (!match) {
            return res.status(404).json({ message: "Pertandingan Laga tidak ditemukan." });
        }
        // Format respons agar konsisten dengan apa yang mungkin diharapkan frontend
        const responseData = match.toJSON();
        responseData.pemenang = responseData.pemenangLaga;
        responseData.dewan = responseData.dewanPertandinganLaga;
        delete responseData.pemenangLaga;
        delete responseData.dewanPertandinganLaga;

        res.status(200).json({ message: "Detail Pertandingan Laga berhasil diambil.", data: responseData });
    } catch (error) {
        console.error("Error getMatchLagaById:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
    }
};

// Approve sebuah MatchLaga dan set nomor Partai
exports.approveMatchLaga = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { matchId } = req.params;
        const { idDewan } = req.body;

        const match = await MatchLaga.findByPk(matchId, { transaction });
        if (!match) {
            await transaction.rollback();
            return res.status(404).json({ message: "Pertandingan Laga tidak ditemukan." });
        }
        if (match.is_approved) {
            await transaction.rollback();
            return res.status(400).json({ message: "Pertandingan Laga sudah di-approve sebelumnya." });
        }
        if (match.status === 'bye') { // BYE sudah otomatis approved saat generate
            await transaction.rollback();
            return res.status(400).json({ message: "Pertandingan BYE tidak perlu diapprove manual." });
        }
        if (!match.idPesertaKubuMerah || !match.idPesertaKubuBiru) {
            await transaction.rollback();
            return res.status(400).json({ message: "Kedua peserta dalam pertandingan harus terisi sebelum approval." });
        }

        if (idDewan) {
            const dewan = await Dewan.findByPk(idDewan, {transaction});
            if(!dewan){
                await transaction.rollback();
                return res.status(404).json({ message: "Dewan yang dipilih tidak ditemukan." });
            }
            match.idDewan = idDewan;
        } else if (!match.idDewan) { // Jika idDewan wajib saat approve
            await transaction.rollback();
            return res.status(400).json({ message: "Dewan wajib dipilih untuk approval pertandingan." });
        }


        const nextPartaiNumber = await getNextPartaiNumber(transaction);

        match.is_approved = true;
        match.status = 'approved';
        match.partai = nextPartaiNumber;
        
        await match.save({ transaction });
        await transaction.commit();
        
        const updatedMatch = await MatchLaga.findByPk(matchId, { // Ambil lagi dengan include dewan
            include: [{ model: Dewan, as: 'dewanPertandinganLaga' }]
        });
        res.status(200).json({ message: `Pertandingan Laga berhasil di-approve dengan nomor partai ${nextPartaiNumber}.`, data: updatedMatch });

    } catch (error) {
        await transaction.rollback();
        console.error("Error approveMatchLaga:", error);
        res.status(500).json({ message: "Gagal approve Pertandingan Laga.", error: error.message });
    }
};

// Update detail pertandingan Laga (skor, pemenang, dewan)
exports.updateMatchLagaDetails = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { matchId } = req.params;
        // *** PERBAIKAN: Menggunakan pemenang_id sesuai dengan payload frontend ***
        let { skor_merah, skor_biru, pemenang_id, idDewan, status, catatan, waktu_mulai } = req.body; 

        const match = await MatchLaga.findByPk(matchId, {
            include: [{model: Bracket, as: 'bracketIndukLaga'}], 
            transaction
        });

        if (!match) {
            await transaction.rollback();
            return res.status(404).json({ message: "Pertandingan Laga tidak ditemukan." });
        }
        if (!match.is_approved && status !== 'pending' && status !== 'approved' && match.status !== 'bye') {
            await transaction.rollback();
            return res.status(400).json({ message: "Pertandingan harus diapprove terlebih dahulu sebelum input hasil (kecuali status diubah ke pending/approved)." });
        }
        if (match.status === 'selesai' && pemenang_id && match.idPemenang && parseInt(pemenang_id,10) !== match.idPemenang) {
            await transaction.rollback();
            return res.status(400).json({message: "Pertandingan sudah selesai. Untuk mengubah pemenang, perlu prosedur reset."})
        }

        // Assign skor dan dewan
        if (skor_merah !== undefined) match.skor_merah = parseInt(skor_merah, 10);
        if (skor_biru !== undefined) match.skor_biru = parseInt(skor_biru, 10);
        if (idDewan !== undefined) match.idDewan = idDewan ? parseInt(idDewan,10) : null;
        if (catatan !== undefined) match.catatan = catatan;
        if (waktu_mulai !== undefined) match.waktu_mulai = waktu_mulai;


        let pemenangUpdatedThisRequest = false;
        // *** PERBAIKAN: Menggunakan pemenang_id ***
        if (pemenang_id !== undefined) {
            if (pemenang_id !== null && pemenang_id !== '') {
                pemenang_id = parseInt(pemenang_id, 10);
            } else {
                pemenang_id = null; // Jika dikirim string kosong, set jadi null
            }

            if (pemenang_id !== null && pemenang_id !== match.idPesertaKubuMerah && pemenang_id !== match.idPesertaKubuBiru) {
                await transaction.rollback();
                return res.status(400).json({ message: "Pemenang harus salah satu dari peserta kubu merah atau biru." });
            }
            match.idPemenang = pemenang_id; // Ini adalah kolom DB, tetap idPemenang
            if (pemenang_id !== null) { // Hanya set status selesai jika ada pemenang valid
                match.status = 'selesai';
            }
            pemenangUpdatedThisRequest = true;
        } else if (status !== undefined && status !== match.status) {
            match.status = status;
        }

        await match.save({ transaction });

        // Progresi pemenang ke match berikutnya
        if (pemenangUpdatedThisRequest && match.idPemenang) {
            console.log(`[Laga] Pemenang ${match.idPemenang} dari match ${matchId} akan diproses ke match berikutnya.`);
            if (match.next_match_laga_id_merah) {
                const nextMatchMerah = await MatchLaga.findByPk(match.next_match_laga_id_merah, { transaction });
                if (nextMatchMerah && nextMatchMerah.idPesertaKubuMerah === null) {
                    nextMatchMerah.idPesertaKubuMerah = match.idPemenang;
                    await nextMatchMerah.save({ transaction });
                    console.log(`[Laga] Peserta Merah di match ${nextMatchMerah.id} diupdate dengan pemenang ${match.idPemenang}.`);
                } else if (nextMatchMerah) {
                    console.log(`[Laga] Peserta Merah di match ${nextMatchMerah.id} sudah terisi. Skip.`);
                } else {
                    console.log(`[Laga] Next Match Merah dengan ID ${match.next_match_laga_id_merah} tidak ditemukan.`);
                }
            }
            if (match.next_match_laga_id_biru) {
                const nextMatchBiru = await MatchLaga.findByPk(match.next_match_laga_id_biru, { transaction });
                if (nextMatchBiru && nextMatchBiru.idPesertaKubuBiru === null) {
                    nextMatchBiru.idPesertaKubuBiru = match.idPemenang;
                    await nextMatchBiru.save({ transaction });
                    console.log(`[Laga] Peserta Biru di match ${nextMatchBiru.id} diupdate dengan pemenang ${match.idPemenang}.`);
                } else if (nextMatchBiru) {
                    console.log(`[Laga] Peserta Biru di match ${nextMatchBiru.id} sudah terisi. Skip.`);
                } else {
                    console.log(`[Laga] Next Match Biru dengan ID ${match.next_match_laga_id_biru} tidak ditemukan.`);
                }
            }
        } else {
            console.log(`[Laga] Progresi pemenang tidak dijalankan. Pemenang tidak diupdate atau idPemenang null.`);
        }

        await transaction.commit();
        // Ambil data match terbaru dengan semua include untuk respons
        const updatedMatchWithIncludes = await MatchLaga.findByPk(matchId, {
            include: [
                { model: Peserta, as: 'pesertaMerah', attributes: ['id', 'nama'] },
                { model: Peserta, as: 'pesertaBiru', attributes: ['id', 'nama'] },
                { model: Peserta, as: 'pemenangLaga', attributes: ['id', 'nama'] },
                { model: Dewan, as: 'dewanPertandinganLaga', attributes: ['id', 'nama'] },
            ]
        });
        res.status(200).json({ message: "Detail Pertandingan Laga berhasil diperbarui.", data: updatedMatchWithIncludes });

    } catch (error) {
        await transaction.rollback();
        console.error("Error updateMatchLagaDetails:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Data tidak valid.", errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: "Gagal update detail Pertandingan Laga.", error: error.message });
    }
};
