import { useState } from 'react';
import { supabase } from '../supabaseClient.js';

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function NoticeCard({ notice, session }) {
  const [busy, setBusy] = useState(false);
  const isAuthor = session && session.user && session.user.id === notice.user_id;

  const handleDelete = async () => {
    if (!confirm('Delete this notice?')) return;
    setBusy(true);
    const { error } = await supabase.from('notices').delete().eq('id', notice.id);
    setBusy(false);
    if (error) alert(`Delete failed: ${error.message}`);
    // Optimistic UI is handled by the realtime DELETE event in NoticeBoard.
  };

  const catClass = `chip chip-${notice.category.toLowerCase()}`;

  return (
    <article className="notice-card">
      <header className="notice-head">
        <span className={catClass}>{notice.category}</span>
        <time className="notice-time" dateTime={notice.created_at}>
          {formatTime(notice.created_at)}
        </time>
      </header>

      <h3 className="notice-title">{notice.title}</h3>
      <p className="notice-body">{notice.body}</p>

      {isAuthor && (
        <footer className="notice-foot">
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={busy}
          >
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </footer>
      )}
    </article>
  );
}
