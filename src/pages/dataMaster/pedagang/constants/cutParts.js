/**
 * Cut Parts Constants
 * Defines the 27 meat cut parts used in pedagang transactions and pricing
 */

export const CUT_PARTS = [
  { key: 'karkas', label: 'Karkas' },
  { key: 'daging', label: 'Daging' },
  { key: 'has', label: 'Has' },
  { key: 'iga', label: 'Iga' },
  { key: 'kaki', label: 'Kaki' },
  { key: 'oval', label: 'Oval' },
  { key: 'sop', label: 'Sop' },
  { key: 'tetelan', label: 'Tetelan' },
  { key: 'urat', label: 'Urat' },
  { key: 'tenderloin', label: 'Tenderloin' },
  { key: 'sirloin', label: 'Sirloin' },
  { key: 'paha_belakang', label: 'Paha Belakang' },
  { key: 'punggung', label: 'Punggung' },
  { key: 'sampil', label: 'Sampil' },
  { key: 'sancan_belakang', label: 'Sancan Belakang' },
  { key: 'sancan_depan', label: 'Sancan Depan' },
  { key: 'sandung_lamur', label: 'Sandung Lamur' },
  { key: 'sengkel', label: 'Sengkel' },
  { key: 'babat', label: 'Babat' },
  { key: 'buntut', label: 'Buntut' },
  { key: 'idung', label: 'Idung' },
  { key: 'kepala', label: 'Kepala' },
  { key: 'kulit', label: 'Kulit' },
  { key: 'lidah', label: 'Lidah' },
  { key: 'otak', label: 'Otak' },
  { key: 'tulang', label: 'Tulang' },
  { key: 'usus', label: 'Usus' },
];

/**
 * Build an empty harga object with all fields set to null/empty
 */
export const getEmptyHarga = () => {
  const harga = {};
  CUT_PARTS.forEach(({ key }) => {
    harga[key] = '';
  });
  return harga;
};

/**
 * Build an empty qty object for transaksi with all fields set to 0
 */
export const getEmptyQty = () => {
  const qty = {};
  CUT_PARTS.forEach(({ key }) => {
    qty[`qty_${key}`] = 0;
  });
  qty.ekor_karkas = 0;
  return qty;
};
