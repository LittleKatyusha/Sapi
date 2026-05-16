/**
 * Dummy data for Stok Sapi RPH page
 */

// Currency formatter
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

// Number formatter
export const formatNumber = (value) => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('id-ID').format(value);
};

// Generate date headers for the last 7 days (Indonesian locale, most recent first)
export const generateDateHeaders = () => {
  const months = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dates = [];
  const today = new Date(2026, 4, 12); // May 12, 2026

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push({
      key: `tgl${i + 1}`,
      label: `${date.getDate()} ${months[date.getMonth() + 1]}`,
      fullDate: date.toISOString().split('T')[0],
    });
  }
  return dates;
};

// Stat cards data
export const statCards = [
  {
    id: 'totalSapi',
    label: 'Total Sapi',
    value: '45 ekor',
    icon: 'Users',
  },
  {
    id: 'totalBerat',
    label: 'Total Berat',
    value: '14.550 kg',
    icon: 'Scale',
  },
  {
    id: 'totalNilai',
    label: 'Total Nilai',
    value: 'Rp 497.000.000',
    icon: 'Banknote',
  },
  {
    id: 'jenisSapi',
    label: 'Jenis Sapi',
    value: '5 jenis',
    icon: 'Tag',
  },
];

// Stok Ringkas data (Tab 1)
export const stokRingkasData = [
  {
    id: 1,
    jenisSapi: 'Sapi PO',
    jumlahEkor: 15,
    berat: 4500,
    harga: 157500000,
  },
  {
    id: 2,
    jenisSapi: 'Sapi Bali',
    jumlahEkor: 10,
    berat: 2800,
    harga: 84000000,
  },
  {
    id: 3,
    jenisSapi: 'Sapi Brahman',
    jumlahEkor: 8,
    berat: 3200,
    harga: 112000000,
  },
  {
    id: 4,
    jenisSapi: 'Sapi Madura',
    jumlahEkor: 5,
    berat: 1250,
    harga: 31250000,
  },
  {
    id: 5,
    jenisSapi: 'Sapi Limousin',
    jumlahEkor: 7,
    berat: 2800,
    harga: 112000000,
  },
];

// Stok Detail - Merged Masuk/Keluar data (Tab 2)
export const stokDetailData = [
  {
    id: 1,
    jenisSapi: 'Sapi PO',
    stokAwal: 15,
    satuan: 'Ekor',
    harian: [
      { masuk: 3, keluar: 2 },
      { masuk: 2, keluar: 1 },
      { masuk: 5, keluar: 3 },
      { masuk: 1, keluar: 0 },
      { masuk: 4, keluar: 2 },
      { masuk: 2, keluar: 1 },
      { masuk: 3, keluar: 2 },
    ],
    totalNilaiBeli: 70000000,
  },
  {
    id: 2,
    jenisSapi: 'Sapi Bali',
    stokAwal: 10,
    satuan: 'Ekor',
    harian: [
      { masuk: 2, keluar: 1 },
      { masuk: 1, keluar: 0 },
      { masuk: 0, keluar: 2 },
      { masuk: 3, keluar: 1 },
      { masuk: 1, keluar: 0 },
      { masuk: 2, keluar: 1 },
      { masuk: 0, keluar: 0 },
    ],
    totalNilaiBeli: 25000000,
  },
  {
    id: 3,
    jenisSapi: 'Sapi Brahman',
    stokAwal: 8,
    satuan: 'Ekor',
    harian: [
      { masuk: 1, keluar: 0 },
      { masuk: 3, keluar: 2 },
      { masuk: 2, keluar: 1 },
      { masuk: 0, keluar: 1 },
      { masuk: 1, keluar: 0 },
      { masuk: 0, keluar: 0 },
      { masuk: 2, keluar: 1 },
    ],
    totalNilaiBeli: 31500000,
  },
  {
    id: 4,
    jenisSapi: 'Sapi Madura',
    stokAwal: 5,
    satuan: 'Ekor',
    harian: [
      { masuk: 0, keluar: 1 },
      { masuk: 1, keluar: 0 },
      { masuk: 1, keluar: 0 },
      { masuk: 0, keluar: 0 },
      { masuk: 2, keluar: 1 },
      { masuk: 0, keluar: 0 },
      { masuk: 1, keluar: 0 },
    ],
    totalNilaiBeli: 8750000,
  },
  {
    id: 5,
    jenisSapi: 'Sapi Limousin',
    stokAwal: 7,
    satuan: 'Ekor',
    harian: [
      { masuk: 2, keluar: 0 },
      { masuk: 0, keluar: 1 },
      { masuk: 1, keluar: 0 },
      { masuk: 3, keluar: 2 },
      { masuk: 0, keluar: 0 },
      { masuk: 2, keluar: 1 },
      { masuk: 1, keluar: 0 },
    ],
    totalNilaiBeli: 28000000,
  },
];
