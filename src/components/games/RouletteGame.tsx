import { useState, useRef } from 'react';
import { RefreshCw, Coins, Play, Dices, HelpCircle } from 'lucide-react';
import { Transaction, RouletteState } from '../../types';

interface RouletteProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  addTransaction: (tx: Transaction) => void;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export default function RouletteGame({ balance, setBalance, addTransaction }: RouletteProps) {
  const [betAmount, setBetAmount] = useState<number>(5);
  const [betType, setBetType] = useState<RouletteState['betType']>('red');
  const [betValue, setBetValue] = useState<number>(17); // holds selected single number 1-36
  const [spinning, setSpinning] = useState<boolean>(false);
  const [result, setResult] = useState<{ number: number; color: 'red' | 'black' | 'green' } | null>(null);
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);

  // Wheel horizontal strip items (randomized full sequence for illusion of motion)
  const [stripNumbers, setStripNumbers] = useState<number[]>([14, 31, 2, 0, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5]);

  const getColor = (num: number): 'red' | 'black' | 'green' => {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  const spinWheel = () => {
    if (balance < betAmount) {
      alert('Insufficient balance to place roulette bet.');
      return;
    }
    if (spinning) return;

    // Deduct balance
    setBalance(b => b - betAmount);
    setSpinning(true);
    setResult(null);
    setOutcomeMsg(null);

    // Roll numbers rapidly in loop
    let counts = 0;
    const intervalId = setInterval(() => {
      // Create random sequence of numbers for dynamic preview strip
      const sequence = Array.from({ length: 15 }).map(() => Math.floor(Math.random() * 37));
      setStripNumbers(sequence);
      counts++;
      
      if (counts > 20) {
        clearInterval(intervalId);
        finalizeSpin();
      }
    }, 70);
  };

  const finalizeSpin = () => {
    const winningNum = Math.floor(Math.random() * 37);
    const winningColor = getColor(winningNum);

    // Position winning number in the center of the strip
    const finalStrip = [
      Math.floor(Math.random() * 37),
      Math.floor(Math.random() * 37),
      Math.floor(Math.random() * 37),
      winningNum, // Center index
      Math.floor(Math.random() * 37),
      Math.floor(Math.random() * 37),
      Math.floor(Math.random() * 37),
    ];
    setStripNumbers(finalStrip);
    setResult({ number: winningNum, color: winningColor });

    let isWin = false;
    let multiplier = 0;

    if (betType === 'red' && winningColor === 'red') {
      isWin = true;
      multiplier = 2; // 1:1 payout
    } else if (betType === 'black' && winningColor === 'black') {
      isWin = true;
      multiplier = 2;
    } else if (betType === 'green' && winningColor === 'green') {
      isWin = true;
      multiplier = 35; // 35:1 payout
    } else if (betType === 'even' && winningNum !== 0 && winningNum % 2 === 0) {
      isWin = true;
      multiplier = 2;
    } else if (betType === 'odd' && winningNum !== 0 && winningNum % 2 !== 0) {
      isWin = true;
      multiplier = 2;
    } else if (betType === 'number' && betValue === winningNum) {
      isWin = true;
      multiplier = 35;
    }

    const wonCredits = betAmount * multiplier;

    if (isWin) {
      setBalance(b => b + wonCredits);
      setOutcomeMsg(`WIN! The wheel stopped on ${winningColor.toUpperCase()} ${winningNum}. You won ${wonCredits.toFixed(2)} credits!`);
      
      addTransaction({
        id: `roul-win-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_win',
        amount: wonCredits,
        betAmount: betAmount,
        title: 'Roulette Round Won',
        details: `Bet class [${betType.toUpperCase()}] resolved correct on pocket ${winningNum} (${winningColor.toUpperCase()}).`,
      });
    } else {
      setOutcomeMsg(`LOST! The wheel stopped on ${winningColor.toUpperCase()} ${winningNum}. Try again!`);
      
      addTransaction({
        id: `roul-loss-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_loss',
        amount: betAmount,
        title: 'Roulette Round Lost',
        details: `Bet class [${betType.toUpperCase()}] resolved incorrect on pocket ${winningNum} (${winningColor.toUpperCase()}).`,
      });
    }

    setSpinning(false);
  };

  const getBgClass = (color: 'red' | 'black' | 'green') => {
    switch (color) {
      case 'red': return 'bg-red-600/90 hover:bg-red-500';
      case 'black': return 'bg-gray-800 hover:bg-gray-700';
      case 'green': return 'bg-emerald-600 hover:bg-emerald-500';
    }
  };

  return (
    <div className="bg-gray-950/80 border border-gray-850 p-6 rounded-2xl text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5 font-mono animate-fade">
          <Dices className="h-4 w-4" /> GRID CYCLE ROULETTE
        </h3>
        <div className="text-xs text-gray-400 flex items-center gap-1 bg-black/40 px-3 py-1 rounded border border-gray-900 font-mono">
          <Coins className="h-3.5 w-3.5 text-amber-500" />
          <span>Balance: {balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Roulette Strip (Simulated wheel tracking) */}
      <div className="relative max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-4 overflow-hidden mb-6 shadow-inner">
        {/* Center Pointer */}
        <div className="absolute top-1 bottom-1 left-1/2 -translate-x-1/2 w-1.5 bg-yellow-400 rounded-full z-20 shadow-md">
          <div className="absolute top-0 -left-1 w-3.5 h-3 bg-yellow-500 clip-triangle" />
        </div>

        <div className="flex justify-center items-center gap-2 overflow-x-auto select-none py-2 shrink-0">
          {stripNumbers.map((num, i) => {
            const col = getColor(num);
            const isCenterSpec = i === 3; // Center index highlight
            return (
              <div
                key={i}
                className={`w-12 h-14 rounded-lg flex flex-col justify-center items-center shrink-0 border transition-all ${
                  col === 'red' ? 'bg-red-600 border-red-500/30' : col === 'black' ? 'bg-gray-950 border-gray-800' : 'bg-emerald-600 border-emerald-500/30'
                } ${isCenterSpec ? 'ring-2 ring-yellow-400 scale-105 z-10 font-bold' : 'scale-95 opacity-55'}`}
              >
                <span className="text-base font-mono font-bold leading-none">{num}</span>
                <span className="text-[7px] uppercase mt-0.5 tracking-wider leading-none opacity-80">{col}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outcome ticker display */}
      <div className="max-w-md mx-auto bg-black border border-gray-900/60 p-2.5 rounded-lg text-center text-xs font-mono mb-6">
        {spinning ? (
          <span className="text-amber-400 flex items-center justify-center gap-1.5 animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Spinning mechanical wheel...
          </span>
        ) : outcomeMsg ? (
          <span className={outcomeMsg.includes('WIN') ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
            {outcomeMsg}
          </span>
        ) : (
          <span className="text-gray-500 uppercase tracking-wider">Ready for Stake Placed</span>
        )}
      </div>

      {/* Betting Form selections */}
      <div className="max-w-md mx-auto space-y-4 mb-6">
        {/* Stake size */}
        <div>
          <span className="block text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1.5">Wager Stake Amount:</span>
          <div className="flex items-center border border-gray-850 bg-black/30 rounded-xl px-2.5 py-1.5 h-10">
            <button
              onClick={() => setBetAmount(b => Math.max(1, b - 5))}
              disabled={spinning}
              className="text-gray-400 hover:text-white px-2 cursor-pointer font-bold disabled:opacity-40"
            >
              -
            </button>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={spinning}
              className="w-full bg-transparent text-center text-sm font-mono text-emerald-400 focus:outline-none"
            />
            <button
              onClick={() => setBetAmount(b => b + 5)}
              disabled={spinning}
              className="text-gray-400 hover:text-white px-2 cursor-pointer font-bold disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {/* Bet Types selector tags */}
        <div>
          <span className="block text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">Category Stakes:</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'red', name: 'RED (1:1)' },
              { id: 'black', name: 'BLACK (1:1)' },
              { id: 'green', name: 'GREEN 0 (35:1)' },
              { id: 'even', name: 'EVEN (1:1)' },
              { id: 'odd', name: 'ODD (1:1)' },
              { id: 'number', name: 'SINGLE NO. (35:1)' },
            ].map((bt) => (
              <button
                key={bt.id}
                type="button"
                onClick={() => setBetType(bt.id as RouletteState['betType'])}
                disabled={spinning}
                className={`py-2 text-[10px] font-mono border rounded-lg transition-all font-semibold cursor-pointer ${
                  betType === bt.id
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-black/30 border-gray-800 text-gray-400 hover:bg-gray-850'
                }`}
              >
                {bt.name}
              </button>
            ))}
          </div>
        </div>

        {/* Specific number helper */}
        {betType === 'number' && (
          <div className="bg-black/20 p-3.5 border border-gray-850 rounded-xl">
            <span className="block text-[10px] text-gray-500 font-mono leading-none mb-2">Pick Pocket Number (0-36):</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                type="range"
                min="0"
                max="36"
                value={betValue}
                onChange={(e) => setBetValue(parseInt(e.target.value))}
                disabled={spinning}
                className="w-full accent-emerald-500 mb-1.5 h-1.5 bg-gray-700 rounded-lg cursor-pointer"
              />
              <p className="text-center w-full font-mono text-xs text-yellow-400">
                Selected single board pocket: <strong className="text-sm font-bold">{betValue}</strong> (Returns Bet * 36)
              </p>
            </div>
          </div>
        )}

        {/* Shoot trigger */}
        <button
          onClick={spinWheel}
          disabled={spinning || balance < betAmount}
          className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-850 disabled:text-gray-500 text-black font-semibold rounded-xl text-xs font-mono tracking-wider cursor-pointer shadow flex items-center justify-center gap-1.5"
        >
          <Play className="h-4 w-4 fill-current" /> SPIN WHEEL
        </button>
      </div>

      {/* Roulette stats notes */}
      <div className="max-w-md mx-auto bg-black/20 p-4 border border-gray-850 rounded-xl text-left text-[10px] text-gray-400 space-y-1 font-mono">
        <span className="text-gray-300 font-bold block mb-1.5 flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" /> BOARD LAYOUT CHEATSHEET
        </span>
        <p>• Green: Single slot (Pocket 0). pays 35 to 1.</p>
        <p>• Red & Black: 18 numbers each. pays 1 to 1.</p>
        <p>• Even / Odd: Evenly balanced payouts (Excludes green 0 context!).</p>
      </div>
    </div>
  );
}
