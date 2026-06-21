import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { onForegroundMessage } from './firebase/config';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import EventosPage from './pages/EventosPage';
import MusicasPage from './pages/MusicasPage';
import GaleriaPage from './pages/GaleriaPage';
import AniversariantesPage from './pages/AniversariantesPage';
import PerfilPage from './pages/PerfilPage';
import './styles/global.css';

const TABS = [
  { id: 'inicio', label: 'Início', icon: 'ti-home' },
  { id: 'eventos', label: 'Eventos', icon: 'ti-calendar-event' },
  { id: 'musicas', label: 'Músicas', icon: 'ti-music' },
  { id: 'galeria', label: 'Galeria', icon: 'ti-photo' },
  { id: 'aniversarios', label: 'Aniversários', icon: 'ti-cake' },
];

export default function App() {
  const { user, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('inicio');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      setToast({ title, body });
      setTimeout(() => setToast(null), 4000);
    });
    return unsub;
  }, [user]);

  if (loading) return (
    <div className="loader"><div className="loader-logo"><img src="/logo.png" alt="Logo" /></div></div>
  );

  if (!user || !userProfile) return <AuthPage />;

  if (!userProfile.aprovado) return (
    <div className="auth-screen">
      <div className="auth-top">
        <div className="auth-logo"><img src="/logo.png" alt="Logo" /></div>
        <h1 className="auth-title">Banda Marcial C.C.F</h1>
        <p className="auth-subtitle">Colégio Coração Feliz</p>
      </div>
      <div className="auth-card" style={{ gap: 16 }}>
        <div style={{ textAlign: 'center' }}><i className="ti ti-clock-hour-4" style={{ fontSize: 48, color: 'var(--gold)' }} /></div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, textAlign: 'center' }}>Aguardando aprovação</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>Sua conta foi criada! O Maestro precisa aprovar seu acesso.</p>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activeTab) {
      case 'inicio': return <HomePage onGoToEventos={() => setActiveTab('eventos')} />;
      case 'eventos': return <EventosPage />;
      case 'musicas': return <MusicasPage />;
      case 'galeria': return <GaleriaPage />;
      case 'aniversarios': return <AniversariantesPage />;
      case 'perfil': return <PerfilPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="app-shell">
      {/* Toast de notificação em primeiro plano */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'var(--red-dark)', color: 'white', borderRadius: 14, padding: '12px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: 320, width: '90%', animation: 'slideDown 0.3s ease' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{toast.title}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{toast.body}</div>
          <style>{`@keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`}</style>
        </div>
      )}

      <div className="app-header">
        <div className="header-logo"><img src="/logo.png" alt="Logo" /></div>
        <div className="header-info"><h1>Banda Marcial C.C.F</h1><p>Colégio Coração Feliz</p></div>
        <div className="header-actions">
          <button className="header-btn" onClick={() => setActiveTab('perfil')}><i className="ti ti-user" /></button>
        </div>
      </div>

      <div className="app-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`app-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            <i className={`ti ${t.icon}`} />{t.label}
          </button>
        ))}
      </div>

      <div className="page-content">
        {renderPage()}
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
