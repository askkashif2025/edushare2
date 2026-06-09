import React, { useState, useEffect, useRef } from 'react';
import { DrawStroke, DrawText, User, WhiteboardData } from '../types';
import { Pen, Type, Square, Circle, Minus, Trash2, Share2, X, Sparkles, Check, Loader2, Users } from 'lucide-react';

interface WhiteboardModalProps {
  channelId: string;
  channelName: string;
  currentUser: User;
  onClose: () => void;
  onShareToChat: (thumbnail: string) => void;
}

export default function WhiteboardModal({
  channelId,
  channelName,
  currentUser,
  onClose,
  onShareToChat,
}: WhiteboardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [tool, setTool] = useState<'free' | 'rect' | 'circle' | 'line' | 'text'>('free');
  const [color, setColor] = useState<string>('#FFFFFF'); // default drawing color (looks great on blueprint dark background)
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [texts, setTexts] = useState<DrawText[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [textEditingPos, setTextEditingPos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeCollaborators, setActiveCollaborators] = useState<string[]>(['Sarah Jenkins', 'Alex Vance']);
  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);

  // Keep track of current stroke during drawing
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);
  
  // Track last fetched timestamp to avoid unnecessary drawing updates
  const lastUpdatedRef = useRef<number>(0);
  // Is the user currently drawing? Avoid overwriting state
  const userDrawingRef = useRef<boolean>(false);

  const COLORS = [
    { value: '#FFFFFF', name: 'White' },
    { value: '#FF5555', name: 'Red' },
    { value: '#50FA7B', name: 'Green' },
    { value: '#8BE9FD', name: 'Cyan' },
    { value: '#FF79C6', name: 'Pink' },
    { value: '#F1FA8C', name: 'Yellow' },
    { value: '#BD93F9', name: 'Purple' },
    { value: '#38BDF8', name: 'Blue' },
  ];

  // Fetch from server on mount & interval
  useEffect(() => {
    fetchBoardData();
    const interval = setInterval(() => {
      if (!userDrawingRef.current && !isSyncing) {
        fetchBoardData(true);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [channelId]);

  // Fetch logic
  const fetchBoardData = async (isBackground = false) => {
    try {
      if (!isBackground) setIsSyncing(true);
      const res = await fetch(`/api/chat/whiteboards/${channelId}`);
      if (!res.ok) return;
      const data: WhiteboardData = await res.json();
      
      if (data.lastUpdated > lastUpdatedRef.current) {
        setStrokes(data.strokes || []);
        setTexts(data.texts || []);
        lastUpdatedRef.current = data.lastUpdated;
      }
    } catch (err) {
      console.error('Error fetching whiteboard:', err);
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  };

  // Push logic
  const pushBoardData = async (updatedStrokes: DrawStroke[], updatedTexts: DrawText[]) => {
    try {
      const res = await fetch(`/api/chat/whiteboards/${channelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strokes: updatedStrokes,
          texts: updatedTexts,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        lastUpdatedRef.current = data.lastUpdated;
      }
    } catch (err) {
      console.error('Error saving whiteboard data:', err);
    }
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw an elegant "blueprint grid" background
    ctx.fillStyle = '#0f172a'; // slate-900 background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw coordinate dots grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    const gridSize = 25;
    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // Draw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const startX = stroke.points[0].x * canvas.width;
      const startY = stroke.points[0].y * canvas.height;

      if (stroke.type === 'free') {
        ctx.moveTo(startX, startY);
        for (let i = 1; i < stroke.points.length; i++) {
          const ptX = stroke.points[i].x * canvas.width;
          const ptY = stroke.points[i].y * canvas.height;
          ctx.lineTo(ptX, ptY);
        }
        ctx.stroke();
      } else if (stroke.type === 'rect') {
        const lastX = stroke.points[stroke.points.length - 1].x * canvas.width;
        const lastY = stroke.points[stroke.points.length - 1].y * canvas.height;
        ctx.strokeRect(startX, startY, lastX - startX, lastY - startY);
      } else if (stroke.type === 'circle') {
        const lastX = stroke.points[stroke.points.length - 1].x * canvas.width;
        const lastY = stroke.points[stroke.points.length - 1].y * canvas.height;
        const radius = Math.sqrt(Math.pow(lastX - startX, 2) + Math.pow(lastY - startY, 2));
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (stroke.type === 'line') {
        const lastX = stroke.points[stroke.points.length - 1].x * canvas.width;
        const lastY = stroke.points[stroke.points.length - 1].y * canvas.height;
        ctx.moveTo(startX, startY);
        ctx.lineTo(lastX, lastY);
        ctx.stroke();
      }
    });

    // Draw all texts
    texts.forEach((txt) => {
      ctx.fillStyle = txt.color;
      ctx.font = `bold ${txt.fontSize}px sans-serif`;
      ctx.textBaseline = 'top';
      const textX = txt.x * canvas.width;
      const textY = txt.y * canvas.height;
      
      // Draw background indicator box behind remote texts for extreme design craft
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const textWidth = ctx.measureText(txt.text).width;
      ctx.fillRect(textX - 4, textY - 3, textWidth + 8, txt.fontSize + 6);
      
      // Draw actual text
      ctx.fillStyle = txt.color;
      ctx.fillText(txt.text, textX, textY);
    });
  }, [strokes, texts]);

  // Handle canvas resize responsively
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Match actual visible size plus support high DPI retina screens
      const dpi = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      canvas.width = rect.width * dpi;
      canvas.height = rect.height * dpi;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpi, dpi);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Tiny delay to ensure layout is complete
    const timer = setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Utility to convert client mouse coordinates to percentage coords
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  // Mouse/Touch Down
  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default touch moving so we don't scroll page
    if (e.type === 'touchstart') {
      e.stopPropagation();
    }

    const coords = getCanvasCoords(e);
    if (!coords) return;

    userDrawingRef.current = true;

    if (tool === 'text') {
      setTextEditingPos(coords);
      setTextInput('');
      return;
    }

    setIsDrawing(true);
    currentPointsRef.current = [coords];

    const tempStroke: DrawStroke = {
      type: tool as any,
      color,
      width: lineWidth,
      points: [coords, coords],
    };

    setStrokes((prev) => [...prev, tempStroke]);
  };

  // Mouse/Touch Move
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e.type === 'touchmove') {
      e.stopPropagation();
    }

    const coords = getCanvasCoords(e);
    if (!coords) return;

    if (tool === 'free') {
      currentPointsRef.current = [...currentPointsRef.current, coords];
      setStrokes((prev) => {
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (lastIdx >= 0) {
          copy[lastIdx] = {
            ...copy[lastIdx],
            points: currentPointsRef.current,
          };
        }
        return copy;
      });
    } else {
      // Shape dragging (rectangle, circle, line)
      setStrokes((prev) => {
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (lastIdx >= 0) {
          const firstPoint = currentPointsRef.current[0];
          copy[lastIdx] = {
            ...copy[lastIdx],
            points: [firstPoint, coords],
          };
        }
        return copy;
      });
    }
  };

  // Mouse/Touch Up
  const handleUp = () => {
    if (!isDrawing) {
      userDrawingRef.current = false;
      return;
    }
    
    setIsDrawing(false);
    userDrawingRef.current = false;
    
    // Save state to server
    pushBoardData(strokes, texts);
  };

  // Typing submit
  const handleAddTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !textEditingPos) return;

    const newTxtItem: DrawText = {
      id: 'txt_' + Date.now(),
      text: textInput.trim(),
      x: textEditingPos.x,
      y: textEditingPos.y,
      color,
      fontSize: 14 + (lineWidth - 3) * 2, // scale with line width selector
    };

    const nextTexts = [...texts, newTxtItem];
    setTexts(nextTexts);
    setTextEditingPos(null);
    setTextInput('');

    pushBoardData(strokes, nextTexts);
  };

  // Clear Board
  const handleClear = () => {
    if (window.confirm('Clear all strokes and writings from this whiteboard?')) {
      setStrokes([]);
      setTexts([]);
      pushBoardData([], []);
    }
  };

  // Export to chat
  const handleShare = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const base64Img = canvas.toDataURL('image/png');
    onShareToChat(base64Img);
    
    setShowSavedNotification(true);
    setTimeout(() => {
      setShowSavedNotification(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col pt-4">
      
      {/* HEADER BAR */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0 select-none">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase block leading-none">
            🎨 Realtime Workspace
          </span>
          <h2 className="text-sm font-black text-white leading-tight mt-1 flex items-center gap-1.5">
            Collab Board: {channelName}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Active indicator */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 text-white select-none">
            <Users size={12} className="text-emerald-400" />
            <span className="text-[10px] font-extrabold max-w-[120px] truncate">
              {activeCollaborators.length} Live
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 px-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all active:scale-90"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* WHITEBOARD ACTIONS BAR */}
      <div className="bg-slate-900 border-b border-white/10 p-3 shrink-0 flex flex-wrap gap-2 items-center justify-between select-none">
        
        {/* Tools picker */}
        <div className="flex gap-1 bg-white/5 border border-white/10 p-0.5 rounded-xl">
          <button
            onClick={() => setTool('free')}
            className={`p-2 rounded-lg transition-all ${tool === 'free' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            title="Free hand Brush"
          >
            <Pen size={14} />
          </button>
          <button
            onClick={() => setTool('line')}
            className={`p-2 rounded-lg transition-all ${tool === 'line' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            title="Line"
          >
            <Minus size={14} className="rotate-45" />
          </button>
          <button
            onClick={() => setTool('rect')}
            className={`p-2 rounded-lg transition-all ${tool === 'rect' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            title="Square"
          >
            <Square size={14} />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-2 rounded-lg transition-all ${tool === 'circle' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            title="Circle"
          >
            <Circle size={14} />
          </button>
          <button
            onClick={() => {
              setTool('text');
              setTextEditingPos(null);
            }}
            className={`p-2 rounded-lg transition-all ${tool === 'text' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            title="Add Text Textbox"
          >
            <Type size={14} />
          </button>
        </div>

        {/* Thickness */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/50 uppercase font-black tracking-widest">Width</span>
          <input
            type="range"
            min="1"
            max="12"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-16 accent-white cursor-pointer"
          />
          <span className="text-[10px] text-white font-mono bg-white/10 px-1 py-0.5 rounded border border-white/15">
            {lineWidth}px
          </span>
        </div>

        {/* Sync loading */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded" title="Autosync state status">
          {isSyncing ? (
            <Loader2 size={10} className="animate-spin text-indigo-400" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <span className="text-[8px] font-bold text-white/50 tracking-wider uppercase font-mono">Sync</span>
        </div>

      </div>

      {/* PALETTE + CLEAR / SAVE BAR */}
      <div className="bg-slate-900 border-b border-white/10 p-2.5 px-3 shrink-0 flex gap-2 items-center justify-between overflow-x-auto select-none no-scrollbar">
        {/* Color Palette */}
        <div className="flex gap-1.5 items-center">
          {COLORS.map((col) => (
            <button
              key={col.value}
              onClick={() => setColor(col.value)}
              className="w-5 h-5 rounded-full border border-white/20 relative transition-all active:scale-95"
              style={{ backgroundColor: col.value }}
              title={col.name}
            >
              {color === col.value && (
                <div className="absolute inset-0.5 rounded-full border-2 border-slate-950 bg-transparent flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Right Operations */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleClear}
            className="p-1 px-2.5 rounded-lg border border-red-500/30 text-red-400 bg-red-950/30 hover:bg-red-950/50 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider transition-all active:scale-95 duration-150"
          >
            <Trash2 size={12} />
            <span>Wipe</span>
          </button>

          <button
            onClick={handleShare}
            className="p-1 px-3 rounded-lg border border-emerald-400 bg-emerald-500 text-slate-950 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider transition-all active:scale-95 duration-150 shadow-md"
          >
            <Share2 size={12} />
            <span>Save & Share</span>
          </button>
        </div>
      </div>

      {/* CANVAS DRAWING SPACE */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full relative bg-slate-950 overflow-hidden cursor-crosshair select-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
          className="absolute inset-0 block w-full h-full"
        />

        {/* Collaborative user pointer simulator banner (micro elements) */}
        {tool === 'text' && !textEditingPos && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-indigo-500/80 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] text-white font-bold tracking-wide pointer-events-none shadow">
            🔤 Click anywhere to place text
          </div>
        )}

        {/* Inline Text Input Editor Mode */}
        {textEditingPos && (
          <form 
            onSubmit={handleAddTextSubmit}
            className="absolute z-20 bg-slate-900 border border-white/20 p-2 rounded-xl shadow-2xl flex items-center gap-1.5 max-w-[280px]"
            style={{ 
              left: `${textEditingPos.x * 100}%`, 
              top: `${textEditingPos.y * 100}%`,
              transform: 'translate(-5%, -50%)'
            }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              autoFocus
              className="bg-white/10 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 w-36"
            />
            <button
              type="submit"
              className="bg-white text-slate-900 hover:bg-white/90 p-1 rounded transition-all"
            >
              <Check size={10} className="stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => setTextEditingPos(null)}
              className="bg-white/10 hover:bg-white/15 text-white/70 p-1 rounded"
            >
              <X size={10} />
            </button>
          </form>
        )}

        {/* Sync Saved Notifications */}
        {showSavedNotification && (
          <div className="absolute inset-x-0 top-1/3 mx-auto max-w-xs bg-slate-900/40 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 text-center select-none shadow-2xl animate-bounce">
            <Sparkles size={24} className="text-emerald-400 mx-auto animate-pulse mb-2" />
            <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">Saved Successfully!</h4>
            <p className="text-[10px] text-white/70 mt-1">Snapshot shared to class chat feed.</p>
          </div>
        )}
      </div>

      {/* FOOTER COLLAB GUIDE SLIDER */}
      <div className="bg-slate-950 p-2 text-center text-[9px] text-white/40 border-t border-white/5 font-mono select-none">
        Drawing/Text update periodically in real-time. Coordinate drawings with teammates!
      </div>
    </div>
  );
}
