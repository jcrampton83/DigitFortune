import { useState, useMemo } from 'react';
import { Search, History, ArrowUpRight, ArrowDownRight, RefreshCw, Copy, CheckCircle, PieChart as ChartIcon, Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Transaction } from '../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  isPollRunning?: boolean;
  lastRefreshTime?: string;
}

export default function TransactionHistory({ 
  transactions,
  isPollRunning = false,
  lastRefreshTime = '',
}: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Recharts ledger distribution computation
  const chartData = useMemo(() => {
    const rewards = transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0);
    const wins = transactions.filter(t => t.type === 'wager_win').reduce((sum, t) => sum + t.amount, 0);
    const losses = transactions.filter(t => t.type === 'wager_loss').reduce((sum, t) => sum + t.amount, 0);

    const rewardsCount = transactions.filter(t => t.type === 'earn').length;
    const winsCount = transactions.filter(t => t.type === 'wager_win').length;
    const lossesCount = transactions.filter(t => t.type === 'wager_loss').length;

    const data = [
      { name: 'Mining Rewards', value: rewards, count: rewardsCount, color: '#06b6d4' },
      { name: 'Wager Wins', value: wins, count: winsCount, color: '#10b981' },
      { name: 'Wager Losses', value: losses, count: lossesCount, color: '#ef4444' },
    ];

    const hasData = (rewards + wins + losses) > 0;
    const totalTransactions = rewardsCount + winsCount + lossesCount;

    const winRate = (winsCount + lossesCount) > 0 
      ? (winsCount / (winsCount + lossesCount)) * 100 
      : 0;

    return { data, hasData, totalTransactions, winRate, rewards, wins, losses };
  }, [transactions]);

  // Custom tool-tip for recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-white/10 p-3 rounded-xl shadow-xl font-mono text-[11px] text-white">
          <p className="font-bold text-slate-300">{data.name}</p>
          <div className="h-px bg-white/10 my-1.5" />
          <p className="flex justify-between gap-4">
            <span className="text-slate-450">Aggregate:</span>
            <span className="font-bold text-white">{data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr</span>
          </p>
          <p className="flex justify-between gap-4 mt-0.5">
            <span className="text-slate-450">Frequency:</span>
            <span className="font-bold text-white">{data.count} blocks</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Filter & Search computation
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesSearch =
          tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.id.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterType === 'all') return matchesSearch;
        if (filterType === 'earn') return tx.type === 'earn' && matchesSearch;
        if (filterType === 'wager_win') return tx.type === 'wager_win' && matchesSearch;
        if (filterType === 'wager_loss') return tx.type === 'wager_loss' && matchesSearch;
        if (filterType === 'payout') {
          return (
            (tx.type === 'payout_pending' || tx.type === 'payout_complete' || tx.type === 'payout_rejected') &&
            matchesSearch
          );
        }
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, searchTerm, filterType]);

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'earn':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Grid Earn
          </span>
        );
      case 'wager_win':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Wager Win
          </span>
        );
      case 'wager_loss':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-500 border border-gray-700">
            Wager Play
          </span>
        );
      case 'payout_pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/20 animate-pulse">
            In Queue
          </span>
        );
      case 'payout_complete':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
            Dispatched
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-container rounded-2xl p-6 text-white relative overflow-hidden z-10" id="transaction-history-panel">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-glow-cyan">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white font-display">Ledger Auditing System</h2>
            <p className="text-xs text-slate-450 font-sans">Cryptographically signed ledger blocks of rewards and plays</p>
          </div>
        </div>

        {/* Action summaries */}
        <div className="flex flex-wrap items-center gap-2">
          {isPollRunning ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold animate-pulse shadow-glow-cyan/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
              </span>
              <span>1s Auto-Polling Active</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/5 text-slate-400 border border-white/5 text-[10px] font-mono font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
              <span>Polling Suspended (Mining Idle)</span>
            </div>
          )}

          {lastRefreshTime && (
            <div className="text-[10px] text-slate-500 font-mono glass-sub px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <RefreshCw className={`h-3 w-3 text-cyan-500/70 ${isPollRunning ? 'animate-spin' : ''}`} />
              <span>SYNCED: {new Date(lastRefreshTime).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Chart Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 p-5 bg-black/40 border border-white/5 rounded-2xl" id="ledger-analytics-board">
        {/* Left: Recharts Pie Chart (columns 1 to 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 pb-6 lg:pb-0 pr-0 lg:pr-6">
          <div>
            <h3 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 uppercase tracking-wide">
              <ChartIcon className="h-4 w-4 text-cyan-400" /> Token Distribution
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Allocation of ledger value weight</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center relative mt-4">
            {chartData.hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Waiting for ledger blocks...
              </div>
            )}
            
            {/* Center label inside Donut chart */}
            {chartData.hasData && (
              <div className="absolute text-center flex flex-col items-center">
                <span className="block text-[8px] font-mono font-bold text-slate-450 uppercase tracking-wider">Total Weight</span>
                <span className="text-xs font-mono font-bold text-cyan-400 glow-cyan">
                  {Math.floor(chartData.rewards + chartData.wins + chartData.losses).toLocaleString()} Cr
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Key metrics & Legend details (columns 6 to 12) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" /> Efficiency & Legend
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Statistical summaries from active sessions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* Legend Indicators */}
            <div className="space-y-2 font-mono text-[11px]">
              {chartData.data.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded bg-indigo-950/20 border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-450 font-semibold">{item.name}</span>
                  </div>
                  <span className="text-slate-200 font-bold">{item.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Cr</span>
                </div>
              ))}
            </div>

            {/* Performance KPIs */}
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-indigo-950/20 border border-white/5 flex flex-col justify-between min-h-[48px]">
                <span className="text-slate-450 text-[9px] uppercase font-bold tracking-wider">Wager Win Rate</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-black text-emerald-400 glow-emerald">{chartData.winRate.toFixed(1)}%</span>
                  <span className="text-[9px] text-slate-500">gaming wins</span>
                </div>
              </div>
              <div className="p-2.5 rounded bg-indigo-950/20 border border-white/5 flex flex-col justify-between min-h-[48px]">
                <span className="text-slate-450 text-[9px] uppercase font-bold tracking-wider">Combined Cycles</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-black text-cyan-400 glow-cyan">{chartData.totalTransactions} blocks</span>
                  <span className="text-[9px] text-slate-500">ledger height</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search block ID, transaction titles, address hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono placeholder:text-slate-550 focus:ring-1 focus:ring-cyan-400 focus:outline-none text-white"
          />
        </div>

        {/* Filter Selection */}
        <div className="md:col-span-4 select-wrapper">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-black/45 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-mono text-slate-300 focus:ring-1 focus:ring-cyan-400 focus:outline-none cursor-pointer text-white"
          >
            <option value="all" className="bg-slate-950 text-white">ALL BLOCKS</option>
            <option value="earn" className="bg-slate-950 text-white">GRID COMPUTE EARN</option>
            <option value="wager_win" className="bg-slate-950 text-white">CASINO WAGER WINS</option>
            <option value="wager_loss" className="bg-slate-950 text-white">CASINO PLAYS</option>
            <option value="payout" className="bg-slate-950 text-white">FIAT CASH OUTS</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto border border-white/10 rounded-xl bg-black/20">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-white/10 bg-black/50 text-[10px] uppercase font-mono tracking-wider text-slate-400">
              <th className="py-3 px-4">Ledger ID</th>
              <th className="py-3 px-4">Execution Block</th>
              <th className="py-3 px-4">Method Class</th>
              <th className="py-3 px-4">Amount Balance</th>
              <th className="py-3 px-4 text-right">Registered UTCTime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-sans text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 font-mono uppercase tracking-widest text-xs">
                  No execution blocks found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isPositive = tx.type === 'earn' || tx.type === 'wager_win';
                const isNegative = tx.type === 'wager_loss' || tx.type === 'payout_pending' || tx.type === 'payout_complete';

                return (
                  <tr key={tx.id} className="hover:bg-white/[0.04] transition-colors">
                    {/* ID */}
                    <td className="py-4 px-4 font-mono text-[10px] text-slate-450">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">#{tx.id.slice(0, 12)}...</span>
                        <button
                          onClick={() => handleCopyId(tx.id)}
                          className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5 rounded"
                          title="Copy Full Transaction Hash"
                        >
                          {copiedId === tx.id ? (
                            <CheckCircle className="h-3 w-3 text-cyan-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Execution Block */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white font-display">{tx.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{tx.details}</div>
                      {tx.hashCount && (
                        <div className="text-[9px] font-mono text-slate-550 mt-1">
                          Calculated proofs: {tx.hashCount.toLocaleString()} hashes
                        </div>
                      )}
                    </td>

                    {/* Method Class (Status) */}
                    <td className="py-4 px-4">
                      {getStatusBadge(tx.type)}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 font-mono font-bold text-sm">
                      <span className={isPositive ? 'text-cyan-400 glow-cyan' : isNegative ? 'text-rose-500' : 'text-slate-350'}>
                        {isPositive ? '+' : '-'} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal ml-1">credits</span>
                    </td>

                    {/* Time */}
                    <td className="py-4 px-4 text-right font-mono text-[10px] text-slate-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
