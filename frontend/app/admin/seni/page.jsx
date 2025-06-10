// frontend/app/admin/seni/page.jsx
import Link from 'next/link';
import { getAllSeni, getAllKategori } from '../../../services/api'; // Path: ../../../
import SeniClient from './SeniClient';

async function fetchDataForSeniPage() {
  try {
    const [seniResponse, kategoriResponse] = await Promise.all([
      getAllSeni({ limit: 100, sortBy: 'nama_seni', order: 'ASC' }),
      getAllKategori({ limit: 100, sortBy: 'nama_kategori', order: 'ASC' }) // Untuk dropdown Kategori Usia/Tingkat
    ]);
    return {
      initialSeniList: seniResponse.data || [],
      kategoriOptions: kategoriResponse.data || [],
      error: null,
    };
  } catch (err) {
    console.error("Failed to fetch data for Seni page:", err);
    return {
      initialSeniList: [],
      kategoriOptions: [],
      error: err.message || "Gagal memuat data.",
    };
  }
}

export default async function AdminSeniPage() {
  const { initialSeniList, kategoriOptions, error } = await fetchDataForSeniPage();

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error</h1>
        <p>{error}</p>
        <Link href="/admin">Kembali ke Dashboard Admin</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Manajemen Kategori Pertandingan Seni</h1>
        <Link href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          &larr; Kembali ke Dashboard Admin
        </Link>
      </div>
      <SeniClient 
        initialSeniList={initialSeniList}
        kategoriOptions={kategoriOptions}
      />
    </div>
  );
}
