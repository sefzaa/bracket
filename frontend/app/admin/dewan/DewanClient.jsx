// frontend/app/admin/dewan/DewanClient.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
    getAllDewan, 
    createDewan, 
    // updateDewan, // Akan kita implementasikan jika model Dewan memiliki field lain untuk diupdate
    // deleteDewan  // Akan kita implementasikan
} from '../../../services/api'; // Path: ../../../ (dari dewan -> admin -> app -> frontend)

// Style dasar (bisa disesuaikan atau di-share)
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
    fontSize: '14px',
};
const listStyle = { listStyleType: 'none', padding: 0 };
const listItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #eee',
    backgroundColor: 'white',
};
const actionButtonStyle = { ...buttonStyle, fontSize: '12px', padding: '6px 10px', marginTop: 0 };
const deleteButtonStyle = { ...actionButtonStyle, backgroundColor: '#dc3545' };
// const editButtonStyle = { ...actionButtonStyle, backgroundColor: '#ffc107', color: '#212529' }; // Jika ada edit

export default function DewanClient({ initialDewanList }) {
  const [dewanList, setDewanList] = useState(initialDewanList || []);
  const [namaDewan, setNamaDewan] = useState('');
  // const [editingDewan, setEditingDewan] = useState(null); // Untuk edit nanti
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const fetchDewan = async () => {
    setIsLoading(true);
    try {
      const response = await getAllDewan({ limit: 100, sortBy: 'nama', order: 'ASC' });
      setDewanList(response.data || []);
    } catch (error) {
      setNotification({ type: 'error', message: `Gagal memuat dewan: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaDewan.trim()) {
      setNotification({ type: 'error', message: 'Nama dewan tidak boleh kosong.' });
      return;
    }
    setIsLoading(true);
    setNotification({ type: '', message: '' });

    try {
      // Untuk Dewan, modelnya sederhana, jadi kita fokus ke create dulu.
      // Edit bisa ditambahkan jika ada field lain selain nama.
      // if (editingDewan) {
      //   await updateDewan(editingDewan.id, { nama: namaDewan });
      //   setNotification({ type: 'success', message: 'Dewan berhasil diperbarui!' });
      // } else {
        await createDewan({ nama: namaDewan });
        setNotification({ type: 'success', message: 'Dewan berhasil ditambahkan!' });
      // }
      setNamaDewan('');
      // setEditingDewan(null);
      fetchDewan(); 
    } catch (error) {
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Edit dan Delete bisa ditambahkan di sini jika diperlukan nanti
  // const handleEdit = (dewan) => {
  //   setEditingDewan(dewan);
  //   setNamaDewan(dewan.nama);
  //   window.scrollTo({ top: 0, behavior: 'smooth' });
  // };

  // const handleDelete = async (id) => {
  //   if (confirm('Apakah Anda yakin ingin menghapus dewan ini?')) {
  //     setIsLoading(true);
  //     setNotification({ type: '', message: '' });
  //     try {
  //       await deleteDewan(id); // Anda perlu menambahkan fungsi deleteDewan di services/api.js dan controller
  //       setNotification({ type: 'success', message: 'Dewan berhasil dihapus!' });
  //       fetchDewan();
  //     } catch (error) {
  //       setNotification({ type: 'error', message: `Gagal menghapus dewan: ${error.message}` });
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  // };

  // const cancelEdit = () => {
  //   setEditingDewan(null);
  //   setNamaDewan('');
  //   setNotification({ type: '', message: '' });
  // };

  return (
    <div>
      {notification.message && (
        <p style={{ 
            padding: '10px', 
            borderRadius: '4px',
            color: 'white',
            backgroundColor: notification.type === 'success' ? '#28a745' : '#dc3545',
            marginBottom: '15px',
            textAlign: 'center',
        }}>
          {notification.message}
        </p>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        <h3>Tambah Dewan/Juri Baru</h3>
        <input
          type="text"
          placeholder="Nama Dewan/Juri"
          value={namaDewan}
          onChange={(e) => setNamaDewan(e.target.value)}
          style={inputStyle}
          disabled={isLoading}
          required
        />
        <button type="submit" style={buttonStyle} disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Tambah Dewan'}
        </button>
        {/* {editingDewan && (
          <button type="button" onClick={cancelEdit} style={{...buttonStyle, backgroundColor: '#6c757d'}} disabled={isLoading}>
            Batal Edit
          </button>
        )} */}
      </form>

      <h3>Daftar Dewan/Juri</h3>
      {isLoading && dewanList.length === 0 && <p>Memuat dewan...</p>}
      {!isLoading && dewanList.length === 0 && <p>Belum ada dewan/juri.</p>}
      
      <ul style={listStyle}>
        {dewanList.map((dewan) => (
          <li key={dewan.id} style={listItemStyle}>
            <span>{dewan.nama} (ID: {dewan.id})</span>
            {/* <div>
              <button onClick={() => handleEdit(dewan)} style={editButtonStyle} disabled={isLoading}>
                Edit
              </button>
              <button onClick={() => handleDelete(dewan.id)} style={deleteButtonStyle} disabled={isLoading}>
                Hapus
              </button>
            </div> */}
          </li>
        ))}
      </ul>
    </div>
  );
}
