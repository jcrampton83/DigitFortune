import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Cpu, Flame, Play, Square, Activity, HelpCircle, Sliders, Laptop, Coins, ShieldCheck, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { MiningStats, Transaction, ComputeSpecs } from '../types';

interface ComputeGridProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  addTransaction: (tx: Transaction) => void;
  miningStats: MiningStats;
  setMiningStats: Dispatch<SetStateAction<MiningStats>>;
  specs?: ComputeSpecs;
}

export default function ComputeGrid({
  balance,
  setBalance,
  addTransaction,
  miningStats,
  setMiningStats,
  specs,
}: ComputeGridProps) {
  const [showDocs, setShowDocs] = useState<boolean>(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState<boolean>(false);
  const workersRef = useRef<Worker[]>([]);
  const lastUpdateRef = useRef<number>(Date.now());
  const [sessionEarned, setSessionEarned] = useState<number>(0);
  const [recentHzHistory, setRecentHzHistory] = useState<number[]>(Array(15).fill(0));

  // Credits conversion rate: 1,000,000 hashes = 1 Game Credit
  const HASH_TO_CREDIT_RATE = 1000000;

  // Web Worker source code blob
  const getWorkerBlobUrl = () => {
    const code = `
      let isRunning = false;
      let timer = null;
      let calculatedCount = 0;
      let intensityDelay = 0;

      self.onmessage = function(e) {
        const { action, intensity } = e.data;
        if (action === 'start') {
          if (isRunning) return;
          isRunning = true;
          calculatedCount = 0;
          intensityDelay = Math.max(0, Math.floor((100 - intensity) * 0.15));

          function calculate() {
            if (!isRunning) return;
            // Simulated grid computing task (workload chunk)
            for (let i = 0; i < 6000; i++) {
              Math.sin(i) * Math.cos(i);
            }
            calculatedCount += 6000;
            
            if (intensityDelay > 0) {
              setTimeout(calculate, intensityDelay);
            } else {
              // Push to micro-task queue instantly
              Promise.resolve().then(calculate);
            }
          }

          calculate();

          timer = setInterval(() => {
            self.postMessage({ type: 'hashreport', amount: calculatedCount });
            calculatedCount = 0;
          }, 1000);

        } else if (action === 'updateIntensity') {
          intensityDelay = Math.max(0, Math.floor((100 - intensity) * 0.15));
        } else if (action === 'stop') {
          isRunning = false;
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          self.postMessage({ type: 'stopped' });
        }
      };
    `;
    const blob = new Blob([code], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  };

  // Manage mining lifecycle
  const toggleMining = () => {
    if (miningStats.isActive) {
      stopAllWorkers();
      setMiningStats(prev => ({ ...prev, isActive: false, hashRate: 0 }));
    } else {
      startAllWorkers();
      setMiningStats(prev => ({ ...prev, isActive: true }));
    }
  };

  const startAllWorkers = () => {
    stopAllWorkers(); // Clear any stale ones
    const blobUrl = getWorkerBlobUrl();
    const newWorkers: Worker[] = [];

    for (let i = 0; i < miningStats.threads; i++) {
      const worker = new Worker(blobUrl);
      worker.onmessage = (e) => {
        if (e.data.type === 'hashreport') {
          const reportAmt = e.data.amount;
          handleHashesMined(reportAmt);
        }
      };
      // Send start message with intensity value
      worker.postMessage({ action: 'start', intensity: miningStats.intensity });
      newWorkers.push(worker);
    }
    workersRef.current = newWorkers;
    URL.revokeObjectURL(blobUrl); // Clean up blob
  };

  const stopAllWorkers = () => {
    workersRef.current.forEach(worker => {
      worker.postMessage({ action: 'stop' });
      worker.terminate();
    });
    workersRef.current = [];
  };

  // Core callback when workers report computed hashes
  const handleHashesMined = (amount: number) => {
    const creditGain = amount / HASH_TO_CREDIT_RATE;
    
    // Update balance & lifetime counters safely outside the nested setter callback
    setBalance(b => b + creditGain);
    setSessionEarned(s => s + creditGain);

    setMiningStats(prev => {
      const updatedTotal = prev.totalHashes + amount;
      return {
        ...prev,
        totalHashes: updatedTotal,
        lifetimeCredits: prev.lifetimeCredits + creditGain,
      };
    });
  };

  // Adjust active thread count
  const handleThreadsChange = (newThreads: number) => {
    setMiningStats(prev => ({ ...prev, threads: newThreads }));
    if (miningStats.isActive) {
      // Restart with new thread count dynamically
      setTimeout(() => {
        startAllWorkers();
      }, 50);
    }
  };

  // Adjust computing intensity
  const handleIntensityChange = (newIntensity: number) => {
    setMiningStats(prev => ({ ...prev, intensity: newIntensity }));
    if (miningStats.isActive) {
      workersRef.current.forEach(worker => {
        worker.postMessage({ action: 'updateIntensity', intensity: newIntensity });
      });
    }
  };

  // Simulate hash rate fluctuations and chart updating while active
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (miningStats.isActive) {
      intervalId = setInterval(() => {
        // Base hash rate correlates to thread count, intensity and a small random jitter
        const baseRate = miningStats.threads * miningStats.intensity * 2400; // hashes per second scale
        const jitter = (Math.random() - 0.5) * (baseRate * 0.15);
        const currentRate = Math.max(0, Math.round(baseRate + jitter));

        setMiningStats(prev => ({ ...prev, hashRate: currentRate }));

        setRecentHzHistory(prev => {
          const next = [...prev.slice(1), currentRate];
          return next;
        });
      }, 1000);
    } else {
      setRecentHzHistory(prev => [...prev.slice(1), 0]);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [miningStats.isActive, miningStats.threads, miningStats.intensity]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllWorkers();
    };
  }, []);

  // Safe-mode throttler when hardware specifications profile is unconfigured
  useEffect(() => {
    if (specs && !specs.isConfigured) {
      if (miningStats.threads > 1 || miningStats.intensity > 30) {
        setMiningStats(prev => ({
          ...prev,
          threads: 1,
          intensity: Math.min(prev.intensity, 30),
        }));
      }
    }
  }, [specs, setMiningStats, miningStats.threads, miningStats.intensity]);

  // Temperature formula modified dynamically if user has Liquid Cooling specs!
  const simulatedTemp = miningStats.isActive
    ? Math.round(
        32 + 
        (miningStats.intensity * (specs?.coolingType === 'liquid' ? 0.22 : 0.32)) + 
        (miningStats.threads * (specs?.coolingType === 'liquid' ? 1.8 : 2.8)) + 
        (Math.random() * 1.5)
      )
    : 28; // Air/liquid cooler base idle temps

  // Emergency core thermal cutoff monitor
  useEffect(() => {
    if (!miningStats.isActive) return;

    const activeLimit = parseInt(localStorage.getItem('sys_thermal_limit') || '80');
    const isShutdownActive = localStorage.getItem('sys_thermal_shutdown') !== 'false';

    if (isShutdownActive && simulatedTemp >= activeLimit) {
      stopAllWorkers();
      setMiningStats(prev => ({ ...prev, isActive: false, hashRate: 0 }));
      
      const emergencyId = `emergency-trip-${Date.now()}`;
      addTransaction({
        id: emergencyId,
        timestamp: new Date().toISOString(),
        type: 'payout_rejected',
        amount: 0,
        title: '⚠️ CRITICAL THERMAL EVENT TRIGGERED',
        details: `Emergency protection shutdown active. Core chip heat spiked to peak limit of ${simulatedTemp}°C (Threshold limits capped at ${activeLimit}°C). Process allocations terminated to protect active hardware.`
      });

      alert(`⚠️ EMERGENCY CORE SAFEGUARD TRIGGERED\n\nYour active CPU/GPU core layout temperature spiked to ${simulatedTemp}°C, exceeding your configured threshold limits of ${activeLimit}°C.\n\nAll background thread operations have been cleanly terminated to protect your physical graphics card and system hardware.`);
    }
  }, [simulatedTemp, miningStats.isActive, setMiningStats, addTransaction]);

  // Check periodically to document heavy sessions to transactions
  useEffect(() => {
    const triggerReportInterval = setInterval(() => {
      if (sessionEarned >= 0.05) {
        addTransaction({
          id: `earn-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'earn',
          amount: parseFloat(sessionEarned.toFixed(4)),
          title: 'Distributed Grid Credits Earned',
          details: `Processed batch of ${((sessionEarned * HASH_TO_CREDIT_RATE) / 1000).toFixed(0)}K security proof hashes.`,
          hashCount: Math.round(sessionEarned * HASH_TO_CREDIT_RATE),
        });
        setSessionEarned(0);
      }
    }, 15000); // Record batch every 15 seconds of work if meaningful

    return () => clearInterval(triggerReportInterval);
  }, [sessionEarned, addTransaction]);

  // Calculate simulated metrics
  const estimatedCreditsPerHour = (miningStats.isActive)
    ? (miningStats.hashRate * 3600) / HASH_TO_CREDIT_RATE
    : 0;


  // SVGs for showing real-time compute spectrum line
  const maxHistory = Math.max(...recentHzHistory, 1);
  const pathData = recentHzHistory
    .map((val, idx) => `${(idx / (recentHzHistory.length - 1)) * 100},${100 - (val / maxHistory) * 85}`)
    .join(' L ');

  return (
    <div className="space-y-6 relative z-10" id="compute-grid-panel">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration & Controls card */}
        <div className={`${isSummaryExpanded ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all duration-300 glass-container rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-between`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl border transition-all ${miningStats.isActive ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse shadow-glow-cyan' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white font-display">Compute Energy Portal</h2>
                <p className="text-xs text-slate-450">Lock your idle cycles into dynamic reward credits</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowDocs(!showDocs)}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
              title="How does this work?"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>

          {showDocs && (
            <div className="mb-6 p-4 glass-sub border border-white/10 rounded-xl text-xs leading-relaxed text-slate-300">
              <p className="font-semibold text-cyan-400 mb-1.5 flex items-center gap-1 glow-cyan">
                <ShieldCheck className="h-3.5 w-3.5" /> Direct browser multithreaded cloud client
              </p>
              This simulator triggers actual background processes called <strong>Web Workers</strong> inside your browser. 
              These threads perform cryptographic computation cycles representing processing work requested by decentralized machine learning pipelines. 
              Each computed proof is registered below as <strong>proof of processing hashes</strong>. For every 1,000,000 proof cycles completed, you earn <strong>1.00 Game Credit</strong> which can be wagered or immediately cashed out to fiat.
            </div>
          )}

          {/* Hardware Protection Safeguard Warning Banner */}
          {!specs?.isConfigured && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs leading-relaxed text-amber-300 flex items-start gap-3 shadow-md animate-fade">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong className="block text-white font-mono uppercase tracking-wider mb-1">⚠️ Hardware protection active (Eco Throttle)</strong>
                Grid client detected an unconfigured device specification profile. Core operations are temporarily locked at conservative safe presets (<strong className="text-white">Cores: 1, Speed limit: 30%</strong>) to prevent graphic cards or ventilations burnout. Calibrate device specs in the <strong className="text-white text-cyan-400 underline cursor-pointer">Systems Settings</strong> (gear icon in the top header) to unleash ultimate multiprocessor power blocks.
              </div>
            </div>
          )}

          {/* Controller core gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Thread Slider */}
            <div className={`glass-sub p-4 rounded-xl transition-all duration-300 ${!specs?.isConfigured ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-3 font-mono">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Laptop className="h-3.5 w-3.5 text-cyan-400" /> Allocated Cores
                </span>
                <span className="text-sm font-semibold text-cyan-400 glow-cyan">
                  {miningStats.threads} {miningStats.threads === 1 ? 'Core' : 'Cores'}
                  {!specs?.isConfigured && ' (Locked)'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={Math.max(4, navigator.hardwareConcurrency || 8)}
                value={miningStats.threads}
                disabled={!specs?.isConfigured}
                onChange={(e) => handleThreadsChange(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                <span>1 Core</span>
                <span>Max Cores ({Math.max(4, navigator.hardwareConcurrency || 8)})</span>
              </div>
            </div>

            {/* Intensity Slider */}
            <div className={`glass-sub p-4 rounded-xl transition-all duration-300 ${!specs?.isConfigured ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-3 font-mono">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 font-mono">
                  <Sliders className="h-3.5 w-3.5 text-indigo-400" /> Target Speed Limit
                </span>
                <span className="text-sm font-semibold text-indigo-400 glow-indigo">
                  {miningStats.intensity}%
                  {!specs?.isConfigured && ' (Locked)'}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={miningStats.intensity}
                disabled={!specs?.isConfigured}
                onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
                className="w-full accent-indigo-400 h-1.5 bg-white/10 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                <span>Eco (10%)</span>
                <span>Extreme (100%)</span>
              </div>
            </div>

            {/* Thermal Indicator */}
            <div className="glass-sub p-4 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-orange-400" /> Chip Heat
                </span>
                <span className={`font-semibold ${simulatedTemp > 70 ? 'text-red-400 animate-pulse' : simulatedTemp > 50 ? 'text-orange-400' : 'text-cyan-400 glow-cyan'}`}>
                  {simulatedTemp}°C
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full transition-all duration-1000 ${simulatedTemp > 70 ? 'bg-gradient-to-r from-orange-500 to-red-500' : simulatedTemp > 50 ? 'bg-orange-500' : 'bg-cyan-400 shadow-glow-cyan'}`}
                  style={{ width: `${Math.min(100, Math.max(20, (simulatedTemp / 100) * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 pb-0.5">
                {miningStats.isActive ? 'Steady dynamic power load' : 'Idle ventilation'}
              </span>
            </div>
          </div>

          {/* Computing live charts */}
          <div className="glass-sub p-4 rounded-xl mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-cyan-400" /> PROOFS LOAD PATTERN
              </span>
              <span className="text-xs text-cyan-400 font-mono glow-cyan">
                {miningStats.isActive ? `${miningStats.hashRate.toLocaleString()} H/s` : 'Paused'}
              </span>
            </div>
            
            <div className="h-24 w-full mt-2 relative">
              {recentHzHistory.length > 1 && (
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {/* Fill area */}
                  <path
                    d={`M 0,100 L ${pathData} L 100,100 Z`}
                    fill="url(#areaGrad)"
                    className="transition-all duration-300"
                  />
                  {/* Line */}
                  <path
                    d={`M ${pathData}`}
                    fill="none"
                    stroke={miningStats.isActive ? '#22d3ee' : '#4b5563'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                  
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
              {!miningStats.isActive && (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-slate-500 uppercase tracking-widest bg-black/40 border border-white/5 rounded">
                  System Standby — Activate Cycle
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Toggle Action */}
        <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-white/10 pt-5 mt-2">
          <button
            onClick={toggleMining}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2.5 transition-all text-sm cursor-pointer shadow-lg active:scale-[0.98] ${
              miningStats.isActive
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/10'
                : 'bg-gradient-to-r from-cyan-400 to-indigo-500 text-white shadow-cyan-500/10 shadow-glow-cyan hover:opacity-95'
            }`}
          >
            {miningStats.isActive ? (
              <>
                <Square className="h-4 w-4 fill-current" /> Terminate Allocation
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" /> Initialize Compute Cycle
              </>
            )}
          </button>
          
          <div className="text-xs text-slate-400 leading-relaxed text-center sm:text-left">
            {miningStats.isActive ? (
              <span className="flex items-center gap-1.5 text-cyan-400 font-medium font-mono glow-cyan">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                Contributing power to Grid tasks. Safe thermal limits fully maintained.
              </span>
            ) : (
              <span>Your device is idle. Turn it on to begin generating play credits automatically.</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid Stats Summary Panel */}
      {isSummaryExpanded && (
        <div className="glass-container rounded-2xl p-6 text-white flex flex-col justify-between relative overflow-hidden transition-all duration-300 animate-fade">
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-6">Live Contribution Summary</h3>
            
            <div className="space-y-6">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Total Web Proofs Calculated</span>
                <span className="text-3xl font-mono font-bold tracking-tight text-white">
                  {miningStats.totalHashes.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-450 block mt-1">Hashes registered directly inside current session context.</span>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1 font-mono">
                  <Coins className="h-3.5 w-3.5 text-cyan-400" /> Estimated Credits Generation
                </span>
                <span className="text-2xl font-mono font-bold tracking-tight text-cyan-400 glow-cyan">
                  ~ {estimatedCreditsPerHour.toFixed(2)} / hr
                </span>
                <span className="text-[10px] text-slate-450 block mt-1">Based on core speed and thread intensity limiters.</span>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <span className="text-xs text-slate-400 block mb-1">All-Time Generation Profit</span>
                <span className="text-xl font-mono font-semibold tracking-tight text-cyan-400 glow-cyan">
                  + {miningStats.lifetimeCredits.toFixed(4)} credits
                </span>
                <span className="text-[10px] text-slate-450 block mt-1">Your cumulated compute contributions.</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-3.5 glass-sub rounded-xl flex items-start gap-2.5">
            <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 mt-0.5">
              <Coins className="h-4 w-4" />
            </div>
            <div className="text-[11px] leading-relaxed text-slate-300">
              <strong>Conversion Note:</strong> Hash rates are simulated safely so you generate enough credits instantly for a premium gaming experience!
            </div>
          </div>
        </div>
      )}
      
      </div>

      {/* Collapsible toggle bar */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
          className="glass-container bg-white/[0.02] hover:bg-white/[0.06] hover:border-cyan-400/30 border-white/10 rounded-2xl px-6 py-3.5 flex items-center gap-3 text-xs font-mono font-bold tracking-wider text-slate-300 transition-all cursor-pointer shadow-lg hover:scale-[1.01]"
        >
          <Coins className="h-4 w-4 text-cyan-400" />
          <span>{isSummaryExpanded ? "HIDE METRICS PANEL" : "SHOW LIVE CONTRIBUTION SUMMARY & METRICS"}</span>
          <div className="flex items-center gap-1 text-cyan-400 font-bold ml-3 border-l border-white/10 pl-3">
            <span>{isSummaryExpanded ? "COLLAPSE" : "EXPAND"}</span>
            {isSummaryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>
      </div>

    </div>
  );
}
