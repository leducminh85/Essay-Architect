import React, { useRef, useState, useEffect } from 'react';
import { OutlineItem, GenerationStatus, GenerationConfig } from '../types';
import { Play, Copy, RefreshCw, AlertCircle, CheckCircle2, StopCircle, ChevronDown, Check } from 'lucide-react';

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

const TONE_OPTIONS = [
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
    
    // Prevent deselecting all tones (keep at least one)
    if (newTones.length === 0) return;

    onUpdateConfig('tone', newTones);
  };

  const completedCount = items.filter(i => i.status === GenerationStatus.SUCCESS).length;
  const progress = Math.round((completedCount / items.length) * 100);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Control Toolbar */}
      <div className="p-4 border-b border-gray-200 bg-white z-20 flex flex-col gap-4 shadow-sm flex-none">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-800 text-sm underline">
              Quay lại
            </button>
            <h2 className="font-semibold text-gray-800 border-l pl-3 ml-1 border-gray-300">
              2. Phát triển & Chỉnh sửa
            </h2>
          </div>
          <div className="flex gap-2">
             <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Copy size={14} /> Sao chép toàn bài
            </button>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Ngôn ngữ:</label>
            <select 
              value={config.language}
              onChange={(e) => onUpdateConfig('language', e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 px-2 text-gray-700 bg-white"
            >
              <option value="Tiếng Việt">Tiếng Việt</option>
              <option value="English">English</option>
            </select>
          </div>

          <div className="w-px h-4 bg-gray-300 mx-1 hidden sm:block"></div>

          {/* Tone Selector (Multi-select) */}
          <div className="flex items-center gap-2 relative" ref={toneDropdownRef}>
            <label className="text-xs font-medium text-gray-600">Giọng văn:</label>
            <button
              onClick={() => setIsToneDropdownOpen(!isToneDropdownOpen)}
              className="flex items-center justify-between gap-2 text-sm border border-gray-300 bg-white rounded-md shadow-sm py-1.5 px-3 hover:bg-gray-50 min-w-[140px] text-gray-700 transition-colors"
            >
              <span className="truncate block text-left flex-1 max-w-[160px]">
                {config.tone.length === 0 ? 'Chọn' : 
                 config.tone.map(t => TONE_OPTIONS.find(o => o.value === t)?.label || t).join(', ')}
              </span>
              <ChevronDown size={14} className="text-gray-500 shrink-0" />
            </button>
            
            {isToneDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-1">
                {TONE_OPTIONS.map((option) => {
                  const isSelected = config.tone.includes(option.value);
                  return (
                    <div 
                      key={option.value}
                      onClick={() => toggleTone(option.value)}
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0
                        ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}
                      `}>
                        {isSelected && <Check size={10} className="text-white" />}
                      </div>
                      <span className={isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                        {option.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Độ dài:</label>
            <select 
              value={config.detailLevel}
              onChange={(e) => onUpdateConfig('detailLevel', e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 px-2 text-gray-700 bg-white"
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
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors shadow-sm"
            >
              <StopCircle size={16} /> Dừng lại
            </button>
          ) : (
             <button
              onClick={onGenerateAll}
              disabled={progress === 100}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400"
            >
              <Play size={16} /> Viết toàn bộ
            </button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* List Area */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className={`
              relative bg-white rounded-lg border transition-all duration-200
              ${item.status === GenerationStatus.loading ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : 'border-gray-200 shadow-sm hover:border-blue-300'}
            `}
            style={{ marginLeft: `${item.level * 20}px` }}
          >
            {/* Outline Point Header */}
            <div className="p-3 bg-gray-50 rounded-t-lg border-b border-gray-100 flex items-start justify-between gap-3">
               <div className="flex items-start gap-2 flex-grow">
                 <span className="mt-1 text-gray-400 text-xs font-mono">
                    {index + 1}.
                 </span>
                 <p className="text-sm font-semibold text-gray-800 leading-tight pt-0.5">
                   {item.originalText}
                 </p>
               </div>
               
               <div className="flex items-center gap-1 shrink-0">
                  {item.status === GenerationStatus.IDLE && (
                    <button 
                      onClick={() => onGenerateSingle(item.id)}
                      disabled={isGenerating}
                      className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors disabled:opacity-30"
                      title="Viết đoạn này"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  {item.status === GenerationStatus.loading && (
                    <div className="flex items-center gap-2 text-blue-600">
                       <RefreshCw size={16} className="animate-spin" />
                       <span className="text-xs font-medium">Đang viết...</span>
                    </div>
                  )}
                  {item.status === GenerationStatus.SUCCESS && (
                    <CheckCircle2 size={16} className="text-green-500" />
                  )}
                  {item.status === GenerationStatus.ERROR && (
                    <AlertCircle size={16} className="text-red-500" />
                  )}
               </div>
            </div>

            {/* Content Area */}
            <div className="p-3">
              {item.status === GenerationStatus.ERROR && (
                <div className="text-xs text-red-500 mb-2 bg-red-50 p-2 rounded">
                  Lỗi: {item.errorMessage || "Không thể tạo nội dung"}
                  <button 
                    onClick={() => onGenerateSingle(item.id)}
                    className="ml-2 underline font-medium hover:text-red-700"
                  >
                    Thử lại
                  </button>
                </div>
              )}
              
              <textarea
                value={item.generatedText}
                onChange={(e) => onUpdateItemText(item.id, e.target.value)}
                placeholder={item.status === GenerationStatus.loading ? "AI đang suy nghĩ và viết bài..." : "Nội dung cho phần này sẽ hiện ở đây..."}
                className={`
                  w-full min-h-[120px] p-3 text-sm rounded-md border-0 bg-transparent resize-y focus:ring-0
                  font-serif leading-relaxed text-gray-800 placeholder-gray-300
                  ${item.status === GenerationStatus.loading ? 'animate-pulse' : ''}
                `}
              />
              
              {item.generatedText && (
                <div className="flex justify-end pt-2 border-t border-gray-50 mt-1">
                  <button 
                    onClick={() => {
                        navigator.clipboard.writeText(item.generatedText);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                  >
                    <Copy size={12} /> Sao chép đoạn
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            Không có mục nào để hiển thị.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpansionList;