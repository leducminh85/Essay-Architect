import React, { useState } from 'react';
import { ArrowRight, RotateCcw, FileText } from 'lucide-react';
import { SAMPLE_OUTLINE } from '../types';

interface Props {
  onProcess: (text: string) => void;
  isProcessing: boolean;
}

const OutlineInput: React.FC<Props> = ({ onProcess, isProcessing }) => {
  const [text, setText] = useState(SAMPLE_OUTLINE);

  const handleSubmit = () => {
    if (text.trim()) {
      onProcess(text);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 flex-none backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                <FileText size={16} />
            </div>
            <h2 className="font-semibold text-gray-800">1. Nhập dàn ý</h2>
        </div>
        <button 
          onClick={() => setText(SAMPLE_OUTLINE)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
        >
          <RotateCcw size={12} /> Dàn ý mẫu
        </button>
      </div>
      
      {/* Textarea Area - Added bg-white and text colors explicitly to prevent dark mode issues */}
      <div className="flex-grow p-0 relative bg-white">
        <textarea
          className="w-full h-full p-5 resize-none bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed border-none block"
          placeholder="Dán dàn bài của bạn vào đây..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      </div>

      {/* Footer / Action Area */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex-none space-y-3">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isProcessing}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.99]"
        >
          {isProcessing ? 'Đang xử lý...' : 'Bắt đầu viết'} <ArrowRight size={18} />
        </button>
        
        <div className="text-xs text-center text-gray-500 flex flex-col gap-1">
            <p>Mẹo: Sử dụng dấu gạch ngang (-) hoặc thụt đầu dòng để phân cấp ý.</p>
        </div>
      </div>
    </div>
  );
};

export default OutlineInput;