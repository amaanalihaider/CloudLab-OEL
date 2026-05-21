import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';
import Auth from './components/Auth.jsx';
import NoticeBoard from './components/NoticeBoard.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });

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

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="app">
      {/* Top ribbon */}
      <div className="ribbon">
        <span className="ribbon-left">Pakistan Navy · Federally Chartered · Est. 2000</span>
        <span className="ribbon-right">{today}</span>
      </div>

      {/* Letterhead */}
      <header className="letterhead">
        <div className="crest" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="56" height="56">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0d2a4f" />
                <stop offset="100%" stopColor="#16365c" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#g)" stroke="#c9a23b" strokeWidth="2" />
            <path
              d="M14 40 C 22 32, 42 32, 50 40"
              fill="none"
              stroke="#c9a23b"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M14 46 C 22 38, 42 38, 50 46"
              fill="none"
              stroke="#c9a23b"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M22 28 L 32 18 L 42 28 L 42 30 L 22 30 Z"
              fill="#c9a23b"
            />
            <rect x="28" y="22" width="8" height="6" fill="#0d2a4f" />
          </svg>
        </div>

        <div className="letterhead-text">
          <p className="university-name">BAHRIA UNIVERSITY</p>
          <p className="university-sub">Department of Software Engineering · Islamabad Campus</p>
          <div className="gold-rule" />
          <h1 className="board-name">Campus Notice Board</h1>
          <p className="board-sub">
            BSE-6 Section A · Cloud Computing · Lab 10A · Instructor: Engr. Salman Zafar
          </p>
        </div>

        <div className="auth-state">
          {authReady && session ? (
            <div className="auth-card-inline">
              <span className="auth-label">Signed in as</span>
              <span className="auth-email" title={session.user.email}>
                {session.user.email}
              </span>
              <button className="btn btn-outline btn-sm" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : authReady ? (
            <div className="auth-card-inline">
              <span className="auth-label">Public Notice View</span>
              <span className="auth-hint">Sign in to post a notice</span>
            </div>
          ) : null}
        </div>
      </header>

      {/* Body */}
      <main className="main">
        {!authReady ? (
          <div className="empty">Loading notices...</div>
        ) : session ? (
          <NoticeBoard session={session} />
        ) : (
          <>
            <NoticeBoard session={null} />
            <Auth />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-rule" />
        <div className="footer-grid">
          <div>
            <p className="footer-title">Bahria University</p>
            <p className="footer-line">Shangrila Road, Sector E-8, Islamabad</p>
            <p className="footer-line">UAN: 111-111-028</p>
          </div>
          <div>
            <p className="footer-title">Department of Software Engineering</p>
            <p className="footer-line">BSE Programme · Faculty of Engineering Sciences</p>
            <p className="footer-line">Cloud Computing · 6th Semester</p>
          </div>
          <div>
            <p className="footer-title">Notice Board</p>
            <p className="footer-line">Powered by Supabase · Deployed on Vercel</p>
            <p className="footer-line">© {new Date().getFullYear()} Bahria University Islamabad</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
