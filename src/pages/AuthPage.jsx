import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', senha: '', aniversario: '', codigoConvite: '' });
  const handle = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.senha);
      } else {
        if (!form.nome || !form.email || !form.senha || !form.aniversario) {
          setError('Preencha todos os campos obrigatórios.'); setLoading(false); return;
        }
        await register(form);
      }
    } catch (e) {
      const msgs = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
        'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres).',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.'
      };
      setError(msgs[e.code] || 'Erro ao entrar. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-top">
        <div className="auth-logo"><img src="/logo.png" alt="Logo" /></div>
        <h1 className="auth-title">Banda Marcial C.C.F</h1>
        <p className="auth-subtitle">Colégio Coração Feliz</p>
      </div>
      <div className="auth-card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h2>
        {mode === 'register' && (
          <div className="form-group">
            <label className="form-label">Nome completo *</label>
            <input className="form-input" placeholder="Seu nome" value={form.nome} onChange={handle('nome')} />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">E-mail *</label>
          <input className="form-input" type="email" placeholder="seu@email.com" value={form.email} onChange={handle('email')} />
        </div>
        <div className="form-group">
          <label className="form-label">Senha *</label>
          <input className="form-input" type="password" placeholder="••••••" value={form.senha} onChange={handle('senha')} />
        </div>
        {mode === 'register' && (
          <>
            <div className="form-group">
              <label className="form-label">Data de aniversário *</label>
              <input className="form-input" type="date" value={form.aniversario} onChange={handle('aniversario')} />
            </div>
            <div className="form-group">
              <label className="form-label">Código de convite (opcional)</label>
              <input className="form-input" placeholder="Ex: BANDACCF2025" value={form.codigoConvite} onChange={handle('codigoConvite')} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Sem código, você entrará como Convidado.</span>
            </div>
          </>
        )}
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
        <button className="btn btn-outline" onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
        </button>
      </div>
    </div>
  );
}
