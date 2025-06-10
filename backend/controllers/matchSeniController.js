// backend/controllers/matchSeniController.js
const { MatchSeni, Peserta, Dewan, Bracket, Seni, Kategori, sequelize, Op } = require('../models');

// Fungsi helper untuk mendapatkan nomor partai berikutnya secara global (Laga & Seni)
async function getNextPartaiNumber(transaction) {
    const lastLagaPartai = await sequelize.models.MatchLaga.max('partai', { transaction });
    const lastSeniPartai = await MatchSeni.max('partai', { transaction });

    const maxLaga = lastLagaPartai || 0;
    const maxSeni = lastSeniPartai || 0;

    return Math.max(maxLaga, maxSeni) + 1;
}

// Mendapatkan detail MatchSeni by ID
exports.getMatchSeniById = async (req, res) => {
    try {
        const { id } = req.params;
        const match = await MatchSeni.findByPk(id, {
            include: [
                { model: Bracket, as: 'bracketIndukSeni', include: [{ model: Seni, as: 'infoSeniBracket', include: [{model: Kategori, as: 'kategori'}]}] },
                { model: Peserta, as: 'pesertaMerahSeni', attributes: ['id', 'nama'] },
                { model: Peserta, as: 'pesertaBiruSeni', attributes: ['id', 'nama'] }, // Mungkin tidak selalu ada untuk semua jenis seni
                { model: Peserta, as: 'pemenangSeni', attributes: ['id', 'nama'] },
                { model: Dewan, as: 'dewanPenilaiSeni', attributes: ['id', 'nama'] },
            ]
        });
        if (!match) {
            return res.status(404).json({ message: "Pertandingan Seni tidak ditemukan." });
        }
        // Format respons agar konsisten
        const responseData = match.toJSON();
        responseData.pesertaMerah = responseData.pesertaMerahSeni;
        responseData.pesertaBiru = responseData.pesertaBiruSeni;
        responseData.pemenang = responseData.pemenangSeni;
        responseData.dewan = responseData.dewanPenilaiSeni;
        delete responseData.pesertaMerahSeni;
        delete responseData.pesertaBiruSeni;
        delete responseData.pemenangSeni;
        delete responseData.dewanPenilaiSeni;

        res.status(200).json({ message: "Detail Pertandingan Seni berhasil diambil.", data: responseData });
    } catch (error) {
        console.error("Error getMatchSeniById:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
    }
};

// Approve sebuah MatchSeni dan set nomor Partai
exports.approveMatchSeni = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { matchId } = req.params;
        const { idDewan } = req.body; // Atau idPanelJuri

        const match = await MatchSeni.findByPk(matchId, { transaction });
        if (!match) {
            await transaction.rollback();
            return res.status(404).json({ message: "Pertandingan Seni tidak ditemukan." });
        }
        if (match.is_approved) {
            await transaction.rollback();
            return res.status(400).json({ message: "Pertandingan Seni sudah di-approve sebelumnya." });
        }
        if (match.status === 'bye') {
            await transaction.rollback();
            return res.status(400).json({ message: "Pertandingan BYE tidak perlu diapprove manual." });
        }
        // Untuk seni tunggal, pesertaBiru mungkin tidak ada. Untuk ganda/regu, keduanya harus ada.
        // Validasi ini perlu disesuaikan tergantung jenis seni jika ingin lebih ketat.
        if (!match.idPesertaKubuMerah) { // Minimal satu peserta/tim harus ada
            await transaction.rollback();
            return res.status(400).json({ message: "Minimal satu peserta/tim harus terisi sebelum approval." });
        }


        if (idDewan) {
            const dewan = await Dewan.findByPk(idDewan, {transaction});
            if(!dewan){
                await transaction.rollback();
                return res.status(404).json({ message: "Dewan/Panel Juri yang dipilih tidak ditemukan." });
            }
            match.idDewan = idDewan;
        } else if (!match.idDewan) {
            await transaction.rollback();
            return res.status(400).json({ message: "Dewan/Panel Juri wajib dipilih untuk approval pertandingan." });
        }

        const nextPartaiNumber = await getNextPartaiNumber(transaction);

        match.is_approved = true;
        match.status = 'approved';
        match.partai = nextPartaiNumber;
        
        await match.save({ transaction });
        await transaction.commit();

        const updatedMatch = await MatchSeni.findByPk(matchId, {
            include: [{ model: Dewan, as: 'dewanPenilaiSeni' }]
        });
        res.status(200).json({ message: `Pertandingan Seni berhasil di-approve dengan nomor partai ${nextPartaiNumber}.`, data: updatedMatch });

    } catch (error) {
        await transaction.rollback();
        console.error("Error approveMatchSeni:", error);
        res.status(500).json({ message: "Gagal approve Pertandingan Seni.", error: error.message });
    }
};

