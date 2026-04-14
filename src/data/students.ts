import { Student } from '../types';

const firstNames = [
  'Aditya', 'Budi', 'Cahyo', 'Dedi', 'Eko', 'Fajar', 'Guntur', 'Hadi', 'Indra', 'Joko',
  'Kurniawan', 'Lutfi', 'Mulyono', 'Nugroho', 'Oki', 'Prabowo', 'Qomar', 'Rian', 'Setyo', 'Taufik',
  'Utomo', 'Vicky', 'Wahyu', 'Xaverius', 'Yanto', 'Zaki', 'Anisa', 'Bunga', 'Citra', 'Dewi',
  'Endah', 'Fitri', 'Gita', 'Hana', 'Indah', 'Jelita', 'Kartika', 'Lestari', 'Maya', 'Novi',
  'Olivia', 'Putri', 'Qonita', 'Rina', 'Sari', 'Tia', 'Utari', 'Vina', 'Wati', 'Yulia'
];

const lastNames = [
  'Saputra', 'Wijaya', 'Kusuma', 'Pratama', 'Santoso', 'Hidayat', 'Gunawan', 'Setiawan', 'Ramadhan', 'Maulana',
  'Siregar', 'Nasution', 'Lubis', 'Pohan', 'Ginting', 'Tarigan', 'Sembiring', 'Manurung', 'Simanjuntak', 'Siahaan',
  'Pangestu', 'Wibowo', 'Nugraha', 'Susanto', 'Purnomo', 'Budiman', 'Suryadi', 'Handoko', 'Djatmiko', 'Suharto'
];

const origins = [
  'Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi',
  'Yogyakarta', 'Solo', 'Malang', 'Denpasar', 'Banjarmasin', 'Balikpapan', 'Pontianak', 'Samarinda', 'Manado', 'Ambon',
  'Padang', 'Pekanbaru', 'Batam', 'Jambi', 'Bengkulu', 'Lampung', 'Serang', 'Cilegon', 'Bogor', 'Sukabumi'
];

export const students: Student[] = Array.from({ length: 100 }, (_, i) => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const origin = origins[Math.floor(Math.random() * origins.length)];
  const name = `${firstName} ${lastName}`;
  const nim = `2514400${(i + 1).toString().padStart(3, '0')}`;
  
  return {
    id: `instrumen-25-${i + 1}`,
    nim,
    name,
    nickname: firstName,
    origin,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
  };
});
