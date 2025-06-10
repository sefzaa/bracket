// frontend/app/admin/peserta/page.jsx
import Link from 'next/link';
import { 
    getAllPeserta, 
    getAllKontingen, 
    getAllKategori,
    getAllLaga,
    getAllSeni
} from '../../../services/api'; // Path: ../../../
import PesertaClient from './PesertaClient';

async function fetchDataForPesertaPage() {
  try {
    const [
        pesertaResponse, 
        kontingenResponse, 
        kategoriUsiaResponse,
        lagaResponse,
        seniResponse
    ] = await Promise.all([
      getAllPeserta({ limit: 50, sortBy: 'nama', order: 'ASC' }), // Ambil 50 peserta awal
      getAllKontingen({ limit: 200, sortBy: 'nama_kontingen', order: 'ASC' }), // Untuk dropdown
      getAllKategori({ limit: 100, sortBy: 'nama_kategori', order: 'ASC' }), // Untuk dropdown Kategori Usia
      getAllLaga({ limit: 200, sortBy: 'nama_tanding', order: 'ASC' }), // Untuk dropdown pendaftaran Laga
      getAllSeni({ limit: 200, sortBy: 'nama_seni', order: 'ASC' }) // Untuk dropdown pendaftaran Seni
    ]);
    
    return {
      initialPesertaList: pesertaResponse.data || [],
      kontingenOptions: kontingenResponse.data || [],
      kategoriUsiaOptions: kategoriUsiaResponse.data || [],
      lagaOptions: lagaResponse.data || [],
      seniOptions: seniResponse.data || [],
      error: null,
    };
  } catch (err) {
    console.error("Failed to fetch data for Peserta page:", err);
    return {
      initialPesertaList: [],
      kontingenOptions: [],
      kategoriUsiaOptions: [],
      lagaOptions: [],
      seniOptions: [],
      error: err.message || "Gagal memuat data.",
    };
  }
}

export default async function AdminPesertaPage() {
  const { 
    initialPesertaList, 
    kontingenOptions, 
    kategoriUsiaOptions,
    lagaOptions,
    seniOptions,
    error 
  } = await fetchDataForPesertaPage();

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
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Manajemen Peserta & Pendaftaran Kompetisi</h1>
        <Link href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          &larr; Kembali ke Dashboard Admin
        </Link>
      </div>
      <PesertaClient 
        initialPesertaList={initialPesertaList}
        kontingenOptions={kontingenOptions}
        kategoriUsiaOptions={kategoriUsiaOptions}
        lagaOptions={lagaOptions}
        seniOptions={seniOptions}
      />
    </div>
  );
}
