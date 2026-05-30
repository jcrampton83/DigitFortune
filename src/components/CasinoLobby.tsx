import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveGame, Transaction, CustomTheme } from '../types';
import SlotsGame from './games/SlotsGame';
import BlackjackGame from './games/BlackjackGame';
import CrashGame from './games/CrashGame';
import RouletteGame from './games/RouletteGame';
import { Trophy, HelpCircle, Gamepad2, Coins, ArrowLeft, Zap, Target, Flame, Play, Info } from 'lucide-react';

import slotsBg from '../assets/images/slots_bg_1780087825382.png';
import blackjackBg from '../assets/images/blackjack_bg_1780087844046.png';
import crashBg from '../assets/images/crash_bg_1780087859289.png';
import rouletteBg from '../assets/images/roulette_bg_1780087875817.png';

interface GameVariant {
  name: string;
  minBet: string;
}

interface GameDefinition {
  id: 'slots' | 'blackjack' | 'crash' | 'roulette';
  name: string;
  desc: string;
  icon: ReactNode;
  badge: string;
  bg: string;
  rules: string;
  variants: GameVariant[];
}

const GAMES: GameDefinition[] = [
  {
    id: 'slots',
    name: 'Slots',
    desc: 'Pull the mechanical layout arm & match crypt-coded indicators for jackpot payouts up to 150x.',
    icon: <Flame className="h-6 w-6 text-orange-400 font-bold" />,
    badge: 'POPULAR',
    bg: slotsBg,
    rules: 'Match 3 crypt-coded indicators in a row to win. Different symbols have different payout multipliers.',
    variants: [{ name: 'Classic Slots', minBet: '1 Cr' }, { name: 'Cyber Slots', minBet: '2 Cr' }, { name: 'MegaSlots', minBet: '5 Cr' }]
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    desc: 'Play standard double-down tactical blackjack versus automated dealer scripts. Aim precisely for 21.',
    icon: <Target className="h-6 w-6 text-sky-400" />,
    badge: 'SKILL',
    bg: blackjackBg,
    rules: 'Beat the dealer\'s hand without busting. Closest to 21 wins. Double down on strong starting totals.',
    variants: [{ name: 'Standard BJ', minBet: '5 Cr' }, { name: 'Speed BJ', minBet: '10 Cr' }]
  },
  {
    id: 'crash',
    name: 'Crash',
    desc: 'Watch the parabolic curve multiplier climb. Claim your earnings manually before the process crashes.',
    icon: <Zap className="h-6 w-6 text-yellow-400" />,
    badge: 'TRENDING',
    bg: crashBg,
    rules: 'Multiply your bet before the curve crashes. Cash out at any multiplier higher than 1x.',
    variants: [{ name: 'Vektr Crash', minBet: '1 Cr' }, { name: 'Fast Crash', minBet: '2 Cr' }]
  },
  {
    id: 'roulette',
    name: 'Roulette',
    desc: 'European single-zero roulette. Place wagers on sector colors, oddness properties, or custom numbers.',
    icon: <Gamepad2 className="h-6 w-6 text-purple-400" />,
    badge: 'CLASSIC',
    bg: rouletteBg,
    rules: 'Spin the wheel and bet on the sector. Payouts depend on the risk of your selected sector number.',
    variants: [{ name: 'European', minBet: '1 Cr' }, { name: 'Zoom', minBet: '2 Cr' }, { name: 'African', minBet: '5 Cr' }]
  },
];

interface CasinoLobbyProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  addTransaction: (tx: Transaction) => void;
  theme?: CustomTheme;
}

