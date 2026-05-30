import { useState } from 'react';
import { ActiveGame, Transaction, CustomTheme } from '../types';
import SlotsGame from './games/SlotsGame';
import BlackjackGame from './games/BlackjackGame';
import CrashGame from './games/CrashGame';
import RouletteGame from './games/RouletteGame';
import { Trophy, HelpCircle, Gamepad2, Coins, ArrowLeft, Zap, Target, Flame, Play } from 'lucide-react';

import slotsBg from '../assets/images/slots_bg_1780087825382.png';
import blackjackBg from '../assets/images/blackjack_bg_1780087844046.png';
import crashBg from '../assets/images/crash_bg_1780087859289.png';
import rouletteBg from '../assets/images/roulette_bg_1780087875817.png';

interface CasinoLobbyProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  addTransaction: (tx: Transaction) => void;
  theme?: CustomTheme;
}

export default function CasinoLobby({ balance, setBalance, addTransaction, theme }: CasinoLobbyProps) {
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);

  // Available games metadata
  const GAMES = [
    {
      id: 'slots' as const,
      name: 'Grid Cycle Slots',
      desc: 'Pull the mechanical layout arm & match crypt-coded indicators for jackpot payouts up to 150x.',
      icon: <Flame className="h-6 w-6 text-orange-400 font-bold" />,
      minBet: '1 Credit',
      maxMultiplier: '150x',
      badge: 'POPULAR',
      bg: slotsBg,
    },
    {
      id: 'blackjack' as const,
      name: 'Grid Proof Blackjack',
      desc: 'Play standard double-down tactical blackjack versus automated dealer scripts. Aim precisely for 21.',
      icon: <Target className="h-6 w-6 text-sky-400" />,
      minBet: '5 Credits',
      maxMultiplier: '2.5x',
      badge: 'SKILL',
      bg: blackjackBg,
    },
    {
      id: 'crash' as const,
      name: 'Grid Vektr Crash',
      desc: 'Watch the parabolic curve multiplier climb. Claim your earnings manually before the process crashes.',
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      minBet: '1 Credit',
      maxMultiplier: 'DYNAMIC',
      badge: 'TRENDING',
      bg: crashBg,
    },
    {
      id: 'roulette' as const,
      name: 'Grid Cycle Roulette',
      desc: 'European single-zero roulette. Place wagers on sector colors, oddness properties, or custom numbers.',
      icon: <Gamepad2 className="h-6 w-6 text-purple-400" />,
      minBet: '1 Credit',
      maxMultiplier: '35x',
      badge: 'CLASSIC',
      bg: rouletteBg,
    },
  ];

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
      {/* Grid of games cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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
              // They haven't set a custom image, so we keep the default game image as fallback
              bgSrc = game.bg;
              shouldRenderImage = true;
            } else {
              // They have explicitly chosen "Use Solid", so don't render the image
              shouldRenderImage = false;
            }
          }

          return (
            <div
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className="group relative glass-container hover:bg-white/[0.02] hover:border-cyan-400/40 rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between overflow-hidden shadow-xl min-h-[240px]"
              style={{ backgroundColor: !isThemeDefault ? gameCardTheme?.color : undefined }}
            >
              {/* Immersive Game Background Image with Glass Overlay */}
              {shouldRenderImage && bgSrc && (
                <img
                  src={bgSrc}
                  alt={game.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700 pointer-events-none z-0"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/30 z-0 pointer-events-none" />

            <div className="relative z-10">
              {/* Card headers */}
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-black/60 border border-white/10 rounded-xl group-hover:border-cyan-500/40 group-hover:bg-black/80 transition-all shadow-md">
                  {game.icon}
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase shadow-glow-cyan">
                  {game.badge}
                </span>
              </div>

              {/* Descriptions title */}
              <h3 className="text-base font-bold text-white group-hover:text-cyan-400 group-hover:glow-cyan transition-colors mb-2 font-display">
                {game.name}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-[90%]">
                {game.desc}
              </p>
            </div>

            {/* Bottom details indicators */}
            <div className="relative z-10 border-t border-white/10 pt-4 mt-6 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex gap-4">
                <span>Min bet: <strong className="text-slate-200">{game.minBet}</strong></span>
                <span>Max mult: <strong className="text-slate-200">{game.maxMultiplier}</strong></span>
              </div>
              <span className="text-cyan-400 font-bold flex items-center group-hover:translate-x-1 transition-transform glow-cyan">
                COMMENCE PLAY <Play className="h-3 w-3 ml-1 fill-current" />
              </span>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
