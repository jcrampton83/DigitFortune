import { useState } from 'react';
import { Lock, Cpu, Users, CreditCard, ClipboardList } from 'lucide-react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Lock className="h-5 w-5" /> Admin Login</h2>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 mb-4 bg-slate-800 rounded-lg" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 mb-6 bg-slate-800 rounded-lg" />
          <button onClick={() => { if (username === 'Admin' && password === 'Nimda') setIsAuthenticated(true); }} className="w-full py-3 bg-cyan-600 rounded-lg">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Admin Portal</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Simple dashboard stats placeholders */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">Users: 1,234</div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">Nodes: 567</div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">Payouts: 50,000Cr</div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">Pending: 12</div>
      </div>
      {/* ... Add other sections ... */}
    </div>
  );
}
