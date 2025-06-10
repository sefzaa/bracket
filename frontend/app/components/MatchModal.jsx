// frontend/app/components/MatchModal.jsx
'use client'; // Komponen ini interaktif, jadi harus Client Component

import { useState, useEffect } from 'react';

// Styling dasar untuk modal (bisa dipindahkan ke file CSS global atau modul CSS)
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
};

const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    minWidth: '350px',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    color: '#000000', 
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: 'black'
};

const inputStyle = {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
};

const selectStyle = {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
};

const buttonStyle = {
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
    marginTop: '10px',
};

const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white',
};

const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    color: 'white',
};

/**
 * Komponen Modal untuk menampilkan dan mengelola detail pertandingan.
 * @param {object} props - Props untuk komponen MatchModal.
 * @param {object} props.match - Objek pertandingan yang akan ditampilkan/diedit.
 * @param {Array<object>} props.dewanList - Daftar dewan yang tersedia untuk dipilih.
 * @param {boolean} props.isOpen - Status apakah modal terbuka atau tertutup.
 * @param {function} props.onClose - Fungsi callback saat modal ditutup.
 * @param {function} props.onApprove - Fungsi callback saat pertandingan diapprove.
 * @param {function} props.onUpdateDetails - Fungsi callback saat detail pertandingan diupdate (skor, pemenang).
 * @param {string} props.notification - Pesan notifikasi yang akan ditampilkan di modal.
 * @param {function} props.setNotification - Fungsi untuk mengupdate pesan notifikasi.
 */
