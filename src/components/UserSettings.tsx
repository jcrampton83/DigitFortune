import { useState } from 'react';
import { User, Shield, Globe, Terminal, Cpu, Calendar, Check, Edit2, ChevronDown, ChevronUp, BarChart2, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { Transaction } from '../types';
import TransactionHistory from './TransactionHistory';

interface UserSettingsProps {
  transactions: Transaction[];
  username: string;
  setUsername: (name: string) => void;
  balance: number;
  isPollRunning?: boolean;
  lastRefreshTime?: string;
}

export default function UserSettings({
  transactions,
  username,
  setUsername,
  balance,
  isPollRunning = false,
  lastRefreshTime = '',
}: UserSettingsProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(username);
  const [region, setRegion] = useState('North America (US-East Edge)');
  const [isExpanded, setIsExpanded] = useState(false);

  // Stats calculation
  const totalMiningEarned = transactions
    .filter(t => t.type === 'earn')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSpentOnWagers = transactions.reduce((acc, t) => {
    if (t.type === 'wager_loss') return acc + t.amount;
    if (t.type === 'wager_win') return acc + (t.betAmount || 0);
    return acc;
  }, 0);

  const totalAmountWon = transactions
    .filter(t => t.type === 'wager_win')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalAmountLost = transactions
    .filter(t => t.type === 'wager_loss')
    .reduce((acc, t) => acc + t.amount, 0);

  const netWagerGains = totalAmountWon - totalSpentOnWagers;

  const resetTimestamp = parseInt(localStorage.getItem('sys_ledger_reset_timestamp') || '0');
  const recentTransactions = transactions.filter(t => new Date(t.timestamp).getTime() > resetTimestamp);
  const wonCurrent = recentTransactions.filter(t => t.type === 'wager_win').reduce((acc, t) => acc + t.amount, 0);
  const lostCurrent = recentTransactions.filter(t => t.type === 'wager_loss').reduce((acc, t) => acc + t.amount, 0);
  const netCurrent = wonCurrent - lostCurrent;

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      setUsername(trimmed);
    } else {
      setTempName(username);
    }
    setIsEditingName(false);
  };

  return (
    <div className="space-y-8 animate-fade relative z-10" id="user-settings-panel">
      {/* Intro Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-glow-indigo">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white font-display">User Security Portal & Profile</h2>
          <p className="text-xs text-slate-400">Configure client settings, monitor edge node status, and audit signed ledger blocks</p>
        </div>
      </div>

      {/* Grid of Profile Details & Node Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="glass-container rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-mono tracking-widest text-slate-450 uppercase">Identity Parameters</span>
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-cyan-500/10 border border-white/10 font-mono">
                {username.slice(0, 2).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="bg-black/40 border border-white/15 rounded px-2.5 py-1 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-400 w-full max-w-[150px]"
                        maxLength={18}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all border border-cyan-500/30 cursor-pointer"
                        title="Save alias"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-white tracking-tight truncate font-mono">{username}</h3>
                      <button
                        onClick={() => {
                          setTempName(username);
                          setIsEditingName(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer"
                        title="Edit system alias"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">Status: Node Administrator</p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs text-slate-350 border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-450">Session Privilege:</span>
                <span className="text-cyan-400 font-bold">Encrypted Root</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Account Balance:</span>
                <span className="text-white font-bold">{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Credits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Node Status */}
        <div className="glass-container rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-mono tracking-widest text-slate-450 uppercase">Cryptographic Audit Console</span>
              <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                <Shield className="h-3 w-3" /> SECURE
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-mono text-white font-semibold">Select Edge Region</span>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="mt-1 bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="North America (US-East Edge)">North America (US-East Edge)</option>
                    <option value="Europe-West (Frankfurt Hub)">Europe-West (Frankfurt Hub)</option>
                    <option value="Asia-Pacific (Tokyo Edge Node)">Asia-Pacific (Tokyo Edge Node)</option>
                    <option value="South America (São Paulo Relay)">South America (São Paulo Relay)</option>
                  </select>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="space-y-2 font-mono text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5 text-cyan-400" /> Host Client:</span>
                  <span className="text-slate-200">Localhost Sandbox v1.0.8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-slate-405" /> Audit Proof Signature:</span>
                  <span className="text-slate-200 text-[10px]">ECDSA-P256 DES-SHA</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-indigo-405" /> Connection Epoch:</span>
                  <span className="text-slate-200">2026-05-29 UTC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Earnings/Losses Summary Dashboard Card */}
      <div className="glass-container rounded-2xl overflow-hidden border border-white/10 shadow-lg" id="earnings-losses-collapsible">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-5 bg-black/40 hover:bg-[#090918]/60 transition-all select-none cursor-pointer text-left"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
              <BarChart2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white font-mono">Earnings/Losses</h3>
              <p className="text-[10px] text-slate-450 uppercase font-mono mt-0.5">Toggle live node Ledger breakdown</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase hidden sm:inline">
              {isExpanded ? 'Click to collapse' : 'Click to analyze'}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-6 border-t border-white/5 bg-slate-950/40 space-y-6 animate-fade">
            
            {/* Lifetime Statistics */}
            <div className="mb-4">
              <h4 className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider mb-3">Lifetime Statistics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Mining Earnings */}
                <div className="glass-sub p-4 rounded-xl border border-white/5 relative overflow-hidden">
                  <span className="block text-[9px] font-mono font-black text-slate-450 tracking-wider uppercase mb-1">Mining Rewards</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-cyan-400 font-mono glow-cyan">
                      {totalMiningEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Cr</span>
                  </div>
                  <div className="absolute right-2 bottom-2 bg-cyan-400/5 p-1.5 rounded-lg border border-cyan-400/10">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400/60" />
                  </div>
                </div>

                {/* Total Wagered / Bets */}
                <div className="glass-sub p-4 rounded-xl border border-white/5 relative overflow-hidden">
                  <span className="block text-[9px] font-mono font-black text-slate-450 tracking-wider uppercase mb-1">Total Wagered (Spent)</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {totalSpentOnWagers.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Cr</span>
                  </div>
                  <div className="absolute right-2 bottom-2 bg-amber-400/5 p-1.5 rounded-lg border border-amber-400/10">
                    <Coins className="h-3.5 w-3.5 text-amber-400/60" />
                  </div>
                </div>

                {/* Casino Winnings */}
                <div className="glass-sub p-4 rounded-xl border border-white/5 relative overflow-hidden">
                  <span className="block text-[9px] font-mono font-black text-slate-450 tracking-wider uppercase mb-1">Total Won</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      {totalAmountWon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Cr</span>
                  </div>
                  <div className="absolute right-2 bottom-2 bg-emerald-400/5 p-1.5 rounded-lg border border-emerald-400/10">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400/60" />
                  </div>
                </div>

                {/* Casino Losses */}
                <div className="glass-sub p-4 rounded-xl border border-white/5 relative overflow-hidden">
                  <span className="block text-[9px] font-mono font-black text-slate-450 tracking-wider uppercase mb-1">Total Lost</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-red-400 font-mono">
                      {totalAmountLost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Cr</span>
                  </div>
                  <div className="absolute right-2 bottom-2 bg-red-400/5 p-1.5 rounded-lg border border-red-400/10">
                    <TrendingDown className="h-3.5 w-3.5 text-red-400/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Current Statistics */}
            <div className="mb-4">
              <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider mb-3">Current Session Performance</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-sub p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                  <span className="block text-[9px] font-mono font-black text-indigo-300 tracking-wider uppercase mb-1">Current Won</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{wonCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr</span>
                </div>
                <div className="glass-sub p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                  <span className="block text-[9px] font-mono font-black text-indigo-300 tracking-wider uppercase mb-1">Current Lost</span>
                  <span className="text-base font-bold text-red-400 font-mono">{lostCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr</span>
                </div>
                <div className="glass-sub p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                  <span className="block text-[9px] font-mono font-black text-indigo-300 tracking-wider uppercase mb-1">Current Gaming Performance</span>
                  <span className={`text-base font-bold font-mono ${netCurrent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {netCurrent >= 0 ? '+' : ''}{netCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr
                  </span>
                </div>
              </div>
            </div>

            {/* Combined/Net Section */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl border ${
                  netWagerGains >= 0 
                  ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400 shadow-glow-emerald' 
                  : 'bg-red-500/15 border-red-500/25 text-red-400'
                }`}>
                  {netWagerGains >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <span className="block text-[11px] font-mono font-bold uppercase text-slate-450">Net Gaming Performance (Total)</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2 sm:text-right">
                <span className={`text-lg font-black font-mono tracking-tight ${
                  netWagerGains >= 0 ? 'text-emerald-400 glow-emerald' : 'text-red-400'
                }`}>
                  {netWagerGains >= 0 ? '+' : ''}{netWagerGains.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-mono text-slate-400 uppercase">Credits</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Ledger History Container */}
      <div className="pt-2">
        <div className="mb-4">
          <h3 className="text-sm font-semibold font-display tracking-tight text-white">Cryptographic Signed Ledger History</h3>
          <p className="text-xs text-slate-450 mt-0.5">Below is the secure log profile of your computing credits generation and wagers plays</p>
        </div>
        <TransactionHistory 
          transactions={transactions} 
          isPollRunning={isPollRunning} 
          lastRefreshTime={lastRefreshTime} 
        />
      </div>
    </div>
  );
}
