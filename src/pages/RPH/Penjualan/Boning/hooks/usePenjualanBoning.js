import { useState, useCallback, useRef } from 'react';
import PenjualanBoningService from '../../../../../services/penjualanBoningService';

const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};

const normalizePedagangOptions = (items = []) => items.map((item) => ({
  id: Number(item.id),
  pid: item.pid,
  id_pedagang: item.id_pedagang,
  nama_alias: item.nama_alias,
  nama_identitas: item.nama_identitas,
  saldo_awal: Number(item.saldo_awal || 0),
  tabungan: Number(item.tabungan || 0),
  kulit: Number(item.kulit || 0),
  saldo_beku: Number(item.saldo_beku || 0),
  saldo_keseluruhan: Number(item.saldo_keseluruhan ?? ((item.saldo_awal || 0) + (item.tabungan || 0) + (item.kulit || 0))),
  saldo_akhir: Number(item.saldo_akhir ?? ((item.saldo_awal || 0) + (item.tabungan || 0) + (item.kulit || 0) - (item.saldo_beku || 0))),
  limit_kredit: Number(item.limit_kredit || 0),
  label: item.label || `${item.nama_alias || item.nama_identitas || '-'} - ${item.id_pedagang || '-'}`,
}));

const normalizeBankOptions = (items = []) => items.map((item) => ({
  id: Number(item.id),
  label: item.label || item.display_name || `${item.nama || '-'}${item.kode ? ` (${item.kode})` : ''}`,
  nama: item.nama,
  kode: item.kode,
}));

const normalizePengirimOptions = (items = []) => items.map((item) => ({
  id: Number(item.id),
  label: item.label || `${item.nama || '-'}${item.no_hp ? ` - ${item.no_hp}` : ''}`,
  nama: item.nama,
  no_hp: item.no_hp,
}));

const normalizeKendaraanOptions = (items = []) => items.map((item) => ({
  id: Number(item.id),
  label: item.label || `${item.jenis_kendaraan || '-'} - ${item.plat_nomor || '-'}`,
  jenis_kendaraan: item.jenis_kendaraan,
  plat_nomor: item.plat_nomor,
}));

const normalizeItemPotongOptions = (items = []) => items.map((item) => ({
  id_item_potong: Number(item.id),
  nama_item: item.name || item.nama_item || '-',
  id_jenis_potong: Number(item.id_jenis_potong || 0),
  stok_tersedia: Number(item.stok_tersedia || 0),
  label: `${item.name || item.nama_item || '-'}${item.jenis_potong ? ` - ${item.jenis_potong}` : ''}${item.stok_tersedia !== undefined ? ` - Stok: ${Math.round(Number(item.stok_tersedia || 0))} Kg` : ''}`,
}));

