import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calculator,
  Layers,
  FileText,
  Scale,
  TrendingUp,
  BarChart3,
  Settings,
  Calendar,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';

const MENU_SHORTCUTS = [
  { name: 'Chart of Accounts (COA)', path: '/akuntansi/coa', icon: Layers, desc: 'Master daftar rekening dan struktur akun' },
  { name: 'Jurnal Umum', path: '/akuntansi/jurnal', icon: FileText, desc: 'Pencatatan dan posting jurnal memorial/operasional' },
  { name: 'Buku Besar', path: '/akuntansi/buku-besar', icon: BookOpen, desc: 'Kartu mutasi detail per akun dan saldo berjalan' },
  { name: 'Neraca Saldo', path: '/akuntansi/neraca-saldo', icon: Scale, desc: 'Pengecekan keseimbangan debit dan kredit' },
  { name: 'Laporan Laba Rugi', path: '/akuntansi/laba-rugi', icon: TrendingUp, desc: 'Kinerja pendapatan dan beban operasional' },
  { name: 'Laporan Neraca', path: '/akuntansi/neraca', icon: BarChart3, desc: 'Posisi aset, kewajiban, dan ekuitas' },
  { name: 'Pengaturan Akunting', path: '/akuntansi/setting', icon: Settings, desc: 'Konfigurasi entitas dan pemetaan akun' },
  { name: 'Periode Akunting', path: '/akuntansi/periode', icon: Calendar, desc: 'Pembukaan dan penutupan buku bulanan' },
];

const SECTIONS = [
  { id: 'all', label: 'Semua Panduan' },
  { id: 'workflow', label: '1. Alur & Siklus' },
  { id: 'coa', label: '2. COA' },
  { id: 'journal', label: '3. Jurnal Umum' },
  { id: 'ledger', label: '4. Buku Besar & Neraca Saldo' },
  { id: 'reports', label: '5. Laporan Keuangan' },
  { id: 'setup', label: '6. Pengaturan & Periode' },
  { id: 'faq', label: '7. FAQ & Solusi' },
];

