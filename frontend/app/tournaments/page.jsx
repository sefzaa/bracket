// frontend/app/tournaments/page.jsx
import Link from 'next/link';
import { getAllKompetisi } from '../../services/api'; // Path: ../../ (dari tournaments -> app -> frontend)
import TournamentListClient from './TournamentListClient'; // Komponen client terpisah

async function fetchInitialKompetisiData() {
  try {
    // Ambil semua kompetisi, diurutkan oleh backend berdasarkan jumlah peserta
    const response = await getAllKompetisi({ limit: 50 }); // Ambil 50 kompetisi awal
    return {
      initialKompetisiList: response.data || [],
      error: null,
    };
  } catch (err) {
    console.error("Failed to fetch initial kompetisi list:", err);
    return {
      initialKompetisiList: [],
      error: err.message || "Gagal memuat daftar kompetisi.",
    };
  }
}

export default async function TournamentsListPage() {
  const { initialKompetisiList, error } = await fetchInitialKompetisiData();

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error Memuat Daftar Kompetisi</h1>
        <p>{error}</p>
        <Link href="/">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Daftar Kompetisi Pertandingan</h1>
        <Link href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          Ke Halaman Admin &rarr;
        </Link>
      </div>
      <TournamentListClient initialKompetisiList={initialKompetisiList} />
    </div>
  );
}