const usePenjualanBoning = () => {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [serverPagination, setServerPagination] = useState({
    currentPage: 1, totalPages: 1, totalItems: 0, perPage: 10,
  });
  const [pedagangList, setPedagangList] = useState([]);
  const [boningItems, setBoningItems] = useState([]);
  const [itemPotongOptions, setItemPotongOptions] = useState([]);
  const [bankOptions, setBankOptions] = useState([]);
  const [pengirimOptions, setPengirimOptions] = useState([]);
  const [kendaraanOptions, setKendaraanOptions] = useState([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const drawRef = useRef(1);
  const user = getCurrentUser();
  const idOffice = user?.id_office;

  const fetchData = useCallback(async (page = 1, perPage = 10, search = '', startDate = '', endDate = '') => {
    setLoading(true);
    setError(null);
    drawRef.current += 1;
    try {
      const res = await PenjualanBoningService.getData({
        draw: drawRef.current,
        start: (page - 1) * perPage,
        length: perPage,
        search,
        startDate,
        endDate,
        idOffice,
      });
      if (res.success) {
        setDataList(res.data);
        const total = res.recordsFiltered || res.recordsTotal || 0;
        setServerPagination({
          currentPage: page,
          perPage,
          totalItems: total,
          totalPages: Math.ceil(total / perPage) || 1,
        });
      } else {
        setError(res.message || 'Gagal memuat data');
      }
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [idOffice]);

  const fetchMasterData = useCallback(async () => {
    setMasterLoading(true);
    try {
      const [masterRes, pedagangRes] = await Promise.all([
        PenjualanBoningService.getMasterData(idOffice),
        PenjualanBoningService.getPedagang(idOffice),
      ]);
      const pedagangFromMasterData = normalizePedagangOptions(masterRes.data?.pedagang || []);
      const pedagangFromEndpoint = normalizePedagangOptions(pedagangRes.data || []);

      if (masterRes.success) {
        const data = masterRes.data || {};
        setBoningItems(data.boning_items || []);
        setBankOptions(normalizeBankOptions(data.banks || []));
        setPengirimOptions(normalizePengirimOptions(data.pengirim || []));
        setKendaraanOptions(normalizeKendaraanOptions(data.kendaraan || []));
        setItemPotongOptions(normalizeItemPotongOptions(data.item_potong || []));
      }

      if (!(masterRes.data?.boning_items || []).length) {
        const boningRes = await PenjualanBoningService.getBoning(idOffice);
        if (boningRes.success) {
          setBoningItems(boningRes.data || []);
        }
      }

      let resolvedPedagang = pedagangFromEndpoint.length
        ? pedagangFromEndpoint
        : pedagangFromMasterData;

      if (!resolvedPedagang.length) {
        const masterPedagangRes = await PenjualanBoningService.getMasterPedagang({
          draw: 1,
          start: 0,
          length: 1000,
          orderColumn: 0,
          orderDir: 'asc',
        });

        if (masterPedagangRes.success) {
          resolvedPedagang = normalizePedagangOptions(
            (masterPedagangRes.data || []).map((item) => ({
              id: item.id,
              pid: item.pid,
              id_pedagang: item.id_pedagang,
              nama_alias: item.nama_alias,
              nama_identitas: item.nama_identitas,
              saldo_awal: item.saldo_awal,
              tabungan: item.tabungan,
              kulit: item.kulit,
              saldo_beku: item.saldo_beku,
              saldo_keseluruhan: item.saldo_keseluruhan,
              saldo_akhir: item.saldo_akhir,
              limit_kredit: item.limit_kredit,
            }))
          );
        }
      }

      if (!normalizeItemPotongOptions(masterRes.data?.item_potong || []).length && typeof PenjualanBoningService.getMasterItemPotong === 'function') {
        const itemPotongRes = await PenjualanBoningService.getMasterItemPotong({ draw: 1, start: 0, length: 1000 });
        if (itemPotongRes.success) {
          setItemPotongOptions(normalizeItemPotongOptions(itemPotongRes.data || []));
        }
      }

      if (!normalizeBankOptions(masterRes.data?.banks || []).length) {
        const bankRes = await PenjualanBoningService.getMasterBanks({ draw: 1, start: 0, length: 1000 });
        if (bankRes.success) {
          setBankOptions(normalizeBankOptions(bankRes.data || []));
        }
      }

      if (!normalizePengirimOptions(masterRes.data?.pengirim || []).length) {
        const pengirimRes = await PenjualanBoningService.getMasterPengirim({ draw: 1, start: 0, length: 1000 });
        if (pengirimRes.success) {
          setPengirimOptions(normalizePengirimOptions(pengirimRes.data || []));
        }
      }

      if (!normalizeKendaraanOptions(masterRes.data?.kendaraan || []).length) {
        const kendaraanRes = await PenjualanBoningService.getMasterKendaraan({ draw: 1, start: 0, length: 1000 });
        if (kendaraanRes.success) {
          setKendaraanOptions(normalizeKendaraanOptions(kendaraanRes.data || []));
        }
      }

      setPedagangList(resolvedPedagang);

      return {
        success: masterRes.success || pedagangRes.success,
        data: {
          ...(masterRes.data || {}),
          pedagang: resolvedPedagang,
        },
        message: masterRes.message || pedagangRes.message,
      };
    } finally {
      setMasterLoading(false);
    }
  }, [idOffice]);

  const fetchHarga = useCallback(async (payload) => {
    return PenjualanBoningService.getHarga(payload);
  }, []);

  const fetchPedagangHarga = useCallback(async (pid) => {
    if (typeof PenjualanBoningService.getPedagangHarga !== 'function') {
      return {
        success: false,
        data: null,
        message: 'Service daftar harga pedagang belum tersedia',
      };
    }

    return PenjualanBoningService.getPedagangHarga(pid);
  }, []);

  const show = useCallback(async (pid) => {
    return PenjualanBoningService.show(pid);
  }, []);

  const store = useCallback(async (payload) => {
    setCreateLoading(true);
    try {
      return await PenjualanBoningService.store(payload);
    } finally {
      setCreateLoading(false);
    }
  }, []);

  const update = useCallback(async (payload) => {
    setUpdateLoading(true);
    try {
      return await PenjualanBoningService.update(payload);
    } finally {
      setUpdateLoading(false);
    }
  }, []);

  const hapus = useCallback(async (pid) => {
    setDeleteLoading(true);
    try {
      return await PenjualanBoningService.hapus(pid);
    } finally {
      setDeleteLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((page) => {
    fetchData(page, serverPagination.perPage, searchTerm, dateRange.startDate, dateRange.endDate);
  }, [fetchData, serverPagination.perPage, searchTerm, dateRange]);

  const handlePerPageChange = useCallback((perPage) => {
    fetchData(1, perPage, searchTerm, dateRange.startDate, dateRange.endDate);
  }, [fetchData, searchTerm, dateRange]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    fetchData(1, serverPagination.perPage, term, dateRange.startDate, dateRange.endDate);
  }, [fetchData, serverPagination.perPage, dateRange]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    fetchData(1, serverPagination.perPage, '', dateRange.startDate, dateRange.endDate);
  }, [fetchData, serverPagination.perPage, dateRange]);

  const handleDateRange = useCallback((range) => {
    setDateRange(range);
    fetchData(1, serverPagination.perPage, searchTerm, range.startDate, range.endDate);
  }, [fetchData, serverPagination.perPage, searchTerm]);

  const clearDateRange = useCallback(() => {
    setDateRange({ startDate: '', endDate: '' });
    fetchData(1, serverPagination.perPage, searchTerm, '', '');
  }, [fetchData, serverPagination.perPage, searchTerm]);

  const refresh = useCallback(() => {
    fetchData(serverPagination.currentPage, serverPagination.perPage, searchTerm, dateRange.startDate, dateRange.endDate);
  }, [fetchData, serverPagination, searchTerm, dateRange]);

  return {
    dataList, loading, error,
    searchTerm, dateRange, serverPagination,
    pedagangList, boningItems, itemPotongOptions, bankOptions, pengirimOptions, kendaraanOptions,
    masterLoading, createLoading, updateLoading, deleteLoading,
    fetchData, fetchMasterData, fetchHarga, fetchPedagangHarga,
    show, store, update, hapus,
    handlePageChange, handlePerPageChange,
    handleSearch, clearSearch,
    handleDateRange, clearDateRange,
    refresh, idOffice,
  };
};

export default usePenjualanBoning;
