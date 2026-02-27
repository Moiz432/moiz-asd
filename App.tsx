
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Shirt, Upload, RotateCcw, Plus, Wand2, X, Loader2, ShoppingBag, 
  Smartphone, Camera, Sparkles, ChevronLeft, Scan, Sliders, Palette, 
  Sun, Droplets, Compass, Maximize2, Check, Copy, Zap, MoveRight, 
  ArrowRight, Info, History, Layers, Download, Box, Trash2, Heart
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ThreeViewer from './components/ThreeViewer';
import { ProductState, DesignIdea } from './types';
import { getDesignSuggestions, editLogoWithAI } from './services/geminiService';

const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToHSL = (hex: string) => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const PhotoshopPicker: React.FC<{ state: ProductState; onChange: (hex: string, h: number, s: number, l: number) => void }> = ({ state, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const handleSquareClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const s = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
    const v = Math.round(Math.max(0, Math.min(100, (1 - (clientY - rect.top) / rect.height) * 100)));
    const l = (v / 100) * (1 - (s / 100) / 2) * 100;
    const sat = (l === 0 || l === 100) ? 0 : ((v / 100 - l / 100) / Math.min(l / 100, 1 - l / 100)) * 100;
    onChange(hslToHex(state.hue, sat, l), state.hue, Math.round(sat), Math.round(l));
  };

  const handleHueClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const h = Math.round(Math.max(0, Math.min(360, ((clientY - rect.top) / rect.height) * 360)));
    onChange(hslToHex(h, state.saturation, state.lightness), h, state.saturation, state.lightness);
  };

  return (
    <div className="space-y-6 bg-black/40 p-6 rounded-[32px] border border-white/5">
      <div className="flex gap-4 h-64">
        <div 
          ref={containerRef}
          className="flex-1 rounded-xl relative cursor-crosshair overflow-hidden"
          style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${state.hue}, 100%, 50%)` }}
          onMouseDown={handleSquareClick}
          onTouchStart={handleSquareClick}
        >
          <div 
            className="absolute w-4 h-4 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-xl pointer-events-none"
            style={{ left: `${state.saturation}%`, top: `${100 - state.lightness}%` }}
          />
        </div>
        <div 
          ref={hueRef}
          className="w-6 rounded-full relative cursor-pointer"
          style={{ background: 'linear-gradient(to bottom, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
          onMouseDown={handleHueClick}
          onTouchStart={handleHueClick}
        >
          <div 
            className="absolute left-0 right-0 h-2 bg-white rounded-full -translate-y-1/2 border border-black/20"
            style={{ top: `${(state.hue / 360) * 100}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Hex Code</label>
          <div className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
            <span className="text-white/20 text-xs">#</span>
            <input 
              type="text" 
              value={state.color.replace('#', '').toUpperCase()} 
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 6) {
                  const hex = '#' + val;
                  if (/^#[0-9A-F]{6}$/i.test(hex)) {
                    const hsl = hexToHSL(hex);
                    onChange(hex, hsl.h, hsl.s, hsl.l);
                  }
                }
              }}
              className="bg-transparent border-none outline-none text-xs font-black text-indigo-400 w-full"
            />
          </div>
        </div>
        <div className="space-y-1 text-right">
          <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">HSL Values</label>
          <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-white/60">
            {state.hue}° {state.saturation}% {state.lightness}%
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'catalog' | 'studio' | 'archive'>('home');
  const [isARMode, setIsARMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'design' | 'presets'>('basics');
  const [product, setProduct] = useState<ProductState>({
    type: 'long_sleeve',
    size: 'L',
    color: '#FBFBFB',
    hue: 0,
    saturation: 0,
    lightness: 98,
    logos: { front: null, back: null, leftSleeve: null, rightSleeve: null },
    textureIntensity: 0.5,
    roughness: 0.9,
    metalness: 0,
    logoScale: 0.45,
    clearcoat: 0.0
  });

  const [aiModal, setAiModal] = useState<{ open: boolean; pos: keyof ProductState['logos'] | null; prompt: string; loading: boolean }>({
    open: false,
    pos: null,
    prompt: '',
    loading: false
  });

  const [aiSuggestions, setAiSuggestions] = useState<{ loading: boolean; data: DesignIdea[] }>({ loading: false, data: [] });
  const [showQR, setShowQR] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [archivedDesigns, setArchivedDesigns] = useState<ProductState[]>([]);
  
  // AR Camera Refs and State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    if (isARMode) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          activeStream = stream;
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access denied or error:", err);
          alert("Unable to access the back camera. Please ensure camera permissions are enabled.");
          setIsARMode(false);
        }
      };
      startCamera();
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isARMode]);

  const catalogItems = [
    { id: 0, name: 'Classic White', color: '#FFFFFF', type: 'polo' as const, price: '$75' },
    { id: 1, name: 'Obsidian Noir', color: '#1A1A1A', type: 'shirt' as const, price: '$68' },
    { id: 2, name: 'Cloud Minimal', color: '#F3F4F6', type: 'shirt' as const, price: '$72' },
    { id: 3, name: 'Indigo Dusk', color: '#312E81', type: 'hoodie' as const, price: '$94' },
    { id: 4, name: 'Concrete Urban', color: '#4B5563', type: 'polo' as const, price: '$82' },
    { id: 5, name: 'Solaris Flare', color: '#FBBF24', type: 'long_sleeve' as const, price: '$78' },
    { id: 6, name: 'Arctic Drift', color: '#E0F2FE', type: 'shirt' as const, price: '$68' },
  ];

  const handleAIEdit = async () => {
    if (!aiModal.pos || !product.logos[aiModal.pos] || !aiModal.prompt) return;
    setAiModal(prev => ({ ...prev, loading: true }));
    const result = await editLogoWithAI(product.logos[aiModal.pos]!, aiModal.prompt);
    if (result) {
      setProduct(prev => ({ ...prev, logos: { ...prev.logos, [aiModal.pos!]: result } }));
      setAiModal({ open: false, pos: null, prompt: '', loading: false });
    } else {
      setAiModal(prev => ({ ...prev, loading: false }));
      alert("AI transformation failed.");
    }
  };

  const handleGenerateIdeas = async () => {
    setAiSuggestions({ loading: true, data: [] });
    const ideas = await getDesignSuggestions(product.type + " streetwear design");
    setAiSuggestions({ loading: false, data: ideas });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, pos: keyof ProductState['logos']) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProduct(prev => ({ ...prev, logos: { ...prev.logos, [pos]: ev.target?.result as string } }));
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const link = document.createElement('a');
      link.download = `picknprints-${product.type}.png`;
      link.href = image;
      link.click();
    }
  };

  const saveToArchive = () => {
    setOrderStatus('processing');
    setTimeout(() => {
      setArchivedDesigns(prev => [...prev, { ...product }]);
      setOrderStatus('success');
      setTimeout(() => setOrderStatus('idle'), 2000);
    }, 1200);
  };

  const loadFromCatalog = (item: typeof catalogItems[0]) => {
    const hsl = hexToHSL(item.color);
    setProduct({
      ...product,
      type: item.type,
      color: item.color,
      hue: hsl.h,
      saturation: hsl.s,
      lightness: hsl.l
    });
    setCurrentView('studio');
  };

  const removeFromArchive = (index: number) => {
    setArchivedDesigns(prev => prev.filter((_, i) => i !== index));
  };

  if (isARMode) return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center overflow-hidden">
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute top-10 right-10 z-[110]">
        <button onClick={() => setIsARMode(false)} className="p-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all">
          <X className="w-8 h-8" />
        </button>
      </div>
      <div className="w-full h-full relative z-[105]">
        <ThreeViewer state={product} />
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
          <div className="px-6 py-2 bg-black/50 backdrop-blur-xl border border-white/20 rounded-full text-white/70 text-[10px] font-bold tracking-[0.3em] uppercase">
            AR Mode Active
          </div>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-3 px-12 py-5 bg-white text-black rounded-full font-black uppercase text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="w-5 h-5" />
            <span>Snapshot Design</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-['Inter']">
      <nav className="h-20 border-b border-white/5 px-6 lg:px-12 flex items-center justify-between backdrop-blur-3xl sticky top-0 z-[60] bg-black/60">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView('home')}>
          <div className="bg-indigo-600 p-2 rounded-xl"><Shirt className="w-6 h-6" /></div>
          <span className="text-xl font-black uppercase tracking-tighter">Pick'n Prints</span>
        </div>
        <div className="hidden lg:flex items-center gap-10">
          {(['catalog', 'studio', 'archive'] as const).map(v => (
            <button key={v} onClick={() => setCurrentView(v)} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${currentView === v ? 'text-indigo-400' : 'text-white/40 hover:text-white'}`}>
              {v}
            </button>
          ))}
        </div>
        <button className="relative p-3 bg-white/5 border border-white/10 rounded-full hover:bg-indigo-600 transition-all">
          <ShoppingBag className="w-5 h-5" />
          {archivedDesigns.length > 0 && (
            <div className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 rounded-full text-[8px] flex items-center justify-center font-black">
              {archivedDesigns.length}
            </div>
          )}
        </button>
      </nav>

      {currentView === 'home' && (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[200px] rounded-full" />
          <div className="relative z-10 max-w-4xl space-y-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">
              <Zap className="w-4 h-4" /> Original 3D Studio
            </div>
            <h1 className="text-6xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.8]">Style is <span className="text-indigo-600">Personal.</span></h1>
            <p className="text-white/40 uppercase tracking-[0.2em] max-w-xl mx-auto text-sm lg:text-lg">Premium Toy-Style 3D Customization.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button onClick={() => setCurrentView('studio')} className="px-12 py-6 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all flex items-center gap-3">Open Studio <MoveRight /></button>
              <button onClick={() => setCurrentView('catalog')} className="px-12 py-6 border border-white/10 bg-white/5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Explore Drops</button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'catalog' && (
        <div className="flex-1 overflow-y-auto p-6 lg:p-20 space-y-12 animate-in fade-in duration-700">
          <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter italic">Featured Drops.</h2>
            <p className="text-white/40 uppercase text-xs tracking-widest font-bold">Curated architectural base layers.</p>
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {catalogItems.map(item => (
              <div key={item.id} className="group relative bg-white/5 border border-white/5 rounded-[40px] overflow-hidden hover:border-indigo-500/30 transition-all">
                <div className="aspect-[4/5] p-10 flex items-center justify-center relative">
                  <div className="w-48 h-48 rounded-full blur-[80px] absolute opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: item.color }} />
                  <Shirt className="w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" style={{ color: item.color }} />
                </div>
                <div className="p-8 space-y-4 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">{item.name}</h3>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{item.type.replace('_', ' ')}</p>
                    </div>
                    <div className="text-xl font-black text-indigo-400">{item.price}</div>
                  </div>
                  <button onClick={() => loadFromCatalog(item)} className="w-full py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Customize</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'studio' && (
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 h-[calc(100vh-80px)] overflow-hidden">
          <div className="lg:col-span-4 border-r border-white/5 bg-[#080808] flex flex-col overflow-hidden">
            <div className="p-8 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tighter uppercase">Studio.</h2>
                <button onClick={() => setProduct({ ...product, logos: { front: null, back: null, leftSleeve: null, rightSleeve: null }, color: '#FBFBFB', lightness: 98, type: 'long_sleeve' })} className="p-3 text-white/20 hover:text-white transition-colors"><RotateCcw className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-2xl border border-white/5">
                {(['basics', 'design', 'presets'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-white/30 hover:text-white'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              {activeTab === 'basics' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <section className="space-y-6">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Fit Selection</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['polo', 'shirt', 'long_sleeve', 'hoodie'] as const).map(t => (
                        <button key={t} onClick={() => setProduct({ ...product, type: t })} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${product.type === t ? 'border-indigo-600 bg-indigo-600/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                          <Shirt className={`w-6 h-6 ${product.type === t ? 'text-indigo-400' : 'text-white/20'}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{t.replace('_', ' ')}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="space-y-6">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Fabric Tone</label>
                    <PhotoshopPicker state={product} onChange={(hex, h, s, l) => setProduct({ ...product, color: hex, hue: h, saturation: s, lightness: l })} />
                  </section>
                  <section className="space-y-6">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Material Finish</label>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between text-[9px] font-black uppercase">
                          <span className="text-white/40">Texture Intensity</span>
                          <span className="text-indigo-400">{Math.round(product.textureIntensity * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.01" 
                          value={product.textureIntensity} 
                          onChange={e => setProduct({ ...product, textureIntensity: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[9px] font-black uppercase">
                          <span className="text-white/40">Roughness</span>
                          <span className="text-indigo-400">{Math.round(product.roughness * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.01" 
                          value={product.roughness} 
                          onChange={e => setProduct({ ...product, roughness: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[9px] font-black uppercase">
                          <span className="text-white/40">Logo Scale</span>
                          <span className="text-indigo-400">{Math.round(product.logoScale * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0.1" max="1" step="0.01" 
                          value={product.logoScale} 
                          onChange={e => setProduct({ ...product, logoScale: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    </div>
                  </section>
                </div>
              )}
              {activeTab === 'design' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="p-6 bg-indigo-500/10 border border-indigo-500/30 rounded-[32px] space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <Scan className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">AR Preview Available</span>
                    </div>
                    <p className="text-[9px] text-white/40 uppercase font-bold">Instantly view this design on your own body using the back camera.</p>
                    <button 
                      onClick={() => setIsARMode(true)}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group shadow-lg shadow-indigo-600/20"
                    >
                      <Camera className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      View in your space
                    </button>
                  </div>

                  {(['front', 'back', 'leftSleeve', 'rightSleeve'] as const).map(pos => (
                    <div key={pos} className="group p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-black rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
                          {product.logos[pos] ? <img src={product.logos[pos]!} className="w-full h-full object-contain" /> : <Upload className="w-6 h-6 text-white/10" />}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest block">{pos}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {product.logos[pos] && (
                          <button onClick={() => setAiModal({ open: true, pos, prompt: '', loading: false })} className="p-4 bg-indigo-600/20 text-indigo-400 rounded-2xl hover:bg-indigo-600 transition-all">
                            <Wand2 className="w-4 h-4" />
                          </button>
                        )}
                        <label className="p-4 bg-white/10 rounded-2xl cursor-pointer hover:bg-white hover:text-black transition-all">
                          <Plus className="w-4 h-4" />
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, pos)} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'presets' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <button onClick={handleGenerateIdeas} disabled={aiSuggestions.loading} className="w-full p-8 bg-indigo-600 rounded-3xl flex flex-col items-center gap-4 hover:scale-[1.02] transition-all disabled:opacity-50">
                    {aiSuggestions.loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8" />}
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">AI Concept Generator</span>
                  </button>
                  <div className="space-y-4">
                    {aiSuggestions.data.map((idea, idx) => (
                      <div key={idx} className="p-6 bg-white/5 border border-white/5 rounded-[32px] hover:border-indigo-500/30 transition-all">
                        <h4 className="text-sm font-black uppercase tracking-tighter mb-2">{idea.title}</h4>
                        <div className="flex gap-2 mb-4">
                          {idea.palette.map(c => <div key={c} className="w-6 h-6 rounded-full" style={{ backgroundColor: c }} />)}
                        </div>
                        <p className="text-[10px] text-white/40 leading-relaxed uppercase font-medium">{idea.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 border-t border-white/5 bg-black/40">
              <button onClick={saveToArchive} disabled={orderStatus !== 'idle'} className={`w-full py-6 rounded-full font-black uppercase tracking-[0.4em] text-xs transition-all ${orderStatus === 'success' ? 'bg-green-600' : 'bg-white text-black hover:scale-[1.02]'}`}>
                {orderStatus === 'idle' ? 'COMMIT TO ARCHIVE' : orderStatus === 'processing' ? 'ARCHIVING...' : 'SAVED'}
              </button>
            </div>
          </div>
          <div className="lg:col-span-8 relative bg-[#0a0a0a] flex flex-col h-full overflow-hidden">
            <div className="absolute top-8 left-8 z-20 flex items-center gap-4 bg-white/5 px-6 py-2.5 rounded-full border border-white/10 backdrop-blur-3xl">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60">LIVE_RENDER_4K</span>
            </div>
            <div className="absolute top-8 right-8 z-20 flex items-center gap-3">
              <button onClick={() => setShowQR(true)} className="p-3.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all"><Smartphone className="w-4 h-4" /></button>
              <button onClick={handleDownload} className="p-3.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all"><Download className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 relative flex items-center justify-center">
              <div className="w-full h-full max-h-[85vh]">
                <ThreeViewer state={product} />
              </div>
              
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
                <button 
                  onClick={() => setIsARMode(true)} 
                  className="group relative flex items-center gap-4 px-10 py-5 bg-black/40 backdrop-blur-3xl border border-white/20 rounded-[40px] text-white transition-all hover:bg-black/60 hover:scale-105 active:scale-95 shadow-2xl"
                >
                  <div className="absolute inset-0 rounded-[40px] bg-indigo-500/10 animate-pulse pointer-events-none" />
                  <div className="flex items-center justify-center border border-white/30 rounded-2xl p-3 bg-indigo-600 shadow-lg shadow-indigo-600/40 group-hover:rotate-3 transition-transform">
                    <Scan className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="tracking-tight text-white font-black uppercase text-[10px] leading-tight mb-0.5">Live Try-On</span>
                    <span className="text-white/60 font-medium text-[11px]">View in your space</span>
                  </div>
                  <div className="ml-2 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'archive' && (
        <div className="flex-1 overflow-y-auto p-6 lg:p-20 space-y-12 animate-in fade-in duration-700">
          <div className="max-w-7xl mx-auto flex justify-between items-end">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter italic">Personal Archive.</h2>
              <p className="text-white/40 uppercase text-xs tracking-widest font-bold">Your collection.</p>
            </div>
            {archivedDesigns.length > 0 && (
              <button onClick={() => setArchivedDesigns([])} className="px-6 py-3 border border-red-500/20 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Clear All</button>
            )}
          </div>
          {archivedDesigns.length === 0 ? (
            <div className="max-w-7xl mx-auto h-[400px] border border-white/5 bg-white/5 rounded-[64px] flex flex-col items-center justify-center space-y-6 text-center">
              <History className="w-8 h-8 text-white/20" />
              <p className="text-white/30 uppercase text-[10px] tracking-[0.2em] font-bold">No designs saved.</p>
              <button onClick={() => setCurrentView('studio')} className="px-10 py-5 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">Go to Studio</button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {archivedDesigns.map((design, idx) => (
                <div key={idx} className="group relative bg-white/5 border border-white/5 rounded-[40px] overflow-hidden hover:border-indigo-500/30 transition-all duration-500">
                  <div className="aspect-square p-10 flex items-center justify-center relative bg-black/40">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundColor: design.color }} />
                    <Shirt className="w-24 h-24 group-hover:scale-110 transition-transform duration-700" style={{ color: design.color }} />
                  </div>
                  <div className="p-8 space-y-6 border-t border-white/5 bg-black/60 backdrop-blur-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-tight">#{idx + 101}</h3>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">{design.type}</p>
                      </div>
                      <button onClick={() => removeFromArchive(idx)} className="p-3 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => { setProduct(design); setCurrentView('studio'); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Edit</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {aiModal.open && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-[#111] border border-white/10 rounded-[48px] overflow-hidden shadow-2xl">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-indigo-400">
                    <Wand2 className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gemini Alchemy</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Transform Graphic</h3>
                </div>
                <button onClick={() => setAiModal({ open: false, pos: null, prompt: '', loading: false })} className="p-4 bg-white/5 rounded-full hover:bg-white transition-all"><X className="w-5 h-5" /></button>
              </div>
              <textarea 
                value={aiModal.prompt}
                onChange={e => setAiModal({ ...aiModal, prompt: e.target.value })}
                placeholder="Style prompt..."
                className="w-full bg-black/50 border border-white/10 rounded-3xl p-6 text-sm text-white focus:border-indigo-500 transition-all outline-none resize-none h-32"
              />
              <button onClick={handleAIEdit} disabled={aiModal.loading || !aiModal.prompt} className="w-full py-6 bg-indigo-600 text-white rounded-full font-black uppercase tracking-widest text-xs disabled:opacity-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-4">
                {aiModal.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {aiModal.loading ? 'ANALYZING...' : 'APPLY ALCHEMY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 p-12 rounded-[64px] text-center space-y-8 shadow-2xl">
            <h3 className="text-3xl font-black uppercase tracking-tighter">Sync Studio</h3>
            <div className="p-8 bg-white rounded-[40px] inline-block">
              <QRCodeSVG value={window.location.href} size={220} level="H" />
            </div>
            <button onClick={() => setShowQR(false)} className="w-full py-6 border border-white/10 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all">Close Sync</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
