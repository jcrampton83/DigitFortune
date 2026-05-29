export interface Transaction {
  id: string;
  timestamp: string;
  type: 'earn' | 'wager_win' | 'wager_loss' | 'payout_pending' | 'payout_complete' | 'payout_rejected';
  amount: number; // in credits
  title: string;
  details: string;
  hashCount?: number;
  betAmount?: number;
}

export type ActiveGame = 'slots' | 'blackjack' | 'crash' | 'roulette' | null;

export interface MiningStats {
  isActive: boolean;
  intensity: number; // 10% to 100%
  threads: number;
  hashRate: number; // hashes per second
  totalHashes: number;
  lifetimeCredits: number;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
  score: number;
}

export interface BlackjackState {
  deck: Card[];
  playerCards: Card[];
  dealerCards: Card[];
  gameStatus: 'idle' | 'playing' | 'player_blackjack' | 'player_win' | 'dealer_win' | 'push' | 'player_bust' | 'dealer_bust';
  betAmount: number;
  message: string;
}

export interface RouletteState {
  spinning: boolean;
  resultNumber: number | null;
  resultColor: 'red' | 'black' | 'green' | null;
  betAmount: number;
  betType: 'red' | 'black' | 'green' | 'even' | 'odd' | 'number';
  betValue?: number; // if betting on specific number
}

export interface CrashState {
  multiplier: number;
  status: 'idle' | 'running' | 'crashed' | 'cashed_out';
  betAmount: number;
  cashOutMultiplier: number;
  crashedAt: number;
}