export default function AccountingGuidePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState({});

  const toggleFaq = (index) => {
    setExpandedFaq((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const isVisible = (tabId) => activeTab === 'all' || activeTab === tabId;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-200 border border-emerald-400/30 mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Dokumentasi & Panduan Resmi
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Petunjuk Penggunaan Modul Akuntansi
          </h1>
          <p className="mt-2 text-sm md:text-base text-emerald-100/90 leading-relaxed">
            Panduan lengkap tata cara pembukuan, master Chart of Accounts (COA), siklus jurnal umum, buku besar, neraca saldo, hingga pelaporan laba rugi dan neraca keuangan di sistem TernaSys.
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Akses Cepat Sub-Modul Akuntansi
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MENU_SHORTCUTS.map((menu) => {
            const Icon = menu.icon;
            return (
              <button
                key={menu.path}
                type="button"
                onClick={() => navigate(menu.path)}
                className="group flex flex-col justify-between p-4 rounded-xl border border-gray-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">
                    {menu.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {menu.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap gap-1.5 pt-2">
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveTab(sec.id)}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeTab === sec.id
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section 1: Workflow */}
      {isVisible('workflow') && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">1. Alur & Siklus Kerja Akuntansi TernaSys</h2>
              <p className="text-xs text-gray-500">Urutan proses standar dari pembukaan periode hingga pelaporan keuangan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
              <div>
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">Langkah 1</span>
                <h3 className="font-semibold text-gray-900 text-sm mt-2">Buka Periode Akuntansi</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Pastikan entitas (HO/RPH/Feedmill) memiliki periode bulan berjalan dengan status <b className="text-emerald-700">OPEN</b>. Tanpa periode buka, posting jurnal akan ditolak.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200">
                <span className="text-[11px] font-medium text-emerald-700">Menu: Periode Akunting</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
              <div>
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">Langkah 2</span>
                <h3 className="font-semibold text-gray-900 text-sm mt-2">Master COA & Pemetaan</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Susun rekening di <b>COA</b> dan pastikan pemetaan akun operasional (kas, piutang, hutang, omset, persediaan) terhubung di <b>Pengaturan Akunting</b>.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200">
                <span className="text-[11px] font-medium text-emerald-700">Menu: COA & Pengaturan</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
              <div>
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">Langkah 3</span>
                <h3 className="font-semibold text-gray-900 text-sm mt-2">Pencatatan & Posting Jurnal</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Transaksi operasional (penjualan, pembelian, kasir) memicu jurnal otomatis. Jurnal non-operasional diinput manual lalu di-<b>POST</b>.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200">
                <span className="text-[11px] font-medium text-emerald-700">Menu: Jurnal Umum</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
              <div>
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">Langkah 4</span>
                <h3 className="font-semibold text-gray-900 text-sm mt-2">Verifikasi & Laporan</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Verifikasi keseimbangan di <b>Neraca Saldo</b> dan mutasi di <b>Buku Besar</b>. Laporan <b>Laba Rugi</b> dan <b>Neraca</b> tersaji secara realtime.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200">
                <span className="text-[11px] font-medium text-emerald-700">Menu: Laporan Keuangan</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs md:text-sm text-emerald-900 flex items-start gap-3 mt-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Prinsip Multi-Entitas TernaSys:</p>
              <p className="mt-0.5 text-emerald-800">
                Setiap entitas (HO, RPH Depok, RPH Tapos, RPH Bekasi, dan Feedmill) memiliki pembukuan dan buku besar independen. Selalu pilih entitas yang tepat pada filter halaman.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Section 2: COA */}
      {isVisible('coa') && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">2. Petunjuk Chart of Accounts (COA)</h2>
              <p className="text-xs text-gray-500">Struktur rekening, aturan saldo normal, dan pembedaan akun posting.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Klasifikasi Akun & Saldo Normal
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="p-2 border-b">Kode Kepala</th>
                      <th className="p-2 border-b">Tipe Akun</th>
                      <th className="p-2 border-b">Saldo Normal</th>
                      <th className="p-2 border-b">Contoh Rekening</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="p-2 font-mono font-bold text-gray-800">1xxx</td>
                      <td className="p-2 font-medium">Aset (Harta)</td>
                      <td className="p-2 text-emerald-700 font-semibold">Debit (D)</td>
                      <td className="p-2 text-gray-500">Kas, Bank, Piutang, Persediaan Hewan</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-gray-800">2xxx</td>
                      <td className="p-2 font-medium">Kewajiban (Hutang)</td>
                      <td className="p-2 text-blue-700 font-semibold">Kredit (K)</td>
                      <td className="p-2 text-gray-500">Hutang Vendor, Hutang Operasional</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-gray-800">3xxx</td>
                      <td className="p-2 font-medium">Ekuitas (Modal)</td>
                      <td className="p-2 text-blue-700 font-semibold">Kredit (K)</td>
                      <td className="p-2 text-gray-500">Modal Disetor, Laba Ditahan</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-gray-800">4xxx</td>
                      <td className="p-2 font-medium">Pendapatan</td>
                      <td className="p-2 text-blue-700 font-semibold">Kredit (K)</td>
                      <td className="p-2 text-gray-500">Penjualan Karkas, Penjualan Sapi, Jasa</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-gray-800">5xxx</td>
                      <td className="p-2 font-medium">HPP (Beban Pokok)</td>
                      <td className="p-2 text-emerald-700 font-semibold">Debit (D)</td>
                      <td className="p-2 text-gray-500">HPP Sapi, HPP Pakan, Biaya Potong</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-gray-800">6xxx</td>
                      <td className="p-2 font-medium">Beban Operasional</td>
                      <td className="p-2 text-emerald-700 font-semibold">Debit (D)</td>
                      <td className="p-2 text-gray-500">Beban Gaji, Listrik, Angkut, Pemeliharaan</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ketentuan Header vs Akun Posting
              </h3>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-gray-900 block text-sm">Akun Header (Induk):</span>
                  <p className="text-gray-600 mt-0.5">
                    Centang <b>"Akun Posting" dikosongkan</b>. Berfungsi murni sebagai pengelompokan hierarki (contoh: <code>1000 - Aset Lancar</code>). Akun header tidak dapat dipilih saat membuat jurnal.
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-900 block text-sm">Akun Posting (Anak / Transaksi):</span>
                  <p className="text-gray-600 mt-0.5">
                    Centang <b className="text-emerald-700">"Akun Posting" aktif</b>. Memiliki induk ke akun header (contoh: <code>1010 - Kas Operasional</code>). Akun inilah yang menyimpan saldo riil dan dipilih di jurnal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Journal */}
      {isVisible('journal') && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">3. Petunjuk Jurnal Umum & Siklus Posting</h2>
              <p className="text-xs text-gray-500">Mekanisme input transaksi, validasi keseimbangan debit-kredit, dan aturan immutable.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                <span className="font-bold text-yellow-800 text-sm block">1. Draft</span>
                <p className="text-yellow-700 mt-1">
                  Jurnal tersimpan sementara. Masih dapat diedit nilai barisnya atau dihapus. Belum masuk buku besar.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                <span className="font-bold text-blue-800 text-sm block">2. Submitted</span>
                <p className="text-blue-700 mt-1">
                  Diajukan untuk review akuntan / internal control. Menunggu persetujuan posting.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                <span className="font-bold text-emerald-800 text-sm block">3. Posted</span>
                <p className="text-emerald-700 mt-1">
                  Resmi dibukukan ke Buku Besar. <b>Bersifat permanen (immutable)</b> dan tidak dapat diubah langsung.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                <span className="font-bold text-red-800 text-sm block">4. Void</span>
                <p className="text-red-700 mt-1">
                  Pembatalan jurnal posted. Sistem otomatis menciptakan jurnal pembalik (reversing entry) demi audit trail.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-xs md:text-sm text-gray-700">
              <h4 className="font-bold text-gray-900">Aturan Penting Pengisian Jurnal:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><b>Keseimbangan (Balance):</b> Total Debit harus sama persis dengan Total Kredit (selisih nol).</li>
                <li><b>Validasi Periode:</b> Tanggal transaksi wajib masuk dalam periode yang berstatus <b>OPEN</b>.</li>
                <li><b>Akun Posting:</b> Hanya akun yang berstatus <code>is_posting = true</code> yang dapat dipilih.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Section 4: Ledger & Trial Balance */}
      {isVisible('ledger') && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">4. Buku Besar & Neraca Saldo</h2>
              <p className="text-xs text-gray-500">Penelusuran mutasi akun, riwayat transaksi, dan verifikasi keseimbangan saldo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">Buku Besar (General Ledger)</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Kartu kendali untuk melihat riwayat mutasi satu rekening tertentu dalam rentang waktu yang dipilih:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <li>Pilih <b>Entitas</b> (HO atau RPH cabang).</li>
                <li>Pilih <b>Akun</b> (misal: Kas, Hutang Vendor).</li>
                <li>Tentukan rentang tanggal transaksi.</li>
                <li>Lihat saldo awal, mutasi debit/kredit, serta running balance.</li>
                <li>Gunakan tombol <b>Ekspor Excel</b> untuk kebutuhan rekonsiliasi audit.</li>
              </ol>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">Neraca Saldo (Trial Balance)</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Menyajikan ringkasan seluruh akun sekaligus beserta total saldo debit dan kreditnya:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <li>Periksa baris <b>Total</b> pada bagian paling bawah tabel.</li>
                <li>Nilai <b>Total Debit</b> harus sama persis dengan <b>Total Kredit</b>.</li>
                <li>Jika terjadi selisih, telusuri jurnal yang belum seimbang atau transaksi draft.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Section 5: Reports */}
      {isVisible('reports') && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">5. Laporan Keuangan (Laba Rugi & Neraca)</h2>
              <p className="text-xs text-gray-500">Standar pelaporan kinerja operasional dan posisi kekayaan perusahaan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/50 space-y-3">
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                Laporan Laba Rugi (Income Statement)
              </h3>
              <div className="rounded-lg bg-white p-3 border border-emerald-200 text-xs font-mono space-y-1 text-gray-800">
                <div className="flex justify-between"><span>Pendapatan Penjualan</span><span>(+)</span></div>
                <div className="flex justify-between text-red-600"><span>HPP (Harga Pokok Penjualan)</span><span>(-)</span></div>
                <div className="flex justify-between border-t border-gray-200 font-bold pt-1 text-emerald-800"><span>= Laba Kotor (Gross Profit)</span><span></span></div>
                <div className="flex justify-between text-red-600"><span>Beban Operasional & Administrasi</span><span>(-)</span></div>
                <div className="flex justify-between border-t-2 border-emerald-500 font-bold pt-1 text-emerald-900"><span>= Laba / Rugi Bersih (Net Income)</span><span></span></div>
              </div>
            </div>

            <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/50 space-y-3">
              <h3 className="font-bold text-blue-950 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-700" />
                Laporan Neraca (Balance Sheet)
              </h3>
              <div className="rounded-lg bg-white p-3 border border-blue-200 text-xs font-mono space-y-1 text-gray-800">
                <div className="flex justify-between font-bold text-blue-800"><span>Total Aset (Harta Lancar & Tetap)</span><span>[A]</span></div>
                <div className="flex justify-between"><span>Total Kewajiban (Hutang)</span><span>[K]</span></div>
                <div className="flex justify-between"><span>Total Ekuitas (Modal & Laba Ditahan)</span><span>[E]</span></div>
                <div className="flex justify-between border-t-2 border-blue-500 font-bold pt-1 text-blue-900"><span>Keseimbangan: Aset = Kewajiban + Ekuitas</span><span>[A = K + E]</span></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 6: Setup & Period */}
      {isVisible('setup') && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">6. Pengaturan Akunting & Periode Akunting</h2>
              <p className="text-xs text-gray-500">Konfigurasi entitas, pemetaan akun otomatis, serta aturan buka-tutup periode.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs md:text-sm text-gray-700">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-700" />
                Pengaturan Entitas & Pemetaan Akun (Mapping)
              </h4>
              <p className="text-gray-600">
                Agar modul operasional (penjualan karkas, pembelian pakan, atau kasir pembayaran) menerbitkan jurnal otomatis, pemetaan akun wajib terkonfigurasi:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 font-mono text-xs">
                <li><code>PENJUALAN_PENDAPATAN</code>: Akun omset penjualan karkas/sapi.</li>
                <li><code>PENJUALAN_PIUTANG</code> / <code>PIUTANG_PEDAGANG</code>: Akun piutang tempo pembeli.</li>
                <li><code>PEMBELIAN_PERSEDIAAN</code>: Akun persediaan hewan / konsentrat.</li>
                <li><code>HUTANG_VENDOR</code>: Akun kewajiban bayar ke pemasok.</li>
                <li><code>KAS</code> & <code>BANK</code>: Rekening penampung pelunasan.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-700" />
                Siklus Periode Akunting
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-600 text-xs">
                <li><b>Awal Bulan:</b> Masuk menu <b>Periode Akunting</b>, pilih entitas, masukkan Tahun dan Bulan, lalu klik <b>Tambah Periode</b>.</li>
                <li><b>Status Open:</b> Jurnal hanya dapat di-post saat status periode adalah <b>OPEN</b>.</li>
                <li><b>Tutup Buku:</b> Setelah audit dan rekonsiliasi kas/bank selesai, ubah status menjadi <b>CLOSED</b>.</li>
                <li><b>Buka Kembali (Reopen):</b> Hanya periode terakhir yang berstatus CLOSED yang dapat dibuka kembali.</li>
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* Section 7: FAQ */}
      {isVisible('faq') && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">7. Tanya Jawab & Masalah Umum (FAQ)</h2>
              <p className="text-xs text-gray-500">Solusi cepat kendala operasional yang sering ditemui.</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              {
                q: 'Muncul pesan: "Periode akuntansi untuk tanggal jurnal belum dibuat". Mengapa?',
                a: 'Sistem mewajibkan adanya periode akuntansi aktif (OPEN) untuk setiap tanggal transaksi. Solusinya: Buka menu "Periode Akunting" di sidebar, pilih entitas Anda, buat periode untuk bulan dan tahun bersangkutan dengan status OPEN.',
              },
              {
                q: 'Bagaimana cara merevisi nominal jurnal yang salah bila statusnya sudah "Posted"?',
                a: 'Jurnal posted bersifat immutable (terkunci) demi kepatuhan jejak audit. Solusinya: Klik tombol "Void" pada jurnal tersebut untuk membuat jurnal pembalik, lalu buat jurnal baru dengan nilai yang benar.',
              },
              {
                q: 'Mengapa rekening baru di COA tidak bisa dipilih saat input Jurnal Umum?',
                a: 'Hanya rekening dengan opsi "Akun Posting" yang dicentang yang bisa dipilih di baris jurnal. Rekening tanpa centang posting berfungsi sebagai Header (kategori induk).',
              },
              {
                q: 'Mengapa laporan keuangan cabang RPH saya kosong?',
                a: 'Pastikan filter Entitas di atas halaman laporan telah diarahkan ke nama RPH bersangkutan (misal: RPH DEPOK / RPH TAPOS / RPH BEKASI), serta rentang tanggal sudah mencakup tanggal transaksi.',
              },
              {
                q: 'Kapan transaksi harian penjualan/pembelian otomatis masuk ke jurnal?',
                a: 'Jurnal otomatis tercipta saat transaksi operasional diselesaikan atau disetujui, selama pemetaan akun sudah terisi dan periode akuntansi bulan tersebut berstatus OPEN.',
              },
            ].map((item, idx) => {
              const isOpen = !!expandedFaq[idx];
              return (
                <div key={idx} className="rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 text-xs md:text-sm flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      {item.q}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white border-t border-gray-200 text-xs md:text-sm text-gray-600 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer Support Banner */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-emerald-600 text-white shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Butuh Konsultasi Pembukuan Lanjutan?</h4>
            <p className="text-xs text-gray-600">
              Hubungi Super Administrator atau Finance Internal Control TernaSys untuk bantuan teknis dan audit.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/akuntansi/coa')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs md:text-sm shadow-sm transition-all"
        >
          Buka Chart of Accounts
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
