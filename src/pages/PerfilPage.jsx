import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = { criador: 'Criador', maestro: 'Maestro', lideranca: 'Liderança', integrante: 'Integrante', convidado: 'Convidado' };
const ROLE_COLORS = { criador: '#8B1A1E', maestro: '#C0272D', lideranca: '#D4A017', integrante: '#2a7d4f', convidado: '#7A7A7A' };
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function GerenciarModal({ onClose }) {
  const { userProfile, isCriador } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    return onSnapshot(collection(db, 'usuarios'), snap =>
      setUsuarios(snap.docs.map(d => d.data()).filter(u => u.uid !== userProfile.uid))
    );
  }, []);

  const setRole = async (uid, role) => {
    setLoading(l => ({ ...l, [uid]: true }));
    await updateDoc(doc(db, 'usuarios', uid), { role, aprovado: true });
    setLoading(l => ({ ...l, [uid]: false }));
  };

  const aprovar = async (uid) => {
    setLoading(l => ({ ...l, [uid]: true }));
    await updateDoc(doc(db, 'usuarios', uid), { aprovado: true, role: 'integrante' });
    setLoading(l => ({ ...l, [uid]: false }));
  };

  const pendentes = usuarios.filter(u => !u.aprovado);
  const ativos = usuarios.filter(u => u.aprovado);
  const initials = nome => nome ? nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '85dvh' }}>
        <div className="modal-handle" />
        <h2 className="modal-title">Gerenciar Membros</h2>
        {pendentes.length > 0 && (<>
          <div className="section-label" style={{ marginBottom: 10 }}>Aguardando aprovação</div>
          {pendentes.map(u => (
            <div key={u.uid} className="user-row">
              <div className="avatar avatar-sm" style={{ background: 'var(--muted)' }}>{initials(u.nome)}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{u.nome}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.email}</div></div>
              <button className="btn btn-gold btn-sm" onClick={() => aprovar(u.uid)} disabled={loading[u.uid]}>Aprovar</button>
            </div>
          ))}
          <div style={{ height: 4 }} />
        </>)}
        <div className="section-label" style={{ marginBottom: 10 }}>Membros ativos</div>
        {ativos.map(u => (
          <div key={u.uid} className="user-row">
            <div className="avatar avatar-sm" style={{ background: ROLE_COLORS[u.role] || 'var(--muted)' }}>{initials(u.nome)}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{u.nome}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{ROLE_LABELS[u.role]}</div></div>
            <select className="form-input form-select" style={{ width: 120, padding: '6px 28px 6px 10px', fontSize: 12 }} value={u.role}
              onChange={e => setRole(u.uid, e.target.value)}
              disabled={loading[u.uid] || u.role === 'criador' || (!isCriador() && u.role === 'maestro')}>
              {isCriador() && <option value="maestro">Maestro</option>}
              <option value="lideranca">Liderança</option>
              <option value="integrante">Integrante</option>
              <option value="convidado">Convidado</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const { userProfile, logout, canManageUsers } = useAuth();
  const [showGerenciar, setShowGerenciar] = useState(false);
  if (!userProfile) return null;

  const initials = nome => nome ? nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?';
  let anivFormatado = '';
  if (userProfile.aniversario) {
    const [, mes, dia] = userProfile.aniversario.split('-');
    anivFormatado = `${parseInt(dia)} de ${MESES[parseInt(mes) - 1]}`;
  }

  return (
    <>
      <div style={{ background: 'linear-gradient(135deg,var(--red-dark),var(--red))', borderRadius: 'var(--radius)', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, background: 'rgba(255,255,255,0.2)' }}>{initials(userProfile.nome)}</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'white' }}>{userProfile.nome}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '4px 12px' }}>
            <span style={{ fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>{ROLE_LABELS[userProfile.role]}</span>
          </div>
        </div>
      </div>

      <div className="card">
        {[['ti-mail','E-mail',userProfile.email], anivFormatado ? ['ti-cake','Aniversário',anivFormatado] : null, ['ti-shield-check','Status',userProfile.aprovado ? 'Aprovado' : 'Aguardando aprovação']].filter(Boolean).map(([icon,label,value]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
            <i className={`ti ${icon}`} style={{ fontSize: 18, color: 'var(--red)', width: 24 }} />
            <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div><div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 1 }}>{value}</div></div>
          </div>
        ))}
      </div>

      {canManageUsers() && <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: 10 }} onClick={() => setShowGerenciar(true)}><i className="ti ti-users" style={{ fontSize: 18 }} />Gerenciar membros</button>}
      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 10, borderColor: 'var(--border)', color: 'var(--muted)' }} onClick={logout}><i className="ti ti-logout" style={{ fontSize: 18 }} />Sair da conta</button>
      {showGerenciar && <GerenciarModal onClose={() => setShowGerenciar(false)} />}
    </>
  );
}
