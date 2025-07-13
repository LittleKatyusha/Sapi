import { useState, useMemo, useCallback } from "react";

// Data dummy awal
const initialData = [
  { id: "JH-001", name: "Sapi" },
  { id: "JH-002", name: "Domba" },
  { id: "JH-003", name: "Kambing" },
];

// Custom hook untuk manajemen data, filter, dan statistik Jenis Hewan
const useJenisHewan = () => {
  const [jenisHewan, setJenisHewan] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNama, setFilterNama] = useState("all");

  // Statistik jumlah jenis hewan
  const stats = useMemo(() => ({
    total: jenisHewan.length,
    sapi: jenisHewan.filter(j => j.name.toLowerCase() === "sapi").length,
    domba: jenisHewan.filter(j => j.name.toLowerCase() === "domba").length,
    kambing: jenisHewan.filter(j => j.name.toLowerCase() === "kambing").length,
  }), [jenisHewan]);

  // Filter dan pencarian
  const filteredData = useMemo(() => {
    let data = jenisHewan;
    if (filterNama !== "all") {
      data = data.filter(j => j.name.toLowerCase() === filterNama);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(j =>
        j.name.toLowerCase().includes(term) ||
        j.id.toLowerCase().includes(term)
      );
    }
    return data;
  }, [jenisHewan, filterNama, searchTerm]);

  // Simulasi API call
  const simulateApiCall = (action) => {
    setLoading(true);
    return new Promise(resolve => {
      setTimeout(() => {
        action();
        setLoading(false);
        resolve();
      }, 500);
    });
  };

  const addJenisHewan = useCallback(async (newItemData) => {
    await simulateApiCall(() => {
      const newItem = {
        ...newItemData,
        id: `JH-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      };
      setJenisHewan(prev => [newItem, ...prev]);
    });
  }, []);

  const updateJenisHewan = useCallback(async (updatedItemData) => {
    await simulateApiCall(() => {
      setJenisHewan(prev =>
        prev.map(item => item.id === updatedItemData.id ? updatedItemData : item)
      );
    });
  }, []);

  const deleteJenisHewan = useCallback(async (itemId) => {
    await simulateApiCall(() => {
      setJenisHewan(prev => prev.filter(item => item.id !== itemId));
    });
  }, []);

  return {
    jenisHewan: filteredData,
    loading,
    addJenisHewan,
    updateJenisHewan,
    deleteJenisHewan,
    searchTerm,
    setSearchTerm,
    filterNama,
    setFilterNama,
    stats,
  };
};

export default useJenisHewan;