import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import PersediaanHasilPotongService from '../../../../../services/persediaanHasilPotongService';
import StokSapiService from '../../../../../services/stokSapiService';

const EditModal = ({ isOpen, onClose, onSuccess, data, type, item }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [boningHeaders, setBoningHeaders] = useState([]);
  const [karkasHeaders, setKarkasHeaders] = useState([]);
  const [boningItems, setBoningItems] = useState([]);
  const [karkasItems, setKarkasItems] = useState([]);
  const [boningDetailsMap, setBoningDetailsMap] = useState({});
  const [karkasDetailsMap, setKarkasDetailsMap] = useState({});
  const [beratKulit, setBeratKulit] = useState('');
  const [tglPotong, setTglPotong] = useState('');
  const [headerGroups, setHeaderGroups] = useState([]);
  const [loadingHeader, setLoadingHeader] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    loadAllData();
  }, [isOpen, type]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      if (type === 'boning') {
        const headersRes = await StokSapiService.getBoningItems();
        if (headersRes.success) {
          const items = headersRes.data || [];
          setBoningItems(items);
          setBoningHeaders(items.map(h => ({ value: h.id, label: h.name, pid: h.pid })));

          const showPromises = items
            .filter(h => h.pid)
            .map(h => StokSapiService.showBoning(h.pid).then(res => ({ h, res })));

          const results = await Promise.all(showPromises);
          const newMap = {};
          results.forEach(({ h, res }) => {
            if (res.success && res.data?.details) {
              newMap[h.id] = res.data.details.map(d => ({ value: d.id, label: d.name }));
            }
          });
          if (Object.keys(newMap).length > 0) {
            setBoningDetailsMap(newMap);
          }
          if (data?.detail?.length > 0) {
            setHeaderGroupsFromData(data);
            setTglPotong(data.tgl_potong || '');
          }
        }
      } else if (type === 'karkas') {
        const headersRes = await StokSapiService.getKarkasItems();
        if (headersRes.success) {
          const items = headersRes.data || [];
          setKarkasItems(items);
          setKarkasHeaders(items.map(h => ({ value: h.id, label: h.name, pid: h.pid })));

          const showPromises = items
            .filter(h => h.pid)
            .map(h => StokSapiService.showKarkas(h.pid).then(res => ({ h, res })));

          const results = await Promise.all(showPromises);
          const newMap = {};
          results.forEach(({ h, res }) => {
            if (res.success && res.data?.details) {
              newMap[h.id] = res.data.details.map(d => ({ value: d.id, label: d.name }));
            }
          });
          if (Object.keys(newMap).length > 0) {
            setKarkasDetailsMap(newMap);
          }
          if (data?.detail?.length > 0) {
            setHeaderGroupsFromData(data);
            setTglPotong(data.tgl_potong || '');
          }
        }
      } else if (type === 'kulit' && data) {
        setBeratKulit(data.detail?.[0]?.berat?.toString() || '');
        setTglPotong(data.tgl_potong || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !data || type === 'kulit') return;

    if (data.detail && data.detail.length > 0) {
      setHeaderGroupsFromData(data);
      setTglPotong(data.tgl_potong || '');
    }
  }, [isOpen, data, type]);

  useEffect(() => {
    if (!isOpen || !data || type !== 'kulit') return;

    if (data.detail && data.detail.length > 0) {
      setBeratKulit(data.detail[0]?.berat?.toString() || '');
    }
    setTglPotong(data.tgl_potong || '');
  }, [isOpen, data, type]);

  const fetchHeaderDetails = useCallback(async (headerId, headerPid, isBoning) => {
    if (!headerPid) return;
    const key = headerId;
    if (isBoning && boningDetailsMap[key]?.length > 0) return;
    if (!isBoning && karkasDetailsMap[key]?.length > 0) return;

    setLoadingHeader(prev => ({ ...prev, [key]: true }));
    try {
      const res = isBoning
        ? await StokSapiService.showBoning(headerPid)
        : await StokSapiService.showKarkas(headerPid);

      if (res.success && res.data?.details) {
        const options = res.data.details.map(d => ({ value: d.id, label: d.name }));
        if (isBoning) {
          setBoningDetailsMap(prev => ({ ...prev, [key]: options }));
        } else {
          setKarkasDetailsMap(prev => ({ ...prev, [key]: options }));
        }
      }
    } finally {
      setLoadingHeader(prev => ({ ...prev, [key]: false }));
    }
  }, [boningDetailsMap, karkasDetailsMap]);

  const setHeaderGroupsFromData = (data) => {
    if (!data.detail || data.detail.length === 0) {
      setHeaderGroups([{ id_header_boning_karkas: '', header_pid: null, detail: [{ id_jenis_boning_karkas: '', berat: '' }] }]);
      return;
    }

    const headerId = data.header?.id;
    const headerItems = type === 'boning' ? boningItems : karkasItems;
    const headerItem = headerId && headerItems.length > 0 ? headerItems.find(h => h.id === headerId) : null;
    const headerPid = headerItem?.pid || null;

    const group = {
      id_header_boning_karkas: headerId || '',
      header_pid: headerPid,
      detail: data.detail.map(d => ({
        id_jenis_boning_karkas: d.id,
        berat: d.berat?.toString() || '',
      })),
    };

    setHeaderGroups([group]);

    if (headerPid) {
      fetchHeaderDetails(headerId, headerPid, type === 'boning');
    }
  };

  const handleKulitSubmit = async () => {
    if (!beratKulit || parseInt(beratKulit) < 1) {
      setError('Berat kulit harus diisi minimal 1');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await PersediaanHasilPotongService.updateKulit({
        pid: item.pid,
        berat_kulit: parseInt(beratKulit),
        tgl_potong: tglPotong || null,
      });
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBoningKarkasSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        pid: item.pid,
        tgl_potong: tglPotong || null,
        header: headerGroups.map(g => ({
          id_header_boning_karkas: parseInt(g.id_header_boning_karkas) || 0,
          detail: g.detail.map(d => ({
            id_jenis_boning_karkas: parseInt(d.id_jenis_boning_karkas) || 0,
            berat: parseInt(d.berat) || 0,
          })),
        })),
      };

      const res = await PersediaanHasilPotongService.update(type, payload);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddGroup = () => {
    setHeaderGroups([
      ...headerGroups,
      { id_header_boning_karkas: '', header_pid: null, detail: [{ id_jenis_boning_karkas: '', berat: '' }] },
    ]);
  };

  const handleRemoveGroup = (groupIndex) => {
    setHeaderGroups(headerGroups.filter((_, i) => i !== groupIndex));
  };

  const handleGroupHeaderChange = (groupIndex, value) => {
    const updated = [...headerGroups];
    updated[groupIndex].id_header_boning_karkas = value;
    updated[groupIndex].detail = [{ id_jenis_boning_karkas: '', berat: '' }];

    if (value) {
      const headers = type === 'boning' ? boningHeaders : karkasHeaders;
      const selectedHeader = headers.find(h => h.value === parseInt(value));
      if (selectedHeader?.pid) {
        updated[groupIndex].header_pid = selectedHeader.pid;
        fetchHeaderDetails(parseInt(value), selectedHeader.pid, type === 'boning');
      }
    } else {
      updated[groupIndex].header_pid = null;
    }

    setHeaderGroups(updated);
  };

  const handleAddDetail = (groupIndex) => {
    const updated = [...headerGroups];
    updated[groupIndex].detail.push({ id_jenis_boning_karkas: '', berat: '' });
    setHeaderGroups(updated);
  };

  const handleRemoveDetail = (groupIndex, detailIndex) => {
    const updated = [...headerGroups];
    updated[groupIndex].detail = updated[groupIndex].detail.filter((_, i) => i !== detailIndex);
    if (updated[groupIndex].detail.length === 0) {
      updated[groupIndex].detail = [{ id_jenis_boning_karkas: '', berat: '' }];
    }
    setHeaderGroups(updated);
  };

  const handleDetailChange = (groupIndex, detailIndex, field, value) => {
    const updated = [...headerGroups];
    updated[groupIndex].detail[detailIndex][field] = value;
    setHeaderGroups(updated);
  };

  const getDetailItems = (headerId) => {
    if (!headerId) return [];
    const key = parseInt(headerId);
    if (type === 'boning') {
      return boningDetailsMap[key] || [];
    } else if (type === 'karkas') {
      return karkasDetailsMap[key] || [];
    }
    return [];
  };

  if (!isOpen) return null;

  const typeLabels = {
    boning: 'Boning',
    karkas: 'Karkas',
    kulit: 'Kulit',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit {typeLabels[type]}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-gray-500">Memuat data...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {type === 'kulit' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Potong
                    </label>
                    <input
                      type="date"
                      value={tglPotong}
                      onChange={(e) => setTglPotong(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Berat Kulit (KG)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={beratKulit}
                      onChange={(e) => setBeratKulit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Masukkan berat kulit"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Header dan detail items untuk {typeLabels[type]}
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Potong
                    </label>
                    <input
                      type="date"
                      value={tglPotong}
                      onChange={(e) => setTglPotong(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  {headerGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Group {groupIndex + 1}</span>
                        {headerGroups.length > 1 && (
                          <button
                            onClick={() => handleRemoveGroup(groupIndex)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Header</label>
                        <select
                          value={group.id_header_boning_karkas}
                          onChange={(e) => handleGroupHeaderChange(groupIndex, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        >
                          <option value="">Pilih Header</option>
                          {type === 'boning' && boningHeaders.map(h => (
                            <option key={h.value} value={h.value}>{h.label}</option>
                          ))}
                          {type === 'karkas' && karkasHeaders.map(h => (
                            <option key={h.value} value={h.value}>{h.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Detail Items</span>
                          <button
                            onClick={() => handleAddDetail(groupIndex)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {group.detail.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex gap-2 items-start">
                            <div className="flex-1 relative">
                              <select
                                value={detail.id_jenis_boning_karkas}
                                onChange={(e) => handleDetailChange(groupIndex, detailIndex, 'id_jenis_boning_karkas', e.target.value)}
                                disabled={!group.id_header_boning_karkas || loadingHeader[group.id_header_boning_karkas]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm disabled:bg-gray-100"
                              >
                                <option value="">
                                  {!group.id_header_boning_karkas
                                    ? 'Pilih header terlebih dahulu'
                                    : loadingHeader[group.id_header_boning_karkas]
                                      ? 'Memuat...'
                                      : 'Pilih Detail'}
                                </option>
                                {getDetailItems(group.id_header_boning_karkas).map(d => (
                                  <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                              </select>
                              {loadingHeader[group.id_header_boning_karkas] && (
                                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                              )}
                            </div>
                            <input
                              type="number"
                              min="1"
                              value={detail.berat}
                              onChange={(e) => handleDetailChange(groupIndex, detailIndex, 'berat', e.target.value)}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                              placeholder="Berat"
                            />
                            {group.detail.length > 1 && (
                              <button
                                onClick={() => handleRemoveDetail(groupIndex, detailIndex)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddGroup}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    + Tambah Group
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={submitting}
          >
            Batal
          </button>
          <button
            onClick={type === 'kulit' ? handleKulitSubmit : handleBoningKarkasSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;