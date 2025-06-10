// File: frontend/app/layout.jsx (atau layout.js)

import { Inter } from 'next/font/google'; // Menggunakan font Inter dari Google Fonts
import "./globals.css"; // Pastikan path ke globals.css benar

// Inisialisasi font Inter
const inter = Inter({
  subsets: ["latin"],
  display: 'swap', // Opsi untuk performa font yang lebih baik
  variable: "--font-inter", // Variabel CSS untuk Inter
});

export const metadata = {
  title: "Aplikasi Bracket Turnamen",
  description: "Aplikasi untuk membuat dan mengelola bracket turnamen.",
};

export default function RootLayout({ children }) {
  return (
    // Terapkan variabel font ke elemen <html>
    <html lang="id" className={`${inter.variable}`}>
      {/*
        Untuk menggunakan font Inter sebagai font utama di aplikasi Anda:
        1. Di file `globals.css` Anda, temukan selector `body`.
        2. Ubah properti `font-family` menjadi:
           font-family: var(--font-inter), Arial, Helvetica, sans-serif;
           atau jika Anda menggunakan --font-sans dari blok @theme dan sudah mengassign --font-inter ke --font-sans:
           font-family: var(--font-sans), Arial, Helvetica, sans-serif;

        Alternatif lain adalah menerapkan kelas font langsung ke body:
        <body className={`${inter.className} antialiased`}>
        Namun, pendekatan variabel CSS lebih fleksibel. Pastikan juga kelas 'antialiased'
        ada di globals.css jika Anda menggunakannya atau berasal dari Tailwind.
      */}
      <body className="antialiased"> {/* Anda bisa juga menambahkan inter.className di sini */}
        {children}
      </body>
    </html>
  );
}
