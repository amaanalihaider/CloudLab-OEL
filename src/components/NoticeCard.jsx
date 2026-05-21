import { useState } from 'react';
import { supabase } from '../supabaseClient.js';

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function shortId(uuid) {
  if (!uuid) return '—';
  return uuid.slice(0, 8).toUpperCase();
}

export default function NoticeCard({ notice, session }) {
  const [busy, setBusy] = useState(false);
  const isAuthor = session && session.user && session.user.id === notice.user_id;

  const handleDelete = async () => {
    if (!confirm('Remove this notice from the board?')) return;
    setBusy(true);
    const { error } = await supabase.from('notices').delete().eq('id', notice.id);
    setBusy(false);
    if (error) alert(`Delete failed: ${error.message}`);
    // Realtime DELETE event in NoticeBoard removes it from the UI.
  };

  const catClass = `stamp stamp-${notice.category.toLowerCase()}`;

  return (
    <article className="notice-card">
      <div className="pin" aria-hidden="true" />

      <header className="notice-head">
        <span className={catClass}>{notice.category}</span>
        <span className="notice-ref">REF #{String(notice.id).padStart(4, '0')}</span>
      </header>

      <h3 className="notice-title">{notice.title}</h3>
      <p className="notice-body">{notice.body}</p>

      <footer className="notice-foot">
        <div className="notice-meta">
          <span className="meta-label">Posted</span>
          <span className="meta-value">{formatDate(notice.created_at)}</span>
          <span className="meta-sep">·</span>
          <span className="meta-label">By</span>
          <span className="meta-value mono">USR-{shortId(notice.user_id)}</span>
        </div>
        {isAuthor && (
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={busy}
          >
            {busy ? 'Removing…' : 'Remove'}
          </button>
        )}
      </footer>
    </article>
  );
}