export default function CasinoLobby({ balance, setBalance, addTransaction, theme }: CasinoLobbyProps) {
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null);
  const [rulesGame, setRulesGame] = useState<GameDefinition | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null);

  if (activeGame === 'slots') {
    return (
      <div className="space-y-4 font-sans animate-fade relative z-10">
        <button
          onClick={() => setActiveGame(null)}
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono hover:text-cyan-300 font-semibold cursor-pointer py-1 glow-cyan"
        >
          <ArrowLeft className="h-4 w-4" /> RE-ENTER GAME LOBBY
        </button>
        <SlotsGame balance={balance} setBalance={setBalance} addTransaction={addTransaction} />
      </div>
    );
  }

  if (activeGame === 'blackjack') {
    return (
      <div className="space-y-4 font-sans animate-fade relative z-10">
        <button
          onClick={() => setActiveGame(null)}
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono hover:text-cyan-300 font-semibold cursor-pointer py-1 glow-cyan"
        >
          <ArrowLeft className="h-4 w-4" /> RE-ENTER GAME LOBBY
        </button>
        <BlackjackGame balance={balance} setBalance={setBalance} addTransaction={addTransaction} />
      </div>
    );
  }

  if (activeGame === 'crash') {
    return (
      <div className="space-y-4 font-sans animate-fade relative z-10">
        <button
          onClick={() => setActiveGame(null)}
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono hover:text-cyan-300 font-semibold cursor-pointer py-1 glow-cyan"
        >
          <ArrowLeft className="h-4 w-4" /> RE-ENTER GAME LOBBY
        </button>
        <CrashGame balance={balance} setBalance={setBalance} addTransaction={addTransaction} />
      </div>
    );
  }

  if (activeGame === 'roulette') {
    return (
      <div className="space-y-4 font-sans animate-fade relative z-10">
        <button
          onClick={() => setActiveGame(null)}
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono hover:text-cyan-300 font-semibold cursor-pointer py-1 glow-cyan"
        >
          <ArrowLeft className="h-4 w-4" /> RE-ENTER GAME LOBBY
        </button>
        <RouletteGame balance={balance} setBalance={setBalance} addTransaction={addTransaction} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 relative z-10" id="casino-lobby">
      <AnimatePresence mode="wait">
        {!selectedGame ? (
          <motion.div
            key="lobby-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2"
          >
            {GAMES.map((game) => {
              const gameCardTheme = theme?.cards?.[game.id];
              const isThemeDefault = !theme || theme.id === 'default' || theme.isDefault;

              let bgSrc = game.bg;
              let shouldRenderImage = true;

              if (!isThemeDefault && gameCardTheme) {
                if (gameCardTheme.useImage && gameCardTheme.imageUrl) {
                  bgSrc = gameCardTheme.imageUrl;
                  shouldRenderImage = true;
                } else if (!gameCardTheme.useImage && !gameCardTheme.imageUrl) {
                  bgSrc = game.bg;
                  shouldRenderImage = true;
                } else {
                  shouldRenderImage = false;
                }
              }
              
              return (
              <motion.div
                key={game.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedGame(game)}
                className="group relative glass-container bg-slate-950/50 hover:border-cyan-500/50 rounded-2xl p-6 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-xl min-h-[200px] border border-white/5 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                style={{ backgroundColor: !isThemeDefault ? gameCardTheme?.color : undefined }}
              >
                {shouldRenderImage && bgSrc && (
                  <img
                    src={bgSrc}
                    alt={game.name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 transition-all duration-700 pointer-events-none z-0"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/30 z-0 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRulesGame(game); }}
                      className="p-3 bg-black/60 border border-white/10 rounded-xl group-hover:border-cyan-500/40 transition-all shadow-md group-hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:glow-cyan"
                    >
                      {game.icon}
                    </button>
                    <button
                      onMouseEnter={(e) => { setTooltip({ x: e.clientX, y: e.clientY, text: game.desc }); }}
                      onMouseLeave={() => setTooltip(null)}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-glow-cyan hover:bg-cyan-500/20"
                    >
                      ?
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-white transition-colors mb-2 font-display">
                    {game.name}
                  </h3>
                </div>
              </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="variants-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button
              onClick={() => setSelectedGame(null)}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono hover:text-cyan-300 font-semibold cursor-pointer py-1"
            >
              <ArrowLeft className="h-4 w-4" /> BACK TO LOBBY
            </button>
            <h2 className="text-2xl font-bold">{selectedGame.name} Variants</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedGame.variants.map((variant) => (
                <div 
                  key={variant.name} 
                  onClick={() => setActiveGame(selectedGame.id)}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 cursor-pointer transition-all hover:bg-white/10"
                >
                  <h4 className="font-bold">{variant.name}</h4>
                  <p className="text-xs text-slate-400">Min bet: {variant.minBet}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules Modal */}
      {rulesGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">{rulesGame.name} Rules</h3>
            <p className="text-slate-300 mb-6">{rulesGame.rules}</p>
            <button onClick={() => setRulesGame(null)} className="w-full py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500">Close</button>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-black border border-cyan-500/30 p-3 rounded-lg text-xs max-w-xs shadow-xl" style={{ top: tooltip.y + 10, left: tooltip.x + 10 }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
