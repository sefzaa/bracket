// frontend/app/admin/dewan/page.jsx
import Link from 'next/link';
import { getAllDewan } from '../../../services/api'; // Path: ../../../ (dari dewan -> admin -> app -> frontend)
import DewanClient from './DewanClient';

async function fetchInitialDewan() {
  try {
    const response = await getAllDewan({ limit: 100, sortBy: 'nama', order: 'ASC' }); 
    return response.data || [];
  } catch (err) {
    console.error("Failed to fetch initial dewan:", err);
    return []; 
  }
}

export default async function AdminDewanPage() {
  const initialDewanList = await fetchInitialDewan();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Manajemen Dewan/Juri</h1>
        <Link href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          &larr; Kembali ke Dashboard Admin
        </Link>
      </div>
      <DewanClient initialDewanList={initialDewanList} />
    </div>
  );
}
