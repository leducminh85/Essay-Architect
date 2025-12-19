import React, { useState, useRef } from 'react';
import Header from './components/Header';
import OutlineInput from './components/OutlineInput';
import ExpansionList from './components/ExpansionList';
import { OutlineItem, GenerationConfig, GenerationStatus } from './types';
import { parseOutline } from './utils/outlineParser';
import { generateParagraph, generateBatch } from './services/gemini';

const App: React.FC = () => {
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [rawOutline, setRawOutline] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1);
  const [config, setConfig] = useState<GenerationConfig>({
    tone: ['Chuyên nghiệp, học thuật'],
    language: 'Tiếng Việt',
    detailLevel: 'standard'
  });
  
  const stopSignalRef = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleProcessOutline = (text: string) => {
    const parsedItems = parseOutline(text);
    setRawOutline(text);
    setItems(parsedItems);
    setStep(2);
  };

  const updateItemStatus = (id: string, status: GenerationStatus, text?: string, error?: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status,
          generatedText: text !== undefined ? text : item.generatedText,
          errorMessage: error
        };
      }
      return item;
    }));
  };

  const handleUpdateItemText = (id: string, text: string) => {
     setItems(prev => prev.map(item => item.id === id ? { ...item, generatedText: text } : item));
  };

  const handleUpdateConfig = (key: keyof GenerationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Helper to get ALL generated text up to the current point
  const getAccumulatedText = (currentItemId: string, currentItems: OutlineItem[]): string => {
    const currentIndex = currentItems.findIndex(i => i.id === currentItemId);
    if (currentIndex <= 0) return "";
    
    return currentItems
      .slice(0, currentIndex)
      .map(i => i.generatedText)
      .filter(t => t && t.trim().length > 0)
      .join("\n\n");
  };

  // Helper to get future points (Look-ahead) to prevent redundancy
  const getNextPoints = (currentItemId: string, currentItems: OutlineItem[]): string[] => {
    const currentIndex = currentItems.findIndex(i => i.id === currentItemId);
    if (currentIndex === -1 || currentIndex === currentItems.length - 1) return [];
    
    // Get next 3 items as context
    return currentItems
      .slice(currentIndex + 1, currentIndex + 4)
      .map(i => i.originalText);
  };

  // Manual single generation
  const handleGenerateSingle = async (id: string) => {
    setIsGenerating(true);
    if (stopSignalRef.current) return;
    
    const index = items.findIndex(i => i.id === id);
    const item = items[index];
    if (!item) return;

    updateItemStatus(id, GenerationStatus.loading);
    
    const accumulatedText = getAccumulatedText(id, items);
    const nextPoints = getNextPoints(id, items);
    const isLastItem = index === items.length - 1;

    try {
      const result = await generateParagraph(
        item.originalText,
        item.level,
        rawOutline, 
        accumulatedText,
        nextPoints,
        config,
        isLastItem
      );
      updateItemStatus(id, GenerationStatus.SUCCESS, result);
    } catch (e: any) {
      updateItemStatus(id, GenerationStatus.ERROR, undefined, e.message || 'Lỗi không xác định');
    }
    setIsGenerating(false);
  };

  // Batch generation for "Generate All"
  const handleGenerateAll = async () => {
    setIsGenerating(true);
    stopSignalRef.current = false;

    // Use a local copy to manage state across batches, but we must update React state to show UI changes
    let localItems = [...items]; 
    const BATCH_SIZE = 5; // Group 5 items per request to reduce API calls

    // Filter items that need generation
    const pendingIndices = localItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.status !== GenerationStatus.SUCCESS);

    if (pendingIndices.length === 0) {
      setIsGenerating(false);
      return;
    }

    // Process in batches
    for (let i = 0; i < pendingIndices.length; i += BATCH_SIZE) {
        if (stopSignalRef.current) break;

        const batch = pendingIndices.slice(i, i + BATCH_SIZE);
        const batchItems = batch.map(b => b.item);
        
        // 1. Set Status to Loading for all items in batch
        setItems(prev => prev.map(item => {
            if (batchItems.some(b => b.id === item.id)) {
                return { ...item, status: GenerationStatus.loading };
            }
            return item;
        }));

        // 2. Prepare Context
        // Use the ID of the first item in batch to get accumulated text
        const firstItemInBatch = batchItems[0];
        // We need the accumulated text from the MAIN list (localItems), not just the batch
        const accumulatedText = getAccumulatedText(firstItemInBatch.id, localItems);
        
        // Get look-ahead points (points coming AFTER this entire batch)
        const lastItemInBatchIdx = batch[batch.length - 1].index;
        const nextPointsOutsideBatch = localItems
            .slice(lastItemInBatchIdx + 1, lastItemInBatchIdx + 4)
            .map(x => x.originalText);
        
        const isLastBatch = (i + BATCH_SIZE) >= pendingIndices.length && (lastItemInBatchIdx === localItems.length - 1);

        try {
            // 3. Call API
            const results = await generateBatch(
                batchItems,
                rawOutline,
                accumulatedText,
                nextPointsOutsideBatch,
                config,
                isLastBatch
            );

            // 4. Update Success State
            // We update localItems for future context loop
            results.forEach(res => {
                const targetIndex = localItems.findIndex(x => x.id === res.id);
                if (targetIndex !== -1) {
                    localItems[targetIndex] = {
                        ...localItems[targetIndex],
                        generatedText: res.content,
                        status: GenerationStatus.SUCCESS
                    };
                }
            });

            // We update React state for UI
            setItems(prev => prev.map(item => {
                const res = results.find(r => r.id === item.id);
                if (res) {
                    return { ...item, status: GenerationStatus.SUCCESS, generatedText: res.content };
                }
                return item;
            }));

            // Small delay to be safe
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error: any) {
            // Handle Batch Error
            setItems(prev => prev.map(item => {
                 if (batchItems.some(b => b.id === item.id)) {
                    return { ...item, status: GenerationStatus.ERROR, errorMessage: error.message };
                }
                return item;
            }));
            // If a batch fails, we probably should stop or skip? Let's stop to save tokens.
            break;
        }
    }

    setIsGenerating(false);
    stopSignalRef.current = false;
  };

  const handleStop = () => {
    stopSignalRef.current = true;
    setIsGenerating(false);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      
      <main className="flex-grow flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-0">
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 h-full">
          
          {/* Left Panel: Input */}
          <div className={`
            lg:col-span-4 h-full flex flex-col min-h-0 transition-all duration-300
            ${step === 1 ? 'block' : 'hidden lg:flex'}
          `}>
             <OutlineInput 
               onProcess={handleProcessOutline} 
               isProcessing={isGenerating}
             />
          </div>

          {/* Right Panel: Expansion List */}
          <div className={`
             lg:col-span-8 h-full flex flex-col min-h-0
             ${step === 2 ? 'block' : 'hidden lg:flex'}
          `}>
            {step === 2 ? (
              <ExpansionList 
                items={items}
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onGenerateSingle={handleGenerateSingle}
                onGenerateAll={handleGenerateAll}
                onStop={handleStop}
                onUpdateItemText={handleUpdateItemText}
                isGenerating={isGenerating}
                onBack={() => setStep(1)}
              />
            ) : (
               <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 border-dashed flex items-center justify-center p-8 text-center">
                 <div className="max-w-md">
                   <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                     <span className="text-2xl font-bold">2</span>
                   </div>
                   <h3 className="text-lg font-medium text-gray-900 mb-2">Đang chờ dàn ý</h3>
                   <p className="text-gray-500">
                     Nhập dàn ý của bạn ở bên trái và nhấn "Bắt đầu xử lý" để phát triển bài viết.
                   </p>
                 </div>
               </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;