export default function MatchModal({
    match,
    dewanList,
    isOpen,
    onClose,
    onApprove,
    onUpdateDetails,
    notification,
    setNotification 
}) {
    const [selectedDewanId, setSelectedDewanId] = useState('');
    const [skorMerah, setSkorMerah] = useState('');
    const [skorBiru, setSkorBiru] = useState('');
    const [pemenangId, setPemenangId] = useState('');

    // Efek untuk me-reset state form ketika data 'match' berubah (saat modal dibuka untuk match berbeda)
    // atau saat modal dibuka/ditutup.
    useEffect(() => {
        if (match) {
            // Menggunakan match.dewanId (camelCase) karena itu yang diharapkan dari backend/BracketDisplayClient
            setSelectedDewanId(match.dewanId || '');
            setSkorMerah(match.skor_merah !== null && match.skor_merah !== undefined ? String(match.skor_merah) : '');
            setSkorBiru(match.skor_biru !== null && match.skor_biru !== undefined ? String(match.skor_biru) : '');
            setPemenangId(match.pemenang_id || '');
            // Log objek match untuk membantu debugging struktur data
            console.log("Match data in modal:", match);
        }
        if (!isOpen) {
            setNotification(''); // Bersihkan notifikasi di parent saat modal ditutup
        }
    }, [match, isOpen, setNotification]);

    // Jika modal tidak terbuka atau data match tidak ada, jangan render apa-apa
    if (!isOpen || !match) return null;

    // Ambil data peserta dari objek match
    // *** PERBAIKAN: Menggunakan camelCase (pesertaMerah, pesertaBiru) sesuai dengan output dari bracketController.js ***
    const pesertaMerah = match.pesertaMerah; 
    const pesertaBiru = match.pesertaBiru;

    // Handler untuk tombol "Approve Pertandingan"
    const handleApproveClick = () => {
        // Validasi: dewan harus dipilih jika belum diapprove
        if (!selectedDewanId && !match.is_approved && !match.dewanId) {
            setNotification("Pilih dewan terlebih dahulu untuk approval.");
            return;
        }
        // Panggil fungsi onApprove dari parent (BracketDisplayClient)
        // Gunakan dewan yang sudah ada jika tidak ada perubahan pilihan dewan
        onApprove(match.id, selectedDewanId || match.dewanId); 
    };

    // Handler untuk tombol "Simpan Hasil"
    const handleSaveDetailsClick = () => {
        const details = {};
        let hasChanges = false;

        // Cek perubahan skor merah
        if (skorMerah !== '' && parseInt(skorMerah, 10) !== (match.skor_merah ?? null)) {
            details.skor_merah = parseInt(skorMerah, 10);
            hasChanges = true;
        }
        // Cek perubahan skor biru
        if (skorBiru !== '' && parseInt(skorBiru, 10) !== (match.skor_biru ?? null)) {
            details.skor_biru = parseInt(skorBiru, 10);
            hasChanges = true;
        }
        // Cek perubahan pemenang_id
        // Mengirim null jika ingin mengosongkan pemenang
        if (pemenangId !== (match.pemenang_id || '')) {
            details.pemenang_id = pemenangId === '' ? null : pemenangId;
            hasChanges = true;
        }
        // Cek perubahan dewanId (jika diizinkan mengubah setelah approve)
        // Menggunakan match.dewanId (camelCase) untuk konsistensi
        if (selectedDewanId !== (match.dewanId || '')) {
            details.dewanId = selectedDewanId;
            hasChanges = true;
        }

        if (!hasChanges) {
            setNotification("Tidak ada perubahan untuk disimpan.");
            return;
        }
        // Panggil fungsi onUpdateDetails dari parent (BracketDisplayClient)
        onUpdateDetails(match.id, details);
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}> {/* Tutup modal jika klik di luar konten */}
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}> {/* Cegah penutupan jika klik di dalam konten */}
                <h3 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Detail Pertandingan (Partai: {match.partai || 'Belum Ditentukan'})
                </h3>

                {/* Area notifikasi */}
                {notification && (
                    <p style={{
                        padding: '10px',
                        marginBottom: '15px',
                        borderRadius: '4px',
                        color: notification.toLowerCase().includes('gagal') ? '#721c24' : '#155724',
                        backgroundColor: notification.toLowerCase().includes('gagal') ? '#f8d7da' : '#d4edda',
                        border: notification.toLowerCase().includes('gagal') ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
                    }}>
                        {notification}
                    </p>
                )}

                {/* Informasi dasar pertandingan */}
                <p>
                    {/* *** PERBAIKAN: Menggunakan camelCase (pesertaMerah, pesertaBiru) *** */}
                    <strong style={{color: '#dc3545'}}>{pesertaMerah?.nama || 'TBD'} (Merah)</strong> vs <strong style={{color: '#007bff'}}>{pesertaBiru?.nama || 'TBD'} (Biru)</strong>
                </p>
                <p>Status: <span style={{fontWeight: 'bold'}}>{match.status}</span> {match.is_approved ? <span style={{color: 'green', fontWeight: 'bold'}}>(Approved)</span> : <span style={{color: 'orange'}}>(Belum Approved)</span>}</p>
                
                {/* Pilihan Dewan Pertandingan */}
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="dewan" style={labelStyle}>Dewan Pertandingan:</label>
                    <select
                        id="dewan"
                        value={selectedDewanId}
                        onChange={(e) => setSelectedDewanId(e.target.value)}
                        style={selectStyle}
                        // Disable pilihan dewan jika sudah diapprove dan ada dewan, kecuali statusnya "pending" (misal: bisa diubah sebelum dimulai)
                        // Menggunakan match.dewanId (camelCase) untuk konsistensi
                        disabled={match.is_approved && match.dewanId && match.status !== 'pending'} 
                    >
                        <option value="">-- Pilih Dewan --</option>
                        {dewanList && dewanList.map(d => (
                            <option key={d.id} value={d.id}>{d.nama}</option>
                        ))}
                    </select>
                </div>

                {/* Tombol Approve hanya muncul jika match belum diapprove dan kedua peserta sudah ada */}
                {/* *** PERBAIKAN: Menggunakan camelCase (pesertaMerah, pesertaBiru) *** */}
                {!match.is_approved && pesertaMerah && pesertaBiru && (
                    <button onClick={handleApproveClick} style={primaryButtonStyle}>
                        Approve Pertandingan
                    </button>
                )}
                
                {/* Input skor dan pemenang hanya muncul jika match sudah diapprove dan belum selesai/bye */}
                {match.is_approved && match.status !== 'selesai' && match.status !== 'bye' && (
                    <>
                    <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid #eee'}}/>
                    <h4>Input Hasil Pertandingan</h4>
                    <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                        <div style={{flex: 1}}>
                            {/* *** PERBAIKAN: Menggunakan camelCase (pesertaMerah) *** */}
                            <label htmlFor="skorMerah" style={labelStyle}>{pesertaMerah?.nama} (Merah):</label>
                            <input type="number" id="skorMerah" value={skorMerah} onChange={(e) => setSkorMerah(e.target.value)} style={inputStyle} min="0" />
                        </div>
                        <div style={{flex: 1}}>
                            {/* *** PERBAIKAN: Menggunakan camelCase (pesertaBiru) *** */}
                            <label htmlFor="skorBiru" style={labelStyle}>{pesertaBiru?.nama} (Biru):</label>
                            <input type="number" id="skorBiru" value={skorBiru} onChange={(e) => setSkorBiru(e.target.value)} style={inputStyle} min="0" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="pemenang" style={labelStyle}>Pemenang:</label>
                        <select id="pemenang" value={pemenangId} onChange={(e) => setPemenangId(e.target.value)} style={selectStyle}>
                            <option value="">-- Tentukan Pemenang --</option>
                            {/* *** PERBAIKAN: Menggunakan camelCase (pesertaMerah, pesertaBiru) *** */}
                            {pesertaMerah && <option value={pesertaMerah.id}>{pesertaMerah.nama} (Merah)</option>}
                            {pesertaBiru && <option value={pesertaBiru.id}>{pesertaBiru.nama} (Biru)</option>}
                        </select>
                    </div>
                    <button onClick={handleSaveDetailsClick} style={primaryButtonStyle}>
                        Simpan Hasil
                    </button>
                    </>
                )}

                {/* Tampilan hasil akhir jika pertandingan sudah selesai */}
                {match.status === 'selesai' && (
                    <div>
                        <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid #eee'}}/>
                        <h4>Hasil Akhir</h4>
                        {/* *** PERBAIKAN: Menggunakan match.pemenang?.nama (camelCase) *** */}
                        <p><strong>Pemenang: {match.pemenang?.nama || 'N/A'}</strong></p>
                        <p>Skor: {match.skor_merah !== null ? match.skor_merah : '-'} (Merah) vs {match.skor_biru !== null ? match.skor_biru : '-'} (Biru)</p>
                    </div>
                )}

                {/* Tombol Tutup Modal */}
                <button onClick={onClose} style={{...secondaryButtonStyle, display: 'block', marginLeft: 'auto', marginRight:0}}>
                    Tutup
                </button>
            </div>
        </div>
    );
}
