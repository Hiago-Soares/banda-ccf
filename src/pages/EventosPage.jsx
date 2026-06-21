import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

function NovoEventoModal({ onClose }) {
  const [form, setForm] = useState({ nome: '', data: '', hora: '', local: '' });
  const [loading, setLoading] = useState(false);
  const h = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const salvar = async () => {
    if (!form.nome || !form.data || !form.hora || !form.local) return;
    setLoading(true);
    const dataObj = new Date(form.data + 'T' + form.hora);
    await addDoc(collection(db, 'eventos'), {
      nome: form.nome, data: Timestamp.fromDate(dataObj),
      hora: form.hora, local: form.local,
      observacoes: '', musicas: [], presencas: [],
      criadoEm: serverTimestamp()
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2 className="modal-title">Novo Evento</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group"><label className="form-label">Nome do evento *</label><input className="form-input" placeholder="Ex: Desfile de Corpus Christi" value={form.nome} onChange={h('nome')} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group"><label className="form-label">Data *</label><input className="form-input" type="date" value={form.data} onChange={h('data')} /></div>
            <div className="form-group"><label className="form-label">Hora *</label><input className="form-input" type="time" value={form.hora} onChange={h('hora')} /></div>
          </div>
          <div className="form-group"><label className="form-label">Local *</label><input className="form-input" placeholder="Ex: Av. Principal, Centro" value={form.local} onChange={h('local')} /></div>
          <button className="btn btn-primary" onClick={salvar} disabled={loading || !form.nome || !form.data || !form.hora || !form.local}>
            {loading ? 'Criando...' : 'Publicar evento'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventoDetalhe({ evento, onClose }) {
  const { userProfile } = useAuth();
  const confirmado = evento.presencas?.includes(userProfile?.uid);

  const togglePresenca = async () => {
    const ref = doc(db, 'eventos', evento.id);
    if (confirmado) await updateDoc(ref, { presencas: arrayRemove(userProfile.uid) });
    else await updateDoc(ref, { presencas: arrayUnion(userProfile.uid) });
  };

  const formatDataLonga = ts => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div style={{ background: 'var(--red-dark)', borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--gold-light)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{formatDataLonga(evento.data)}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'white' }}>{evento.nome}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="evento-info-item"><i className="ti ti-clock" /><span>{evento.hora}</span></div>
            <div className="evento-info-item"><i className="ti ti-map-pin" /><span>{evento.local}</span></div>
          </div>
          {evento.observacoes && (
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase' }}>Observações</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{evento.observacoes}</div>
            </div>
          )}
          <div>
            <div className="section-label" style={{ marginBottom: 10 }}>Presença</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{evento.presencas?.length || 0} confirmados</span>
              {userProfile?.role !== 'convidado' && (
                <button className={`presence-btn ${confirmado ? 'confirmed' : ''}`} onClick={togglePresenca}>
                  <i className={`ti ti-${confirmado ? 'check' : 'circle-check'}`} />
                  {confirmado ? 'Confirmado!' : 'Confirmar presença'}
                </button>
              )}
            </div>
          </div>
          {evento.musicas?.length > 0 && (
            <div>
              <div className="section-label" style={{ marginBottom: 10 }}>Músicas do evento</div>
              {evento.musicas.map((m, i) => (
                <div key={i} style={{ fontSize: 13, padding: '8px 0', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="ti ti-music" style={{ color: 'var(--red)', fontSize: 16 }} />{m}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventosPage() {
  const { canPost } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'eventos'), orderBy('data', 'asc'));
    return onSnapshot(q, snap => setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const agora = new Date();
  const proximos = eventos.filter(e => { if (!e.data) return true; const d = e.data.toDate ? e.data.toDate() : new Date(e.data); return d >= agora; });
  const passados = eventos.filter(e => { if (!e.data) return false; const d = e.data.toDate ? e.data.toDate() : new Date(e.data); return d < agora; });

  const formatData = ts => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  return (
    <>
      {proximos.length === 0 && <div className="empty-state"><i className="ti ti-calendar-off" /><p>Nenhum evento agendado.</p></div>}
      {proximos.length > 0 && <div className="section-label">Próximos eventos</div>}
      {proximos.map(e => (
        <div key={e.id} className="evento-card" onClick={() => setSelected(e)} style={{ cursor: 'pointer' }}>
          <div className="evento-banner">
            <div className="evento-banner-date"><i className="ti ti-calendar" />{formatData(e.data)}</div>
            <div className="evento-banner-title">{e.nome}</div>
          </div>
          <div className="evento-info-row">
            {e.hora && <div className="evento-info-item"><i className="ti ti-clock" /><span>{e.hora}</span></div>}
            {e.local && <div className="evento-info-item"><i className="ti ti-map-pin" /><span>{e.local}</span></div>}
            <div className="evento-info-item"><i className="ti ti-check" /><span>{e.presencas?.length || 0} confirmados</span></div>
          </div>
        </div>
      ))}
      {passados.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 4 }}>Eventos passados</div>
          {passados.map(e => (
            <div key={e.id} className="card" onClick={() => setSelected(e)} style={{ cursor: 'pointer', opacity: 0.7 }}>
              <div className="card-top"><span className="badge badge-gray">Concluído</span><span className="card-date">{formatData(e.data)}</span></div>
              <div className="card-title">{e.nome}</div>
              {e.local && <div className="card-body" style={{ marginTop: 4 }}><i className="ti ti-map-pin" style={{ marginRight: 4 }} />{e.local}</div>}
            </div>
          ))}
        </>
      )}
      {canPost() && (
        <>
          <button className="fab" onClick={() => setShowModal(true)}><i className="ti ti-plus" /></button>
          {showModal && <NovoEventoModal onClose={() => setShowModal(false)} />}
        </>
      )}
      {selected && <EventoDetalhe evento={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
