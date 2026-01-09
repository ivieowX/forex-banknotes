import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Globe2,
  Sparkles,
  Layers3,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import stafyBanner from '../assets/stafy_banner.jpg';
import forexBanner from '../assets/forex_erp_banner.jpg';
import moneyone from '../assets/money1.png';
import moneytwo from '../assets/money2.png';

export default function Home() {
  const [currencies, setCurrencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotes, setSelectedNotes] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeBanner, setActiveBanner] = useState(0);
  const [isBannerHovered, setIsBannerHovered] = useState(false);

  const bannerImages = useMemo(
    () => [
      {
        src: forexBanner,
        title: 'อัตราแลกเปลี่ยนทันใจ',
        description: 'อัปเดตข้อมูลค่าเงินและธนบัตรล่าสุดจากแหล่งข้อมูลที่เชื่อถือได้',
      },
      {
        src: stafyBanner,
        title: 'ภาพความละเอียดสูง',
        description: 'ชมรายละเอียดธนบัตรจากทั่วโลกด้วยรูปภาพคมชัดระดับมืออาชีพ',
      },
      {
        src: moneyone,
        title: 'ระบบจัดการสะดวก',
        description: 'ค้นหา จัดหมวดหมู่ และจัดการข้อมูลสกุลเงินได้รวดเร็วไร้สะดุด',
      },
      {
        src: moneytwo,
        title: 'ทีมงานมืออาชีพ',
        description: 'ดูแลและอัปเดตฐานข้อมูลอย่างต่อเนื่องเพื่อความแม่นยำสูงสุด',
      },
    ],
    []
  );

  useEffect(() => {
    if (!bannerImages.length) return;
    const timer = setInterval(() => {
      if (!isBannerHovered) {
        setActiveBanner((prev) => (prev + 1) % bannerImages.length);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [bannerImages.length, isBannerHovered]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase.from('currencies').select('*');
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
            firstBanknote: images[0] || '',
            normalizedName: item.name?.toLowerCase() || '',
            normalizedCode: item.code?.toLowerCase() || '',
          };
        });
        setCurrencies(processed);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return currencies;
    return currencies.filter(
      (c) => c.normalizedCode.includes(term) || c.normalizedName.includes(term)
    );
  }, [currencies, searchTerm]);

  const displayCurrencies = useMemo(() => filtered.slice(0, 30), [filtered]);
  const hasMore = filtered.length > 30;

  const openModal = useCallback((images) => {
    setSelectedNotes(images);
    setCurrentImageIndex(0);
    setImageLoading(true);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    // Preload all images
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const nextImage = useCallback((e) => {
    e.stopPropagation();
    if (selectedNotes && currentImageIndex < selectedNotes.length - 1) {
      setImageLoading(true);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
      setCurrentImageIndex((prev) => prev + 1);
    }
  }, [currentImageIndex, selectedNotes]);

  const prevImage = useCallback((e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setImageLoading(true);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
      setCurrentImageIndex((prev) => prev - 1);
    }
  }, [currentImageIndex]);

  // Zoom functions
  const handleZoomIn = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setImagePosition({ x: 0, y: 0 });
      return newZoom;
    });
  }, []);

  const handleResetZoom = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  // Drag handlers for panning when zoomed
  const handleMouseDown = useCallback((e) => {
    if (zoomLevel > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  }, [zoomLevel, imagePosition]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const clearSearch = useCallback(() => setSearchTerm(''), []);

  const showPreviousBanner = useCallback(() => {
    setActiveBanner((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  }, [bannerImages.length]);

  const showNextBanner = useCallback(() => {
    setActiveBanner((prev) => (prev + 1) % bannerImages.length);
  }, [bannerImages.length]);

  const jumpToBanner = useCallback(
    (index) => {
      setActiveBanner(index);
    },
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Hero */}
      <header className="relative flex-none px-6 pt-10 pb-6">
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
        </div>

        <div className="absolute -top-6 left-10 animate-float opacity-30">
          <Banknote size={52} className="text-blue-500" />
        </div>
        <div className="absolute top-8 right-16 animate-float opacity-30" style={{ animationDelay: '0.8s' }}>
          <Globe2 size={44} className="text-purple-500" />
        </div>
        <div className="absolute bottom-2 left-1/3 animate-float opacity-30" style={{ animationDelay: '1.6s' }}>
          <Sparkles size={36} className="text-amber-500" />
        </div>
        <div
          className="relative z-10 max-w-5xl mx-auto"
          onMouseEnter={() => setIsBannerHovered(true)}
          onMouseLeave={() => setIsBannerHovered(false)}
        >
          <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-white/40 backdrop-blur">
            <div className="relative h-56 md:h-72">
              {bannerImages.map((banner, index) => (
                <img
                  key={banner.title}
                  src={banner.src}
                  alt={banner.title}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
                    activeBanner === index ? 'opacity-100' : 'opacity-0'
                  }`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              ))}

              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-600 shadow-lg hover:bg-white focus:outline-none"
                onClick={showPreviousBanner}
                aria-label="Previous banner"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-600 shadow-lg hover:bg-white focus:outline-none"
                onClick={showNextBanner}
                aria-label="Next banner"
              >
                <ChevronRight size={20} />
              </button>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 via-slate-900/40 to-transparent">
                <div className="px-6 pb-6 pt-12 text-white">
                  <h3 className="text-xl font-semibold md:text-2xl">{bannerImages[activeBanner]?.title}</h3>
                  <p className="mt-2 text-sm md:text-base text-white/80">
                    {bannerImages[activeBanner]?.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {bannerImages.map((banner, index) => (
                <button
                  key={banner.title}
                  type="button"
                  className={`h-2.5 w-8 rounded-full transition-all ${
                    activeBanner === index ? 'bg-white shadow-lg w-10' : 'bg-white/50 hover:bg-white/80'
                  }`}
                  onClick={() => jumpToBanner(index)}
                  aria-label={`Show banner ${index + 1}`}
                ></button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto mt-10">
          {/* <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl mb-4 animate-pulseGlow">
            <Banknote size={34} className="text-white" />
          </div> */}
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
            สกุลเงิน<span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ต่างประเทศ</span>
          </h1>
          <p className="mt-3 text-slate-600 text-base md:text-lg">
            รวบรวมข้อมูลธนบัตรจากทั่วโลก พร้อมรูปภาพคุณภาพสูงแบบครบชุด
          </p>
        </div>
      </header>

      {/* Search */}
      <div className="flex-none px-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
              
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-blue-500/10 overflow-hidden border border-slate-200">
              <Search className="ml-5 text-slate-400" size={22} />
              <input
                type="text"
                placeholder="ค้นหาสกุลเงิน เช่น USD, EUR, JPY..."
                className="w-full p-4 text-base border-none focus:outline-none bg-transparent text-slate-700 placeholder-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="mr-4 p-2 hover:bg-slate-100 rounded-full transition"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Layers3 size={16} className="text-blue-500" />
              <span>ทั้งหมด {currencies.length} สกุลเงิน</span>
            </div>
            <div className="flex items-center gap-2">
              <Search size={16} className="text-purple-500" />
              <span>แสดงอยู่ {displayCurrencies.length} รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-8 md:px-10 lg:px-12 pt-6 pb-10 flex flex-col gap-4">
        {loading ? (
          <div className="grid h-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" style={{ gridAutoRows: '1fr' }}>
            {[...Array(12)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse" />
            ))}
          </div>
        ) : displayCurrencies.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-center text-slate-500 border border-slate-200 rounded-3xl bg-white shadow-sm">
            <div>
              <Search size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-lg text-slate-600">ไม่พบสกุลเงินตามที่ค้นหา</p>
              <p className="text-sm text-slate-400 mt-1">ลองใช้คำค้นอื่นหรือรีเซ็ตการค้นหา</p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="grid h-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              style={{ gridAutoRows: '1fr' }}
            >
              {displayCurrencies.map((curr) => {
                const images = curr.banknoteImages || [];
                return (
                  <button
                    key={curr.id}
                    onClick={() => openModal(images)}
                    className="relative flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:shadow-blue-500/10 px-3 py-4 text-slate-700 transition-all hover:border-blue-400/50 hover:-translate-y-1"
                  >
                    {/* <div className="flex w-full items-center justify-between text-xs text-white/40">
                      <span># {curr.id}</span>
                      {curr.banknoteCount > 1 && (
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-200">
                          {curr.banknoteCount} รูป
                        </span>
                      )}
                    </div> */}

                    <div className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50 p-2">
                      <div className="flex h-12 w-full items-center justify-center">
                        <img
                          src={curr.flag_url}
                          alt={curr.code}
                          className="max-h-full max-w-full rounded-md object-contain"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex w-full flex-col items-center gap-1">
                      <span className="text-lg font-semibold tracking-wide text-slate-800">{curr.code}</span>
                      <span className="text-[11px] text-slate-500 text-center leading-tight max-w-[120px] truncate">
                        {curr.name}
                      </span>
                    </div>

                    {/* <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${Math.min(curr.banknoteCount * 20, 100)}%` }}
                      ></div>
                    </div> */}
                  </button>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center text-xs text-slate-400">
                มีอีก {filtered.length - 30} สกุลเงิน • ใช้การค้นหาเพื่อกรองให้ตรงใจ
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal */}
      {selectedNotes && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setSelectedNotes(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedNotes(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 hover:scale-110"
          >
            <X size={24} />
          </button>

          {/* Navigation buttons */}
          {selectedNotes.length > 1 && (
            <>
              <button
                onClick={prevImage}
                disabled={currentImageIndex === 0}
                className={`absolute left-4 z-10 rounded-full bg-white/10 p-4 text-white transition hover:bg-white/20 hover:scale-110 ${currentImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={nextImage}
                disabled={currentImageIndex === selectedNotes.length - 1}
                className={`absolute right-4 z-10 rounded-full bg-white/10 p-4 text-white transition hover:bg-white/20 hover:scale-110 ${currentImageIndex === selectedNotes.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Main image container */}
          <div
            className="relative flex items-center justify-center w-full max-w-6xl max-h-[75vh] p-4 md:p-8 mb-20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Loading spinner */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-black/50 rounded-2xl p-6">
                  <Loader2 size={40} className="text-white animate-spin" />
                </div>
              </div>
            )}

            {/* Main Image */}
            <img
              src={selectedNotes[currentImageIndex]}
              className={`max-w-full max-h-[70vh] rounded-2xl shadow-2xl object-contain transition-all ${isDragging ? 'cursor-grabbing' : zoomLevel > 1 ? 'cursor-grab' : ''} ${imageLoading ? 'opacity-0 scale-95' : 'opacity-100'}`}
              alt={`banknote-${currentImageIndex + 1}`}
              onLoad={() => setImageLoading(false)}
              onMouseDown={handleMouseDown}
              draggable={false}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
            />

            {/* Zoom controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="rounded-full bg-white/20 backdrop-blur p-3 text-white transition hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                title="ขยาย"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="rounded-full bg-white/20 backdrop-blur p-3 text-white transition hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                title="ย่อ"
              >
                <ZoomOut size={20} />
              </button>
              <button
                onClick={handleResetZoom}
                disabled={zoomLevel === 1}
                className="rounded-full bg-white/20 backdrop-blur p-3 text-white transition hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                title="รีเซ็ต"
              >
                <RotateCcw size={20} />
              </button>
              {zoomLevel > 1 && (
                <div className="rounded-full bg-blue-500/80 backdrop-blur px-3 py-1 text-white text-xs font-medium text-center">
                  {Math.round(zoomLevel * 100)}%
                </div>
              )}
            </div>

            {/* Image counter badge */}
            {selectedNotes.length > 1 && (
              <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <span className="rounded-full bg-white/20 backdrop-blur px-4 py-1 text-sm font-medium text-white">
                  {currentImageIndex + 1} / {selectedNotes.length}
                </span>
              </div>
            )}

            {/* Dot indicators */}
            {selectedNotes.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                {selectedNotes.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageLoading(true);
                      setCurrentImageIndex(idx);
                    }}
                    className={`h-2.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail strip - positioned outside image area */}
          {selectedNotes.length > 1 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 rounded-xl bg-black/80 backdrop-blur-md p-2 z-50">
              {selectedNotes.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageLoading(true);
                    setCurrentImageIndex(idx);
                  }}
                  className={`h-12 w-20 overflow-hidden rounded-lg border-2 transition-all ${idx === currentImageIndex ? 'border-blue-400 scale-105 shadow-lg shadow-blue-500/30' : 'border-transparent opacity-50 hover:opacity-80'}`}
                >
                  <img src={img} alt="thumb" className="h-full w-full object-cover" loading="eager" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}