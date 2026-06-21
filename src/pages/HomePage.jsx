import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

function NovoAvisoModal({ onClose }) {
  const { userProfile } = useAuth();
  const [form, setForm] = useState({ titulo: '', texto: '', tipo: 'aviso' });
  const [loading, setLoading] = useState(false);

  const salvar = async () => {
    if (!form.titulo || !form.texto) return;
    setLoading(true);
    await addDoc(collection(db, 'avisos'), { ...form, autor: userProfile.nome, autorRole: userProfile.role, criadoEm: serverTimestamp() });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2 className="modal-title">Novo Aviso</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-input form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option value="aviso">📢 Aviso</option>
              <option value="maestro">🎼 Recado do Maestro</option>
              <option value="urgente">⚠️ Urgente</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-input" placeholder="Título do aviso" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Mensagem *</label>
            <textarea className="form-input" rows={4} placeholder="Escreva a mensagem..." value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} style={{ resize: 'none' }} />
          </div>
          <button className="btn btn-primary" onClick={salvar} disabled={loading || !form.titulo || !form.texto}>
            {loading ? 'Publicando...' : 'Publicar aviso'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((new Date() - d) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff}min atrás`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function HomePage({ onGoToEventos }) {
  const { canPost, userProfile } = useAuth();
  const [avisos, setAvisos] = useState([]);
  const [proximoEvento, setProximoEvento] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'avisos'), orderBy('criadoEm', 'desc'), limit(20));
    return onSnapshot(q, snap => setAvisos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'eventos'), orderBy('data', 'asc'), limit(10));
    return onSnapshot(q, snap => {
      const agora = new Date();
      const proximos = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => {
        if (!e.data) return false;
        const d = e.data.toDate ? e.data.toDate() : new Date(e.data);
        return d >= agora;
      });
      setProximoEvento(proximos[0] || null);
    });
  }, []);

  const initials = nome => nome ? nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?';
  const TIPO = { aviso: { label: 'Aviso', cls: 'badge-red' }, maestro: { label: 'Maestro', cls: 'badge-purple' }, urgente: { label: 'Urgente', cls: 'badge-red' } };

  return (
    <>
      {proximoEvento && (
        <div onClick={onGoToEventos} style={{ cursor: 'pointer' }}>
          <div className="evento-card">
            <div className="evento-banner">
              <div className="evento-banner-date">
                <i className="ti ti-calendar" />
                {proximoEvento.data?.toDate ? proximoEvento.data.toDate().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) : ''}
              </div>
              <div className="evento-banner-title">{proximoEvento.nome}</div>
            </div>
            <div className="evento-info-row">
              {proximoEvento.hora && <div className="evento-info-item"><i className="ti ti-clock" /><span>{proximoEvento.hora}</span></div>}
              {proximoEvento.local && <div className="evento-info-item"><i className="ti ti-map-pin" /><span>{proximoEvento.local}</span></div>}
              <div className="evento-info-item"><i className="ti ti-users" /><span>Todos</span></div>
            </div>
          </div>
        </div>
      )}
      <div className="section-label">Avisos recentes</div>
      {avisos.length === 0 && <div className="empty-state"><i className="ti ti-speakerphone" /><p>Nenhum aviso ainda.</p></div>}
      {avisos.map(a => {
        const cfg = TIPO[a.tipo] || TIPO.aviso;
        return (
          <div key={a.id} className={`card card-accent-${a.tipo === 'maestro' ? 'gold' : 'red'}`}>
            <div className="card-top"><span className={`badge ${cfg.cls}`}>{cfg.label}</span><span className="card-date">{formatDate(a.criadoEm)}</span></div>
            <div className="card-title">{a.titulo}</div>
            <div className="card-body">{a.texto}</div>
            <div className="card-footer">
              <div className="avatar avatar-sm" style={{ background: ['maestro','criador'].includes(a.autorRole) ? 'var(--red-dark)' : 'var(--gold-dark)' }}>{initials(a.autor)}</div>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}><strong style={{ color: 'var(--text)' }}>{a.autor}</strong></span>
            </div>
          </div>
        );
      })}
      {canPost() && (
        <>
          <button className="fab" onClick={() => setShowModal(true)}><i className="ti ti-plus" /></button>
          {showModal && <NovoAvisoModal onClose={() => setShowModal(false)} />}
        </>
      )}
    </>
  );
}