// Update detail pertandingan Seni (skor, pemenang, dewan)
exports.updateMatchSeniDetails = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { matchId } = req.params;
        // *** PERBAIKAN: Menggunakan pemenang_id sesuai dengan payload frontend ***
        let { skor_merah, skor_biru, pemenang_id, idDewan, status, catatan, waktu_tampil } = req.body;

        const match = await MatchSeni.findByPk(matchId, {
            include: [{model: Bracket, as: 'bracketIndukSeni'}],
            transaction
        });

        if (!match) {
            await transaction.rollback();
            return res.status(404).json({ message: "Pertandingan Seni tidak ditemukan." });
        }
        if (!match.is_approved && status !== 'pending' && status !== 'approved' && match.status !== 'bye') {
            await transaction.rollback();
            return res.status(400).json({ message: "Pertandingan harus diapprove terlebih dahulu sebelum input hasil." });
        }
        if (match.status === 'selesai' && pemenang_id && match.idPemenang && parseInt(pemenang_id,10) !== match.idPemenang) {
            await transaction.rollback();
            return res.status(400).json({message: "Pertandingan sudah selesai. Untuk mengubah pemenang, perlu prosedur reset."})
        }

        // Assign skor dan dewan
        if (skor_merah !== undefined) match.skor_merah = parseFloat(skor_merah); // Skor seni bisa float
        if (skor_biru !== undefined) match.skor_biru = parseFloat(skor_biru);   // Skor seni bisa float
        if (idDewan !== undefined) match.idDewan = idDewan ? parseInt(idDewan,10) : null;
        if (catatan !== undefined) match.catatan = catatan;
        if (waktu_tampil !== undefined) match.waktu_tampil = waktu_tampil;

        let pemenangUpdatedThisRequest = false;
        // *** PERBAIKAN: Menggunakan pemenang_id ***
        if (pemenang_id !== undefined) {
            if (pemenang_id !== null && pemenang_id !== '') {
                pemenang_id = parseInt(pemenang_id, 10);
            } else {
                pemenang_id = null;
            }
            // Validasi pemenang untuk seni bisa lebih kompleks, tergantung apakah ada kubu_biru
            if (pemenang_id !== null && 
                pemenang_id !== match.idPesertaKubuMerah && 
                (match.idPesertaKubuBiru && pemenang_id !== match.idPesertaKubuBiru) ) {
                    // Jika ada kubu biru tapi pemenang bukan salah satunya, ATAU jika tidak ada kubu biru tapi pemenang bukan kubu merah
                    if(match.idPesertaKubuBiru || (!match.idPesertaKubuBiru && pemenang_id !== match.idPesertaKubuMerah)) {
                        await transaction.rollback();
                        return res.status(400).json({ message: "Pemenang tidak valid untuk pertandingan seni ini." });
                    }
            }
            match.idPemenang = pemenang_id; // Ini adalah kolom DB, tetap idPemenang
            if (pemenang_id !== null) {
                match.status = 'selesai';
            }
            pemenangUpdatedThisRequest = true;
        } else if (status !== undefined && status !== match.status) {
            match.status = status;
        }

        await match.save({ transaction });

        // Progresi pemenang ke match berikutnya
        if (pemenangUpdatedThisRequest && match.idPemenang) {
            console.log(`[Seni] Pemenang ${match.idPemenang} dari match ${matchId} akan diproses ke match berikutnya.`);
            if (match.next_match_seni_id_merah) {
                const nextMatchMerah = await MatchSeni.findByPk(match.next_match_seni_id_merah, { transaction });
                if (nextMatchMerah && nextMatchMerah.idPesertaKubuMerah === null) {
                    nextMatchMerah.idPesertaKubuMerah = match.idPemenang;
                    await nextMatchMerah.save({ transaction });
                    console.log(`[Seni] Peserta Merah di match ${nextMatchMerah.id} diupdate dengan pemenang ${match.idPemenang}.`);
                } else if (nextMatchMerah) {
                    console.log(`[Seni] Peserta Merah di match ${nextMatchMerah.id} sudah terisi. Skip.`);
                } else {
                    console.log(`[Seni] Next Match Merah dengan ID ${match.next_match_seni_id_merah} tidak ditemukan.`);
                }
            }
            if (match.next_match_seni_id_biru) {
                const nextMatchBiru = await MatchSeni.findByPk(match.next_match_seni_id_biru, { transaction });
                if (nextMatchBiru && nextMatchBiru.idPesertaKubuBiru === null) {
                    nextMatchBiru.idPesertaKubuBiru = match.idPemenang;
                    await nextMatchBiru.save({ transaction });
                    console.log(`[Seni] Peserta Biru di match ${nextMatchBiru.id} diupdate dengan pemenang ${match.idPemenang}.`);
                } else if (nextMatchBiru) {
                    console.log(`[Seni] Peserta Biru di match ${nextMatchBiru.id} sudah terisi. Skip.`);
                } else {
                    console.log(`[Seni] Next Match Biru dengan ID ${match.next_match_seni_id_biru} tidak ditemukan.`);
                }
            }
        } else {
            console.log(`[Seni] Progresi pemenang tidak dijalankan. Pemenang tidak diupdate atau idPemenang null.`);
        }

        await transaction.commit();
        const updatedMatchWithIncludes = await MatchSeni.findByPk(matchId, {
            include: [
                { model: Peserta, as: 'pesertaMerahSeni', attributes: ['id', 'nama'] },
                { model: Peserta, as: 'pesertaBiruSeni', attributes: ['id', 'nama'] },
                { model: Peserta, as: 'pemenangSeni', attributes: ['id', 'nama'] },
                { model: Dewan, as: 'dewanPenilaiSeni', attributes: ['id', 'nama'] },
            ]
        });
        res.status(200).json({ message: "Detail Pertandingan Seni berhasil diperbarui.", data: updatedMatchWithIncludes });

    } catch (error) {
        await transaction.rollback();
        console.error("Error updateMatchSeniDetails:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Data tidak valid.", errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: "Gagal update detail Pertandingan Seni.", error: error.message });
    }
};
