import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';
import Auth from './components/Auth.jsx';
import NoticeBoard from './components/NoticeBoard.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });

    // Keep session in sync
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">▣</span>
          <div>
            <h1 className="brand-title">Campus Notice Board</h1>
            <p className="brand-sub">BSE-6 · Cloud Computing · Lab 10A</p>
          </div>
        </div>

        <div className="auth-state">
          {authReady && session ? (
            <>
              <span className="who" title={session.user.email}>
                <span className="dot dot-on" /> {session.user.email}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : authReady ? (
            <span className="who">
              <span className="dot" /> Not signed in
            </span>
          ) : null}
        </div>
      </header>

      <main className="main">
        {!authReady ? (
          <div className="empty">Loading...</div>
        ) : session ? (
          <NoticeBoard session={session} />
        ) : (
          <>
            <NoticeBoard session={null} />
            <Auth />
          </>
        )}
      </main>

      <footer className="footer">
        <span>Bahria University — Department of Software Engineering</span>
        <span className="sep">·</span>
        <span>Supabase · Vercel · React</span>
      </footer>
    </div>
  );
}
