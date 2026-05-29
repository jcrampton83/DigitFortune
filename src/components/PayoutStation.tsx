import { useState, FormEvent } from 'react';
import { CreditCard, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Transaction } from '../types';

interface PayoutStationProps {
  balance: number;
  setBalance: (updater: (prev: number) => number) => void;
  addTransaction: (tx: Transaction) => void;
}

export default function PayoutStation({ balance, setBalance, addTransaction }: PayoutStationProps) {
  const [amountInput, setAmountInput] = useState<string>('');
  const [withdrawMethod, setWithdrawMethod] = useState<'paypal' | 'bank' | 'crypto'>('bank');
  
  // Custom form details
  const [paypalEmail, setPaypalEmail] = useState<string>('');
  const [bankRouting, setBankRouting] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [cryptoAddress, setCryptoAddress] = useState<string>('');
  const [payoutLoading, setPayoutLoading] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Pop-up confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Conversion: 100 Credits = $1.00 USD
  const RATE_CREDIT_TO_USD = 0.01; 

  const handleWithdrawSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessInfo(null);

    const credits = parseFloat(amountInput);
    if (!amountInput || isNaN(credits) || credits <= 0) {
      setFormError('Please enter a valid amount of credits to cash out.');
      return;
    }

    if (credits > balance) {
      setFormError(`Insufficient balance. You only have ${Math.floor(balance).toLocaleString()} credits.`);
      return;
    }

    if (credits < 50) {
      setFormError('The minimum withdrawal limit is 50 credits ($0.50 USD).');
      return;
    }

    // Validate method forms
    if (withdrawMethod === 'paypal' && !paypalEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setFormError('Please enter a valid PayPal email address.');
      return;
    }

    if (withdrawMethod === 'bank' && (!bankRouting || bankRouting.length < 9 || !bankAccount)) {
      setFormError('Please enter a valid routing number (9 digits) and bank account number.');
      return;
    }

    if (withdrawMethod === 'crypto' && (!cryptoAddress || cryptoAddress.length < 24)) {
      setFormError('Please enter a valid Ethereum or USDC wallet address (minimum 24 characters).');
      return;
    }

    // Trigger confirmation pop-up
    setShowConfirmModal(true);
  };

  const executePayout = () => {
    setShowConfirmModal(false);
    setPayoutLoading(true);

    const credits = parseFloat(amountInput);

    setTimeout(() => {
      // Deduct balance
      setBalance(prev => prev - credits);
      
      const payoutId = `payout-${Date.now()}`;
      const amountUsd = credits * RATE_CREDIT_TO_USD;
      const detailsText = withdrawMethod === 'paypal' 
        ? `PayPal transfer requested to ${paypalEmail}`
        : withdrawMethod === 'bank'
          ? `Direct bank deposit Routing: ****${bankRouting.slice(-4)}, Acc: ****${bankAccount.slice(-4)}`
          : `USDC polygon payout dispatched to ${cryptoAddress.slice(0, 6)}...${cryptoAddress.slice(-6)}`;

      // Post pending transaction
      const pendingTx: Transaction = {
        id: payoutId,
        timestamp: new Date().toISOString(),
        type: 'payout_pending',
        amount: credits,
        title: `Fiat Payout - ${withdrawMethod.toUpperCase()}`,
        details: `${detailsText}. Processing queue verification.`,
      };
      
      addTransaction(pendingTx);
      setPayoutLoading(false);
      setAmountInput('');
      setSuccessInfo(`Success! You have requested a cash-out of ${credits.toLocaleString()} credits ($${amountUsd.toFixed(2)} USD). Our payout dispatcher has logged the payment block.`);

      // Simulate network processing completing after 5 seconds to give dynamic flair
      setTimeout(() => {
        addTransaction({
          id: `payout-success-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'payout_complete',
          amount: credits,
          title: `Fiat Payout Complete - ${withdrawMethod.toUpperCase()}`,
          details: `${detailsText}. Payment successfully finalized and verified on-grid.`,
        });
      }, 5000);

    }, 1500);
  };

  const currentCredits = parseFloat(amountInput) || 0;
  const rawUsd = currentCredits * RATE_CREDIT_TO_USD;
  const flatFee = currentCredits > 0 ? Math.min(2.00, rawUsd * 0.02) : 0; // 2% fee capped at $2
  const finalUsd = Math.max(0, rawUsd - flatFee);

  return (
    <div className="w-full max-w-2xl mx-auto text-white relative z-10" id="payout-panel">
      {/* Exchange Card */}
      <div className="glass-container rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-glow-cyan">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white font-display">Convert & Cash Out</h2>
              <p className="text-xs text-slate-400">Redeem game credits directly back into real-world fiat</p>
            </div>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-6">
            {/* Amount input */}
            <div className="glass-sub p-5 rounded-xl">
              <label className="block text-xs font-medium text-slate-400 mb-2 font-mono">
                REDEEM AMOUNT (IN CREDITS)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Minimum: 50"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="bg-transparent text-xl font-mono text-cyan-400 font-bold focus:outline-none w-full font-sans"
                />
                <button
                  type="button"
                  onClick={() => setAmountInput(Math.floor(balance).toString())}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 transition-colors text-xs font-mono rounded border border-white/5 text-slate-300 cursor-pointer"
                >
                  MAX
                </button>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-3 pt-3 border-t border-white/10 font-mono">
                <span>Available balance: {balance.toFixed(4)} credits</span>
                <span className="text-cyan-400 glow-cyan">100 Credits = $1.00 USD</span>
              </div>
            </div>

            {/* Select Method */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2.5 font-mono">
                WITHDRAWAL GATEWAY METHOD
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawMethod('bank');
                    setFormError(null);
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    withdrawMethod === 'bank'
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-glow-cyan'
                      : 'bg-black/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold block font-sans">ACH Bank Wire</span>
                  <span className="text-[9px] text-slate-500 font-mono">Free • 1-2 Days</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawMethod('paypal');
                    setFormError(null);
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    withdrawMethod === 'paypal'
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-glow-cyan'
                      : 'bg-black/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold block font-sans">PayPal</span>
                  <span className="text-[9px] text-slate-500 font-mono">2% fee • Instant</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawMethod('crypto');
                    setFormError(null);
                  }}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    withdrawMethod === 'crypto'
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-glow-cyan'
                      : 'bg-black/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold block font-sans">USDC</span>
                  <span className="text-[9px] text-slate-500 font-mono">Free • Instant</span>
                </button>
              </div>
            </div>

            {/* Render conditional inputs */}
            <div className="glass-sub p-4 rounded-xl space-y-4">
              {withdrawMethod === 'bank' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1.5 font-mono">Routing Number (9 DIGITS)</label>
                    <input
                      type="text"
                      maxLength={9}
                      placeholder="021000021"
                      value={bankRouting}
                      onChange={(e) => setBankRouting(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-black/45 border border-white/10 rounded-lg p-2.5 font-mono text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1.5 font-mono">Account Number</label>
                    <input
                      type="password"
                      placeholder="9876543210"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full bg-black/45 border border-white/10 rounded-lg p-2.5 font-mono text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white font-medium"
                    />
                  </div>
                </div>
              )}

              {withdrawMethod === 'paypal' && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5 font-mono">PayPal Account Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full bg-black/45 border border-white/10 rounded-lg p-2.5 font-mono text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white font-medium"
                  />
                </div>
              )}

              {withdrawMethod === 'crypto' && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5 font-mono">Recipient Polygon USDC Wallet Address</label>
                  <input
                    type="text"
                    placeholder="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    className="w-full bg-black/45 border border-white/10 rounded-lg p-2.5 font-mono text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white font-medium"
                  />
                </div>
              )}
            </div>

            {/* Error messaging */}
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Success messaging */}
            {successInfo && (
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/25 rounded-xl flex items-start gap-2.5 text-xs text-cyan-400 animate-fade">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-cyan-400 glow-cyan" />
                <span>{successInfo}</span>
              </div>
            )}

            {/* Submit Payout Button */}
            <button
              type="submit"
              disabled={payoutLoading}
              className="w-full h-12 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-95 text-white disabled:bg-gray-800 disabled:text-gray-500 font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 shadow-glow-cyan transition-all"
            >
              {payoutLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Verifying ledger blocks...
                </>
              ) : (
                <>
                  Initialize Cashout Transfer <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation Pop-Up Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade">
          <div className="glass-container max-w-md w-full rounded-2xl p-6 border-white/15 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <ShieldCheck className="h-5 w-5 glow-cyan animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight font-display text-white">Ledger Extraction Dispatch</h3>
                  <p className="text-[9px] text-slate-450 font-mono uppercase">Audit summary estimate</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Gateway Method</span>
                <span className="text-white font-bold uppercase">
                  {withdrawMethod === 'bank' ? 'ACH Bank Wire' : withdrawMethod === 'paypal' ? 'PayPal Account' : 'USDC ERC-20'}
                </span>
              </div>

              {withdrawMethod === 'paypal' && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Recipient Email</span>
                  <span className="text-white font-bold truncate max-w-[200px]">{paypalEmail}</span>
                </div>
              )}

              {withdrawMethod === 'bank' && (
                <>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Routing Number</span>
                    <span className="text-white font-bold">****{bankRouting.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Account Number</span>
                    <span className="text-white font-bold">****{bankAccount.slice(-4)}</span>
                  </div>
                </>
              )}

              {withdrawMethod === 'crypto' && (
                <div className="flex justify-between border-b border-white/5 pb-2 border-dashed">
                  <span className="text-slate-400">Payout Address</span>
                  <span className="text-white font-bold truncate max-w-[150px]">{cryptoAddress.slice(0, 6)}...{cryptoAddress.slice(-4)}</span>
                </div>
              )}

              {/* Estimate Calculations */}
              <div className="bg-black/50 border border-white/10 rounded-xl p-4 mt-2 space-y-3 font-mono">
                <div className="flex justify-between text-[11px] items-center">
                  <span className="text-slate-450 font-medium">Gross exchange value ({currentCredits} Cr):</span>
                  <span className="text-slate-200 font-bold">${rawUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] items-center text-slate-450">
                  <span>Gateway process fee:</span>
                  <span>{flatFee > 0 ? `-$${flatFee.toFixed(2)}` : '$0.00'}</span>
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="flex justify-between text-sm items-center pt-1 font-bold">
                  <span className="text-cyan-400 font-bold">Net payout value:</span>
                  <span className="text-cyan-400 glow-cyan font-extrabold text-base">${finalUsd.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Secure Guidelines */}
              <div className="text-[10px] text-slate-450 leading-relaxed space-y-2 pt-2 border-t border-white/5 font-sans">
                <h4 className="text-[11px] font-semibold text-slate-300 font-mono">LIQUIDITY PROTOCOL POLICIES:</h4>
                <div className="flex items-start gap-1.5 align-middle">
                  <span className="text-cyan-400 font-black">•</span>
                  <span>ACH bank deposits hold cycle verification generally completes inside 24 hours of cooling.</span>
                </div>
                <div className="flex items-start gap-1.5 align-middle">
                  <span className="text-cyan-400 font-black">•</span>
                  <span>Automated audit checks confirm compute integrity instantly to secure and finalize calculations.</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold rounded-xl cursor-pointer text-xs font-mono transition-colors text-center"
              >
                DISMISS
              </button>
              <button
                type="button"
                onClick={executePayout}
                className="py-2.5 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-90 text-white font-bold rounded-xl cursor-pointer text-xs font-mono transition-all text-center shadow-lg shadow-cyan-500/20 shadow-glow-cyan"
              >
                DISPATCH PAYOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
