// backend/controllers/bracketController.js
const { Bracket, Laga, Seni, Peserta, PesertaLaga, PesertaSeni, MatchLaga, MatchSeni, Dewan, Kategori, sequelize } = require('../models'); // Pastikan Kategori diimpor
const { Op } = require('sequelize');

// Fungsi helper (tetap sama)
function getBracketDetails(numParticipants) {
    if (numParticipants < 2) return { rounds: 0, byes: 0, totalSlots: 0, matchesInFirstRound: 0 };
    const nearestPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
    const byes = nearestPowerOfTwo - numParticipants;
    const rounds = Math.log2(nearestPowerOfTwo);
    const matchesInFirstRound = nearestPowerOfTwo / 2;
    return { rounds, byes, totalSlots: nearestPowerOfTwo, matchesInFirstRound };
}

// Generate Bracket untuk Laga atau Seni (kode dari revisi sebelumnya, seharusnya sudah baik)
exports.generateBracket = async (req, res) => {
  const { idKompetisi, tipeKompetisi } = req.body;
  if (!idKompetisi || !tipeKompetisi || !['laga', 'seni'].includes(tipeKompetisi)) {
    return res.status(400).json({ message: "ID Kompetisi dan Tipe Kompetisi (laga/seni) wajib diisi dengan benar." });
  }

  const transaction = await sequelize.transaction();
  try {
    let kompetisi;
    let pesertaTerdaftarInstances = [];
    let namaBracketDefault = '';

    if (tipeKompetisi === 'laga') {
      kompetisi = await Laga.findByPk(idKompetisi, {
        include: [{ model: Peserta, as: 'pesertaTerdaftarDiLaga', attributes: ['id', 'nama'] }],
        transaction
      });
      if (kompetisi) pesertaTerdaftarInstances = kompetisi.pesertaTerdaftarDiLaga;
      namaBracketDefault = `Bracket ${kompetisi?.nama_tanding || 'Laga'}`;
    } else { 
      kompetisi = await Seni.findByPk(idKompetisi, {
        include: [{ model: Peserta, as: 'pesertaTerdaftarDiSeni', attributes: ['id', 'nama'] }],
        transaction
      });
      if (kompetisi) pesertaTerdaftarInstances = kompetisi.pesertaTerdaftarDiSeni;
      namaBracketDefault = `Bracket ${kompetisi?.nama_seni || 'Seni'}`;
    }

    if (!kompetisi) {
      await transaction.rollback();
      return res.status(404).json({ message: `${tipeKompetisi.charAt(0).toUpperCase() + tipeKompetisi.slice(1)} tidak ditemukan.` });
    }

    if (pesertaTerdaftarInstances.length < 2) {
      await transaction.rollback();
      return res.status(400).json({ message: `Jumlah peserta/tim terdaftar minimal 2 untuk membuat bracket ${tipeKompetisi}. Saat ini: ${pesertaTerdaftarInstances.length}` });
    }

    let bracket = await Bracket.findOne({ 
      where: tipeKompetisi === 'laga' ? { idLaga: idKompetisi } : { idSeni: idKompetisi },
      transaction 
    });

    if (bracket) {
      if (tipeKompetisi === 'laga') {
        await MatchLaga.destroy({ where: { idBracket: bracket.id }, transaction });
      } else {
        await MatchSeni.destroy({ where: { idBracket: bracket.id }, transaction });
      }
    } else {
      bracket = await Bracket.create({
        [tipeKompetisi === 'laga' ? 'idLaga' : 'idSeni']: idKompetisi,
        tipe_kompetisi: tipeKompetisi,
        nama_bracket: namaBracketDefault,
        status: 'belum dibuat'
      }, { transaction });
    }

    const pesertaList = [...pesertaTerdaftarInstances];
    const { rounds, byes, totalSlots, matchesInFirstRound } = getBracketDetails(pesertaList.length);
    
    let allMatchesToCreateInitially = [];
    let participantIdx = 0;
    let byesPlaced = 0;

    for (let i = 0; i < matchesInFirstRound; i++) {
        const matchOrderInRound = i + 1;
        let p1Id = null, p2Id = null;
        let status = 'pending';
        let pemenang_id = null;
        const needsByeThisMatch = (byesPlaced < byes);
        
        if (needsByeThisMatch && (i < byes)) {
            p1Id = pesertaList[participantIdx++]?.id || null;
            p2Id = null; status = 'bye'; pemenang_id = p1Id; byesPlaced++;
        } else {
            p1Id = pesertaList[participantIdx++]?.id || null;
            p2Id = pesertaList[participantIdx++]?.id || null;
             if (!p1Id && p2Id) { status = 'bye'; pemenang_id = p2Id; p1Id = p2Id; p2Id = null; }
             else if (p1Id && !p2Id) { status = 'bye'; pemenang_id = p1Id; }
             else if (!p1Id && !p2Id && matchesInFirstRound > 0 && pesertaList.length > 0 && participantIdx >= pesertaList.length) { /* Handle jika peserta habis */ }
        }
        
        allMatchesToCreateInitially.push({
            idBracket: bracket.id, ronde: 1, match_order_in_round: matchOrderInRound,
            idPesertaKubuMerah: p1Id, idPesertaKubuBiru: p2Id, status: status, idPemenang: pemenang_id,
            is_approved: (status === 'bye'),
        });
    }

    let matchesInPreviousRoundCount = matchesInFirstRound;
    for (let r = 2; r <= rounds; r++) {
        const matchesInThisRoundCount = matchesInPreviousRoundCount / 2;
        for (let i = 0; i < matchesInThisRoundCount; i++) {
            allMatchesToCreateInitially.push({
                idBracket: bracket.id, ronde: r, match_order_in_round: i + 1,
                idPesertaKubuMerah: null, idPesertaKubuBiru: null, status: 'pending', is_approved: false,
            });
        }
        matchesInPreviousRoundCount = matchesInThisRoundCount;
    }

    const MatchModel = tipeKompetisi === 'laga' ? MatchLaga : MatchSeni;
    const createdMatchInstances = await MatchModel.bulkCreate(allMatchesToCreateInitially, { transaction, returning: true });

    const matchMapDb = {};
    createdMatchInstances.forEach(mInst => {
        if (!matchMapDb[mInst.ronde]) matchMapDb[mInst.ronde] = {};
        matchMapDb[mInst.ronde][mInst.match_order_in_round] = mInst;
    });

    const nextMatchMerahField = tipeKompetisi === 'laga' ? 'next_match_laga_id_merah' : 'next_match_seni_id_merah';
    const nextMatchBiruField = tipeKompetisi === 'laga' ? 'next_match_laga_id_biru' : 'next_match_seni_id_biru';

    for (let r = 1; r < rounds; r++) {
        const currentRoundMatchesList = Object.values(matchMapDb[r] || {});
        for (let i = 0; i < currentRoundMatchesList.length; i++) {
            const currentMatchInstance = currentRoundMatchesList[i];
            if (!currentMatchInstance) continue;
            const nextRoundNumber = r + 1;
            const orderInNextRound = Math.ceil((i + 1) / 2);
            const nextMatchInstance = matchMapDb[nextRoundNumber]?.[orderInNextRound];
            if (nextMatchInstance) {
                if ((i + 1) % 2 === 1) {
                    currentMatchInstance[nextMatchMerahField] = nextMatchInstance.id;
                } else {
                    currentMatchInstance[nextMatchBiruField] = nextMatchInstance.id;
                }
                await currentMatchInstance.save({ transaction });
            }
        }
    }
    
    const firstRoundByeMatches = createdMatchInstances.filter(
        m => m.ronde === 1 && m.status === 'bye' && m.idPemenang !== null
    );
    for (const byeMatch of firstRoundByeMatches) {
        const nextMatchIdMerah = byeMatch[nextMatchMerahField];
        const nextMatchIdBiru = byeMatch[nextMatchBiruField];
        if (nextMatchIdMerah) {
            const nextMatchInstance = await MatchModel.findByPk(nextMatchIdMerah, { transaction });
            if (nextMatchInstance && nextMatchInstance.idPesertaKubuMerah === null) {
                nextMatchInstance.idPesertaKubuMerah = byeMatch.idPemenang;
                await nextMatchInstance.save({ transaction });
            }
        }
        if (nextMatchIdBiru) { 
            const nextMatchInstance = await MatchModel.findByPk(nextMatchIdBiru, { transaction });
            if (nextMatchInstance && nextMatchInstance.idPesertaKubuBiru === null) {
                nextMatchInstance.idPesertaKubuBiru = byeMatch.idPemenang;
                await nextMatchInstance.save({ transaction });
            }
        }
    }
    
    bracket.status = 'pending';
    await bracket.save({transaction});
    await transaction.commit();
    res.status(201).json({ 
        message: `Bracket untuk ${tipeKompetisi} berhasil digenerate.`, 
        bracketId: bracket.id, 
        totalMatches: createdMatchInstances.length 
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error generateBracket:", error);
    res.status(500).json({ message: "Gagal menggenerate bracket.", error: error.message });
  }
};

// Mendapatkan detail Bracket (termasuk match-nya)
exports.getBracketDetails = async (req, res) => {
  try {
    const { bracketId } = req.params;
    const bracket = await Bracket.findByPk(bracketId, {
      include: [
        // Include info Laga atau Seni beserta Kategori Usianya
        { 
          model: Laga, 
          as: 'infoLagaBracket', 
          required: false, // LEFT JOIN
          include: [{model: Kategori, as: 'kategori', attributes: ['id', 'nama_kategori']}] 
        },
        { 
          model: Seni, 
          as: 'infoSeniBracket', 
          required: false, // LEFT JOIN
          include: [{model: Kategori, as: 'kategori', attributes: ['id', 'nama_kategori']}] 
        },
      ]
    });

    if (!bracket) {
      return res.status(404).json({ message: "Bracket tidak ditemukan." });
    }

    let matches = [];
    const tipeKompetisi = bracket.tipe_kompetisi; // Ambil tipe dari data bracket

    if (tipeKompetisi === 'laga') {
      matches = await MatchLaga.findAll({
        where: { idBracket: bracketId },
        include: [
            { model: Peserta, as: 'pesertaMerah', attributes: ['id', 'nama'], required: false },
            { model: Peserta, as: 'pesertaBiru', attributes: ['id', 'nama'], required: false },
            { model: Peserta, as: 'pemenangLaga', attributes: ['id', 'nama'], required: false },
            { model: Dewan, as: 'dewanPertandinganLaga', attributes: ['id', 'nama'], required: false },
        ],
        order: [['ronde', 'ASC'], ['match_order_in_round', 'ASC']],
      });
    } else if (tipeKompetisi === 'seni') {
      matches = await MatchSeni.findAll({
        where: { idBracket: bracketId },
        include: [
            { model: Peserta, as: 'pesertaMerahSeni', attributes: ['id', 'nama'], required: false },
            { model: Peserta, as: 'pesertaBiruSeni', attributes: ['id', 'nama'], required: false },
            { model: Peserta, as: 'pemenangSeni', attributes: ['id', 'nama'], required: false },
            { model: Dewan, as: 'dewanPenilaiSeni', attributes: ['id', 'nama'], required: false },
        ],
        order: [['ronde', 'ASC'], ['match_order_in_round', 'ASC']],
      });
    } else {
        // Seharusnya tidak terjadi jika data bracket konsisten
        return res.status(500).json({ message: "Tipe kompetisi pada bracket tidak dikenali." });
    }
    
    const formattedMatches = matches.map(m => {
        const matchJson = m.toJSON();
        if (tipeKompetisi === 'seni') {
            matchJson.pesertaMerah = matchJson.pesertaMerahSeni;
            matchJson.pesertaBiru = matchJson.pesertaBiruSeni;
            matchJson.pemenang = matchJson.pemenangSeni;
            matchJson.dewan = matchJson.dewanPenilaiSeni;
            delete matchJson.pesertaMerahSeni;
            delete matchJson.pesertaBiruSeni;
            delete matchJson.pemenangSeni;
            delete matchJson.dewanPenilaiSeni;
        } else { // laga
            matchJson.pemenang = matchJson.pemenangLaga;
            matchJson.dewan = matchJson.dewanPertandinganLaga;
            delete matchJson.pemenangLaga;
            delete matchJson.dewanPertandinganLaga;
        }
        return matchJson;
    });

    const responseData = {
        ...bracket.toJSON(),
        matches: formattedMatches,
    };

    res.status(200).json({ message: "Detail bracket berhasil diambil.", data: responseData });
  } catch (error) {
    console.error("Error getBracketDetails:", error);
    // Kirim pesan error yang lebih detail ke frontend jika dalam mode development
    const errorMessage = process.env.NODE_ENV === 'development' ? error.stack : "Terjadi kesalahan pada server.";
    res.status(500).json({ message: "Terjadi kesalahan pada server.", error: errorMessage });
  }
};

// Update status bracket (tetap sama)
exports.updateBracketStatus = async (req, res) => {
    try {
        const { bracketId } = req.params;
        const { status } = req.body;
        const bracket = await Bracket.findByPk(bracketId);
        if (!bracket) {
            return res.status(404).json({ message: "Bracket tidak ditemukan." });
        }
        if (!['belum dibuat', 'pending', 'berjalan', 'selesai'].includes(status)) {
            return res.status(400).json({ message: "Status tidak valid." });
        }
        bracket.status = status;
        await bracket.save();
        res.status(200).json({ message: `Status bracket berhasil diubah menjadi ${status}.`, data: bracket });
    } catch (error) {
        console.error("Error updateBracketStatus:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
    }
};
