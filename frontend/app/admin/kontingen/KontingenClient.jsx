// frontend/app/admin/kontingen/KontingenClient.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
    getAllKontingen, 
    createKontingen, 
    updateKontingen, 
    deleteKontingen 
} from '../../../services/api'; // Sesuaikan path jika perlu

// Style dasar (bisa dipindahkan ke file CSS atau di-share)
const formStyle = {
    marginBottom: '30px',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
};
const inputContainerStyle = {
    marginBottom: '10px',
};
const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
};
const inputStyle = {
    width: 'calc(100% - 22px)',
    padding: '10px',
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
    padding: '12px 10px',
    borderBottom: '1px solid #eee',
    backgroundColor: 'white',
};
const listItemContentStyle = {
    flexGrow: 1,
};
const actionButtonStyle = { ...buttonStyle, fontSize: '12px', padding: '6px 10px', marginTop: 0 };
const deleteButtonStyle = { ...actionButtonStyle, backgroundColor: '#dc3545' };
const editButtonStyle = { ...actionButtonStyle, backgroundColor: '#ffc107', color: '#212529' };

export default function KontingenClient({ initialKontingenList }) {
  const [kontingenList, setKontingenList] = useState(initialKontingenList || []);
  const [formData, setFormData] = useState({
    nama_kontingen: '',
    kabupaten: '',
    provinsi: '',
  });
  const [editingKontingen, setEditingKontingen] = useState(null); // Untuk menyimpan data kontingen yang diedit
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const fetchKontingen = async () => {
    setIsLoading(true);
    try {
      const response = await getAllKontingen({ limit: 100, sortBy: 'nama_kontingen', order: 'ASC' });
      setKontingenList(response.data || []);
    } catch (error) {
      setNotification({ type: 'error', message: `Gagal memuat kontingen: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ nama_kontingen: '', kabupaten: '', provinsi: '' });
    setEditingKontingen(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_kontingen.trim()) {
      setNotification({ type: 'error', message: 'Nama kontingen tidak boleh kosong.' });
      return;
    }
    setIsLoading(true);
    setNotification({ type: '', message: '' });

    try {
      if (editingKontingen) {
        await updateKontingen(editingKontingen.id, formData);
        setNotification({ type: 'success', message: 'Kontingen berhasil diperbarui!' });
      } else {
        await createKontingen(formData);
        setNotification({ type: 'success', message: 'Kontingen berhasil ditambahkan!' });
      }
      resetForm();
      fetchKontingen(); 
    } catch (error) {
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (kontingen) => {
    setEditingKontingen(kontingen);
    setFormData({
      nama_kontingen: kontingen.nama_kontingen,
      kabupaten: kontingen.kabupaten || '',
      provinsi: kontingen.provinsi || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus kontingen ini? Ini bisa gagal jika kontingen memiliki peserta.')) {
      setIsLoading(true);
      setNotification({ type: '', message: '' });
      try {
        await deleteKontingen(id);
        setNotification({ type: 'success', message: 'Kontingen berhasil dihapus!' });
        fetchKontingen();
      } catch (error) {
        setNotification({ type: 'error', message: `Gagal menghapus kontingen: ${error.message}` });
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
        <h3>{editingKontingen ? 'Edit Kontingen' : 'Tambah Kontingen Baru'}</h3>
        <div style={inputContainerStyle}>
            <label htmlFor="nama_kontingen" style={labelStyle}>Nama Kontingen:</label>
            <input
              type="text"
              name="nama_kontingen"
              id="nama_kontingen"
              placeholder="Nama Kontingen (e.g., Kontingen Kota Payakumbuh)"
              value={formData.nama_kontingen}
              onChange={handleInputChange}
              style={inputStyle}
              disabled={isLoading}
              required
            />
        </div>
        <div style={inputContainerStyle}>
            <label htmlFor="kabupaten" style={labelStyle}>Kabupaten/Kota:</label>
            <input
              type="text"
              name="kabupaten"
              id="kabupaten"
              placeholder="Kabupaten/Kota (Opsional)"
              value={formData.kabupaten}
              onChange={handleInputChange}
              style={inputStyle}
              disabled={isLoading}
            />
        </div>
        <div style={inputContainerStyle}>
            <label htmlFor="provinsi" style={labelStyle}>Provinsi:</label>
            <input
              type="text"
              name="provinsi"
              id="provinsi"
              placeholder="Provinsi (Opsional)"
              value={formData.provinsi}
              onChange={handleInputChange}
              style={inputStyle}
              disabled={isLoading}
            />
        </div>
        <button type="submit" style={buttonStyle} disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : (editingKontingen ? 'Update Kontingen' : 'Tambah Kontingen')}
        </button>
        {editingKontingen && (
          <button type="button" onClick={cancelEdit} style={{...buttonStyle, backgroundColor: '#6c757d'}} disabled={isLoading}>
            Batal Edit
          </button>
        )}
      </form>

      <h3>Daftar Kontingen</h3>
      {isLoading && kontingenList.length === 0 && <p>Memuat kontingen...</p>}
      {!isLoading && kontingenList.length === 0 && <p>Belum ada kontingen.</p>}
      
      <ul style={listStyle}>
        {kontingenList.map((kontingen) => (
          <li key={kontingen.id} style={listItemStyle}>
            <div style={listItemContentStyle}>
                <strong style={{fontSize: '1.1em'}}>{kontingen.nama_kontingen}</strong> (ID: {kontingen.id})
                <div style={{fontSize: '0.9em', color: '#555'}}>
                    {kontingen.kabupaten && <span>{kontingen.kabupaten}</span>}
                    {kontingen.kabupaten && kontingen.provinsi && <span>, </span>}
                    {kontingen.provinsi && <span>{kontingen.provinsi}</span>}
                </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <button onClick={() => handleEdit(kontingen)} style={editButtonStyle} disabled={isLoading}>
                Edit
              </button>
              <button onClick={() => handleDelete(kontingen.id)} style={deleteButtonStyle} disabled={isLoading}>
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
