import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) setMessage('Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.');
        else setMessage('Compte créé avec succès.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="page-content"><p>Chargement de votre session…</p></div>;
  if (!supabase) return <div className="page-content"><section className="form-card"><h2>Connexion Supabase requise</h2><p>Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans les variables d’environnement de Vercel, puis relancez le déploiement.</p></section></div>;
  if (session) return <>{children}</>;

  return <main className="page-content" style={{ maxWidth: 520, margin: '7vh auto', width: '100%' }}>
    <section className="form-card">
      <p className="eyebrow">VOTRE STUDIO CRÉATIF</p>
      <h1>{mode === 'signup' ? 'Créer votre compte KIVA' : 'Bon retour sur KIVA'}</h1>
      <p>{mode === 'signup' ? 'Créez un compte pour enregistrer vos marques et vos fichiers en toute sécurité.' : 'Connectez-vous pour retrouver votre espace de travail.'}</p>
      <form onSubmit={submit}>
        <label htmlFor="auth-email">Adresse e-mail</label>
        <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" />
        <label htmlFor="auth-password">Mot de passe</label>
        <input id="auth-password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="6 caractères minimum" />
        {message && <p className="helper-text" role="status">{message}</p>}
        <button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Veuillez patienter…' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}</button>
      </form>
      <p className="helper-text">{mode === 'signup' ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'} <button type="button" className="text-link" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }}>{mode === 'signup' ? 'Se connecter' : 'Créer un compte'}</button></p>
    </section>
  </main>;
}
