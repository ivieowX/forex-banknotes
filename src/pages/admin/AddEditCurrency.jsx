import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Save, Image, Globe2, 
  Banknote, X, CheckCircle2, Loader2, AlertCircle, Edit3 
} from 'lucide-react';

// Mapping currency code -> country code for flag
const currencyToCountry = {
  USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', CNY: 'cn', THB: 'th',
  AUD: 'au', CAD: 'ca', CHF: 'ch', HKD: 'hk', SGD: 'sg', NZD: 'nz',
  KRW: 'kr', MYR: 'my', PHP: 'ph', IDR: 'id', INR: 'in', VND: 'vn',
  TWD: 'tw', AED: 'ae', SAR: 'sa', RUB: 'ru', BRL: 'br', MXN: 'mx',
  ZAR: 'za', SEK: 'se', NOK: 'no', DKK: 'dk', PLN: 'pl', TRY: 'tr',
  ILS: 'il', EGP: 'eg', PKR: 'pk', BDT: 'bd', LKR: 'lk', MMK: 'mm',
  KHR: 'kh', LAK: 'la', BND: 'bn', NPR: 'np', QAR: 'qa', KWD: 'kw',
  BHD: 'bh', OMR: 'om', JOD: 'jo', NGN: 'ng', KES: 'ke', GHS: 'gh',
  CZK: 'cz', HUF: 'hu', RON: 'ro', BGN: 'bg', HRK: 'hr', UAH: 'ua',
};

// Mapping currency code -> Thai name
const currencyToThaiName = {
  USD: 'ดอลลาร์สหรัฐ',
  EUR: 'ยูโร',
  GBP: 'ปอนด์สเตอร์ลิง',
  JPY: 'เยนญี่ปุ่น',
  CNY: 'หยวนจีน',
  THB: 'บาทไทย',
  AUD: 'ดอลลาร์ออสเตรเลีย',
  CAD: 'ดอลลาร์แคนาดา',
  CHF: 'ฟรังก์สวิส',
  HKD: 'ดอลลาร์ฮ่องกง',
  SGD: 'ดอลลาร์สิงคโปร์',
  NZD: 'ดอลลาร์นิวซีแลนด์',
  KRW: 'วอนเกาหลีใต้',
  MYR: 'ริงกิตมาเลเซีย',
  PHP: 'เปโซฟิลิปปินส์',
  IDR: 'รูเปียห์อินโดนีเซีย',
  INR: 'รูปีอินเดีย',
  VND: 'ดองเวียดนาม',
  TWD: 'ดอลลาร์ไต้หวัน',
  AED: 'ดีร์ฮัมสหรัฐอาหรับเอมิเรตส์',
  SAR: 'ริยาลซาอุดีอาระเบีย',
  RUB: 'รูเบิลรัสเซีย',
  BRL: 'เรียลบราซิล',
  MXN: 'เปโซเม็กซิโก',
  ZAR: 'แรนด์แอฟริกาใต้',
  SEK: 'โครนาสวีเดน',
  NOK: 'โครนนอร์เวย์',
  DKK: 'โครนเดนมาร์ก',
  PLN: 'ซลอตีโปแลนด์',
  TRY: 'ลีราตุรกี',
  ILS: 'เชเกลอิสราเอล',
  EGP: 'ปอนด์อียิปต์',
  PKR: 'รูปีปากีสถาน',
  BDT: 'ตากาบังกลาเทศ',
  LKR: 'รูปีศรีลังกา',
  MMK: 'จ๊าตเมียนมา',
  KHR: 'เรียลกัมพูชา',
  LAK: 'กีบลาว',
  BND: 'ดอลลาร์บรูไน',
  NPR: 'รูปีเนปาล',
  QAR: 'รียาลกาตาร์',
  KWD: 'ดีนาร์คูเวต',
  BHD: 'ดีนาร์บาห์เรน',
  OMR: 'รียาลโอมาน',
  JOD: 'ดีนาร์จอร์แดน',
  NGN: 'ไนราไนจีเรีย',
  KES: 'ชิลลิงเคนยา',
  GHS: 'เซดีกานา',
  CZK: 'โครูนาเช็ก',
  HUF: 'ฟอรินต์ฮังการี',
  RON: 'ลิวโรมาเนีย',
  BGN: 'เลฟบัลแกเรีย',
  HRK: 'คูนาโครเอเชีย',
  UAH: 'ฮริฟเนียยูเครน',
};

const getFlagUrl = (countryCode) => {
  if (!countryCode) return '';
  return `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`;
};

