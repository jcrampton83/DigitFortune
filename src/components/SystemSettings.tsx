import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Cpu, 
  Laptop, 
  Check, 
  Sparkles, 
  Trash2, 
  Save, 
  ShieldAlert, 
  Flame, 
  X, 
  Layout, 
  Type, 
  ChevronRight, 
  MousePointerClick, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { ComputeSpecs, CustomTheme, GameCardTheme } from '../types';

interface SystemSettingsProps {
  specs: ComputeSpecs;
  setSpecs: (specs: ComputeSpecs) => void;
  theme: CustomTheme;
  setTheme: (theme: CustomTheme) => void;
  savedThemes: CustomTheme[];
  setSavedThemes: (themes: CustomTheme[]) => void;
}

export default function SystemSettings({
  specs,
  setSpecs,
  theme,
  setTheme,
  savedThemes,
  setSavedThemes,
}: SystemSettingsProps) {
  // specs editing state
  const [cpuVal, setCpuVal] = useState(specs.cpuModel);
  const [gpuVal, setGpuVal] = useState(specs.gpuModel);
  const [ramVal, setRamVal] = useState(specs.ramSize || '8GB');
  const [coolingVal, setCoolingVal] = useState(specs.coolingType || 'air');
  const [psuVal, setPsuVal] = useState(specs.psuCapacity || '550W');
  const [isSpecsSavedSuccessfully, setIsSpecsSavedSuccessfully] = useState(false);

  // current editing theme states
  const [themeName, setThemeName] = useState(theme.name);
  const [bgColor, setBgColor] = useState(theme.background.color);
  const [bgImg, setBgImg] = useState(theme.background.imageUrl);
  const [bgUseImg, setBgUseImg] = useState(theme.background.useImage);
  const [tintColor, setTintColor] = useState(theme.additionalCardsColor);
  const [chosenFont, setChosenFont] = useState(theme.fontFamily);

  // modal for game card creation cycle
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(0); // 0: slots, 1: blackjack, 2: crash, 3: roulette
  const [modalCardColor, setModalCardColor] = useState('#090918');
  const [modalCardImg, setModalCardImg] = useState('');
  const [modalCardUseImg, setModalCardUseImg] = useState(false);

  // theme deletion confirmation modal
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [themeToDeleteId, setThemeToDeleteId] = useState<string | null>(null);

  // thermal limit (extra feature idea)
  const [thermalLimit, setThermalLimit] = useState(() => {
    return parseInt(localStorage.getItem('sys_thermal_limit') || '80');
  });
  const [autoThermalShutdown, setAutoThermalShutdown] = useState(() => {
    return localStorage.getItem('sys_thermal_shutdown') !== 'false';
  });

  // sync temp values to state when theme changes
  useEffect(() => {
    setThemeName(theme.name);
    setBgColor(theme.background.color);
    setBgImg(theme.background.imageUrl);
    setBgUseImg(theme.background.useImage);
    setTintColor(theme.additionalCardsColor);
    setChosenFont(theme.fontFamily);
  }, [theme]);

  // Handle Specs Save
  const handleSaveSpecs = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      cpuModel: cpuVal,
      gpuModel: gpuVal,
      ramSize: ramVal,
      coolingType: coolingVal as 'air' | 'liquid',
      psuCapacity: psuVal,
      isConfigured: !!(cpuVal && gpuVal),
    };
    setSpecs(updated);
    setIsSpecsSavedSuccessfully(true);
    setTimeout(() => setIsSpecsSavedSuccessfully(false), 2500);
  };

  // Handle background image upload
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setBgImg(reader.result);
          setBgUseImg(true);
          // Auto apply change to current active editing state
          applyLiveChanges({
            ...theme,
            background: {
              ...theme.background,
              imageUrl: reader.result,
              useImage: true,
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearBgImage = () => {
    setBgImg('');
    setBgUseImg(false);
    applyLiveChanges({
      ...theme,
      background: {
        ...theme.background,
        imageUrl: '',
        useImage: false,
      }
    });
  };

  // Helper to instantly update the active parent theme on changes
  const applyLiveChanges = (updated: CustomTheme) => {
    setTheme(updated);
  };

  // Font choices listing
  const FONTS_LIST = [
    { label: 'Standard Clean (Inter)', family: 'Inter, system-ui, sans-serif' },
    { label: 'Geometric Grid (Outfit)', family: "'Outfit', 'Inter', sans-serif" },
    { label: 'Modular Console (JetBrains Mono)', family: "'JetBrains Mono', monospace" },
    { label: 'Cyber Syndicate (Orbitron)', family: "'Orbitron', sans-serif" },
    { label: 'Industrial Grid (Share Tech)', family: "'Share Tech', sans-serif" },
    { label: 'Editorial Luxury (Playfair Display)', family: "'Playfair Display', serif" },
    { label: 'Artsy Avant-Garde (Syne)', family: "'Syne', sans-serif" },
  ];

  // Initiate Game Cards Pop-up Flow
  const startCardsCustomization = () => {
    setModalStep(0);
    // Seed step editing values with slot cards' current values
    const firstGameId = 'slots';
    const firstGameSettings = theme.cards[firstGameId];
    setModalCardColor(firstGameSettings?.color || '#090918');
    setModalCardImg(firstGameSettings?.imageUrl || '');
    setModalCardUseImg(firstGameSettings?.useImage || false);
    setIsCardModalOpen(true);
  };

  // Modal Next Step
  const handleModalCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setModalCardImg(reader.result);
          setModalCardUseImg(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalNext = () => {
    const gameKeys: ('slots' | 'blackjack' | 'crash' | 'roulette')[] = ['slots', 'blackjack', 'crash', 'roulette'];
    const currentKey = gameKeys[modalStep];

    const currentCardSettings: GameCardTheme = {
      color: modalCardColor,
      imageUrl: modalCardImg,
      useImage: modalCardUseImg,
    };

    const newCardsTheme = {
      ...theme.cards,
      [currentKey]: currentCardSettings,
    };

    const updatedTheme: CustomTheme = {
      ...theme,
      cards: newCardsTheme,
    };

    applyLiveChanges(updatedTheme);

    // Go to next, or done!
    if (modalStep < 3) {
      const nextStep = modalStep + 1;
      setModalStep(nextStep);
      const nextKey = gameKeys[nextStep];
      const nextGameSettings = theme.cards[nextKey];
      setModalCardColor(nextGameSettings?.color || '#090918');
      setModalCardImg(nextGameSettings?.imageUrl || '');
      setModalCardUseImg(nextGameSettings?.useImage || false);
    } else {
      setIsCardModalOpen(false);
    }
  };

  // Real-time application triggers for slide wheels
  const handleBgColorChange = (color: string) => {
    setBgColor(color);
    applyLiveChanges({
      ...theme,
      background: {
        ...theme.background,
        color: color,
      }
    });
  };

  const handleTintColorChange = (color: string) => {
    setTintColor(color);
    applyLiveChanges({
      ...theme,
      additionalCardsColor: color,
    });
  };

  const handleFontChange = (font: string) => {
    setChosenFont(font);
    applyLiveChanges({
      ...theme,
      fontFamily: font,
    });
  };

  // Theme saves / dropdown
  const handleSaveTheme = () => {
    // Cannot overwrite active default name
    if (theme.isDefault && themeName === 'Default Cyber-Slate') {
      alert("The Default theme is locked and cannot be edited. Enter a new name to save as a custom theme.");
      return;
    }

    const themeToSave: CustomTheme = {
      id: theme.isDefault ? `theme-${Date.now()}` : theme.id,
      name: themeName === 'Default Cyber-Slate' ? `Aesthetic Preset ${savedThemes.length + 1}` : themeName,
      background: {
        color: bgColor,
        imageUrl: bgImg,
        useImage: bgUseImg,
      },
      cards: { ...theme.cards },
      additionalCardsColor: tintColor,
      fontFamily: chosenFont,
    };

    // Filter out overwrite or limit to 5
    let updatedThemesList = savedThemes.filter(t => t.id !== themeToSave.id);
    if (updatedThemesList.length >= 5) {
      // Remove oldest
      updatedThemesList.shift();
    }
    updatedThemesList = [...updatedThemesList, themeToSave];

    setSavedThemes(updatedThemesList);
    setTheme(themeToSave); // Make newly saved theme active
    alert(`Theme "${themeToSave.name}" has been successfully saved to your system list.`);
  };

  // Handle Deletion Triggers
  const triggerDeleteTheme = () => {
    if (theme.isDefault) {
      // Default theme is locked, can't delete
      return;
    }
    setThemeToDeleteId(theme.id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteTheme = () => {
    if (themeToDeleteId) {
      const remaining = savedThemes.filter(t => t.id !== themeToDeleteId);
      setSavedThemes(remaining);
      // Reset active theme to default
      const defaultTheme = {
        id: 'default',
        name: 'Default Cyber-Slate',
        isDefault: true,
        background: { color: '#050510', imageUrl: '', useImage: false },
        cards: {
          slots: { color: '#090918', imageUrl: '', useImage: false },
          blackjack: { color: '#090918', imageUrl: '', useImage: false },
          crash: { color: '#090918', imageUrl: '', useImage: false },
          roulette: { color: '#090918', imageUrl: '', useImage: false }
        },
        additionalCardsColor: '#3b82f6',
        fontFamily: 'Inter, system-ui, sans-serif'
      };
      setTheme(defaultTheme);
    }
    setIsDeleteConfirmOpen(false);
    setThemeToDeleteId(null);
  };

  const selectThemeFromList = (id: string) => {
    if (id === 'default') {
      setTheme({
        id: 'default',
        name: 'Default Cyber-Slate',
        isDefault: true,
        background: { color: '#050510', imageUrl: '', useImage: false },
        cards: {
          slots: { color: '#090918', imageUrl: '', useImage: false },
          blackjack: { color: '#090918', imageUrl: '', useImage: false },
          crash: { color: '#090918', imageUrl: '', useImage: false },
          roulette: { color: '#090918', imageUrl: '', useImage: false }
        },
        additionalCardsColor: '#3b82f6',
        fontFamily: 'Inter, system-ui, sans-serif'
      });
      return;
    }
    const found = savedThemes.find(t => t.id === id);
    if (found) {
      setTheme(found);
    }
  };

  // Extra ideas handles
  const handleThermalLimitChange = (val: number) => {
    setThermalLimit(val);
    localStorage.setItem('sys_thermal_limit', val.toString());
  };

  const toggleThermalShutdown = () => {
    const nextVal = !autoThermalShutdown;
    setAutoThermalShutdown(nextVal);
    localStorage.setItem('sys_thermal_shutdown', nextVal.toString());
  };

  // Get current card name for modal design progress
  const gameNames = ['Grid Cycle Slots', 'Grid Proof Blackjack', 'Grid Vektr Crash', 'Grid Cycle Roulette'];

  return (
    <div className="space-y-6 relative z-10" id="system-settings-panel">
      {/* Dynamic Theme Styles Override applied on additional cards if tinted */}
      <style>{`
        /* Dynamic card tint rules generated on-the-fly for pristine craftsmanship */
        .glass-container {
          background-color: ${tintColor}0a !important;
          border-color: ${tintColor}30 !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45), 0 0 16px ${tintColor}0b !important;
        }
        .glass-sub {
          background-color: rgba(0, 0, 0, 0.35) !important;
          border-color: ${tintColor}1a !important;
        }
        .glow-cyan {
          text-shadow: 0 0 10px ${tintColor}aa, 0 0 2px ${tintColor}55 !important;
        }
        .text-cyan-400 {
          color: ${tintColor} !important;
        }
        .border-cyan-400 {
          border-color: ${tintColor} !important;
        }
      `}</style>

      {/* Main Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 bg-black/50 border border-white/5 rounded-2xl gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg">
            <Settings className="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black tracking-tight text-white uppercase">Control & Calibration Hub</h2>
            <p className="text-xs text-slate-400 font-mono">Calibrate PoW power parameters, thermal safeguard limits & user environment designs</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Active Theme Profile:</span>
          <select
            value={theme.id}
            onChange={(e) => selectThemeFromList(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg p-2.5 font-mono text-[11px] text-cyan-400 focus:outline-none focus:border-cyan-500"
          >
            <option value="default">Default Cyber-Slate (Locked)</option>
            {savedThemes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Hardware Calibration Specs & Temp Protector (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* HARDWARE OPTIMIZATION FORM */}
          <div className="glass-container rounded-2xl p-6 relative overflow-hidden" id="hardware-specs-block">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center space-x-2.5 mb-5">
              <Laptop className="h-5 w-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-white">Grid Hardware Profile</h3>
                <p className="text-[10px] text-slate-400">Taylor node workload cycles to prevent cooling overload</p>
              </div>
            </div>

            <form onSubmit={handleSaveSpecs} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1.5">CPU Model Specifications</label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Intel Core i7-13700H / AMD Ryzen 9"
                    value={cpuVal}
                    onChange={(e) => setCpuVal(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1.5">Dedicated GPU Hardware</label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. NVIDIA RTX 4070 Laptop GPU"
                    value={gpuVal}
                    onChange={(e) => setGpuVal(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1.5">System Memory</label>
                  <select
                    value={ramVal}
                    onChange={(e) => setRamVal(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="8GB">8 GB DDR4/5</option>
                    <option value="16GB">16 GB DDR4/5</option>
                    <option value="32GB">32 GB DualChannel</option>
                    <option value="64GB">64 GB HighBandwidth</option>
                    <option value="128GB+">128 GB+ Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1.5">Cooling Layout</label>
                  <select
                    value={coolingVal}
                    onChange={(e) => setCoolingVal(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="air">Air Cooler Vent</option>
                    <option value="liquid">Liquid Radiator AIO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1.5">Power Supply Output</label>
                <input
                  type="text"
                  placeholder="e.g. 750W Platinum"
                  value={psuVal}
                  onChange={(e) => setPsuVal(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono font-bold tracking-wider uppercase text-xs py-3 rounded-xl cursor-pointer transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" /> Apply Dynamic Specifications
                </button>
              </div>

              {isSpecsSavedSuccessfully && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl flex items-center gap-2 animate-fade">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] font-mono text-emerald-400">PROFILE SAVED: Slower safe limits removed. Hardware calibrated!</p>
                </div>
              )}
            </form>

            <div className="mt-4 p-3.5 bg-yellow-500/5 border border-yellow-500/15 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-[10px] font-mono leading-normal text-yellow-500/90">
                {!specs.isConfigured ? (
                  <p><strong>SAFEGUARD PROFILE ACTIVE:</strong> Your computer specs are currently unidentified. Workload engines defaults to an eco-conservative pace (Cores capped at 1, Intensity capped at 30%) to prevent heating damage.</p>
                ) : (
                  <p><strong>PROFILE ACTIVE:</strong> High-performance threads unlocked. Keep eye on live chip heat sensor logs.</p>
                )}
              </div>
            </div>
          </div>

          {/* SMART IN-SITE THERMAL PROTECTION (Extra Idea) */}
          <div className="glass-container rounded-2xl p-6 relative overflow-hidden" id="thermal-guard-block">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center space-x-2.5 mb-4">
              <Flame className="h-5 w-5 text-orange-400" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-white">Smart Thermal Protection</h3>
                <p className="text-[10px] text-slate-400">Emergency auto-cooldown control parameters</p>
              </div>
            </div>

            <div className="space-y-4 font-mono">
              <div className="flex items-center justify-between p-3 bg-black/35 rounded-xl border border-white/5">
                <div>
                  <span className="block text-xs font-bold text-white">Automatic Thermal Shutdown</span>
                  <span className="text-[9px] text-slate-550 leading-none">Terminate Cores when chip hits threshold</span>
                </div>
                <button
                  type="button"
                  onClick={toggleThermalShutdown}
                  className={`w-12 h-6 rounded-full p-0.5 transition-all outline-none relative cursor-pointer flex items-center ${autoThermalShutdown ? 'bg-orange-500 shadow-glow-cyan/20' : 'bg-slate-800'}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-white transition-all shadow-md transform ${autoThermalShutdown ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-400">Emergency Core Cutoff Temp</span>
                  <span className="text-orange-400 font-bold">{thermalLimit}°C</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={thermalLimit}
                  disabled={!autoThermalShutdown}
                  onChange={(e) => handleThermalLimitChange(parseInt(e.target.value))}
                  className="w-full accent-orange-400 h-1.5 bg-white/10 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>60°C (Safe limit)</span>
                  <span>95°C (Extreme throttle)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Theme Design Engine & Editor (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-container rounded-2xl p-6 relative overflow-hidden" id="theme-editor-block">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2.5">
                <Layout className="h-5 w-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-white">Theme Creation Engine</h3>
                  <p className="text-[10px] text-slate-400">Design dynamic layouts, custom card filters, and vector spacing</p>
                </div>
              </div>
              <span className="text-[9px] font-mono uppercase bg-purple-500/15 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md">
                Live editor
              </span>
            </div>

            <div className="space-y-5">
              
              {/* Theme Name input */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <label className="block text-[10px] font-mono font-bold text-slate-450 uppercase mb-1.5">Theme Profile Name</label>
                <input
                  type="text"
                  placeholder="Creative Cyberpunk Theme"
                  disabled={theme.isDefault}
                  value={themeName}
                  onChange={(e) => {
                    setThemeName(e.target.value);
                    applyLiveChanges({ ...theme, name: e.target.value });
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {theme.isDefault && (
                  <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase">⚠️ Change custom name to unlock editable template copies</p>
                )}
              </div>

              {/* Background Color & Image option */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Background option (color/image) */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                  <span className="block text-[10px] font-mono font-bold text-slate-450 uppercase">Grid Block Background</span>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => handleBgColorChange(e.target.value)}
                      className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded-full overflow-hidden"
                      title="Select background block solid tint color"
                    />
                    <div className="text-[10px] font-mono">
                      <span className="block text-white font-bold">{bgColor.toUpperCase()}</span>
                      <span className="text-slate-500 uppercase">Interactive color wheel</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/5" />

                  {/* Image upload */}
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-mono text-slate-400">Or overlay custom banner image:</span>
                    {bgImg ? (
                      <div className="flex items-center justify-between p-2 rounded bg-black/50 border border-white/15">
                        <span className="text-[10px] font-mono text-cyan-400 truncate max-w-[70%]">Image Configured ✓</span>
                        <button
                          type="button"
                          onClick={clearBgImage}
                          className="hover:text-red-400 text-slate-500 transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center p-2.5 rounded-lg border border-dashed border-white/15 hover:border-cyan-505/30 hover:bg-white/[0.01] transition-all cursor-pointer font-mono text-[10px] text-slate-400">
                        Upload Image Banner
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBgImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Additional Cards Custom Tint Color */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                  <span className="block text-[10px] font-mono font-bold text-slate-450 uppercase">General Card Tint</span>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={tintColor}
                      onChange={(e) => handleTintColorChange(e.target.value)}
                      className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded-full overflow-hidden"
                      title="Select additional site cards solid accent tint"
                    />
                    <div className="text-[10px] font-mono">
                      <span className="block text-white font-bold">{tintColor.toUpperCase()}</span>
                      <span className="text-slate-500 uppercase">Overall cards color wheel</span>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-500 font-mono leading-relaxed mt-2 uppercase">tints all core parameters displays, ledgers counters, and security tabs to a beautiful customized hue.</p>
                </div>

              </div>

              {/* UNIVERSAL FONT FAMILY OVERRIDE */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center space-x-1.5 mb-2">
                  <Type className="h-4 w-4 text-purple-400" />
                  <span className="block text-[10px] font-mono font-bold text-slate-450 uppercase">Universal System Font Style</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {FONTS_LIST.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleFontChange(f.family)}
                      style={{ fontFamily: f.family }}
                      className={`p-2 rounded-lg text-left text-[11px] border transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer ${chosenFont === f.family ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 font-semibold' : 'bg-black/40 border-white/5 text-slate-450 hover:text-white hover:border-white/10'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* POP-UP GAME CARDS DESIGN SEQUENCE FLOATER BUTTON */}
              <div className="p-5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-indigo-505/20 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                    <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" /> Game Cards Customization Sequence
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">Change the visual colors or background banners for all 4 available casino lobby wager games step-by-step.</p>
                </div>
                <button
                  type="button"
                  onClick={startCardsCustomization}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-400/30 font-mono text-[10px] font-bold uppercase tracking-wider text-white rounded-xl shadow-md cursor-pointer transition-colors shrink-0 flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                >
                  Configure Cards <MousePointerClick className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* SAVE / REMOVE FOOTER ACTIONS */}
              <div className="h-px bg-white/5 pt-2" />
              <div className="flex items-center justify-between gap-4 pt-1">
                <button
                  type="button"
                  onClick={handleSaveTheme}
                  className="flex-1 bg-cyan-650 hover:bg-cyan-600 border border-cyan-450/40 py-3 rounded-xl font-mono text-[11px] font-bold text-white uppercase tracking-wider cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4 text-cyan-400" /> Save Theme Preset
                </button>

                <button
                  type="button"
                  onClick={triggerDeleteTheme}
                  disabled={theme.isDefault}
                  className={`flex-1 border py-3 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${theme.isDefault ? 'border-white/5 text-slate-650 cursor-not-allowed bg-transparent' : 'bg-red-500/10 border-red-505/20 text-red-400 hover:bg-red-500/20 cursor-pointer shadow-md'}`}
                >
                  <Trash2 className="h-4 w-4" /> Delete Active Theme
                </button>
              </div>

              {/* Reset All Settings Button */}
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to reset all settings? This will clear compute specs, active theme, and current performance metrics. Lifetime totals remain unchanged.")) {
                    localStorage.removeItem('sys_compute_specs');
                    localStorage.removeItem('sys_active_theme');
                    localStorage.setItem('sys_ledger_reset_timestamp', Date.now().toString());
                    window.location.reload();
                  }
                }}
                className="w-full mt-4 bg-red-650/80 hover:bg-red-600 border border-red-400/30 py-3 rounded-xl font-mono text-[11px] font-bold text-white uppercase tracking-wider cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Reset All Settings
              </button>

            </div>
          </div>
        </div>

      </div>

      {/* STEP-BY-STEP GAME CARD CUSTOMIZER POP-UP MODAL (CYCLE FLOW) */}
      {isCardModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#090918] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-fade font-sans text-neutral-100">
            {/* Modal headers */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-mono font-extrabold tracking-widest text-cyan-400 uppercase bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded">
                STEP {modalStep + 1} OF 4
              </span>
              <button 
                onClick={() => setIsCardModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Game title */}
            <h3 className="text-base font-bold text-white font-display uppercase tracking-tight mb-0.5">
              Customize Game Card Backplane
            </h3>
            <p className="text-[10px] text-cyan-400 font-mono mb-6 uppercase tracking-wider">
              {gameNames[modalStep]} Card Design Settings
            </p>

            <div className="space-y-6">
              
              {/* Card visual live PREVIEW mock */}
              <div className="p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between border min-h-[140px]"
                style={{ 
                  backgroundColor: modalCardColor,
                  borderColor: modalCardUseImg ? 'rgba(255,255,255,0.15)' : `${modalCardColor}88`,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 10px ${modalCardColor}44`
                }}
              >
                {modalCardUseImg && modalCardImg && (
                  <img
                    src={modalCardImg}
                    alt="Custom preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase tracking-widest">
                    ACTIVE PREVIEW
                  </span>
                  <p className="text-sm font-bold text-white mt-2 font-display">{gameNames[modalStep]}</p>
                </div>

                <div className="relative z-10 border-t border-white/5 pt-2 mt-4 text-[9px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Wager limits: safe</span>
                  <span className="text-cyan-400 font-bold uppercase flex items-center">Play Game <ChevronRight className="h-2.5 w-2.5" /></span>
                </div>
              </div>

              {/* Color Picker option */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Card Color Wheel</span>
                  <button
                    type="button"
                    onClick={() => {
                      setModalCardUseImg(false);
                    }}
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors ${!modalCardUseImg ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold' : 'bg-transparent text-slate-500 border-transparent'}`}
                  >
                    Use Solid
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={modalCardColor}
                    onChange={(e) => {
                      setModalCardColor(e.target.value);
                    }}
                    className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded-full overflow-hidden"
                  />
                  <div className="text-[10px] font-mono">
                    <span className="block text-white font-black">{modalCardColor.toUpperCase()}</span>
                    <span className="text-slate-500 uppercase">Interactive palette picker</span>
                  </div>
                </div>
              </div>

              {/* Background Image Upload */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Custom Image Overlap</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (modalCardImg) {
                        setModalCardUseImg(true);
                      } else {
                        alert("Please upload a card image banner first.");
                      }
                    }}
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors ${modalCardUseImg ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold' : 'bg-transparent text-slate-500 border-transparent'}`}
                  >
                    Use Image
                  </button>
                </div>

                {modalCardImg ? (
                  <div className="flex items-center justify-between p-2 rounded bg-black/50 border border-white/10">
                    <span className="text-[9px] font-mono text-cyan-400 truncate max-w-[70%]">Design Image Attached ✓</span>
                    <button
                      type="button"
                      onClick={() => {
                        setModalCardImg('');
                        setModalCardUseImg(false);
                      }}
                      className="text-red-400 p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center p-2.5 rounded-lg border border-dashed border-white/15 hover:border-cyan-505/30 hover:bg-white/[0.01] transition-all cursor-pointer font-mono text-[9px] text-slate-400">
                    Upload Card Background Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleModalCardImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

            </div>

            {/* Modal progression bottom action */}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleModalNext}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold uppercase tracking-wider text-xs py-3 rounded-xl cursor-pointer transition-colors shadow-lg flex items-center justify-center gap-1.5"
              >
                {modalStep < 3 ? 'Save & Proceed To Next' : 'Done & Conclude Design'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFICATION popup BEFORE theme deletion */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-[#090918] border border-red-500/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-fade text-center font-sans text-neutral-100">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/25 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Confirm Theme Deletion</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you absolutely certain you wish to delete this custom theme preset? This action is irreversible.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 rounded-xl py-2.5 font-mono text-[10px] font-bold uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTheme}
                className="flex-1 bg-red-650 hover:bg-red-600 border border-red-400/30 text-white rounded-xl py-2.5 font-mono text-[10px] font-bold uppercase"
              >
                Delete Preset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
