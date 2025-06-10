// frontend/app/admin/peserta/PesertaClient.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
    getAllPeserta, 
    createPeserta, 
    updatePeserta, 
    deletePeserta,
    registerPesertaToLaga,
    registerPesertaToSeni,
    getPesertaById // Untuk memuat detail laga/seni yang diikuti
} from '../../../services/api'; // Sesuaikan path jika perlu

// Style dasar (bisa disesuaikan atau di-share)
const formContainerStyle = { marginBottom: '30px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'};
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px'};
const inputGroupStyle = { display: 'flex', flexDirection: 'column' };
const labelStyle = { marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#333' };
const inputStyle = { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' };
const selectStyle = { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', backgroundColor: 'white' };
const buttonStyle = { padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px', backgroundColor: '#007bff', color: 'white', fontSize: '14px', fontWeight: '500' };
const listStyle = { listStyleType: 'none', padding: 0 };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 10px', borderBottom: '1px solid #f0f0f0', backgroundColor: 'white', borderRadius: '4px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' };
const actionButtonStyle = { ...buttonStyle, fontSize: '12px', padding: '6px 12px', marginTop: 0 };
const deleteButtonStyle = { ...actionButtonStyle, backgroundColor: '#dc3545' };
const editButtonStyle = { ...actionButtonStyle, backgroundColor: '#ffc107', color: '#212529' };
const registrationSectionStyle = { marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc' };

export default function PesertaClient({ initialPesertaList, kontingenOptions, kategoriUsiaOptions, lagaOptions, seniOptions }) {
  const [pesertaList, setPesertaList] = useState(initialPesertaList || []);
  const [formData, setFormData] = useState({
    nama: '',
    idKontingen: '',
    idKategoriUsia: '',
    jenis_kelamin: 'pria',
  });
  const [editingPeserta, setEditingPeserta] = useState(null);
  const [selectedPesertaForRegistration, setSelectedPesertaForRegistration] = useState(null);
  const [selectedLagaId, setSelectedLagaId] = useState('');
  const [selectedSeniId, setSelectedSeniId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [pesertaDetails, setPesertaDetails] = useState(null); // Untuk menampilkan detail laga/seni yang diikuti

  const fetchPeserta = async () => {
    setIsLoading(true);
    try {
      const response = await getAllPeserta({ limit: 100, sortBy: 'nama', order: 'ASC' }); // Tambah paginasi jika perlu
      setPesertaList(response.data || []);
    } catch (error) {
      setNotification({ type: 'error', message: `Gagal memuat peserta: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPesertaDetails = async (pesertaId) => {
    if (!pesertaId) {
        setPesertaDetails(null);
        return;
    }
    try {
        const response = await getPesertaById(pesertaId);
        setPesertaDetails(response.data);
    } catch (error) {
        console.error("Gagal memuat detail peserta:", error);
        setPesertaDetails(null);
        setNotification({ type: 'error', message: `Gagal memuat detail peserta: ${error.message}` });
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ nama: '', idKontingen: '', idKategoriUsia: '', jenis_kelamin: 'pria' });
    setEditingPeserta(null);
  };

  const handleSubmitPeserta = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.idKontingen || !formData.idKategoriUsia || !formData.jenis_kelamin) {
      setNotification({ type: 'error', message: 'Semua field peserta wajib diisi.' });
      return;
    }
    setIsLoading(true);
    setNotification({ type: '', message: '' });

    try {
      if (editingPeserta) {
        await updatePeserta(editingPeserta.id, formData);
        setNotification({ type: 'success', message: 'Data Peserta berhasil diperbarui!' });
      } else {
        await createPeserta(formData);
        setNotification({ type: 'success', message: 'Peserta berhasil ditambahkan!' });
      }
      resetForm();
      fetchPeserta(); 
    } catch (error) {
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPeserta = (peserta) => {
    setEditingPeserta(peserta);
    setFormData({
      nama: peserta.nama || '',
      idKontingen: peserta.idKontingen || peserta.kontingen?.id || '',
      idKategoriUsia: peserta.idKategoriUsia || peserta.kategoriUsiaPeserta?.id || '',
      jenis_kelamin: peserta.jenis_kelamin || 'pria',
    });
    setSelectedPesertaForRegistration(null); // Tutup form registrasi jika ada
    setPesertaDetails(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePeserta = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus peserta ini? Ini juga akan menghapus pendaftarannya dari semua kompetisi.')) {
      setIsLoading(true);
      setNotification({ type: '', message: '' });
      try {
        await deletePeserta(id);
        setNotification({ type: 'success', message: 'Peserta berhasil dihapus!' });
        fetchPeserta();
        if (selectedPesertaForRegistration?.id === id) {
            setSelectedPesertaForRegistration(null);
            setPesertaDetails(null);
        }
      } catch (error) {
        setNotification({ type: 'error', message: `Gagal menghapus peserta: ${error.message}` });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenRegistration = (peserta) => {
    setSelectedPesertaForRegistration(peserta);
    setEditingPeserta(null); // Tutup form edit peserta jika ada
    resetForm(); // Kosongkan form utama
    fetchPesertaDetails(peserta.id); // Muat detail kompetisi yang diikuti
    setSelectedLagaId('');
    setSelectedSeniId('');
  };

  const handleRegisterToLaga = async () => {
    if (!selectedPesertaForRegistration || !selectedLagaId) {
        setNotification({ type: 'error', message: 'Pilih peserta dan kategori laga terlebih dahulu.' });
        return;
    }
    setIsRegistering(true);
    setNotification({ type: '', message: '' });
    try {
        await registerPesertaToLaga({ idPeserta: selectedPesertaForRegistration.id, idLaga: selectedLagaId });
        setNotification({ type: 'success', message: `Peserta ${selectedPesertaForRegistration.nama} berhasil didaftarkan ke Laga.` });
        fetchPesertaDetails(selectedPesertaForRegistration.id); // Refresh detail
        // Mungkin juga perlu refresh jumlah peserta di lagaOptions jika ditampilkan
    } catch (error) {
        setNotification({ type: 'error', message: `Gagal mendaftar ke Laga: ${error.message}` });
    } finally {
        setIsRegistering(false);
    }
  };
  
  const handleRegisterToSeni = async () => {
    if (!selectedPesertaForRegistration || !selectedSeniId) {
        setNotification({ type: 'error', message: 'Pilih peserta dan kategori seni terlebih dahulu.' });
        return;
    }
    setIsRegistering(true);
    setNotification({ type: '', message: '' });
    try {
        // Untuk seni ganda/regu, idPeserta bisa array. Untuk saat ini kita handle individu.
        await registerPesertaToSeni({ idPeserta: selectedPesertaForRegistration.id, idSeni: selectedSeniId });
        setNotification({ type: 'success', message: `Peserta ${selectedPesertaForRegistration.nama} berhasil didaftarkan ke Seni.` });
        fetchPesertaDetails(selectedPesertaForRegistration.id); // Refresh detail
    } catch (error) {
        setNotification({ type: 'error', message: `Gagal mendaftar ke Seni: ${error.message}` });
    } finally {
        setIsRegistering(false);
    }
  };


  const cancelEditPeserta = () => {
    resetForm();
    setNotification({ type: '', message: '' });
  };

  return (
    <div>
      {notification.message && (
        <p style={{ padding: '10px', borderRadius: '4px', color: 'white', backgroundColor: notification.type === 'success' ? '#28a745' : '#dc3545', marginBottom: '15px', textAlign: 'center' }}>
          {notification.message}
        </p>
      )}

      {/* Form Tambah/Edit Peserta */}
      <div style={formContainerStyle}>
        <h3>{editingPeserta ? `Edit Peserta: ${editingPeserta.nama}` : 'Tambah Peserta Baru'}</h3>
        <form onSubmit={handleSubmitPeserta}>
          <div style={formGridStyle}>
            <div style={inputGroupStyle}>
              <label htmlFor="nama" style={labelStyle}>Nama Lengkap:</label>
              <input type="text" name="nama" id="nama" value={formData.nama} onChange={handleInputChange} style={inputStyle} disabled={isLoading} required />
            </div>
            <div style={inputGroupStyle}>
              <label htmlFor="idKontingen" style={labelStyle}>Kontingen:</label>
              <select name="idKontingen" id="idKontingen" value={formData.idKontingen} onChange={handleInputChange} style={selectStyle} disabled={isLoading} required>
                <option value="">-- Pilih Kontingen --</option>
                {kontingenOptions.map(k => (<option key={k.id} value={k.id}>{k.nama_kontingen}</option>))}
              </select>
            </div>
            <div style={inputGroupStyle}>
              <label htmlFor="idKategoriUsia" style={labelStyle}>Kategori Usia/Tingkat Peserta:</label>
              <select name="idKategoriUsia" id="idKategoriUsia" value={formData.idKategoriUsia} onChange={handleInputChange} style={selectStyle} disabled={isLoading} required>
                <option value="">-- Pilih Kategori Usia --</option>
                {kategoriUsiaOptions.map(kat => (<option key={kat.id} value={kat.id}>{kat.nama_kategori}</option>))}
              </select>
            </div>
            <div style={inputGroupStyle}>
              <label htmlFor="jenis_kelamin" style={labelStyle}>Jenis Kelamin:</label>
              <select name="jenis_kelamin" id="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} style={selectStyle} disabled={isLoading} required>
                <option value="pria">Pria</option>
                <option value="wanita">Wanita</option>
              </select>
            </div>
          </div>
          <button type="submit" style={buttonStyle} disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : (editingPeserta ? 'Update Peserta' : 'Tambah Peserta')}
          </button>
          {editingPeserta && (
            <button type="button" onClick={cancelEditPeserta} style={{...buttonStyle, backgroundColor: '#6c757d'}} disabled={isLoading}>
              Batal Edit
            </button>
          )}
        </form>
      </div>

      {/* Form Pendaftaran Peserta ke Kompetisi */}
      {selectedPesertaForRegistration && (
        <div style={{...formContainerStyle, marginTop: '30px', borderColor: '#007bff'}}>
            <h3>Daftarkan: {selectedPesertaForRegistration.nama} (Kontingen: {selectedPesertaForRegistration.kontingen?.nama_kontingen || '-'})</h3>
            {pesertaDetails && (
                <div style={{marginBottom: '15px', fontSize: '13px'}}>
                    <strong>Terdaftar di Laga:</strong>
                    {pesertaDetails.lagaYangDiikuti?.length > 0 ? 
                        <ul>{pesertaDetails.lagaYangDiikuti.map(l => <li key={l.id}>{l.nama_tanding}</li>)}</ul> : 
                        <p>Belum ada.</p>}
                    <strong>Terdaftar di Seni:</strong>
                     {pesertaDetails.seniYangDiikuti?.length > 0 ? 
                        <ul>{pesertaDetails.seniYangDiikuti.map(s => <li key={s.id}>{s.nama_seni}</li>)}</ul> : 
                        <p>Belum ada.</p>}
                </div>
            )}
            
            <div style={registrationSectionStyle}>
                <h4>Daftar ke Kategori Laga</h4>
                <div style={inputGroupStyle}>
                    <select value={selectedLagaId} onChange={(e) => setSelectedLagaId(e.target.value)} style={selectStyle} disabled={isRegistering}>
                        <option value="">-- Pilih Kategori Laga --</option>
                        {lagaOptions.map(l => (<option key={l.id} value={l.id}>{l.nama_tanding}</option>))}
                    </select>
                    <button onClick={handleRegisterToLaga} style={{...buttonStyle, marginTop:'10px', backgroundColor: '#28a745'}} disabled={isRegistering || !selectedLagaId}>
                        {isRegistering ? 'Mendaftarkan...' : 'Daftarkan ke Laga Ini'}
                    </button>
                </div>
            </div>
            <div style={registrationSectionStyle}>
                <h4>Daftar ke Kategori Seni</h4>
                 <div style={inputGroupStyle}>
                    <select value={selectedSeniId} onChange={(e) => setSelectedSeniId(e.target.value)} style={selectStyle} disabled={isRegistering}>
                        <option value="">-- Pilih Kategori Seni --</option>
                        {seniOptions.map(s => (<option key={s.id} value={s.id}>{s.nama_seni}</option>))}
                    </select>
                    <button onClick={handleRegisterToSeni} style={{...buttonStyle, marginTop:'10px', backgroundColor: '#17a2b8'}} disabled={isRegistering || !selectedSeniId}>
                        {isRegistering ? 'Mendaftarkan...' : 'Daftarkan ke Seni Ini'}
                    </button>
                </div>
            </div>
             <button onClick={() => {setSelectedPesertaForRegistration(null); setPesertaDetails(null);}} style={{...buttonStyle, backgroundColor: '#6c757d', marginTop: '20px'}}>
              Selesai Mendaftarkan Peserta Ini
            </button>
        </div>
      )}


      {/* Daftar Peserta */}
      <h3 style={{marginTop: '30px'}}>Daftar Seluruh Peserta</h3>
      {isLoading && pesertaList.length === 0 && <p>Memuat peserta...</p>}
      {!isLoading && pesertaList.length === 0 && <p>Belum ada peserta.</p>}
      
      <ul style={listStyle}>
        {pesertaList.map((peserta) => (
          <li key={peserta.id} style={listItemStyle}>
            <div style={listItemContentStyle}>
                <strong style={{fontSize: '1.1em'}}>{peserta.nama}</strong> (ID: {peserta.id})
                <div style={{fontSize: '0.9em', color: '#555'}}>
                    Kontingen: {peserta.kontingen?.nama_kontingen || '-'} | 
                    Kategori Usia: {peserta.kategoriUsiaPeserta?.nama_kategori || '-'} | 
                    Gender: {peserta.jenis_kelamin}
                </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', gap: '5px' }}>
              <button onClick={() => handleOpenRegistration(peserta)} style={{...actionButtonStyle, backgroundColor: '#17a2b8'}} disabled={isLoading}>
                Daftarkan ke Kompetisi
              </button>
              <button onClick={() => handleEditPeserta(peserta)} style={editButtonStyle} disabled={isLoading}>
                Edit Peserta
              </button>
              <button onClick={() => handleDeletePeserta(peserta.id)} style={deleteButtonStyle} disabled={isLoading}>
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
