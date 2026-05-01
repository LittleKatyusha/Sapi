import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import WilayahService from '../../../../services/wilayahService';

const useWilayah = (initialValues = {}) => {
  // State for each level
  const [provinsiList, setProvinsiList] = useState([]);
  const [kabupatenList, setKabupatenList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [kelurahanList, setKelurahanList] = useState([]);

  const [loadingProvinsi, setLoadingProvinsi] = useState(false);
  const [loadingKabupaten, setLoadingKabupaten] = useState(false);
  const [loadingKecamatan, setLoadingKecamatan] = useState(false);
  const [loadingKelurahan, setLoadingKelurahan] = useState(false);

  // Track previous values to detect actual changes
  const prevValues = useRef({ provinsi: null, kabupaten: null, kecamatan: null });

  // Fetch provinsi on mount
  useEffect(() => {
    const fetchProvinsi = async () => {
      setLoadingProvinsi(true);
      const result = await WilayahService.getProvinsi();
      if (result.success) {
        setProvinsiList(result.data || []);
      }
      setLoadingProvinsi(false);
    };
    fetchProvinsi();
  }, []);

  // Fetch kabupaten by provinsi
  const fetchKabupaten = useCallback(async (idProvinsi) => {
    if (!idProvinsi) {
      setKabupatenList([]);
      return;
    }
    setLoadingKabupaten(true);
    const result = await WilayahService.getKabupaten(idProvinsi);
    if (result.success) {
      setKabupatenList(result.data || []);
    }
    setLoadingKabupaten(false);
  }, []);

  // Fetch kecamatan by kabupaten
  const fetchKecamatan = useCallback(async (idKabupaten) => {
    if (!idKabupaten) {
      setKecamatanList([]);
      return;
    }
    setLoadingKecamatan(true);
    const result = await WilayahService.getKecamatan(idKabupaten);
    if (result.success) {
      setKecamatanList(result.data || []);
    }
    setLoadingKecamatan(false);
  }, []);

  // Fetch kelurahan by kecamatan
  const fetchKelurahan = useCallback(async (idKecamatan) => {
    if (!idKecamatan) {
      setKelurahanList([]);
      return;
    }
    setLoadingKelurahan(true);
    const result = await WilayahService.getKelurahan(idKecamatan);
    if (result.success) {
      setKelurahanList(result.data || []);
    }
    setLoadingKelurahan(false);
  }, []);

  // Auto-load children when initial values are provided (for edit pages)
  useEffect(() => {
    const currentProvinsi = initialValues.id_provinsi;
    if (currentProvinsi && prevValues.current.provinsi !== currentProvinsi) {
      prevValues.current.provinsi = currentProvinsi;
      fetchKabupaten(currentProvinsi);
    }
  }, [initialValues.id_provinsi, fetchKabupaten]);

  useEffect(() => {
    const currentKabupaten = initialValues.id_kabupaten;
    if (currentKabupaten && prevValues.current.kabupaten !== currentKabupaten) {
      prevValues.current.kabupaten = currentKabupaten;
      fetchKecamatan(currentKabupaten);
    }
  }, [initialValues.id_kabupaten, fetchKecamatan]);

  useEffect(() => {
    const currentKecamatan = initialValues.id_kecamatan;
    if (currentKecamatan && prevValues.current.kecamatan !== currentKecamatan) {
      prevValues.current.kecamatan = currentKecamatan;
      fetchKelurahan(currentKecamatan);
    }
  }, [initialValues.id_kecamatan, fetchKelurahan]);

  // Transform to { value, label } options for SearchableSelect
  const provinsiOptions = useMemo(() =>
    provinsiList.map(item => ({ value: Number(item.id_provinsi), label: item.nama })),
    [provinsiList]
  );

  const kabupatenOptions = useMemo(() =>
    kabupatenList.map(item => ({ value: Number(item.id_kabupaten), label: item.nama })),
    [kabupatenList]
  );

  const kecamatanOptions = useMemo(() =>
    kecamatanList.map(item => ({ value: Number(item.id_kecamatan), label: item.nama })),
    [kecamatanList]
  );

  const kelurahanOptions = useMemo(() =>
    kelurahanList.map(item => ({ value: item.id_kelurahan != null ? String(item.id_kelurahan) : '', label: item.nama })),
    [kelurahanList]
  );

  return {
    provinsiOptions,
    kabupatenOptions,
    kecamatanOptions,
    kelurahanOptions,
    loadingProvinsi,
    loadingKabupaten,
    loadingKecamatan,
    loadingKelurahan,
    fetchKabupaten,
    fetchKecamatan,
    fetchKelurahan,
  };
};

export default useWilayah;
