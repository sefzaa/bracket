// frontend/app/admin/page.jsx
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard Admin</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '10px' }}>
          <Link href="/admin/kategori-usia" style={{ fontSize: '1.1em', color: '#007bff', textDecoration: 'none' }}>
            Manajemen Kategori Usia/Tingkat
          </Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
          <Link href="/admin/add-peserta" style={{ fontSize: '1.1em', color: '#007bff', textDecoration: 'none' }}>
            Tambah Peserta
          </Link>
        </li>
        {/* Tambahkan link ke halaman admin lainnya di sini nanti */}
        {/* <li style={{ marginBottom: '10px' }}>
          <Link href="/admin/kontingen" style={{ fontSize: '1.1em', color: '#007bff', textDecoration: 'none' }}>
            Manajemen Kontingen
          </Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
          <Link href="/admin/dewan" style={{ fontSize: '1.1em', color: '#007bff', textDecoration: 'none' }}>
            Manajemen Dewan
          </Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
          <Link href="/admin/laga" style={{ fontSize: '1.1em', color: '#007bff', textDecoration: 'none' }}>
            Manajemen Kategori Laga
          </Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
          <Link href="/admin/seni" style={{ fontSize: '1.1em', color: '#007bff', textDecoration: 'none' }}>
            Manajemen Kategori Seni
          </Link>
        </li>
        */}
      </ul>
      <hr style={{margin: '20px 0'}} />
      <p><Link href="/tournaments" style={{color: '#28a745'}}>Lihat Daftar Turnamen/Kompetisi</Link></p>
    </div>
  );
}