// Helper functions for edit mode
const parseBanknoteUrls = (banknoteUrl) => {
  if (!banknoteUrl) return [];
  try {
    const parsed = JSON.parse(banknoteUrl);
    return Array.isArray(parsed) ? parsed : [banknoteUrl];
  } catch {
    return [banknoteUrl];
  }
};

const extractCountryCodeFromFlagUrl = (flagUrl) => {
  if (!flagUrl) return '';
  const match = flagUrl.match(/flagcdn\.com\/w\d+\/([a-z]{2})\.png/i);
  return match ? match[1].toLowerCase() : '';
};

const extractStoragePath = (url) => {
  if (!url) return null;
  const match = url.match(/\/images\/([^?]+)/);
  return match ? match[1] : null;
};

export default function AddEditCurrency() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [noteFiles, setNoteFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingNoteUrls, setExistingNoteUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Load existing data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      setLoadingRecord(true);
      supabase
        .from('currencies')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            setError('ไม่พบข้อมูลสกุลเงินนี้');
          } else if (data) {
            setCode(data.code || '');
            setName(data.name || '');
            setCountryCode(extractCountryCodeFromFlagUrl(data.flag_url));
            const urls = parseBanknoteUrls(data.banknote_url);
            setExistingNoteUrls(urls);
          }
          setLoadingRecord(false);
        });
    }
  }, [id, isEditMode]);

  // Auto-fill country code and Thai name when currency code changes
  const handleCodeChange = (value) => {
    const upper = value.toUpperCase();
    setCode(upper);
    // Auto-suggest country code if we have a mapping
    if (currencyToCountry[upper]) {
      setCountryCode(currencyToCountry[upper]);
    }
    // Auto-suggest Thai name if we have a mapping
    if (currencyToThaiName[upper]) {
      setName(currencyToThaiName[upper]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNoteFiles(files);
    
    // Create preview URLs
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const removeFile = (index) => {
    const newFiles = [...noteFiles];
    const newPreviews = [...previews];
    
    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setNoteFiles(newFiles);
    setPreviews(newPreviews);
  };

  const removeExistingImage = (index) => {
    const newUrls = [...existingNoteUrls];
    newUrls.splice(index, 1);
    setExistingNoteUrls(newUrls);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    const hasImages = noteFiles.length > 0 || existingNoteUrls.length > 0;
    if (!countryCode || !hasImages) {
      setError("กรุณากรอกรหัสประเทศและเลือกรูปธนบัตรอย่างน้อย 1 รูป");
      return;
    }
    
    const flagUrl = getFlagUrl(countryCode);
    
    setUploading(true);
    try {
      const uploadImage = async (file) => {
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name.replace(/\s/g, '')}`;
        const { error } = await supabase.storage.from('images').upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        return data.publicUrl;
      };

      // Upload new images
      const uploadPromises = noteFiles.map(file => uploadImage(file));
      const newNoteUrls = await Promise.all(uploadPromises);
      
      // Combine existing URLs with new ones
      const allNoteUrls = [...existingNoteUrls, ...newNoteUrls];

      if (isEditMode) {
        // Update existing record
        const { error } = await supabase
          .from('currencies')
          .update({ 
            code, 
            name, 
            flag_url: flagUrl, 
            banknote_url: JSON.stringify(allNoteUrls)
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('currencies')
          .insert([{ 
            code, 
            name, 
            flag_url: flagUrl, 
            banknote_url: JSON.stringify(allNoteUrls)
          }]);

        if (error) throw error;
      }

      navigate('/admin/dashboard');

    } catch (error) {
      console.error(error);
      setError("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      {/* Back Button */}
      <div className="max-w-2xl mx-auto mb-6">
        <Link 
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>กลับหน้าแดชบอร์ด</span>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header Card */}
        <div className="relative mb-8 animate-fadeIn">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-lg opacity-30"></div>
          <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${isEditMode ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                {isEditMode ? <Edit3 size={32} className="text-white" /> : <Banknote size={32} className="text-white" />}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {isEditMode ? 'แก้ไขสกุลเงิน' : 'เพิ่มสกุลเงินใหม่'}
                </h1>
                <p className="text-slate-400">
                  {isEditMode ? 'แก้ไขข้อมูลและรูปธนบัตร' : 'กรอกข้อมูลและอัปโหลดรูปธนบัตร'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State for Edit Mode */}
        {loadingRecord && (
          <div className="mb-6 p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-blue-400" />
            <span className="text-slate-300">กำลังโหลดข้อมูล...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 flex items-center gap-3 animate-scaleIn">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUpload} className="space-y-6">
          {/* Currency Code & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 text-blue-400 mb-2">
                <Globe2 size={20} />
                <span className="font-medium">รหัสสกุลเงิน</span>
              </div>
              <input 
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-lg font-mono uppercase"
                value={code} 
                onChange={e => handleCodeChange(e.target.value)} 
                required 
                placeholder="USD"
                maxLength={3}
              />
              <p className="text-xs text-slate-500">รหัส 3 ตัวอักษร เช่น USD, EUR, JPY (จะเติมรหัสประเทศให้อัตโนมัติ)</p>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4 animate-fadeIn" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3 text-purple-400 mb-2">
                <Banknote size={20} />
                <span className="font-medium">ชื่อสกุลเงิน</span>
              </div>
              <input 
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="ดอลลาร์สหรัฐ"
              />
              <p className="text-xs text-slate-500">ชื่อเต็มของสกุลเงิน</p>
            </div>
          </div>
        
          {/* Country Code for Flag */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4 animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 text-green-400 mb-2">
              <Image size={20} />
              <span className="font-medium">รหัสประเทศ (ISO Country Code)</span>
            </div>
            <input 
              type="text" 
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition-all text-lg font-mono lowercase"
              placeholder="us"
              value={countryCode} 
              onChange={e => setCountryCode(e.target.value.toLowerCase().slice(0, 2))} 
              required 
              maxLength={2}
            />
            {countryCode && (
              <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
                <img 
                  src={getFlagUrl(countryCode)} 
                  alt="Flag Preview" 
                  className="h-10 rounded border-2 border-slate-600" 
                  onError={(e) => { e.target.style.display='none'; }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle2 size={16} />
                    <span>ตัวอย่างธงชาติ</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">URL: {getFlagUrl(countryCode)}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-500">รหัสประเทศ 2 ตัวอักษร เช่น us (อเมริกา), th (ไทย), jp (ญี่ปุ่น), eu (ยูโร)</p>
          </div>

          {/* Banknote Upload */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4 animate-fadeIn" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <Upload size={20} />
              <span className="font-medium">รูปธนบัตร</span>
            </div>
            
            {/* Upload Area */}
            <label className="block cursor-pointer group">
              <div className="border-2 border-dashed border-slate-600 hover:border-amber-500/50 bg-slate-900/30 hover:bg-slate-900/50 rounded-2xl p-8 text-center transition-all">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={28} className="text-amber-400" />
                </div>
                <p className="text-white font-medium mb-1">คลิกเพื่อเลือกรูป หรือลากวางไฟล์</p>
                <p className="text-slate-500 text-sm">รองรับ JPG, PNG, WEBP (สูงสุด 10MB ต่อรูป)</p>
                <p className="text-amber-400/70 text-sm mt-2">เลือกได้หลายรูป</p>
              </div>
              <input 
                type="file" 
                multiple
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden"
                required={!isEditMode && noteFiles.length === 0 && existingNoteUrls.length === 0}
              />
            </label>

            {/* Existing Images (Edit Mode) */}
            {existingNoteUrls.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-green-400 text-sm font-medium">
                    รูปปัจจุบัน ({existingNoteUrls.length} รูป)
                  </p>
                  <button 
                    type="button"
                    onClick={() => setExistingNoteUrls([])}
                    className="text-red-400 text-sm hover:text-red-300 transition-colors"
                  >
                    ลบรูปเดิมทั้งหมด
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingNoteUrls.map((url, index) => (
                    <div key={`existing-${index}`} className="relative group rounded-xl overflow-hidden border-2 border-green-600/50 bg-slate-900">
                      <img 
                        src={url} 
                        className="w-full h-24 object-contain p-2" 
                        alt={`Existing ${index + 1}`} 
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-green-900/70 text-green-200 text-xs p-1 text-center">
                        รูปเดิม {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Preview Grid */}
            {previews.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-amber-400 text-sm font-medium">
                    รูปใหม่ที่จะเพิ่ม ({previews.length} รูป)
                  </p>
                  <button 
                    type="button"
                    onClick={() => { setNoteFiles([]); setPreviews([]); }}
                    className="text-red-400 text-sm hover:text-red-300 transition-colors"
                  >
                    ลบรูปใหม่ทั้งหมด
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden border-2 border-amber-600/50 bg-slate-900">
                      <img 
                        src={preview} 
                        className="w-full h-24 object-contain p-2" 
                        alt={`Preview ${index + 1}`} 
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-amber-900/70 text-amber-200 text-xs p-1 text-center">
                        รูปใหม่ {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={uploading || loadingRecord} 
            className={`w-full text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 btn-press animate-fadeIn ${isEditMode ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'}`}
            style={{ animationDelay: '300ms' }}
          >
            {uploading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                {isEditMode ? 'กำลังบันทึกการแก้ไข...' : 'กำลังอัปโหลด...'}
              </>
            ) : (
              <>
                <Save size={22} />
                {isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}