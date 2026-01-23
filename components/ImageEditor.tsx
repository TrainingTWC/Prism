import React, { useRef, useState, useEffect } from 'react';

interface ImageEditorProps {
  imageBase64: string;
  onSave: (editedImage: string) => void;
  onCancel: () => void;
}

type Tool = 'pen' | 'circle' | 'arrow' | 'text' | 'none';

const ImageEditor: React.FC<ImageEditorProps> = ({ imageBase64, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#FF0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;

    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    if (!ctx || !previewCtx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      // Save initial state
      saveToHistory();
    };
    img.src = imageBase64;
  }, [imageBase64]);

  // Set up non-passive event listeners for touch events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Native event handlers that work with non-passive listeners
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const syntheticEvent = {
        preventDefault: () => {},
        touches: e.touches,
      } as any;
      handleStart(syntheticEvent);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const syntheticEvent = {
        preventDefault: () => {},
        touches: e.touches,
      } as any;
      handleMove(syntheticEvent);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const syntheticEvent = {
        preventDefault: () => {},
        touches: e.changedTouches.length > 0 ? [e.changedTouches[0]] : [],
      } as any;
      handleEnd(syntheticEvent);
    };

    // Add non-passive touch event listeners
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [tool, color, lineWidth, isDrawing, startPos]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[ImageEditor] Cannot save to history - canvas not available');
      return;
    }
    
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      console.log('[ImageEditor] Saving to history. Current step:', historyStep, 'Data URL length:', dataUrl.length);
      setHistory(prev => [...prev.slice(0, historyStep + 1), dataUrl]);
      setHistoryStep(prev => prev + 1);
    } catch (error) {
      console.error('[ImageEditor] Error saving to history:', error);
      alert('Failed to save edit state. Try using a smaller image.');
    }
  };

  const undo = () => {
    console.log('[ImageEditor] Undo requested. Current step:', historyStep, 'History length:', history.length);
    if (historyStep <= 0) {
      console.log('[ImageEditor] Cannot undo, already at first state');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      console.error('[ImageEditor] Canvas or context not available for undo');
      return;
    }

    console.log('[ImageEditor] Loading history state:', historyStep - 1);
    const img = new Image();
    img.onload = () => {
      console.log('[ImageEditor] Undo image loaded successfully');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryStep(prev => prev - 1);
    };
    img.onerror = (error) => {
      console.error('[ImageEditor] Failed to load undo state:', error);
      alert('Failed to undo. Please try again.');
    };
    img.src = history[historyStep - 1];
  };

  const redo = () => {
    console.log('[ImageEditor] Redo requested. Current step:', historyStep, 'History length:', history.length);
    if (historyStep >= history.length - 1) {
      console.log('[ImageEditor] Cannot redo, already at latest state');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      console.error('[ImageEditor] Canvas or context not available for redo');
      return;
    }

    console.log('[ImageEditor] Loading history state:', historyStep + 1);
    const img = new Image();
    img.onload = () => {
      console.log('[ImageEditor] Redo image loaded successfully');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryStep(prev => prev + 1);
    };
    img.onerror = (error) => {
      console.error('[ImageEditor] Failed to load redo state:', error);
      alert('Failed to redo. Please try again.');
    };
    img.src = history[historyStep + 1];
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | any) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | any) => {
    if (e.preventDefault) e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) {
      console.error('[ImageEditor] Failed to get canvas point on start');
      return;
    }

    console.log('[ImageEditor] Start drawing:', tool, 'at', point);

    if (tool === 'text') {
      setTextPosition(point);
      return;
    }

    setIsDrawing(true);
    setStartPos(point);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) {
      console.error('[ImageEditor] Canvas context not available on start');
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | any) => {
    if (e.preventDefault) e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    if (tool === 'pen' && isDrawing) {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else if ((tool === 'circle' || tool === 'arrow') && isDrawing && startPos) {
      // Show preview on overlay canvas
      const previewCanvas = previewCanvasRef.current;
      const canvas = canvasRef.current;
      const previewCtx = previewCanvas?.getContext('2d');
      const ctx = canvas?.getContext('2d');
      if (!previewCanvas || !canvas || !previewCtx || !ctx) return;

      // Clear preview canvas
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      
      // Draw preview
      previewCtx.strokeStyle = color;
      previewCtx.lineWidth = lineWidth;
      previewCtx.lineCap = 'round';
      previewCtx.lineJoin = 'round';

      if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(point.x - startPos.x, 2) + Math.pow(point.y - startPos.y, 2));
        previewCtx.beginPath();
        previewCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        previewCtx.stroke();
      } else if (tool === 'arrow') {
        drawArrow(previewCtx, startPos.x, startPos.y, point.x, point.y);
      }
    }
  };

  const handleEnd = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | any) => {
    if (e.preventDefault) e.preventDefault();
    if (!isDrawing) return;

    const point = getCanvasPoint(e);
    if (!point || !startPos) {
      setIsDrawing(false);
      return;
    }

    const ctx = canvasRef.current?.getContext('2d');
    const previewCtx = previewCanvasRef.current?.getContext('2d');
    if (!ctx || !previewCtx) return;

    // Clear preview canvas
    previewCtx.clearRect(0, 0, previewCanvasRef.current!.width, previewCanvasRef.current!.height);

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = 'transparent';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (tool) {
      case 'circle':
        const radius = Math.sqrt(Math.pow(point.x - startPos.x, 2) + Math.pow(point.y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;

      case 'arrow':
        drawArrow(ctx, startPos.x, startPos.y, point.x, point.y);
        break;
    }

    setIsDrawing(false);
    setStartPos(null);
    saveToHistory();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 20;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const addText = () => {
    if (!textPosition || !textInput) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.font = `${lineWidth * 8}px Arial`;
    ctx.fillText(textInput, textPosition.x, textPosition.y);

    setTextInput('');
    setTextPosition(null);
    saveToHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const editedImage = canvas.toDataURL('image/jpeg', 0.9);
    onSave(editedImage);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full h-full sm:max-w-6xl sm:max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Image Editor</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 hidden sm:block">Draw, annotate, and enhance your image</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200 group"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
          {/* Tools */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-1.5 shadow-sm border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setTool('pen')}
              className={`group relative p-2.5 sm:p-3 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                tool === 'pen' 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Pen</span>
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`group relative p-2.5 sm:p-3 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                tool === 'circle' 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Circle</span>
            </button>
            <button
              onClick={() => setTool('arrow')}
              className={`group relative p-2.5 sm:p-3 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                tool === 'arrow' 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Arrow</span>
            </button>
            <button
              onClick={() => setTool('text')}
              className={`group relative p-2.5 sm:p-3 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                tool === 'text' 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Text</span>
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-gray-300 dark:bg-slate-600"></div>

          {/* Color Picker */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-slate-700">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 hidden sm:inline">Color</label>
            <div className="relative group">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-slate-600 transition-all hover:scale-105"
              />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"></div>
            </div>
          </div>

          {/* Line Width */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 shadow-sm border border-gray-200 dark:border-slate-700 flex-1 sm:flex-initial">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 hidden sm:inline whitespace-nowrap">Thickness</label>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <input
                type="range"
                min="2"
                max="12"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-full sm:w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                style={{
                  background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((lineWidth - 2) / 10) * 100}%, rgb(229, 231, 235) ${((lineWidth - 2) / 10) * 100}%, rgb(229, 231, 235) 100%)`
                }}
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 min-w-[32px] text-center bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md">{lineWidth}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-gray-300 dark:bg-slate-600"></div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-1.5 shadow-sm border border-gray-200 dark:border-slate-700 ml-auto">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="group relative p-2.5 sm:p-3 text-gray-600 dark:text-slate-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Undo</span>
            </button>
            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="group relative p-2.5 sm:p-3 text-gray-600 dark:text-slate-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Redo</span>
            </button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center justify-center min-h-full relative">
            <div className="relative max-w-full max-h-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              <canvas
                ref={canvasRef}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                className="max-w-full max-h-full bg-white"
                style={{ maxHeight: 'calc(100vh - 280px)', touchAction: 'none' }}
              />
              <canvas
                ref={previewCanvasRef}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                className="absolute top-0 left-0 max-w-full max-h-full cursor-crosshair"
                style={{ maxHeight: 'calc(100vh - 280px)', touchAction: 'none', pointerEvents: 'auto' }}
              />
            </div>
          </div>
        </div>

        {/* Text Input Modal */}
        {textPosition && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-slate-700">
              <h4 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Add Text
              </h4>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter your text..."
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTextPosition(null);
                    setTextInput('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addText}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-500/30"
                >
                  Add Text
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl transition-all font-medium border border-gray-200 dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
