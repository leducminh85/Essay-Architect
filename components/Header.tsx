import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex-none z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Essay Architect By Duc Minh</h1>
            <p className="text-xs text-gray-500">Trợ lý phát triển dàn ý thành văn</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
          <Sparkles size={16} className="text-yellow-500" />
          <span>Sử dụng Gemini 2.5 Flash</span>
        </div>
      </div>
    </header>
  );
};

export default Header;