// frontend/app/admin/laga/LagaClient.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
    getAllLaga, 
    createLaga, 
    updateLaga, 
    deleteLaga,
    // getAllKategori // Sudah di-pass sebagai prop 'kategoriOptions'
} from '../../../services/api'; // Sesuaikan path jika perlu

// Style dasar (bisa disesuaikan atau di-share)
const formContainerStyle = {
    marginBottom: '30px',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};
const formGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '15px',
};
const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
};
const labelStyle = {
    marginBottom: '5px',
    fontWeight: '500',
    fontSize: '14px',
    color: '#333',
};
const inputStyle = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
};
const selectStyle = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
};
const buttonStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
};
const listStyle = { listStyleType: 'none', padding: 0 };
const listItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 10px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: 'white',
    borderRadius: '4px',
    marginBottom: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
};
const listItemContentStyle = {
    flexGrow: 1,
};
const actionButtonStyle = { ...buttonStyle, fontSize: '12px', padding: '6px 12px', marginTop: 0 };
const deleteButtonStyle = { ...actionButtonStyle, backgroundColor: '#dc3545' };
const editButtonStyle = { ...actionButtonStyle, backgroundColor: '#ffc107', color: '#212529' };

export default function LagaClient({ initialLagaList, kategoriOptions }) {
  const [lagaList, setLagaList] = useState(initialLagaList || []);
  const [formData, setFormData] = useState({
    idKategori: '',
    kelas: '',
    jenis_kelamin: 'pria', // Default value
  });
  const [editingLaga, setEditingLaga] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const fetchLaga = async () => {
    setIsLoading(true);
    try {
      const response = await getAllLaga({ limit: 100, sortBy: 'nama_tanding', order: 'ASC' });
      setLagaList(response.data || []);
    } catch (error) {
      setNotification({ type: 'error', message: `Gagal memuat kategori laga: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ idKategori: '', kelas: '', jenis_kelamin: 'pria' });
    setEditingLaga(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.idKategori || !formData.kelas.trim() || !formData.jenis_kelamin) {
      setNotification({ type: 'error', message: 'Semua field (Kategori, Kelas, Jenis Kelamin) wajib diisi.' });
      return;
    }
    setIsLoading(true);
    setNotification({ type: '', message: '' });

    try {
      if (editingLaga) {
        await updateLaga(editingLaga.id, formData);
        setNotification({ type: 'success', message: 'Kategori Laga berhasil diperbarui!' });
      } else {
        await createLaga(formData);
        setNotification({ type: 'success', message: 'Kategori Laga berhasil ditambahkan!' });
      }
      resetForm();
      fetchLaga(); 
    } catch (error) {
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (laga) => {
    setEditingLaga(laga);
    setFormData({
      idKategori: laga.idKategori || laga.kategori?.id || '', // Ambil dari laga.kategori jika ada
      kelas: laga.kelas || '',
      jenis_kelamin: laga.jenis_kelamin || 'pria',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori laga ini? Ini bisa gagal jika sudah ada peserta atau bracket terkait.')) {
      setIsLoading(true);
      setNotification({ type: '', message: '' });
      try {
        await deleteLaga(id);
        setNotification({ type: 'success', message: 'Kategori Laga berhasil dihapus!' });
        fetchLaga();
      } catch (error) {
        setNotification({ type: 'error', message: `Gagal menghapus kategori laga: ${error.message}` });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const cancelEdit = () => {
    resetForm();
    setNotification({ type: '', message: '' });
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

      <div style={formContainerStyle}>
        <h3>{editingLaga ? 'Edit Kategori Laga' : 'Tambah Kategori Laga Baru'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={formGridStyle}>
            <div style={inputGroupStyle}>
              <label htmlFor="idKategori" style={labelStyle}>Kategori Usia/Tingkat:</label>
              <select
                name="idKategori"
                id="idKategori"
                value={formData.idKategori}
                onChange={handleInputChange}
                style={selectStyle}
                disabled={isLoading}
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {kategoriOptions.map(kat => (
                  <option key={kat.id} value={kat.id}>{kat.nama_kategori}</option>
                ))}
              </select>
            </div>

            <div style={inputGroupStyle}>
              <label htmlFor="kelas" style={labelStyle}>Kelas Tanding:</label>
              <input
                type="text"
                name="kelas"
                id="kelas"
                placeholder="e.g., A, B, Open"
                value={formData.kelas}
                onChange={handleInputChange}
                style={inputStyle}
                disabled={isLoading}
                required
              />
            </div>

            <div style={inputGroupStyle}>
              <label htmlFor="jenis_kelamin" style={labelStyle}>Jenis Kelamin:</label>
              <select
                name="jenis_kelamin"
                id="jenis_kelamin"
                value={formData.jenis_kelamin}
                onChange={handleInputChange}
                style={selectStyle}
                disabled={isLoading}
                required
              >
                <option value="pria">Pria</option>
                <option value="wanita">Wanita</option>
                <option value="campuran">Campuran (jika ada)</option>
              </select>
            </div>
          </div>
          <button type="submit" style={buttonStyle} disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : (editingLaga ? 'Update Kategori Laga' : 'Tambah Kategori Laga')}
          </button>
          {editingLaga && (
            <button type="button" onClick={cancelEdit} style={{...buttonStyle, backgroundColor: '#6c757d'}} disabled={isLoading}>
              Batal Edit
            </button>
          )}
        </form>
      </div>

      <h3>Daftar Kategori Pertandingan Laga</h3>
      {isLoading && lagaList.length === 0 && <p>Memuat kategori laga...</p>}
      {!isLoading && lagaList.length === 0 && <p>Belum ada kategori laga.</p>}
      
      <ul style={listStyle}>
        {lagaList.map((laga) => (
          <li key={laga.id} style={listItemStyle}>
            <div style={listItemContentStyle}>
                <strong style={{fontSize: '1.1em'}}>{laga.nama_tanding}</strong> (ID: {laga.id})
                <div style={{fontSize: '0.9em', color: '#555'}}>
                    Kategori: {laga.kategori?.nama_kategori || '-'} | Kelas: {laga.kelas} | Gender: {laga.jenis_kelamin}
                    <br/>
                    Peserta Terdaftar: {laga.jumlah_peserta || 0}
                </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', gap: '5px' }}>
              <button onClick={() => handleEdit(laga)} style={editButtonStyle} disabled={isLoading}>
                Edit
              </button>
              <button onClick={() => handleDelete(laga.id)} style={deleteButtonStyle} disabled={isLoading}>
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
