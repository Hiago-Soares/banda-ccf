import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

function UploadModal({ onClose }) {
  const { userProfile } = useAuth();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [legenda, setLegenda] = useState('');
  const [loading, setLoading] = useState(false);

  const onFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const enviar = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const storagePath = `galeria/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'galeria'), { url, legenda, tipo: isVideo ? 'video' : 'foto', storagePath, autor: userProfile.nome, autorUid: userProfile.uid, criadoEm: serverTimestamp() });
      onClose();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2 className="modal-title">Enviar foto ou vídeo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div onClick={() => fileRef.current.click()} style={{ border: '2px dashed var(--border)', borderRadius: 14, padding: 24, textAlign: 'center', cursor: 'pointer', background: 'var(--bg)', minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {preview ? (
              file?.type.startsWith('video/') ? <video src={preview} style={{ maxHeight: 180, borderRadius: 10 }} controls /> : <img src={preview} style={{ maxHeight: 180, borderRadius: 10, objectFit: 'cover' }} alt="preview" />
            ) : (
              <><i className="ti ti-cloud-upload" style={{ fontSize: 36, color: 'var(--muted)' }} /><span style={{ fontSize: 13, color: 'var(--muted)' }}>Toque para selecionar foto ou vídeo</span></>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={onFile} style={{ display: 'none' }} />
          <div className="form-group">
            <label className="form-label">Legenda</label>
            <input className="form-input" placeholder="Descrição da foto/vídeo..." value={legenda} onChange={e => setLegenda(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={enviar} disabled={loading || !file}>{loading ? 'Enviando...' : 'Publicar na galeria'}</button>
        </div>
      </div>
    </div>
  );
}

function FotoModal({ item, onClose, onDelete, canDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', background: 'rgba(0,0,0,0.9)' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: 20 }} onClick={e => e.stopPropagation()}>
        {item.tipo === 'video'
          ? <video src={item.url} controls style={{ width: '100%', borderRadius: 16 }} />
          : <img src={item.url} style={{ width: '100%', borderRadius: 16, objectFit: 'contain', maxHeight: '70dvh' }} alt={item.legenda} />
        }
        {item.legenda && <div style={{ color: 'white', textAlign: 'center', marginTop: 12, fontSize: 14 }}>{item.legenda}</div>}
        <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 6, fontSize: 11 }}>Enviado por {item.autor}</div>

        {canDelete && !confirmDelete && (
          <button onClick={() => setConfirmDelete(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px auto 0', background: 'rgba(220,38,38,0.8)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            <i className="ti ti-trash" />Remover
          </button>
        )}
        {confirmDelete && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => setConfirmDelete(false)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
            <button onClick={() => onDelete(item)} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Confirmar exclusão</button>
          </div>
        )}

        <button onClick={onClose} style={{ display: 'block', margin: '16px auto 0', background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}>Fechar</button>
      </div>
    </div>
  );
}

export default function GaleriaPage() {
  const { canUploadMedia, userProfile, isMaestroOrAbove } = useAuth();
  const [itens, setItens] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'galeria'), orderBy('criadoEm', 'desc'));
    return onSnapshot(q, snap => setItens(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const handleDelete = async (item) => {
    try {
      if (item.storagePath) {
        const storageRef = ref(storage, item.storagePath);
        await deleteObject(storageRef).catch(() => {});
      }
      await deleteDoc(doc(db, 'galeria', item.id));
      setSelected(null);
    } catch (e) { console.error(e); }
  };

  const canDelete = (item) => isMaestroOrAbove() || item.autorUid === userProfile?.uid;

  return (
    <>
      <div className="section-label">Fotos e vídeos da banda</div>
      {itens.length === 0 && <div className="empty-state"><i className="ti ti-photo-off" /><p>Nenhuma foto ou vídeo ainda.</p></div>}
      <div className="gallery-grid">
        {itens.map(item => (
          <div key={item.id} className="gallery-item" onClick={() => setSelected(item)}>
            {item.tipo === 'video'
              ? <div style={{ width: '100%', height: '100%', background: 'var(--red-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-player-play-filled" style={{ fontSize: 32, color: 'white' }} /></div>
              : <img src={item.url} alt={item.legenda} loading="lazy" />
            }
            {item.legenda && <div className="gallery-item-label">{item.legenda}</div>}
            {item.tipo === 'video' && <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 6px' }}><i className="ti ti-video" style={{ fontSize: 12, color: 'white' }} /></div>}
          </div>
        ))}
      </div>
      {canUploadMedia() && (<><div style={{ height: 80 }} /><button className="fab" onClick={() => setShowModal(true)}><i className="ti ti-plus" /></button>{showModal && <UploadModal onClose={() => setShowModal(false)} />}</>)}
      {selected && <FotoModal item={selected} onClose={() => setSelected(null)} onDelete={handleDelete} canDelete={canDelete(selected)} />}
    </>
  );
}
