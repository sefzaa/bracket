// frontend/app/admin/kategori-usia/KategoriClient.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
    getAllKategori, 
    createKategori, 
    updateKategori, 
    deleteKategori 
} from '../../../services/api'; // Path: ../../../ (dari kategori-usia -> admin -> app -> frontend)

// Style dasar (bisa dipindahkan ke file CSS)
const formStyle = {
    marginBottom: '30px',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
};
const inputStyle = {
    width: 'calc(100% - 22px)',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
};
const buttonStyle = {
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
    backgroundColor: '#007bff',
    color: 'white',
};
const listStyle = { listStyleType: 'none', padding: 0 };
const listItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #eee',
};
const actionButtonStyle = { ...buttonStyle, fontSize: '12px', padding: '6px 10px' };
const deleteButtonStyle = { ...actionButtonStyle, backgroundColor: '#dc3545' };
const editButtonStyle = { ...actionButtonStyle, backgroundColor: '#ffc107', color: '#212529' };


export default function KategoriClient({ initialKategoriList }) {
  const [kategoriList, setKategoriList] = useState(initialKategoriList || []);
  const [namaKategori, setNamaKategori] = useState('');
  const [editingKategori, setEditingKategori] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const fetchKategori = async () => {
    setIsLoading(true);
    try {
      const response = await getAllKategori({ limit: 100, sortBy: 'nama_kategori', order: 'ASC' });
      setKategoriList(response.data || []);
    } catch (error) {
      setNotification({ type: 'error', message: `Gagal memuat kategori: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaKategori.trim()) {
      setNotification({ type: 'error', message: 'Nama kategori tidak boleh kosong.' });
      return;
    }
    setIsLoading(true);
    setNotification({ type: '', message: '' });

    try {
      if (editingKategori) {
        await updateKategori(editingKategori.id, { nama_kategori: namaKategori });
        setNotification({ type: 'success', message: 'Kategori berhasil diperbarui!' });
      } else {
        await createKategori({ nama_kategori: namaKategori });
        setNotification({ type: 'success', message: 'Kategori berhasil ditambahkan!' });
      }
      setNamaKategori('');
      setEditingKategori(null);
      fetchKategori(); 
    } catch (error) {
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (kategori) => {
    setEditingKategori(kategori);
    setNamaKategori(kategori.nama_kategori);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      setIsLoading(true);
      setNotification({ type: '', message: '' });
      try {
        await deleteKategori(id);
        setNotification({ type: 'success', message: 'Kategori berhasil dihapus!' });
        fetchKategori();
      } catch (error) {
        setNotification({ type: 'error', message: `Gagal menghapus kategori: ${error.message}` });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const cancelEdit = () => {
    setEditingKategori(null);
    setNamaKategori('');
    setNotification({ type: '', message: '' });
  };

  return (
    <div>
      {notification.message && (
        <p style={{ 
            padding: '10px', 
            borderRadius: '4px',
            color: 'white',
            backgroundColor: notification.type === 'success' ? '#28a745' : '#dc3545',
            marginBottom: '15px'
        }}>
          {notification.message}
        </p>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        <h3>{editingKategori ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
        <input
          type="text"
          placeholder="Nama Kategori Usia/Tingkat (e.g., Dewasa, Remaja)"
          value={namaKategori}
          onChange={(e) => setNamaKategori(e.target.value)}
          style={inputStyle}
          disabled={isLoading}
        />
        <button type="submit" style={buttonStyle} disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : (editingKategori ? 'Update Kategori' : 'Tambah Kategori')}
        </button>
        {editingKategori && (
          <button type="button" onClick={cancelEdit} style={{...buttonStyle, backgroundColor: '#6c757d'}} disabled={isLoading}>
            Batal Edit
          </button>
        )}
      </form>

      <h3>Daftar Kategori Usia/Tingkat</h3>
      {isLoading && kategoriList.length === 0 && <p>Memuat kategori...</p>}
      {!isLoading && kategoriList.length === 0 && <p>Belum ada kategori usia/tingkat.</p>}
      
      <ul style={listStyle}>
        {kategoriList.map((kategori) => (
          <li key={kategori.id} style={listItemStyle}>
            <span>{kategori.nama_kategori} (ID: {kategori.id})</span>
            <div>
              <button onClick={() => handleEdit(kategori)} style={editButtonStyle} disabled={isLoading}>
                Edit
              </button>
              <button onClick={() => handleDelete(kategori.id)} style={deleteButtonStyle} disabled={isLoading}>
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
