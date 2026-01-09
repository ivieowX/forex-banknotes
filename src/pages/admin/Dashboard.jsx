import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Plus,
  LogOut,
  Banknote,
  Search,
  Home,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  Globe2,
  Image,
  Loader2,
  AlertCircle,
  Edit3,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  Menu,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function Dashboard() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
  const [selectedImages, setSelectedImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();

  // Show toast notification
  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Image modal functions
  const openImageModal = useCallback((images) => {
    setSelectedImages(images);
    setCurrentImageIndex(0);
  }, []);

  const closeImageModal = useCallback(() => {
    setSelectedImages(null);
    setCurrentImageIndex(0);
  }, []);

  const nextImage = useCallback(() => {
    if (selectedImages && currentImageIndex < selectedImages.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  }, [currentImageIndex, selectedImages]);

  const prevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  }, [currentImageIndex]);

  const fetchCurrencies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("currencies")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });

    if (data) {
      const processed = data.map((item) => {
        let images = [];
        try {
          const parsed = JSON.parse(item.banknote_url);
          images = Array.isArray(parsed) ? parsed : [item.banknote_url];
        } catch (err) {
          images = [item.banknote_url];
        }
        return {
          ...item,
          banknoteImages: images,
          banknoteCount: images.length,
          firstBanknote: images[0] || "",
          normalizedName: item.name?.toLowerCase() || "",
          normalizedCode: item.code?.toLowerCase() || "",
        };
      });
      setCurrencies(processed);
    }
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handleDelete = useCallback(async (id) => {
    setDeleteId(id);
    const { error } = await supabase.from("currencies").delete().eq("id", id);
    if (!error) {
      fetchCurrencies();
      showToast('success', 'ลบข้อมูลสำเร็จแล้ว');
    } else {
      showToast('error', 'ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
    setDeleteId(null);
  }, [showToast]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/login");
  }, [navigate]);

  // Move currency up/down
  const moveCurrency = useCallback((index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currencies.length) return;
    
    const newCurrencies = [...currencies];
    [newCurrencies[index], newCurrencies[newIndex]] = [newCurrencies[newIndex], newCurrencies[index]];
    setCurrencies(newCurrencies);
    setHasOrderChanged(true);
  }, [currencies]);

  // Drag handlers
  const handleDragStart = useCallback((index) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newCurrencies = [...currencies];
    const [draggedItem] = newCurrencies.splice(draggedIndex, 1);
    newCurrencies.splice(index, 0, draggedItem);
    
    setCurrencies(newCurrencies);
    setDraggedIndex(index);
    setHasOrderChanged(true);
  }, [draggedIndex, currencies]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // Save new order to database
  const saveOrder = useCallback(async () => {
    setSavingOrder(true);
    try {
      const updates = currencies.map((curr, index) => ({
        id: curr.id,
        sort_order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from("currencies")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }

      setHasOrderChanged(false);
      showToast('success', 'บันทึกลำดับเรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      showToast('error', 'เกิดข้อผิดพลาดในการบันทึก');
    }
    setSavingOrder(false);
  }, [currencies, showToast]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return currencies;
    return currencies.filter(
      (c) => c.normalizedCode.includes(term) || c.normalizedName.includes(term)
    );
  }, [currencies, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totals = useMemo(() => ({
    currencyCount: currencies.length,
    banknoteCount: currencies.reduce((acc, curr) => acc + (curr.banknoteCount || 0), 0),
    filteredCount: filtered.length,
  }), [currencies, filtered]);

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-800/50 border-r border-slate-700/50 p-4 flex flex-col transition-all duration-300 shrink-0`}>
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="self-end p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all mb-4"
          title={sidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
        >
          {sidebarCollapsed ? <Menu size={20} /> : <ChevronsLeft size={20} />}
        </button>

        {/* Logo */}
        <div className={`flex items-center gap-3 mb-8 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
            <Banknote size={20} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">Forex Admin</h1>
              <p className="text-xs text-slate-400">จัดการระบบ</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          <Link 
            to="/admin/dashboard" 
            className={`flex items-center gap-3 px-3 py-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 ${sidebarCollapsed ? 'justify-center' : ''}`}
            title="แดชบอร์ด"
          >
            <LayoutDashboard size={20} />
            {!sidebarCollapsed && <span className="font-medium">แดชบอร์ด</span>}
          </Link>
          <Link 
            to="/admin/add" 
            className={`flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-700/50 rounded-xl transition-all hover:text-white group ${sidebarCollapsed ? 'justify-center' : ''}`}
            title="เพิ่มสกุลเงิน"
          >
            <Plus size={20} />
            {!sidebarCollapsed && (
              <>
                <span className="font-medium">เพิ่มสกุลเงิน</span>
                <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </Link>
          <Link 
            to="/" 
            className={`flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-700/50 rounded-xl transition-all hover:text-white group ${sidebarCollapsed ? 'justify-center' : ''}`}
            title="หน้าเว็บไซต์"
          >
            <Home size={20} />
            {!sidebarCollapsed && (
              <>
                <span className="font-medium">หน้าเว็บไซต์</span>
                <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </Link>
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all mt-auto border border-transparent hover:border-red-500/30 ${sidebarCollapsed ? 'justify-center' : ''}`}
          title="ออกจากระบบ"
        >
          <LogOut size={20} />
          {!sidebarCollapsed && <span className="font-medium">ออกจากระบบ</span>}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">จัดการสกุลเงิน</h2>
            <p className="text-slate-400">จัดการข้อมูลธนบัตรทั้งหมดในระบบ</p>
          </div>
          <div className="flex items-center gap-3">
            {hasOrderChanged && (
              <button
                onClick={saveOrder}
                disabled={savingOrder}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all btn-press font-medium disabled:opacity-50"
              >
                {savingOrder ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                บันทึกลำดับ
              </button>
            )}
            <Link
              to="/admin/add"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all btn-press font-medium"
            >
              <Plus size={20} /> เพิ่มสกุลเงินใหม่
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Globe2 size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">สกุลเงินทั้งหมด</p>
                <p className="text-2xl font-bold text-white">{totals.currencyCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Image size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">รูปธนบัตรทั้งหมด</p>
                <p className="text-2xl font-bold text-white">
                  {totals.banknoteCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Banknote size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">ผลการค้นหา</p>
                <p className="text-2xl font-bold text-white">{totals.filteredCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาสกุลเงิน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 pl-11 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">แสดง:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-400 text-sm">รายการ</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 size={36} className="text-blue-400 animate-spin mb-4" />
              <p className="text-slate-400">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg mb-2">ไม่พบข้อมูล</p>
              <p className="text-slate-500 text-sm">
                {searchTerm ? 'ลองค้นหาด้วยคำค้นอื่น' : 'เริ่มต้นเพิ่มสกุลเงินใหม่'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50 border-b border-slate-700 sticky top-0">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold text-slate-300 w-20">ลำดับ</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-300 w-12">#</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-300">สกุลเงิน</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-300">ธงชาติ</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-300">ตัวอย่าง</th>
                      <th className="p-3 text-center text-xs font-semibold text-slate-300">รูป</th>
                      <th className="p-3 text-center text-xs font-semibold text-slate-300">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {paginatedData.map((curr, index) => {
                      const actualIndex = (currentPage - 1) * itemsPerPage + index;
                      return (
                        <tr 
                          key={curr.id} 
                          className={`hover:bg-slate-700/30 transition-colors group ${draggedIndex === actualIndex ? 'bg-blue-500/20' : ''}`}
                          draggable={!searchTerm}
                          onDragStart={() => handleDragStart(actualIndex)}
                          onDragOver={(e) => handleDragOver(e, actualIndex)}
                          onDragEnd={handleDragEnd}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {!searchTerm && (
                                <>
                                  <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition-colors">
                                    <GripVertical size={16} />
                                  </div>
                                  <div className="flex flex-col">
                                    <button
                                      onClick={() => moveCurrency(actualIndex, 'up')}
                                      disabled={actualIndex === 0}
                                      className="p-0.5 text-slate-500 hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="เลื่อนขึ้น"
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      onClick={() => moveCurrency(actualIndex, 'down')}
                                      disabled={actualIndex === currencies.length - 1}
                                      className="p-0.5 text-slate-500 hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="เลื่อนลง"
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-500 text-sm">{actualIndex + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-white">{curr.code}</div>
                            <div className="text-xs text-slate-400">{curr.name}</div>
                          </td>
                          <td className="p-3">
                            <div className="w-12 h-8 rounded border border-slate-600 bg-slate-900 flex items-center justify-center">
                              <img
                                src={curr.flag_url}
                                className="max-w-[90%] max-h-[80%] object-contain"
                                loading="lazy"
                                alt="flag"
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => openImageModal(curr.banknoteImages)}
                              className="relative group cursor-pointer"
                              title="คลิกเพื่อดูรูปธนบัตร"
                            >
                              <img
                                src={curr.firstBanknote}
                                className="h-10 w-auto rounded border border-slate-600 bg-slate-900 object-contain group-hover:border-blue-500 transition-all"
                                loading="lazy"
                                alt="banknote"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded transition-all">
                                <Eye size={16} className="text-white" />
                              </div>
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                              <Image size={12} />
                              {curr.banknoteCount}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <Link
                                to={`/admin/edit/${curr.id}`}
                                className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-all"
                                title="แก้ไข"
                              >
                                <Edit3 size={16} />
                              </Link>
                              <button
                                onClick={() => {
                                  if (confirm("ยืนยันที่จะลบข้อมูลนี้?")) {
                                    handleDelete(curr.id);
                                  }
                                }}
                                disabled={deleteId === curr.id}
                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50"
                                title="ลบ"
                              >
                                {deleteId === curr.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-700/50">
                  <p className="text-slate-400 text-sm">
                    แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} จาก {filtered.length} รายการ
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="หน้าแรก"
                    >
                      <ChevronsLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="ก่อนหน้า"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 py-2 text-white text-sm">
                      หน้า {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="หน้าถัดไป"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="หน้าสุดท้าย"
                    >
                      <ChevronsRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Image Modal */}
      {selectedImages && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          {/* Close button */}
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 hover:scale-110"
          >
            <X size={24} />
          </button>

          {/* Navigation buttons */}
          {selectedImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                disabled={currentImageIndex === 0}
                className={`absolute left-4 z-10 rounded-full bg-white/10 p-4 text-white transition hover:bg-white/20 hover:scale-110 ${currentImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                disabled={currentImageIndex === selectedImages.length - 1}
                className={`absolute right-4 z-10 rounded-full bg-white/10 p-4 text-white transition hover:bg-white/20 hover:scale-110 ${currentImageIndex === selectedImages.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Main image */}
          <div
            className="relative flex items-center justify-center w-full max-w-5xl max-h-[85vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImages[currentImageIndex]}
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain"
              alt={`banknote-${currentImageIndex + 1}`}
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            />

            {/* Image counter */}
            {selectedImages.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-white/20 backdrop-blur px-4 py-2 text-sm font-medium text-white">
                  {currentImageIndex + 1} / {selectedImages.length}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {selectedImages.length > 1 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 rounded-xl bg-black/80 backdrop-blur-md p-2">
              {selectedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`h-12 w-20 overflow-hidden rounded-lg border-2 transition-all ${idx === currentImageIndex ? 'border-blue-400 scale-105 shadow-lg shadow-blue-500/30' : 'border-transparent opacity-50 hover:opacity-80'}`}
                >
                  <img src={img} alt="thumb" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideIn">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-green-500/90 to-emerald-600/90 border-green-400/30' 
              : 'bg-gradient-to-r from-red-500/90 to-rose-600/90 border-red-400/30'
          } backdrop-blur-md`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={24} className="text-white" />
            ) : (
              <XCircle size={24} className="text-white" />
            )}
            <span className="text-white font-medium">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={16} className="text-white/80" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
