import { useState } from 'react';
import { Coins, HelpCircle, Trophy, RefreshCw } from 'lucide-react';
import { Transaction } from '../../types';

interface SlotsProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  addTransaction: (tx: Transaction) => void;
}

const SYMBOLS = [
  { char: '🍒', value: 'Cherry', mult3: 4, mult2: 1.5 },
  { char: '🍋', value: 'Lemon', mult3: 6, mult2: 2 },
  { char: '🍇', value: 'Grape', mult3: 8, mult2: 2.5 },
  { char: '🔔', value: 'Bell', mult3: 15, mult2: 4 },
  { char: '💎', value: 'Diamond', mult3: 40, mult2: 8 },
  { char: '7️⃣', value: 'LuckySeven', mult3: 150, mult2: 25 },
];

export default function SlotsGame({ balance, setBalance, addTransaction }: SlotsProps) {
  const [bet, setBet] = useState<number>(5);
  const [reels, setReels] = useState<string[]>(['💎', '7️⃣', '💎']);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [outcome, setOutcome] = useState<{ win: boolean; amount: number; msg: string } | null>(null);

  const spinSlots = () => {
    if (balance < bet) {
      alert('Insufficient credits for this bet.');
      return;
    }
    if (spinning) return;

    // Deduct bet instantly
    setBalance(b => b - bet);
    setSpinning(true);
    setOutcome(null);

    // Simulate animated spinning
    let spinsCount = 0;
    const interval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
      ]);
      spinsCount++;
      if (spinsCount > 15) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 70);
  };

  const finalizeSpin = () => {
    // Determine final symbols
    const finalReels = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
    ];
    setReels(finalReels);

    const [r1, r2, r3] = finalReels;
    let multiplier = 0;
    let message = 'No Luck this time! Try another spin.';
    let win = false;

    // Matching counts
    if (r1 === r2 && r2 === r3) {
      // 3 of a kind
      win = true;
      const symbol = SYMBOLS.find(s => s.char === r1);
      multiplier = symbol ? symbol.mult3 : 5;
      message = `JACKPOT! 3 of a kind: Matching ${symbol?.value}! (${multiplier}x)`;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      // 2 of a kind
      win = true;
      const matchChar = (r1 === r2 || r1 === r3) ? r1 : r2;
      const symbol = SYMBOLS.find(s => s.char === matchChar);
      multiplier = symbol ? symbol.mult2 : 2;
      message = `Nice combo! 2 of a kind: Matching ${symbol?.value}! (${multiplier}x)`;
    }

    const wonAmount = bet * multiplier;

    if (win) {
      setBalance(b => b + wonAmount);
      addTransaction({
        id: `slots-win-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_win',
        amount: wonAmount,
        betAmount: bet,
        title: 'Slots Play Won',
        details: `Combination Reels: [${finalReels.join(' ')}] on a bet of ${bet} credits.`,
      });
      setOutcome({ win: true, amount: wonAmount, msg: message });
    } else {
      addTransaction({
        id: `slots-loss-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_loss',
        amount: bet,
        title: 'Slots Play Lost',
        details: `Combination Reels: [${finalReels.join(' ')}] on a bet of ${bet} credits.`,
      });
      setOutcome({ win: false, amount: 0, msg: message });
    }

    setSpinning(false);
  };

  return (
    <div className="bg-gray-950/80 border border-gray-850 p-6 rounded-2xl text-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5 font-mono">
          <Trophy className="h-4 w-4" /> GRID CYCLE SLOTS
        </h3>
        <div className="text-xs text-gray-400 flex items-center gap-1 bg-black/40 px-3 py-1 rounded border border-gray-900 font-mono">
          <Coins className="h-3.5 w-3.5 text-amber-500" />
          <span>Balance: {balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Reel machine casing */}
      <div className="relative max-w-sm mx-auto bg-gradient-to-b from-gray-900 to-black p-5 rounded-3xl border-2 border-emerald-500/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl blur-md pointer-events-none" />
        
        {/* Lights border */}
        <div className="flex justify-between px-2 mb-2">
          <span className={`h-2.5 w-2.5 rounded-full ${spinning ? 'bg-orange-500 animate-pulse' : 'bg-orange-800'}`} />
          <span className={`h-2.5 w-2.5 rounded-full ${spinning ? 'bg-amber-500 animate-ping' : 'bg-amber-800'}`} />
          <span className={`h-2.5 w-2.5 rounded-full ${spinning ? 'bg-yellow-500 animate-pulse' : 'bg-yellow-800'}`} />
          <span className={`h-2.5 w-2.5 rounded-full ${spinning ? 'bg-emerald-500 animate-ping' : 'bg-emerald-800'}`} />
        </div>

        {/* Reels layout */}
        <div className="grid grid-cols-3 gap-3 bg-black border-4 border-gray-800 rounded-2xl py-6 px-4 mb-4 shadow-inner relative overflow-hidden">
          <div className="absolute h-px bg-red-600/60 left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          
          {reels.map((char, index) => (
            <div
              key={index}
              className={`flex items-center justify-center bg-gray-900 border border-gray-800 rounded-xl h-24 text-4xl select-none shadow-md ${
                spinning ? 'animate-bounce transition-transform' : 'transition-all'
              }`}
            >
              {char}
            </div>
          ))}
        </div>

        {/* Outcome Screen */}
        <div className="min-h-[44px] bg-black/60 border border-gray-850 rounded-lg flex items-center justify-center text-center px-4 py-2">
          {outcome ? (
            <p className={`text-xs font-semibold ${outcome.win ? 'text-emerald-400 font-mono' : 'text-gray-400'}`}>
              {outcome.msg}
            </p>
          ) : spinning ? (
            <p className="text-xs text-amber-400 font-mono flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Spinning server reels...
            </p>
          ) : (
            <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">Ready to Spin</p>
          )}
        </div>
      </div>

      {/* Betting controllers */}
      <div className="max-w-sm mx-auto flex items-center gap-3 mb-6">
        <div className="flex-1 shrink-0">
          <span className="block text-[11px] text-gray-450 mb-1 font-mono uppercase text-center">Stake Wager</span>
          <div className="flex items-center border border-gray-800 bg-black/30 rounded-lg px-2 py-1">
            <button
              onClick={() => setBet(b => Math.max(1, b - 5))}
              className="text-gray-400 hover:text-white px-2 cursor-pointer font-bold"
            >
              -
            </button>
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-transparent text-center text-sm font-mono text-emerald-400 focus:outline-none"
            />
            <button
              onClick={() => setBet(b => b + 5)}
              className="text-gray-400 hover:text-white px-2 cursor-pointer font-bold"
            >
              +
            </button>
          </div>
        </div>
        <button
          onClick={spinSlots}
          disabled={spinning || balance < bet}
          className="flex-1 h-[42px] mt-4 font-bold rounded-xl cursor-pointer shadow bg-emerald-500 hover:bg-emerald-400 text-black text-sm disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-1.5 transition-all"
        >
          {spinning ? 'SPINNING' : 'PULL LEVER'}
        </button>
      </div>

      {/* Payout table */}
      <div className="max-w-sm mx-auto bg-black/20 p-4 border border-gray-850 rounded-xl text-left">
        <span className="text-[10px] text-gray-400 font-mono tracking-wider block mb-2 font-bold flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" /> REEL WIN INDEX (X MULTIPLIERS)
        </span>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10px] text-gray-400 font-mono">
          {SYMBOLS.map(sym => (
            <div key={sym.char} className="flex justify-between items-center py-0.5 border-b border-gray-900 pb-1">
              <span>{sym.char} {sym.value}</span>
              <span className="text-amber-400">2x: {sym.mult2} | 3x: {sym.mult3}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
