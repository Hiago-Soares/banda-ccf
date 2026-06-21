import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function NovoAniversarianteModal({ onClose }) {
  const [form, setForm] = useState({ nome: '', aniversario: '' });
  const [loading, setLoading] = useState(false);
  const salvar = async () => {
    if (!form.nome || !form.aniversario) return;
    setLoading(true);
    await addDoc(collection(db, 'aniversariantes_externos'), { nome: form.nome, aniversario: form.aniversario, criadoEm: serverTimestamp() });
    setLoading(false);
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2 className="modal-title">Adicionar Aniversariante</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Nome completo *</label><input className="form-input" placeholder="Nome do membro" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Data de aniversário *</label><input className="form-input" type="date" value={form.aniversario} onChange={e => setForm(f => ({ ...f, aniversario: e.target.value }))} /></div>
          <button className="btn btn-primary" onClick={salvar} disabled={loading || !form.nome || !form.aniversario}>{loading ? 'Salvando...' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AniversariantesPage() {
  const { canAddBirthdays } = useAuth();
  const [membros, setMembros] = useState([]);
  const [externos, setExternos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();

  useEffect(() => {
    const q = query(collection(db, 'usuarios'), where('role', 'in', ['maestro','criador','lideranca','integrante']), where('aprovado', '==', true));
    return onSnapshot(q, snap => setMembros(snap.docs.map(d => d.data())));
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'aniversariantes_externos'), snap =>
      setExternos(snap.docs.map(d => ({ id: d.id, ...d.data(), role: 'integrante' })))
    );
  }, []);

  const toAniv = m => {
    if (!m.aniversario) return null;
    const [, mes, dia] = m.aniversario.split('-').map(Number);
    return { ...m, mesAniv: mes, diaAniv: dia };
  };

  const todos = [...membros, ...externos].map(toAniv).filter(Boolean);
  const hoje_aniv = todos.filter(m => m.mesAniv === mesAtual && m.diaAniv === diaAtual);
  const mes_aniv = todos.filter(m => m.mesAniv === mesAtual && m.diaAniv !== diaAtual).sort((a, b) => a.diaAniv - b.diaAniv);
  const proximos = todos.filter(m => m.mesAniv === (mesAtual % 12) + 1).sort((a, b) => a.diaAniv - b.diaAniv);
  const ROLE_COLORS = { criador: '#8B1A1E', maestro: '#C0272D', lideranca: '#D4A017', integrante: '#2a7d4f' };
  const initials = nome => nome ? nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?';

  return (
    <>
      {hoje_aniv.length > 0 && (<>
        <div className="section-label">🎂 Hoje</div>
        {hoje_aniv.map(m => (
          <div key={m.uid || m.id} style={{ background: 'linear-gradient(135deg,var(--red-dark),var(--red))', borderRadius: 'var(--radius)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar avatar-md" style={{ background: 'rgba(255,255,255,0.2)', fontSize: 18 }}>{initials(m.nome)}</div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'white' }}>{m.nome}</div><div style={{ fontSize: 12, color: 'var(--gold-light)', marginTop: 2 }}>🎉 Feliz aniversário!</div></div>
            <div style={{ marginLeft: 'auto', fontSize: 32 }}>🎂</div>
          </div>
        ))}
      </>)}

      {mes_aniv.length > 0 && (<>
        <div className="section-label">Este mês — {MESES[mesAtual - 1]}</div>
        {mes_aniv.map(m => (
          <div key={m.uid || m.id} className="card birthday-item" style={{ padding: '12px 16px' }}>
            <div className="avatar avatar-sm" style={{ background: ROLE_COLORS[m.role] || 'var(--muted)' }}>{initials(m.nome)}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.nome}</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{m.diaAniv} de {MESES[m.mesAniv - 1]}</div></div>
            <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-cake" style={{ color: 'var(--red)', fontSize: 16 }} />dia {m.diaAniv}</div>
          </div>
        ))}
      </>)}

      {proximos.length > 0 && (<>
        <div className="section-label">Próximo mês — {MESES[mesAtual % 12]}</div>
        {proximos.map(m => (
          <div key={m.uid || m.id} className="card birthday-item" style={{ padding: '12px 16px', opacity: 0.7 }}>
            <div className="avatar avatar-sm" style={{ background: ROLE_COLORS[m.role] || 'var(--muted)' }}>{initials(m.nome)}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.nome}</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{m.diaAniv} de {MESES[m.mesAniv - 1]}</div></div>
          </div>
        ))}
      </>)}

      {todos.length === 0 && <div className="empty-state"><i className="ti ti-cake" /><p>Nenhum aniversário cadastrado ainda.</p></div>}

      {canAddBirthdays() && (<><div style={{ height: 80 }} /><button className="fab" onClick={() => setShowModal(true)}><i className="ti ti-plus" /></button>{showModal && <NovoAniversarianteModal onClose={() => setShowModal(false)} />}</>)}
    </>
  );
}
