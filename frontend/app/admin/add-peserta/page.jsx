// frontend/pages/admin/add-peserta.jsx
'use client'; // Tandai sebagai Client Component

import { useState } from 'react';
import { createPeserta } from '../../../services/api'; // atau fungsi lain yang Anda butuhkan // Sesuaikan path
import Link from 'next/link';

export default function AddPesertaPage() {
  const [formData, setFormData] = useState({
    nama: '',
    jenis_kelamin: 'pria',
    jenis: 'tanding',
    kategori: 'dewasa',
    kelas: 'A',
  });
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification('');
    setError('');
    try {
      const response = await createPeserta(formData);
      setNotification(`Peserta "${response.data.nama}" berhasil ditambahkan!`);
      // Reset form
      setFormData({
        nama: '', jenis_kelamin: 'pria', jenis: 'tanding', kategori: 'dewasa', kelas: 'A',
      });
    } catch (err) {
      setError(`Gagal menambahkan peserta: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h1>Tambah Peserta Baru</h1>
      {notification && <p style={{ color: 'green' }}>{notification}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nama">Nama Peserta:</label>
          <input type="text" name="nama" id="nama" value={formData.nama} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="jenis_kelamin">Jenis Kelamin:</label>
          <select name="jenis_kelamin" id="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange}>
            <option value="pria">Pria</option>
            <option value="wanita">Wanita</option>
          </select>
        </div>
        <div>
          <label htmlFor="jenis">Jenis Pertandingan:</label>
          <select name="jenis" id="jenis" value={formData.jenis} onChange={handleChange}>
            {['tanding', 'tunggal', 'regu', 'ganda', 'solo kreatif'].map(j => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="kategori">Kategori Usia:</label>
          <select name="kategori" id="kategori" value={formData.kategori} onChange={handleChange}>
            {['pra usia dini', 'usia dini', 'pra remaja', 'remaja', 'dewasa', 'master'].map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="kelas">Kelas Pertandingan:</label>
          <select name="kelas" id="kelas" value={formData.kelas} onChange={handleChange}>
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'OPEN'].map(kl => <option key={kl} value={kl}>{kl}</option>)}
          </select>
        </div>
        <button type="submit" style={{ marginTop: '15px' }}>Tambah Peserta</button>
      </form>
      <p style={{marginTop: '20px'}}><Link href="/tournaments" legacyBehavior><a>Kembali ke Daftar Grup Turnamen</a></Link></p>
    </div>
  );
}