
import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';

interface LoginProps {
  onLoginSuccess: (session: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabaseService.login(email, password);
      
      if (authError) throw authError;
      if (data?.session) {
        onLoginSuccess(data.session);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-12 space-y-10 animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary rounded-3xl shadow-xl shadow-brand-primary/20 mb-4">
            <span className="text-4xl font-black text-white">M</span>
          </div>
          <h1 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">MedAudit Pro</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso Restrito ao Sistema de Auditoria</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">E-mail Corporativo</label>
            <input 
              type="email" 
              required 
              autoFocus
              className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-brand-primary outline-none transition-all"
              placeholder="seu@email.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Senha de Acesso</label>
            <input 
              type="password" 
              required 
              className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-brand-primary outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-4 bg-support-rose/10 border border-brand-accent/20 rounded-xl text-center">
              <p className="text-[10px] font-black text-brand-accent uppercase tracking-tight">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-brand-primary text-white p-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:bg-brand-dark transition-all disabled:opacity-50"
          >
            {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Governança em Auditoria Médica v2.5.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
