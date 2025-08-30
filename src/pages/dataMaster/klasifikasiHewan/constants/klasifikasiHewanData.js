// Data dummy untuk fallback jika API tidak tersedia
const klasifikasiHewanData = [
  {
    pubid: "kh-001-uuid",
    encryptedPid: "kh-001-uuid",
    name: "Sapi Brahman",
    jenis: "Sapi",
    description: "Jenis sapi potong hasil persilangan dengan ketahanan tinggi terhadap panas",

    status: 1
  },
  {
    pubid: "kh-002-uuid",
    encryptedPid: "kh-002-uuid",
    name: "Sapi Limousin",
    jenis: "Sapi",
    description: "Sapi potong dengan warna bulu emas-merah, pertumbuhan cepat",

    status: 1
  },
  {
    pubid: "kh-003-uuid",
    encryptedPid: "kh-003-uuid",
    name: "Sapi Simmental",
    jenis: "Sapi",
    description: "Sapi dwi fungsi untuk daging dan susu dengan produktivitas tinggi",

    status: 1
  },
  {
    pubid: "kh-004-uuid",
    encryptedPid: "kh-004-uuid",
    name: "Domba Garut",
    jenis: "Domba",
    description: "Domba aduan dan pedaging asli Garut dengan postur tubuh besar",

    status: 1
  },
  {
    pubid: "kh-005-uuid",
    encryptedPid: "kh-005-uuid",
    name: "Domba Merino",
    jenis: "Domba",
    description: "Domba penghasil wol berkualitas tinggi dengan adaptasi baik",

    status: 1
  },
  {
    pubid: "kh-006-uuid",
    encryptedPid: "kh-006-uuid",
    name: "Kambing Boer",
    jenis: "Kambing",
    description: "Kambing potong unggul dari Afrika Selatan dengan pertumbuhan cepat",

    status: 1
  },
  {
    pubid: "kh-007-uuid",
    encryptedPid: "kh-007-uuid",
    name: "Kambing Etawa",
    jenis: "Kambing",
    description: "Kambing perah dengan produksi susu tinggi dan kualitas baik",

    status: 1
  },
  {
    pubid: "kh-008-uuid",
    encryptedPid: "kh-008-uuid",
    name: "Kambing Kacang",
    jenis: "Kambing",
    description: "Kambing lokal Indonesia dengan daya adaptasi tinggi",

    status: 1
  }
];

// Konstanta untuk jenis hewan
export const JENIS_HEWAN_OPTIONS = [
  { value: 'all', label: 'Semua Jenis' },
  { value: 'Sapi', label: 'Sapi' },
  { value: 'Domba', label: 'Domba' },
  { value: 'Kambing', label: 'Kambing' }
];

// Konstanta untuk jenis hewan ID mapping
export const JENIS_HEWAN_ID_OPTIONS = [
  { value: 1, label: 'Sapi' },
  { value: 2, label: 'Domba' },
  { value: 3, label: 'Kambing' }
];

// Konstanta untuk status
export const STATUS_OPTIONS = [
  { value: 1, label: 'Aktif' },
  { value: 0, label: 'Tidak Aktif' }
];

// Template untuk form data baru
export const EMPTY_KLASIFIKASI_FORM = {
  name: '',
  id_jenis_hewan: 1,
  jenis: 'Sapi',
  description: '',

  status: 1
};

export default klasifikasiHewanData;