// frontend/app/admin/seni/SeniClient.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
    getAllSeni, 
    createSeni, 
    updateSeni, 
    deleteSeni,
} from '../../../services/api'; // Sesuaikan path jika perlu

// Style dasar (bisa menggunakan style yang sama dengan LagaClient atau disesuaikan)
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
const inputStyle = { // Tidak digunakan untuk form ini, tapi jaga jika ada
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

const JENIS_SENI_OPTIONS = ['tunggal', 'ganda', 'regu', 'solo kreatif'];

export default function SeniClient({ initialSeniList, kategoriOptions }) {
  const [seniList, setSeniList] = useState(initialSeniList || []);
  const [formData, setFormData] = useState({
    idKategori: '',
    jenis_seni: JENIS_SENI_OPTIONS[0], // Default value
    jenis_kelamin: 'pria', // Default value
  });
  const [editingSeni, setEditingSeni] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const fetchSeni = async () => {
    setIsLoading(true);
    try {
      const response = await getAllSeni({ limit: 100, sortBy: 'nama_seni', order: 'ASC' });
      setSeniList(response.data || []);
    } catch (error) {
      setNotification({ type: 'error', message: `Gagal memuat kategori seni: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ idKategori: '', jenis_seni: JENIS_SENI_OPTIONS[0], jenis_kelamin: 'pria' });
    setEditingSeni(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.idKategori || !formData.jenis_seni || !formData.jenis_kelamin) {
      setNotification({ type: 'error', message: 'Semua field (Kategori, Jenis Seni, Jenis Kelamin) wajib diisi.' });
      return;
    }
    setIsLoading(true);
    setNotification({ type: '', message: '' });

    try {
      if (editingSeni) {
        await updateSeni(editingSeni.id, formData);
        setNotification({ type: 'success', message: 'Kategori Seni berhasil diperbarui!' });
      } else {
        await createSeni(formData);
        setNotification({ type: 'success', message: 'Kategori Seni berhasil ditambahkan!' });
      }
      resetForm();
      fetchSeni(); 
    } catch (error) {
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (seni) => {
    setEditingSeni(seni);
    setFormData({
      idKategori: seni.idKategori || seni.kategori?.id || '',
      jenis_seni: seni.jenis_seni || JENIS_SENI_OPTIONS[0],
      jenis_kelamin: seni.jenis_kelamin || 'pria',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori seni ini? Ini bisa gagal jika sudah ada peserta atau bracket terkait.')) {
      setIsLoading(true);
      setNotification({ type: '', message: '' });
      try {
        await deleteSeni(id);
        setNotification({ type: 'success', message: 'Kategori Seni berhasil dihapus!' });
        fetchSeni();
      } catch (error) {
        setNotification({ type: 'error', message: `Gagal menghapus kategori seni: ${error.message}` });
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
        <h3>{editingSeni ? 'Edit Kategori Seni' : 'Tambah Kategori Seni Baru'}</h3>
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
              <label htmlFor="jenis_seni" style={labelStyle}>Jenis Seni:</label>
              <select
                name="jenis_seni"
                id="jenis_seni"
                value={formData.jenis_seni}
                onChange={handleInputChange}
                style={selectStyle}
                disabled={isLoading}
                required
              >
                {JENIS_SENI_OPTIONS.map(js => (
                    <option key={js} value={js}>{js.charAt(0).toUpperCase() + js.slice(1)}</option>
                ))}
              </select>
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
                <option value="campuran">Campuran</option>
              </select>
            </div>
          </div>
          <button type="submit" style={buttonStyle} disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : (editingSeni ? 'Update Kategori Seni' : 'Tambah Kategori Seni')}
          </button>
          {editingSeni && (
            <button type="button" onClick={cancelEdit} style={{...buttonStyle, backgroundColor: '#6c757d'}} disabled={isLoading}>
              Batal Edit
            </button>
          )}
        </form>
      </div>

      <h3>Daftar Kategori Pertandingan Seni</h3>
      {isLoading && seniList.length === 0 && <p>Memuat kategori seni...</p>}
      {!isLoading && seniList.length === 0 && <p>Belum ada kategori seni.</p>}
      
      <ul style={listStyle}>
        {seniList.map((seni) => (
          <li key={seni.id} style={listItemStyle}>
            <div style={listItemContentStyle}>
                <strong style={{fontSize: '1.1em'}}>{seni.nama_seni}</strong> (ID: {seni.id})
                <div style={{fontSize: '0.9em', color: '#555'}}>
                    Kategori: {seni.kategori?.nama_kategori || '-'} | Jenis: {seni.jenis_seni} | Gender: {seni.jenis_kelamin}
                    <br/>
                    Peserta Terdaftar: {seni.jumlah_peserta || 0}
                </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', gap: '5px' }}>
              <button onClick={() => handleEdit(seni)} style={editButtonStyle} disabled={isLoading}>
                Edit
              </button>
              <button onClick={() => handleDelete(seni.id)} style={deleteButtonStyle} disabled={isLoading}>
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
