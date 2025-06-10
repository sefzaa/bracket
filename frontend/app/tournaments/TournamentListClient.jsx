// frontend/app/tournaments/TournamentListClient.jsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAllKompetisi, generateBracket as apiGenerateBracket } from '../../services/api'; // Path: ../../

// Style dasar
const listItemStyle = {
    padding: '15px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '15px',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};
const buttonStyle = {
    padding: '8px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none', 
    display: 'inline-block', 
    textAlign: 'center',
};
const viewBracketButton = { ...buttonStyle, backgroundColor: '#28a745', color: 'white' };
const generateBracketButton = { ...buttonStyle, backgroundColor: '#007bff', color: 'white' };

export default function TournamentListClient({ initialKompetisiList }) {
  const [kompetisiList, setKompetisiList] = useState(initialKompetisiList || []);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [error, setError] = useState('');


  const fetchKompetisi = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getAllKompetisi({ limit: 50 }); 
      setKompetisiList(response.data || []);
    } catch (err) {
      console.error("Error refreshing kompetisi list:", err);
      setError(`Gagal memuat ulang daftar kompetisi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Jika data awal tidak ada, atau ingin selalu refresh saat komponen mount
    if (!initialKompetisiList || initialKompetisiList.length === 0) {
        // fetchKompetisi(); // Aktifkan jika ingin fetch di client jika data awal kosong
    }
    // Jika initialKompetisiList sudah ada, setKompetisiList
    if (initialKompetisiList && initialKompetisiList.length > 0 && kompetisiList.length === 0) {
        setKompetisiList(initialKompetisiList);
    }
  }, [initialKompetisiList]); // Tambahkan kompetisiList.length sebagai dependensi jika ingin fetchKompetisi hanya jika list kosong


  const handleGenerateBracket = async (kompetisiId, tipeKompetisi, namaKompetisi) => {
    if (confirm(`Apakah Anda yakin ingin membuat/memperbarui bracket untuk ${namaKompetisi}? Match lama (jika ada) akan dihapus.`)) {
      setIsLoading(true);
      setNotification({ type: '', message: '' });
      try {
        const response = await apiGenerateBracket({ idKompetisi: kompetisiId, tipeKompetisi: tipeKompetisi });
        setNotification({ type: 'success', message: `Bracket untuk ${namaKompetisi} (ID Bracket: ${response.bracketId}) berhasil dibuat/diperbarui!` });
        fetchKompetisi(); 
      } catch (err) {
        console.error('Error generating bracket:', err);
        setNotification({ type: 'error', message: `Gagal membuat bracket untuk ${namaKompetisi}: ${err.message}` });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      {notification.message && (
        <p style={{ 
            padding: '10px', borderRadius: '4px', color: 'white',
            backgroundColor: notification.type === 'success' ? '#28a745' : '#dc3545',
            marginBottom: '15px', textAlign: 'center',
        }}>
          {notification.message}
        </p>
      )}
      {error && <p style={{color: 'red', margin: '10px 0'}}>{error}</p>}

      <button onClick={fetchKompetisi} style={{...buttonStyle, backgroundColor: '#6c757d', marginBottom: '20px'}} disabled={isLoading}>
        {isLoading ? 'Memuat Ulang...' : 'Muat Ulang Daftar Kompetisi'}
      </button>

      {isLoading && kompetisiList.length === 0 && <p>Memuat daftar kompetisi...</p>}
      {!isLoading && kompetisiList.length === 0 && !error && <p>Belum ada kompetisi yang dibuat.</p>}
      
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {kompetisiList.map((kompetisi) => (
          <li key={`${kompetisi.tipe_kompetisi}-${kompetisi.id}`} style={listItemStyle}>
            <div style={{ flexGrow: 1 }}>
              <h3 style={{ marginTop: 0, marginBottom: '5px', color: '#333' }}>
                {kompetisi.nama_kompetisi} 
                <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px' }}>
                    (Tipe: {kompetisi.tipe_kompetisi?.toUpperCase()})
                </span>
              </h3>
              <p style={{ margin: '2px 0', fontSize: '14px', color: '#555' }}>
                Kategori: {kompetisi.kategori?.nama_kategori || '-'} | 
                {kompetisi.tipe_kompetisi === 'laga' && ` Kelas: ${kompetisi.kelas || '-'} | `}
                {kompetisi.tipe_kompetisi === 'seni' && ` Jenis Seni: ${kompetisi.jenis_seni || '-'} | `}
                Gender: {kompetisi.jenis_kelamin || '-'}
              </p>
              <p style={{ margin: '2px 0', fontSize: '14px', color: '#555' }}>
                Peserta Terdaftar: <strong>{kompetisi.jumlah_peserta || 0}</strong>
              </p>
              {/* Menampilkan status bracket jika ada */}
              {kompetisi.bracket && kompetisi.bracket.id && ( // Pastikan bracket dan bracket.id ada
                <p style={{ margin: '2px 0', fontSize: '12px', color: kompetisi.bracket.status === 'berjalan' ? 'blue' : '#555' }}>
                  Status Bracket: <strong>{kompetisi.bracket.status}</strong> (ID: {kompetisi.bracket.id})
                </p>
              )}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <button 
                onClick={() => handleGenerateBracket(kompetisi.id, kompetisi.tipe_kompetisi, kompetisi.nama_kompetisi)} 
                style={generateBracketButton}
                disabled={isLoading || (kompetisi.jumlah_peserta || 0) < 2}
                title={(kompetisi.jumlah_peserta || 0) < 2 ? "Minimal 2 peserta untuk membuat bracket" : "Generate atau perbarui bracket"}
              >
                {/* Logika teks tombol berdasarkan apakah bracket sudah ada */}
                {kompetisi.bracket?.id ? 'Update Bracket' : 'Generate Bracket'}
              </button>
              
              {/* Link "Lihat Bracket" akan muncul jika kompetisi.bracket.id ada */}
              {kompetisi.bracket?.id && (
                <Link href={`/tournaments/bracket/${kompetisi.bracket.id}`} legacyBehavior={false}>
                  <a style={viewBracketButton}>Lihat Bracket</a>
                </Link>
              )}
               <small style={{color: '#777', fontSize: '11px'}}>ID Kompetisi: {kompetisi.id}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
