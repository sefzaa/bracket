// frontend/app/tournaments/bracket/[bracketId]/page.jsx
import Link from 'next/link';
// Pastikan path ke service API sudah benar relatif terhadap file ini
import { getBracketDetailsById, getAllDewan } from '../../../../services/api'; 
import BracketDisplayClient from './BracketDisplayClient';

/**
 * Fungsi untuk mengambil data bracket dan daftar dewan dari backend.
 * Dijalankan di sisi server (Server Component).
 * @param {string} bracketId - ID bracket yang akan diambil datanya.
 * @returns {Promise<{initialBracketDetails: object|null, initialDewanList: Array, error: string|null}>}
 */
async function fetchBracketPageData(bracketId) {
    try {
        // Mengambil detail bracket dan daftar dewan secara paralel untuk efisiensi
        const [bracketDetailsResponse, dewanListResponse] = await Promise.all([
            getBracketDetailsById(bracketId), 
            getAllDewan() 
        ]);

        return {
            initialBracketDetails: bracketDetailsResponse, // Berisi { message, data (bracket dgn matches & info kompetisi) }
            initialDewanList: dewanListResponse.data || [], // Pastikan ini array
            error: null,
        };
    } catch (err) {
        console.error(`Failed to fetch data for bracketId ${bracketId}:`, err);
        return {
            initialBracketDetails: null,
            initialDewanList: [],
            error: err.message || "Gagal memuat data bracket.", // Pesan error yang lebih informatif
        };
    }
}

/**
 * Komponen halaman untuk menampilkan detail bracket.
 * Ini adalah Server Component di Next.js.
 * @param {{params: {bracketId: string}}} props - Props yang berisi parameter route.
 */
export default async function BracketDetailPage({ params }) {
    const { bracketId } = params; 
    const { initialBracketDetails, initialDewanList, error } = await fetchBracketPageData(bracketId);

    // Tampilkan pesan error jika terjadi kesalahan saat memuat data
    if (error) {
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <h1>Error Memuat Bracket</h1>
                <p>{error}</p>
                <Link href="/tournaments" style={{ color: '#007bff', textDecoration: 'none' }}>
                    Kembali ke Daftar Kompetisi
                </Link>
            </div>
        );
    }

    // Tampilkan pesan jika data bracket tidak ditemukan
    if (!initialBracketDetails || !initialBracketDetails.data) {
        return (
            <div style={{ padding: '20px' }}>
                <h1>Informasi</h1>
                <p>Data bracket tidak ditemukan untuk ID: {bracketId}.</p>
                <Link href="/tournaments" style={{ color: '#007bff', textDecoration: 'none' }}>
                    Kembali ke Daftar Kompetisi
                </Link>
            </div>
        );
    }
    
    // Mengambil judul dari nama bracket yang sudah digenerate atau info kompetisi
    // Prioritas: nama_bracket > nama_tanding (laga) > nama_seni (seni) > default
    const bracketTitle = initialBracketDetails.data.nama_bracket || 
                         initialBracketDetails.data.infoLagaBracket?.nama_tanding || 
                         initialBracketDetails.data.infoSeniBracket?.nama_seni || 
                         `Detail Bracket #${bracketId}`;

    return (
        <div style={{ padding: '20px', maxWidth: '95%', margin: '0 auto' }}> 
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Bracket: {bracketTitle}</h1>
                <Link href="/tournaments" style={{ color: '#007bff', textDecoration: 'none' }}>
                    &larr; Kembali ke Daftar Kompetisi
                </Link>
            </div>
            {/* Render komponen client untuk tampilan interaktif bracket */}
            <BracketDisplayClient
                bracketId={bracketId}
                initialBracketDetails={initialBracketDetails} // Mengirim seluruh respons detail bracket
                initialDewanList={initialDewanList}
            />
        </div>
    );
}

