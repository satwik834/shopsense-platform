import React, { useState } from 'react';
import { api } from '../api';
import { ShieldCheck, Store, Lock, Mail, ArrowRight, UserPlus, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [registerType, setRegisterType] = useState('customer'); // 'customer' or 'vendor'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setMessage(null);
      const res = await api.login(email, password);
      localStorage.setItem('shopsense_token', res.access_token);
      localStorage.setItem('shopsense_user', JSON.stringify(res));
      onLoginSuccess(res);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Invalid email or password.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    try {
      setLoading(true);
      setMessage(null);

      if (registerType === 'customer') {
        await api.registerCustomer({
          name,
          email,
          password,
          phone: phone || undefined,
          address: address || undefined
        });

        setMessage({
          type: 'success',
          text: 'Customer account registered successfully! You can now sign in.'
        });
      } else {
        await api.registerVendor({
          name,
          store_name: storeName || name,
          email,
          password,
          phone: phone || undefined,
          description: description || undefined
        });

        setMessage({
          type: 'success',
          text: 'Vendor registration submitted! Your account status is PENDING approval by an administrator. You will be able to sign in once approved.'
        });
      }

      setMode('login');
      setPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d12] flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-md bg-[#12141e] border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-mono font-bold text-indigo-400 text-2xl mx-auto shadow-inner">
            S
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight">ShopSense Analytics</h1>
          <p className="text-xs text-zinc-400">Multi-Vendor E-Commerce Platform</p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 p-1 bg-[#090a0f] border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('login'); setMessage(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setMessage(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-xl text-xs font-medium border flex items-start gap-2.5 ${
            message.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">{message.text}</div>
          </div>
        )}

        {/* Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Account Type Selector */}
            <div className="grid grid-cols-2 p-1 bg-[#090a0f] border border-zinc-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => { setRegisterType('customer'); setMessage(null); }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  registerType === 'customer'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Customer Account
              </button>
              <button
                type="button"
                onClick={() => { setRegisterType('vendor'); setMessage(null); }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  registerType === 'vendor'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Vendor Account
              </button>
            </div>

            {registerType === 'customer' ? (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    PASSWORD *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    SHIPPING ADDRESS
                  </label>
                  <input
                    type="text"
                    placeholder="Street address, City, State"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  <span>{loading ? 'Creating Account...' : 'Register Customer Account'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    BUSINESS LEGAL NAME *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Dynamics Ltd."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    STORE NAME
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Tech Store"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    CORPORATE EMAIL *
                  </label>
                  <input
                    type="email"
                    placeholder="contact@apex.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    PASSWORD *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    STORE / BUSINESS DESCRIPTION
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of your product catalog"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  <span>{loading ? 'Submitting Application...' : 'Register Vendor (Requires Approval)'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
