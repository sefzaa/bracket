// frontend/app/admin/kategori-usia/page.jsx
import Link from 'next/link';
import { getAllKategori } from '../../../services/api'; // Path: ../../../ (dari kategori-usia -> admin -> app -> frontend)
import KategoriClient from './KategoriClient';

async function fetchInitialKategori() {
  try {
    const response = await getAllKategori({ limit: 100, sortBy: 'nama_kategori', order: 'ASC' }); 
    return response.data || [];
  } catch (err) {
    console.error("Failed to fetch initial kategori:", err);
    return []; 
  }
}

export default async function AdminKategoriUsiaPage() {
  const initialKategoriList = await fetchInitialKategori();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Manajemen Kategori Usia/Tingkat</h1>
        <Link href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          &larr; Kembali ke Dashboard Admin
        </Link>
      </div>
      <KategoriClient initialKategoriList={initialKategoriList} />
    </div>
  );
}
