import { createContext, useContext, useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, requestNotificationPermission } from '../firebase/config';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const ROLES = { CRIADOR: 'criador', MAESTRO: 'maestro', LIDERANCA: 'lideranca', INTEGRANTE: 'integrante', CONVIDADO: 'convidado' };
export const ROLE_LABELS = { criador: 'Criador', maestro: 'Maestro', lideranca: 'Liderança', integrante: 'Integrante', convidado: 'Convidado' };
export const ROLE_COLORS = { criador: '#8B1A1E', maestro: '#C0272D', lideranca: '#D4A017', integrante: '#2a7d4f', convidado: '#7A7A7A' };

const CRIADOR_EMAIL = 'hiago@bandaccf.com';
const CODIGO_CONVITE = 'BANDACCF2025';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'usuarios', u.uid));
        if (snap.exists()) setUserProfile(snap.data());
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const saveNotificationToken = async (uid) => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        await updateDoc(doc(db, 'usuarios', uid), { fcmToken: token });
      }
    } catch (e) {}
  };

  const register = async ({ nome, email, senha, aniversario, codigoConvite }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(cred.user, { displayName: nome });
    let role = ROLES.CONVIDADO;
    let aprovado = false;
    if (email === CRIADOR_EMAIL) { role = ROLES.CRIADOR; aprovado = true; }
    else if (codigoConvite === CODIGO_CONVITE) { role = ROLES.INTEGRANTE; aprovado = true; }
    const profile = { uid: cred.user.uid, nome, email, role, aprovado, aniversario: aniversario || null, criadoEm: serverTimestamp() };
    await setDoc(doc(db, 'usuarios', cred.user.uid), profile);
    setUserProfile(profile);
    await saveNotificationToken(cred.user.uid);
    return profile;
  };

  const login = async (email, senha) => {
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    const snap = await getDoc(doc(db, 'usuarios', cred.user.uid));
    if (snap.exists()) {
      setUserProfile(snap.data());
      await saveNotificationToken(cred.user.uid);
      return snap.data();
    }
  };

  const logout = () => signOut(auth);

  const canPost = () => ['criador','maestro'].includes(userProfile?.role);
  const canUploadMedia = () => ['criador','maestro','lideranca'].includes(userProfile?.role);
  const canManageUsers = () => ['criador','maestro'].includes(userProfile?.role);
  const canAddBirthdays = () => ['criador','maestro','lideranca'].includes(userProfile?.role);
  const isCriador = () => userProfile?.role === ROLES.CRIADOR;
  const isMaestroOrAbove = () => ['criador','maestro'].includes(userProfile?.role);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, register, login, logout, canPost, canUploadMedia, canManageUsers, canAddBirthdays, isCriador, isMaestroOrAbove, ROLES, ROLE_LABELS, ROLE_COLORS }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
