import { useState, useEffect, useRef } from 'react';
import { Play, Coins, AlertOctagon, TrendingUp, HelpCircle } from 'lucide-react';
import { Transaction } from '../../types';

interface CrashProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  addTransaction: (tx: Transaction) => void;
}

export default function CrashGame({ balance, setBalance, addTransaction }: CrashProps) {
  const [bet, setBet] = useState<number>(5);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [status, setStatus] = useState<'idle' | 'running' | 'crashed' | 'cashed_out'>('idle');
  const [crashedAt, setCrashedAt] = useState<number>(0);
  const [cashedOutValue, setCashedOutValue] = useState<number>(0);

  const loopRef = useRef<number | null>(null);
  const multiplierRef = useRef<number>(1.0);
  const crashPointRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Generate randomized crash point matching realistic probability distributions
  const generateCrashPoint = (): number => {
    const probability = Math.random();
    if (probability < 0.08) {
      // Instant instant-crash (8% chance)
      return 1.0;
    }
    // Exponential formula for natural betting multipliers
    const scale = Math.pow(1 - Math.random(), -0.92);
    return Math.max(1.05, Math.round(scale * 100) / 100);
  };

  const startCrash = () => {
    if (balance < bet) {
      alert('Insufficient balance to place this wager.');
      return;
    }

    // Deduct bet amount
    setBalance(b => b - bet);

    // Reset parameters
    const point = generateCrashPoint();
    crashPointRef.current = point;
    multiplierRef.current = 1.0;
    startTimeRef.current = Date.now();
    setMultiplier(1.0);
    setStatus('running');
    setCashedOutValue(0);

    // Core multiplier game loop
    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      // Parabolic calculation: multiplier climbs faster over time
      const nextMultiplier = 1.0 + Math.pow(elapsed, 1.45) * 0.16;
      const rounded = Math.round(nextMultiplier * 100) / 100;

      if (rounded >= crashPointRef.current) {
        // Crash Triggered!
        multiplierRef.current = crashPointRef.current;
        setMultiplier(crashPointRef.current);
        setStatus('crashed');
        setCrashedAt(crashPointRef.current);
        
        addTransaction({
          id: `crash-lost-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'wager_loss',
          amount: bet,
          title: 'Crash Wager Lost',
          details: `The vector crashed at ${crashPointRef.current.toFixed(2)}x. Stake lost.`,
        });

        if (loopRef.current) {
          cancelAnimationFrame(loopRef.current);
        }
      } else {
        multiplierRef.current = rounded;
        setMultiplier(rounded);
        loopRef.current = requestAnimationFrame(tick);
      }
    };

    loopRef.current = requestAnimationFrame(tick);
  };

  const cashOut = () => {
    if (status !== 'running') return;

    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
    }

    const value = multiplierRef.current;
    const winnings = bet * value;
    
    setBalance(b => b + winnings);
    setCashedOutValue(value);
    setStatus('cashed_out');

    addTransaction({
      id: `crash-win-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'wager_win',
      amount: winnings,
      betAmount: bet,
      title: 'Crash Wager Won',
      details: `Successful manual Cash Out at ${value.toFixed(2)}x on a bet of ${bet} credits.`,
    });
  };

  // Perform clean up on loop unmount
  useEffect(() => {
    return () => {
      if (loopRef.current) {
        cancelAnimationFrame(loopRef.current);
      }
    };
  }, []);

  // Compute curve visualization coordinate path
  const currentRatio = Math.min(1.0, (multiplier - 1.0) / 12.0); // scale max representation limit
  const curvePoints = Array.from({ length: 40 }).map((_, i) => {
    const ratio = i / 39;
    const x = ratio * 100;
    // Parabolic slope
    const y = 100 - Math.pow(ratio * currentRatio, 1.6) * 85;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-gray-950/80 border border-gray-850 p-6 rounded-2xl text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5 font-mono">
          <TrendingUp className="h-4 w-4" /> GRID VEKTR CRASH
        </h3>
        <div className="text-xs text-gray-400 flex items-center gap-1 bg-black/40 px-3 py-1 rounded border border-gray-900 font-mono">
          <Coins className="h-3.5 w-3.5 text-amber-500" />
          <span>Balance: {balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Main Vector Screen */}
      <div className="relative bg-gradient-to-b from-gray-950 to-black border border-gray-800 rounded-2xl h-56 flex flex-col justify-between p-6 overflow-hidden mb-6 shadow-inner">
        {/* Background micro grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] opacity-10 pointer-events-none" />

        {/* Real-time ticker */}
        <div className="z-10 text-center m-auto">
          {status === 'crashed' ? (
            <div className="space-y-1 animate-ping-once">
              <span className="text-[10px] font-mono font-bold text-red-500 border border-red-500/20 bg-red-950/30 px-2.5 py-1 rounded uppercase tracking-widest">
                💥 CRASHED!
              </span>
              <p className="text-5xl font-mono font-black text-red-500 select-none mt-2">
                {crashedAt.toFixed(2)}x
              </p>
            </div>
          ) : status === 'cashed_out' ? (
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-1 rounded uppercase tracking-widest">
                🎉 CASHED OUT
              </span>
              <p className="text-5xl font-mono font-black text-emerald-400 select-none mt-2">
                {cashedOutValue.toFixed(2)}x
              </p>
              <p className="text-[11px] text-gray-400 font-mono">Winnings: {(bet * cashedOutValue).toFixed(2)} credits</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className={`text-6xl font-mono font-black select-none ${status === 'running' ? 'text-amber-400' : 'text-gray-400'}`}>
                {multiplier.toFixed(2)}x
              </p>
              {status === 'running' && (
                <p className="text-[11px] text-emerald-400 font-mono tracking-wider animate-pulse">
                  Current Return: {(bet * multiplier).toFixed(2)} credits
                </p>
              )}
            </div>
          )}
        </div>

        {/* Graph Vector Line */}
        {status === 'running' && (
          <div className="absolute bottom-0 left-0 right-0 h-full pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
                points={curvePoints}
                className="opacity-75 transition-all"
              />
              <circle
                cx={Math.min(100, currentRatio * 100)}
                cy={100 - Math.pow(currentRatio, 1.6) * 85}
                r="6"
                fill="#10b981"
                className="animate-pulse"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Controllers */}
      <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 items-end mb-6">
        <div>
          <span className="block text-[10px] text-gray-500 mb-1.5 font-mono uppercase text-center">Bets Stake</span>
          <div className="flex items-center border border-gray-850 bg-black/30 rounded-xl px-2 h-11">
            <button
              onClick={() => setBet(b => Math.max(1, b - 5))}
              disabled={status === 'running'}
              className="text-gray-400 hover:text-white px-2 cursor-pointer font-bold disabled:opacity-40"
            >
              -
            </button>
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={status === 'running'}
              className="w-full bg-transparent text-center text-sm font-mono text-emerald-400 focus:outline-none"
            />
            <button
              onClick={() => setBet(b => b + 5)}
              disabled={status === 'running'}
              className="text-gray-400 hover:text-white px-2 cursor-pointer font-bold disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {status === 'running' ? (
          <button
            onClick={cashOut}
            className="w-full h-11 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-xl text-xs font-mono tracking-wider cursor-pointer shadow-lg animate-pulse"
          >
            CASH OUT MATCH
          </button>
        ) : (
          <button
            onClick={startCrash}
            disabled={balance < bet}
            className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-500 text-black font-semibold rounded-xl text-xs font-mono tracking-wider cursor-pointer shadow flex items-center justify-center gap-1.5"
          >
            <Play className="h-4 w-4 fill-current" /> LAUNCH VECTOR
          </button>
        )}
      </div>

      {/* Rules block */}
      <div className="max-w-md mx-auto bg-black/20 p-4 border border-gray-850 rounded-xl text-left text-[10px] text-gray-400 space-y-1 font-mono">
        <span className="text-gray-300 font-bold block mb-1.5 flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" /> HOW TO PLAY CRASH
        </span>
        <p>• The mathematical index starts rising from 1.00x towards higher limits.</p>
        <p>• Click the <strong>Cash Out</strong> parameter BEFORE the vector crashes to secure points.</p>
        <p>• Warning: Crash can occur instantly at 1.00x based on server loop outcomes!</p>
      </div>
    </div>
  );
}
