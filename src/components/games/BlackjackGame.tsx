import { useState, useEffect } from 'react';
import { Card, BlackjackState, Transaction } from '../../types';
import { Sparkles, Trophy, HelpCircle, Coins } from 'lucide-react';

interface BlackjackProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  addTransaction: (tx: Transaction) => void;
}

const SUITS: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = [
  { val: '2', score: 2 },
  { val: '3', score: 3 },
  { val: '4', score: 4 },
  { val: '5', score: 5 },
  { val: '6', score: 6 },
  { val: '7', score: 7 },
  { val: '8', score: 8 },
  { val: '9', score: 9 },
  { val: '10', score: 10 },
  { val: 'J', score: 10 },
  { val: 'Q', score: 10 },
  { val: 'K', score: 10 },
  { val: 'A', score: 11 }, // Handle aces dynamic sum dynamically
];

export default function BlackjackGame({ balance, setBalance, addTransaction }: BlackjackProps) {
  const [gameState, setGameState] = useState<BlackjackState>({
    deck: [],
    playerCards: [],
    dealerCards: [],
    gameStatus: 'idle',
    betAmount: 5,
    message: 'Place your wager to deal a hand.',
  });

  // Calculate high-fidelity score matching dynamic Ace values
  const getHandScore = (cards: Card[]): number => {
    let rawScore = cards.reduce((sum, c) => sum + c.score, 0);
    let acesCount = cards.filter(c => c.value === 'A').length;

    while (rawScore > 21 && acesCount > 0) {
      rawScore -= 10;
      acesCount--;
    }
    return rawScore;
  };

  // Generate shuffled deck
  const generateDeck = (): Card[] => {
    const freshDeck: Card[] = [];
    SUITS.forEach((suit) => {
      VALUES.forEach((v) => {
        freshDeck.push({
          suit,
          value: v.val,
          score: v.score,
        });
      });
    });

    // Shuffle simple indices
    for (let i = freshDeck.length - 1; i > 0; i--) {
      const pick = Math.floor(Math.random() * (i + 1));
      const temp = freshDeck[i];
      freshDeck[i] = freshDeck[pick];
      freshDeck[pick] = temp;
    }
    return freshDeck;
  };

  const startHand = () => {
    if (balance < gameState.betAmount) {
      alert('Insufficient credits for this bet.');
      return;
    }

    // Deduct bet amount
    setBalance(b => b - gameState.betAmount);

    const deck = generateDeck();
    const playerCards = [deck.pop()!, deck.pop()!];
    const dealerCards = [deck.pop()!, deck.pop()!];

    const pScore = getHandScore(playerCards);
    const dScore = getHandScore(dealerCards);

    let status: BlackjackState['gameStatus'] = 'playing';
    let message = 'Your turn! Hit or stand?';

    if (pScore === 21 && dScore === 21) {
      status = 'push';
      message = 'Both have Blackjack! Match points returned.';
      setBalance(b => b + gameState.betAmount);
    } else if (pScore === 21) {
      status = 'player_blackjack';
      const payout = gameState.betAmount * 2.5; // 3:2 payout
      message = `Natural 21! BLACKJACK pays ${payout} credits!`;
      setBalance(b => b + payout);
      
      addTransaction({
        id: `bj-win-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_win',
        amount: payout,
        betAmount: gameState.betAmount,
        title: 'Blackjack Natural Win',
        details: `Blackjack hand dealt natural 21. Earned 3:2 payout.`,
      });
    } else if (dScore === 21) {
      status = 'dealer_win';
      message = 'Dealer has natural Blackjack. Dealer wins.';
      
      addTransaction({
        id: `bj-loss-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_loss',
        amount: gameState.betAmount,
        title: 'Blackjack Played Lost',
        details: `Dealer has natural Blackjack hand on a bet of ${gameState.betAmount}.`,
      });
    }

    setGameState(prev => ({
      ...prev,
      deck,
      playerCards,
      dealerCards,
      gameStatus: status,
      message,
    }));
  };

  const handleHit = () => {
    if (gameState.gameStatus !== 'playing') return;

    const newDeck = [...gameState.deck];
    const newCards = [...gameState.playerCards, newDeck.pop()!];
    const score = getHandScore(newCards);

    let nextStatus: BlackjackState['gameStatus'] = 'playing';
    let msg = 'Hit or Stand?';

    if (score > 21) {
      nextStatus = 'player_bust';
      msg = `Bust! You scored ${score} points. Dealer wins.`;
      
      addTransaction({
        id: `bj-loss-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_loss',
        amount: gameState.betAmount,
        title: 'Blackjack Played Lost',
        details: `Busted hand with ${score} total score.`,
      });
    }

    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      playerCards: newCards,
      gameStatus: nextStatus,
      message: msg,
    }));
  };

  const handleStand = () => {
    if (gameState.gameStatus !== 'playing') return;

    let newDeck = [...gameState.deck];
    const newDealerCards = [...gameState.dealerCards];

    // Dealer rules: stands on soft/hard 17 or more
    let dScore = getHandScore(newDealerCards);
    while (dScore < 17) {
      newDealerCards.push(newDeck.pop()!);
      dScore = getHandScore(newDealerCards);
    }

    const pScore = getHandScore(gameState.playerCards);

    let nextStatus: BlackjackState['gameStatus'] = 'idle';
    let msg = '';
    let winAmount = 0;

    if (dScore > 21) {
      nextStatus = 'dealer_bust';
      msg = `Dealer busts with ${dScore} points! You win ${gameState.betAmount * 2} credits!`;
      winAmount = gameState.betAmount * 2;
      setBalance(b => b + winAmount);
    } else if (pScore > dScore) {
      nextStatus = 'player_win';
      msg = `You score ${pScore} to dealer's ${dScore}. You win ${gameState.betAmount * 2} credits!`;
      winAmount = gameState.betAmount * 2;
      setBalance(b => b + winAmount);
    } else if (dScore > pScore) {
      nextStatus = 'dealer_win';
      msg = `Dealer scores ${dScore} to your ${pScore}. Dealer wins.`;
    } else {
      nextStatus = 'push';
      msg = `Tie hand! Push of ${dScore} points. Bet returned.`;
      winAmount = gameState.betAmount; // Return original bet
      setBalance(b => b + winAmount);
    }

    // Capture transactions
    if (winAmount > gameState.betAmount) {
      addTransaction({
        id: `bj-win-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_win',
        amount: winAmount,
        betAmount: gameState.betAmount,
        title: 'Blackjack Hand Won',
        details: `Player scores ${pScore} versus Dealer's ${dScore}.`,
      });
    } else if (winAmount === 0) {
      addTransaction({
        id: `bj-loss-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_loss',
        amount: gameState.betAmount,
        title: 'Blackjack Played Lost',
        details: `Player scores ${pScore} versus Dealer's ${dScore} on a bet of ${gameState.betAmount}.`,
      });
    }

    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      dealerCards: newDealerCards,
      gameStatus: nextStatus,
      message: msg,
    }));
  };

  const handleDoubleDown = () => {
    if (gameState.gameStatus !== 'playing' || gameState.playerCards.length !== 2) return;
    if (balance < gameState.betAmount) {
      alert('Insufficient balance to double down.');
      return;
    }

    // Deduct supplementary bet
    setBalance(b => b - gameState.betAmount);

    const newDeck = [...gameState.deck];
    const newPlayerCards = [...gameState.playerCards, newDeck.pop()!];
    const pScore = getHandScore(newPlayerCards);

    // Double-down gives exactly ONE card, then auto-stands
    let nextStatus: BlackjackState['gameStatus'] = 'playing';
    let dScore = getHandScore(gameState.dealerCards);

    let updatedBet = gameState.betAmount * 2;

    if (pScore > 21) {
      addTransaction({
        id: `bj-loss-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_loss',
        amount: updatedBet,
        title: 'Blackjack Double-Down Lost',
        details: `Busted with ${pScore} score on doubled wager of ${updatedBet}.`,
      });

      setGameState(prev => ({
        ...prev,
        deck: newDeck,
        playerCards: newPlayerCards,
        gameStatus: 'player_bust',
        message: `Bust! You scored ${pScore}. Dealer wins.`,
      }));
      return;
    }

    // Run Dealer AI
    const newDealerCards = [...gameState.dealerCards];
    dScore = getHandScore(newDealerCards);
    while (dScore < 17) {
      newDealerCards.push(newDeck.pop()!);
      dScore = getHandScore(newDealerCards);
    }

    let winAmount = 0;
    let finalStatus: BlackjackState['gameStatus'] = 'idle';
    let msg = '';

    if (dScore > 21) {
      finalStatus = 'dealer_bust';
      msg = `Dealer busts with ${dScore}! You win ${updatedBet * 2} credits on double down!`;
      winAmount = updatedBet * 2;
    } else if (pScore > dScore) {
      finalStatus = 'player_win';
      msg = `Double down success! You scored ${pScore} to Dealer's ${dScore}. Win ${updatedBet * 2}!`;
      winAmount = updatedBet * 2;
    } else if (dScore > pScore) {
      finalStatus = 'dealer_win';
      msg = `Dealer scores ${dScore} to your ${pScore}. Double down lost.`;
    } else {
      finalStatus = 'push';
      msg = `Tie hand! Push of ${dScore}. Wager returned.`;
      winAmount = updatedBet;
    }

    // Credit changes
    if (winAmount > 0) {
      setBalance(b => b + winAmount);
    }

    if (winAmount > updatedBet) {
      addTransaction({
        id: `bj-win-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_win',
        amount: winAmount,
        betAmount: updatedBet,
        title: 'Blackjack Double-Down Win',
        details: `Payout of ${winAmount} scored ${pScore} over Dealer's ${dScore}.`,
      });
    } else if (winAmount === 0) {
      addTransaction({
        id: `bj-loss-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'wager_loss',
        amount: updatedBet,
        title: 'Blackjack Double-Down Lost',
        details: `Doubled wager of ${updatedBet} lost. Player: ${pScore}, Dealer: ${dScore}.`,
      });
    }

    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      playerCards: newPlayerCards,
      dealerCards: newDealerCards,
      gameStatus: finalStatus,
      message: msg,
    }));
  };

  const getSuitSymbol = (suit: Card['suit']) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
    }
  };

  const getSuitColor = (suit: Card['suit']) => {
    return (suit === 'hearts' || suit === 'diamonds') ? 'text-red-500' : 'text-gray-300';
  };

  // Card helper renderer
  const renderCard = (card: Card, hidden?: boolean, key?: any) => {
    if (hidden) {
      return (
        <div key={key} className="w-16 h-24 bg-gradient-to-br from-indigo-900 to-indigo-950 border-2 border-indigo-500/30 rounded-xl flex items-center justify-center p-1.5 shadow-md shrink-0 relative transition-all animate-flip">
          <div className="absolute inset-1 border border-indigo-400/20 rounded-lg flex items-center justify-center overflow-hidden">
            <span className="text-[10px] font-mono font-bold text-indigo-400/60 uppercase tracking-widest text-center rotate-45">GRIDSEC</span>
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="w-16 h-24 bg-gray-950 border border-gray-800 rounded-xl flex flex-col justify-between p-2 shadow-lg shrink-0 relative transition-all">
        <div className={`text-sm font-semibold leading-none flex justify-between ${getSuitColor(card.suit)}`}>
          <span>{card.value}</span>
          <span className="text-xs">{getSuitSymbol(card.suit)}</span>
        </div>
        <div className={`text-center text-3xl font-light leading-none ${getSuitColor(card.suit)}`}>
          {getSuitSymbol(card.suit)}
        </div>
        <div className={`text-sm font-semibold leading-none flex justify-between rotate-180 self-end ${getSuitColor(card.suit)}`}>
          <span>{card.value}</span>
          <span className="text-xs">{getSuitSymbol(card.suit)}</span>
        </div>
      </div>
    );
  };

  const pScore = getHandScore(gameState.playerCards);
  const dScore = getHandScore(gameState.dealerCards);
  const isPlaying = gameState.gameStatus === 'playing';

  return (
    <div className="bg-gray-950/80 border border-gray-850 p-6 rounded-2xl text-white">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5 font-mono">
          <Sparkles className="h-4 w-4" /> GRID PROOF BLACKJACK
        </h3>
        <div className="text-xs text-gray-400 flex items-center gap-1 bg-black/40 px-3 py-1 rounded border border-gray-900 font-mono">
          <Coins className="h-3.5 w-3.5 text-amber-500" />
          <span>Balance: {balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Game board */}
      <div className="bg-gradient-to-b from-gray-950 to-gray-900 border border-gray-800/85 rounded-2xl p-6 min-h-[300px] flex flex-col justify-between relative mb-6">
        <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-3xl pointer-events-none" />

        {/* Dealer space */}
        <div>
          <div className="flex justify-between items-center text-xs text-gray-550 mb-2">
            <span>DEALER HAND (Stands on 17)</span>
            <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-gray-900 text-gray-400 font-bold">
              {isPlaying ? '?' : dScore}
            </span>
          </div>
          <div className="flex gap-2 min-h-[96px] overflow-x-auto pb-2">
            {gameState.dealerCards.map((card, idx) => (
              renderCard(card, isPlaying && idx === 1, idx)
            ))}
          </div>
        </div>

        {/* Message board */}
        <div className="my-6 border-y border-gray-800/60 py-3 text-center">
          <p className="text-xs font-mono font-semibold text-amber-400">
            {gameState.message}
          </p>
        </div>

        {/* Player space */}
        <div>
          <div className="flex justify-between items-center text-xs text-gray-550 mb-2">
            <span>YOUR COMBINATION</span>
            {pScore > 0 && (
              <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-gray-900 text-emerald-400 font-semibold">
                {pScore}
              </span>
            )}
          </div>
          <div className="flex gap-2 min-h-[96px] overflow-x-auto pb-2">
            {gameState.playerCards.map((card, idx) => (
              renderCard(card, false, idx)
            ))}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="max-w-md mx-auto grid grid-cols-2 gap-3 mb-6">
        {isPlaying ? (
          <>
            <button
              onClick={handleHit}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-750 font-semibold rounded-xl text-xs font-mono tracking-wider cursor-pointer border border-gray-700 hover:text-white text-gray-200 uppercase"
            >
              Hit (Card)
            </button>
            <button
              onClick={handleStand}
              className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs font-mono tracking-wider cursor-pointer"
            >
              Stand (Decline)
            </button>
            {gameState.playerCards.length === 2 && balance >= gameState.betAmount && (
              <button
                onClick={handleDoubleDown}
                className="col-span-2 px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/40 font-semibold rounded-xl text-[11px] font-mono tracking-wider cursor-pointer mt-1"
              >
                Double Stake Wager (+{gameState.betAmount})
              </button>
            )}
          </>
        ) : (
          <div className="col-span-2 flex items-center gap-3">
            <div className="flex-1">
              <span className="block text-[10px] text-gray-500 mb-1 font-mono uppercase text-center">Stake Game</span>
              <div className="flex items-center border border-gray-850 bg-black/30 rounded-xl px-2 py-1.5 h-10">
                <button
                  type="button"
                  onClick={() => setGameState(prev => ({ ...prev, betAmount: Math.max(1, prev.betAmount - 5) }))}
                  className="text-gray-400 hover:text-white px-2 cursor-pointer font-bold text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  value={gameState.betAmount}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setGameState(prev => ({ ...prev, betAmount: val }));
                  }}
                  className="w-full bg-transparent text-center text-xs font-mono text-emerald-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setGameState(prev => ({ ...prev, betAmount: prev.betAmount + 5 }))}
                  className="text-gray-400 hover:text-white px-2 cursor-pointer font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>
            
            <button
              onClick={startHand}
              disabled={gameState.betAmount > balance}
              className="flex-1 h-10 mt-5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-500 text-black font-semibold rounded-xl text-xs font-mono tracking-wider cursor-pointer flex items-center justify-center gap-1 shadow transition-all"
            >
              DEAL CARD
            </button>
          </div>
        )}
      </div>

      {/* Help box */}
      <div className="max-w-md mx-auto bg-black/20 p-4 border border-gray-850 rounded-xl text-left text-[10px] text-gray-400 space-y-1 font-mono">
        <span className="text-gray-300 font-bold block mb-1.5 flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" /> CARD RULES QUICK-GUIDE
        </span>
        <p>• Aim for 21. Scores above 21 immediately go Bust and lose the bet.</p>
        <p>• Dealer must draw cards until their core hand score hits 17 or higher.</p>
        <p>• Natural Blackjack payouts are scaled at 3 to 2 (2.5x original bet).</p>
      </div>
    </div>
  );
}
