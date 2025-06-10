// frontend/app/admin/kontingen/page.jsx
import Link from 'next/link';
import { getAllKontingen } from '../../../services/api'; // Sesuaikan path jika perlu
import KontingenClient from './KontingenClient';

async function fetchInitialKontingen() {
  try {
    const response = await getAllKontingen({ limit: 100, sortBy: 'nama_kontingen', order: 'ASC' }); 
    return response.data || [];
  } catch (err) {
    console.error("Failed to fetch initial kontingen:", err);
    return []; 
  }
}

export default async function AdminKontingenPage() {
  const initialKontingenList = await fetchInitialKontingen();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Manajemen Kontingen</h1>
        <Link href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          &larr; Kembali ke Dashboard Admin
        </Link>
      </div>
      <KontingenClient initialKontingenList={initialKontingenList} />
    </div>
  );
}
