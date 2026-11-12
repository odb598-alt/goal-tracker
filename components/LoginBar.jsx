'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginBar({ session, onLogout, isAdmin }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const login = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setOpen(false); setEmail(''); setPassword('');
  };

  if (session && isAdmin) {
    return (
      <span className="status" role="status">
        <span className="dot" />
        Admin · {session.user.email}
        <button className="link-btn" onClick={onLogout} style={{ marginLeft: 8 }}>Déconnexion</button>
      </span>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(!open)}>
        {open ? 'Annuler' : 'Connexion admin'}
      </button>
      {open && (
        <form onSubmit={login}
          style={{ position: 'absolute', right: 0, top: 40, zIndex: 10, width: 280,
                   background: 'var(--card)', border: '1px solid var(--line-strong)',
                   borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input className="input" type="email" placeholder="Email admin" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {err && <p className="msg-error" role="alert">{err}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        </form>
      )}
    </div>
  );
}