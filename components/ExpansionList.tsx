import React, { useRef, useState, useEffect } from 'react';
import { OutlineItem, GenerationStatus, GenerationConfig } from '../types';
import { Play, Copy, RefreshCw, AlertCircle, CheckCircle2, StopCircle, ChevronDown, Check, Plus, X, BookOpen } from 'lucide-react';

interface Props {
  items: OutlineItem[];
  config: GenerationConfig;
  onUpdateConfig: (key: keyof GenerationConfig, value: any) => void;
  onGenerateSingle: (id: string) => void;
  onGenerateAll: () => void;
  onStop: () => void;
  onUpdateItemText: (id: string, text: string) => void;
  isGenerating: boolean;
  onBack: () => void;
}

const DEFAULT_TONE_OPTIONS = [
  { value: 'Chuyên nghiệp, học thuật', label: 'Học thuật' },
  { value: 'Thân thiện, kể chuyện', label: 'Kể chuyện' },
  { value: 'Thuyết phục, hùng hồn', label: 'Hùng hồn' },
  { value: 'Nhẹ nhàng, cảm xúc', label: 'Cảm xúc' },
  { value: 'Hài hước, dí dỏm', label: 'Hài hước' },
];

const ExpansionList: React.FC<Props> = ({
  items,
  config,
  onUpdateConfig,
  onGenerateSingle,
  onGenerateAll,
  onStop,
  onUpdateItemText,
  isGenerating,
  onBack
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [customToneInput, setCustomToneInput] = useState('');
  const toneDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(event.target as Node)) {
        setIsToneDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCopyAll = () => {
    const fullText = items
      .map(item => item.generatedText)
      .filter(text => text.trim().length > 0)
      .join('\n\n');
    navigator.clipboard.writeText(fullText);
    alert('Đã sao chép toàn bộ bài văn!');
  };

  const toggleTone = (value: string) => {
    const currentTones = config.tone || [];
    let newTones: string[];
    
    if (currentTones.includes(value)) {
      newTones = currentTones.filter(t => t !== value);
    } else {
      newTones = [...currentTones, value];
    }
    
    if (newTones.length === 0) return;
    onUpdateConfig('tone', newTones);
  };

  const handleAddCustomTone = () => {
    const trimmed = customToneInput.trim();
    if (trimmed) {
      // 1. Add to the active selection if not already there
      if (!config.tone.includes(trimmed)) {
        onUpdateConfig('tone', [...config.tone, trimmed]);
      }
      // 2. Add to the persistent custom list if not already there
      if (!config.customTones.includes(trimmed)) {
        onUpdateConfig('customTones', [...config.customTones, trimmed]);
      }
      setCustomToneInput('');
    }
  };

  const handleDeleteCustomTone = (tone: string) => {
    // Completely remove from both selection and the custom list
    onUpdateConfig('customTones', config.customTones.filter(t => t !== tone));
    onUpdateConfig('tone', config.tone.filter(t => t !== tone));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTone();
    }
  };

  const completedCount = items.filter(i => i.status === GenerationStatus.SUCCESS).length;
  const progress = Math.round((completedCount / items.length) * 100);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Control Toolbar */}
      <div className="p-4 border-b border-gray-200 bg-white z-20 flex flex-col gap-4 shadow-sm flex-none">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
              Quay lại
            </button>
            <h2 className="font-semibold text-gray-800 border-l pl-3 ml-1 border-gray-200">
              2. Phát triển & Chỉnh sửa
            </h2>
          </div>
          <div className="flex gap-2">
             <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-sm"
            >
              <Copy size={14} className="text-gray-500" /> Sao chép toàn bài
            </button>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
          
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ngôn ngữ</label>
            <select 
              value={config.language}
              onChange={(e) => onUpdateConfig('language', e.target.value)}
              className="text-sm border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 py-1.5 px-2.5 text-gray-700 bg-white outline-none transition-all cursor-pointer hover:border-gray-300"
            >
              <option value="Tiếng Việt">Tiếng Việt</option>
              <option value="English">English</option>
            </select>
          </div>

          <div className="w-px h-4 bg-gray-200 mx-1 hidden sm:block"></div>

          {/* Tone Selector */}
          <div className="flex items-center gap-2 relative" ref={toneDropdownRef}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giọng văn</label>
            <button
              onClick={() => setIsToneDropdownOpen(!isToneDropdownOpen)}
              className="flex items-center justify-between gap-2 text-sm border border-gray-200 bg-white rounded-lg shadow-sm py-1.5 px-3 hover:border-gray-300 min-w-[160px] text-gray-700 transition-all hover:shadow-sm"
            >
              <span className="truncate block text-left flex-1 max-w-[140px] font-medium">
                {config.tone.length === 0 ? 'Chọn giọng văn' : 
                 config.tone.map(t => DEFAULT_TONE_OPTIONS.find(o => o.value === t)?.label || t).join(', ')}
              </span>
              <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform duration-200 ${isToneDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isToneDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-1.5 flex flex-col ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                <div className="max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {/* Default Options */}
                  {DEFAULT_TONE_OPTIONS.map((option) => {
                    const isSelected = config.tone.includes(option.value);
                    return (
                      <div 
                        key={option.value}
                        onClick={() => toggleTone(option.value)}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer rounded-lg transition-all mb-0.5 ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                        <div className={`
                          w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0
                          ${isSelected ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-200' : 'border-gray-300 bg-white hover:border-blue-400'}
                        `}>
                          {isSelected && <Check size={12} className="text-white stroke-[3px]" />}
                        </div>
                        <span className={`flex-grow ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                          {option.label}
                        </span>
                      </div>
                    );
                  })}

                  {/* Custom Tones list (PERSISTENT) */}
                  {config.customTones.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-3 py-2 mt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tùy chỉnh</span>
                        <div className="h-px bg-gray-100 flex-grow" />
                      </div>
                      {config.customTones.map((tone) => {
                        const isSelected = config.tone.includes(tone);
                        return (
                          <div 
                            key={tone}
                            className={`flex items-center justify-between gap-2 px-3 py-2.5 text-sm cursor-default group rounded-lg mb-0.5 transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex items-center gap-3 flex-grow cursor-pointer" onClick={() => toggleTone(tone)}>
                              <div className={`
                                w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0
                                ${isSelected ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-200' : 'border-gray-300 bg-white hover:border-blue-400'}
                              `}>
                                {isSelected && <Check size={12} className="text-white stroke-[3px]" />}
                              </div>
                              <span className={`truncate max-w-[160px] ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-700 font-medium'}`}>{tone}</span>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteCustomTone(tone); }}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                              title="Xóa vĩnh viễn"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Add Custom Section */}
                <div className="border-t border-gray-100 mt-1.5 p-2 bg-gray-50/50 rounded-b-lg">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      placeholder="Thêm giọng văn khác..."
                      value={customToneInput}
                      onChange={(e) => setCustomToneInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full text-xs text-gray-900 pl-3 pr-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 bg-white"
                    />
                    <button 
                      onClick={handleAddCustomTone}
                      disabled={!customToneInput.trim()}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm active:scale-95"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Độ dài</label>
            <select 
              value={config.detailLevel}
              onChange={(e) => onUpdateConfig('detailLevel', e.target.value)}
              className="text-sm border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 py-1.5 px-2.5 text-gray-700 bg-white outline-none transition-all cursor-pointer hover:border-gray-300"
            >
              <option value="brief">Ngắn gọn</option>
              <option value="standard">Vừa phải</option>
              <option value="detailed">Chi tiết</option>
            </select>
          </div>

           <div className="flex-grow"></div>

          {isGenerating ? (
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all shadow-md shadow-red-100 active:scale-95"
            >
              <StopCircle size={18} /> Dừng lại
            </button>
          ) : (
             <button
              onClick={onGenerateAll}
              disabled={progress === 100}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:bg-gray-300 disabled:shadow-none active:scale-95"
            >
              <Play size={18} fill="currentColor" /> Viết toàn bộ
            </button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(37,99,235,0.3)]" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* List Area */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className={`
              relative bg-white rounded-xl border transition-all duration-300
              ${item.status === GenerationStatus.loading ? 'border-blue-400 shadow-xl ring-2 ring-blue-500/5 translate-y-[-2px]' : 'border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-md'}
            `}
            style={{ marginLeft: `${item.level * 24}px` }}
          >
            {/* Outline Point Header */}
            <div className={`p-4 rounded-t-xl border-b flex items-start justify-between gap-3 ${item.status === GenerationStatus.loading ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50/40 border-gray-100'}`}>
               <div className="flex items-start gap-3 flex-grow">
                 <span className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${item.status === GenerationStatus.loading ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                    {index + 1}
                 </span>
                 <p className="text-sm font-bold text-gray-800 leading-snug">
                   {item.originalText}
                 </p>
               </div>
               
               <div className="flex items-center gap-1.5 shrink-0">
                  {item.status === GenerationStatus.IDLE && (
                    <button 
                      onClick={() => onGenerateSingle(item.id)}
                      disabled={isGenerating}
                      className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-all disabled:opacity-30"
                      title="Viết đoạn này"
                    >
                      <Play size={18} fill="currentColor" />
                    </button>
                  )}
                  {item.status === GenerationStatus.loading && (
                    <div className="flex items-center gap-2 text-blue-600 px-2 py-1 bg-blue-100/50 rounded-lg">
                       <RefreshCw size={14} className="animate-spin" />
                       <span className="text-[10px] font-bold uppercase tracking-wider">Đang viết</span>
                    </div>
                  )}
                  {item.status === GenerationStatus.SUCCESS && (
                    <div className="p-1 bg-green-50 rounded-lg">
                      <CheckCircle2 size={18} className="text-green-500" />
                    </div>
                  )}
                  {item.status === GenerationStatus.ERROR && (
                    <div className="p-1 bg-red-50 rounded-lg">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                  )}
               </div>
            </div>

            {/* Content Area */}
            <div className="p-4">
              {item.status === GenerationStatus.ERROR && (
                <div className="text-xs text-red-600 mb-3 bg-red-50 border border-red-100 p-3 rounded-lg flex items-center justify-between">
                  <span>Lỗi: {item.errorMessage || "Không thể tạo nội dung"}</span>
                  <button 
                    onClick={() => onGenerateSingle(item.id)}
                    className="ml-4 font-bold hover:underline"
                  >
                    Thử lại
                  </button>
                </div>
              )}
              
              <textarea
                value={item.generatedText}
                onChange={(e) => onUpdateItemText(item.id, e.target.value)}
                placeholder={item.status === GenerationStatus.loading ? "AI đang xây dựng nội dung cho phần này..." : "Nhấn nút 'Viết' để AI phát triển ý tưởng này..."}
                className={`
                  w-full min-h-[140px] p-0 text-base rounded-md border-0 bg-transparent resize-y focus:outline-none focus:ring-0
                  font-serif leading-relaxed text-gray-700 placeholder:text-gray-300 transition-opacity
                  ${item.status === GenerationStatus.loading ? 'opacity-50' : 'opacity-100'}
                `}
              />
              
              {item.generatedText && (
                <div className="flex justify-end pt-3 border-t border-gray-50 mt-2">
                  <button 
                    onClick={() => {
                        navigator.clipboard.writeText(item.generatedText);
                    }}
                    className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1.5 transition-all font-medium py-1 px-2 hover:bg-blue-50 rounded-lg"
                  >
                    <Copy size={14} /> Sao chép đoạn văn
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
               <BookOpen size={32} className="text-gray-300" />
            </div>
            <p className="font-medium">Chưa có dàn ý nào được tải.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpansionList;