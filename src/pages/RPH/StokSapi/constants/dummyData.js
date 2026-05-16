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

// Stok Detail - Sapi Masuk data (Tab 2, Sub-tab 1)
export const sapiMasukData = [
  {
    id: 1,
    jenisSapi: 'Sapi PO',
    stokAwal: 15,
    satuan: 'Ekor',
    tgl1: 3,
    tgl2: 2,
    tgl3: 5,
    tgl4: 1,
    tgl5: 4,
    tgl6: 2,
    tgl7: 3,
    totalNilaiBeli: 70000000,
  },
  {
    id: 2,
    jenisSapi: 'Sapi Bali',
    stokAwal: 10,
    satuan: 'Ekor',
    tgl1: 2,
    tgl2: 1,
    tgl3: 0,
    tgl4: 3,
    tgl5: 1,
    tgl6: 2,
    tgl7: 0,
    totalNilaiBeli: 25000000,
  },
  {
    id: 3,
    jenisSapi: 'Sapi Brahman',
    stokAwal: 8,
    satuan: 'Ekor',
    tgl1: 1,
    tgl2: 3,
    tgl3: 2,
    tgl4: 0,
    tgl5: 1,
    tgl6: 0,
    tgl7: 2,
    totalNilaiBeli: 31500000,
  },
  {
    id: 4,
    jenisSapi: 'Sapi Madura',
    stokAwal: 5,
    satuan: 'Ekor',
    tgl1: 0,
    tgl2: 1,
    tgl3: 1,
    tgl4: 0,
    tgl5: 2,
    tgl6: 0,
    tgl7: 1,
    totalNilaiBeli: 8750000,
  },
  {
    id: 5,
    jenisSapi: 'Sapi Limousin',
    stokAwal: 7,
    satuan: 'Ekor',
    tgl1: 2,
    tgl2: 0,
    tgl3: 1,
    tgl4: 3,
    tgl5: 0,
    tgl6: 2,
    tgl7: 1,
    totalNilaiBeli: 28000000,
  },
];

// Stok Detail - Sapi Keluar data (Tab 2, Sub-tab 2)
export const sapiKeluarData = [
  {
    id: 1,
    jenisSapi: 'Sapi PO',
    stokAwal: 15,
    satuan: 'Ekor',
    tgl1: 2,
    tgl2: 1,
    tgl3: 3,
    tgl4: 0,
    tgl5: 2,
    tgl6: 1,
    tgl7: 2,
    totalNilaiBeli: 0,
  },
  {
    id: 2,
    jenisSapi: 'Sapi Bali',
    stokAwal: 10,
    satuan: 'Ekor',
    tgl1: 1,
    tgl2: 0,
    tgl3: 2,
    tgl4: 1,
    tgl5: 0,
    tgl6: 1,
    tgl7: 0,
    totalNilaiBeli: 0,
  },
  {
    id: 3,
    jenisSapi: 'Sapi Brahman',
    stokAwal: 8,
    satuan: 'Ekor',
    tgl1: 0,
    tgl2: 2,
    tgl3: 1,
    tgl4: 1,
    tgl5: 0,
    tgl6: 0,
    tgl7: 1,
    totalNilaiBeli: 0,
  },
  {
    id: 4,
    jenisSapi: 'Sapi Madura',
    stokAwal: 5,
    satuan: 'Ekor',
    tgl1: 1,
    tgl2: 0,
    tgl3: 0,
    tgl4: 0,
    tgl5: 1,
    tgl6: 0,
    tgl7: 0,
    totalNilaiBeli: 0,
  },
  {
    id: 5,
    jenisSapi: 'Sapi Limousin',
    stokAwal: 7,
    satuan: 'Ekor',
    tgl1: 0,
    tgl2: 1,
    tgl3: 0,
    tgl4: 2,
    tgl5: 0,
    tgl6: 1,
    tgl7: 0,
    totalNilaiBeli: 0,
  },
];
