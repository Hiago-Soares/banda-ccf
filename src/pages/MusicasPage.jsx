import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

function NovaMusicaModal({ onClose }) {
  const fileRef = useRef();
  const [nome, setNome] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const salvar = async () => {
    if (!nome.trim()) return;
    setLoading(true);
    let pdfUrl = null, pdfNome = null;
    if (pdfFile) {
      try {
        const storageRef = ref(storage, `partituras/${Date.now()}_${pdfFile.name}`);
        await uploadBytes(storageRef, pdfFile);
        pdfUrl = await getDownloadURL(storageRef);
        pdfNome = pdfFile.name;
      } catch (e) { console.error(e); }
    }
    await addDoc(collection(db, 'musicas'), { titulo: nome.trim(), pdfUrl, pdfNome, criadoEm: serverTimestamp() });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2 className="modal-title">Adicionar Música</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome da música *</label>
            <input className="form-input" placeholder="Ex: Dobrado dos Campeões" value={nome} onChange={e => setNome(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Partitura em PDF (opcional)</label>
            <div onClick={() => fileRef.current.click()} style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: pdfFile ? 'var(--red-light)' : 'var(--bg)' }}>
              <i className="ti ti-file-type-pdf" style={{ fontSize: 28, color: pdfFile ? 'var(--red-dark)' : 'var(--muted)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: pdfFile ? 'var(--red-dark)' : 'var(--text)' }}>{pdfFile ? pdfFile.name : 'Toque para selecionar PDF'}</div>
                {!pdfFile && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Partitura da música</div>}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files[0])} style={{ display: 'none' }} />
          </div>
          <button className="btn btn-primary" onClick={salvar} disabled={loading || !nome.trim()}>{loading ? 'Salvando...' : 'Adicionar música'}</button>
        </div>
      </div>
    </div>
  );
}

export default function MusicasPage() {
  const { canPost } = useAuth();
  const [musicas, setMusicas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'musicas'), orderBy('titulo', 'asc'));
    return onSnapshot(q, snap => setMusicas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const excluir = async (id) => { await deleteDoc(doc(db, 'musicas', id)); setConfirmDelete(null); };

  return (
    <>
      <div className="section-label">{musicas.length} música{musicas.length !== 1 ? 's' : ''} no repertório</div>
      {musicas.length === 0 && <div className="empty-state"><i className="ti ti-music-off" /><p>Nenhuma música no repertório.</p></div>}
      {musicas.map((m, i) => (
        <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{m.titulo}</div>
            {m.pdfUrl && (
              <a href={m.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 12, fontWeight: 600, color: 'var(--red-dark)', background: 'var(--red-light)', padding: '3px 10px', borderRadius: 6, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                <i className="ti ti-file-type-pdf" style={{ fontSize: 14 }} />Ver partitura
              </a>
            )}
          </div>
          {canPost() && <button onClick={() => setConfirmDelete(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, padding: 4 }}><i className="ti ti-trash" /></button>}
        </div>
      ))}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title">Remover música?</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>Tem certeza que deseja remover <strong style={{ color: 'var(--text)' }}>{confirmDelete.titulo}</strong>?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1, background: '#dc2626' }} onClick={() => excluir(confirmDelete.id)}>Remover</button>
            </div>
          </div>
        </div>
      )}
      {canPost() && (<><div style={{ height: 80 }} /><button className="fab" onClick={() => setShowModal(true)}><i className="ti ti-plus" /></button>{showModal && <NovaMusicaModal onClose={() => setShowModal(false)} />}</>)}
    </>
  );
}
