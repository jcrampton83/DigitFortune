import { useState, useCallback, useEffect } from 'react';
import { Cpu, Gamepad2, CreditCard, History, ShieldCheck, Coins, Activity, Laptop } from 'lucide-react';
import { Transaction, MiningStats } from './types';
import ComputeGrid from './components/ComputeGrid';
import CasinoLobby from './components/CasinoLobby';
import PayoutStation from './components/PayoutStation';
import TransactionHistory from './components/TransactionHistory';
import UserSettings from './components/UserSettings';

export default function App() {
  const [activeTab, setActiveTab] = useState<'compute' | 'casino' | 'payout' | 'settings'>('casino');
  const [username, setUsername] = useState<string>('Anon');
  
  // Starting balance: 25.0 free credits as starter bonus to try out the system instantly
  const [balance, setBalance] = useState<number>(25.0);

  // Initialize mining statistics
  const [miningStats, setMiningStats] = useState<MiningStats>({
    isActive: false,
    intensity: 60,
    threads: 2,
    hashRate: 0,
    totalHashes: 0,
    lifetimeCredits: 0,
  });

  // Seed default transaction history blocks for realism
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'reg-claim-fmg1085',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      type: 'earn',
      amount: 25.0,
      title: 'Starter Promotion Credit Claim',
      details: 'Initial welcome balance allocated representing node test setup.',
    }
  ]);

  // Polling & Live Ledger synchronization monitors
  const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toISOString());
  const [isPollRunning, setIsPollRunning] = useState<boolean>(false);

  // Periodically poll (every 1s) for block verification if mining is active
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (miningStats.isActive) {
      setIsPollRunning(true);
      intervalId = setInterval(() => {
        setLastRefreshTime(new Date().toISOString());
      }, 1000);
    } else {
      setIsPollRunning(false);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [miningStats.isActive]);

  // Handle auto-refresh trigger when balance changes or a transaction concluded
  useEffect(() => {
    setLastRefreshTime(new Date().toISOString());
  }, [balance, transactions.length]);

  // Utility callback to record transactions
  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
  }, []);

  const setBalanceUpdater = useCallback((updater: (prev: number) => number) => {
    setBalance(updater);
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] text-slate-200 font-sans flex flex-col justify-between relative overflow-hidden" id="app-root-container">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Sticky Top-Right Balance Dashboard (Locked in corner on scroll) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3" id="locked-top-balance">
        {miningStats.isActive && (
          <div className="hidden md:flex items-center space-x-2 text-cyan-400 font-semibold bg-black/85 backdrop-blur-md px-3 py-2 border border-cyan-500/20 rounded-xl shadow-glow-cyan text-xs font-mono">
            <Activity className="h-3.5 w-3.5 animate-spin" />
            <span>GRID: {miningStats.hashRate.toLocaleString()} H/s</span>
          </div>
        )}
        
        <button
          onClick={() => setActiveTab('settings')}
          className={`group flex items-center space-x-2 px-4 py-2.5 bg-black/80 hover:bg-[#090918]/95 backdrop-blur-md border rounded-xl shadow-lg transition-all duration-300 cursor-pointer ${
            activeTab === 'settings'
              ? 'border-cyan-400 shadow-glow-cyan'
              : 'border-white/10 hover:border-cyan-450/40'
          }`}
          title="Open User Security Settings & Portal"
        >
          <Coins className="h-4 w-4 text-cyan-400 group-hover:animate-pulse" />
          <span className="text-slate-350 font-black tracking-wider text-[10px] uppercase font-mono">{username}:</span>
          <span className="text-white font-black text-xs sm:text-sm tracking-tight glow-cyan font-mono">
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-slate-450 font-medium text-[10px] uppercase font-mono">Cr</span>
        </button>
      </div>

      {/* Top Banner / Glass Navigation Bar */}
      <div className="glass-navbar px-6 py-4 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="p-2.5 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
                <Cpu className="h-6 w-6" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-cyan-400 rounded-full border-2 border-[#050510] animate-ping" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                GRID COMPUTE <span className="text-cyan-400 text-sm font-semibold tracking-wider font-mono">BETA</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono mt-1">Proof of Work (PoW) Gaming & Fiat Redemption Ecosystem</p>
            </div>
          </div>

        </div>
      </div>

      {/* Main navigation & Tabs section */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 relative z-10">
        
        {/* Navigation Selector Bars - Glass pill design */}
        <div className="flex bg-white/5 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl mb-8 overflow-x-auto min-w-full gap-2 text-xs">
          {[
            { id: 'casino' as const, label: 'PLAY WAGER ARCADE', icon: <Gamepad2 className="h-4 w-4" /> },
            { id: 'compute' as const, label: 'LEND CORE POWER', icon: <Cpu className="h-4 w-4" /> },
            { id: 'payout' as const, label: 'PAYOUT STATION', icon: <CreditCard className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 text-xs font-mono font-bold tracking-wider cursor-pointer transition-all shrink-0 uppercase rounded-xl border ${
                activeTab === tab.id
                  ? 'bg-white/10 border-white/20 text-cyan-400 shadow-glow-cyan'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content wrappers */}
        <div className="transition-all duration-350">
          {activeTab === 'casino' && (
            <CasinoLobby
              balance={balance}
              setBalance={setBalanceUpdater}
              addTransaction={addTransaction}
            />
          )}

          {activeTab === 'compute' && (
            <ComputeGrid
              balance={balance}
              setBalance={setBalanceUpdater}
              addTransaction={addTransaction}
              miningStats={miningStats}
              setMiningStats={setMiningStats}
            />
          )}

          {activeTab === 'payout' && (
            <PayoutStation
              balance={balance}
              setBalance={setBalanceUpdater}
              addTransaction={addTransaction}
            />
          )}

          {activeTab === 'settings' && (
            <UserSettings
              transactions={transactions}
              username={username}
              setUsername={setUsername}
              balance={balance}
              isPollRunning={isPollRunning}
              lastRefreshTime={lastRefreshTime}
            />
          )}
        </div>
      </main>

      {/* Footer System parameters */}
      <footer className="border-t border-white/5 bg-[#050510]/80 backdrop-blur-md py-5 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Distributed Edge Container Client Online</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Cryptographic audit active</span>
            <span>Version beta-v1.0.8</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
