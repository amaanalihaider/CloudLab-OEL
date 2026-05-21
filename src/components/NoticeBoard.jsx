import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { CATEGORIES } from '../constants.js';
import NoticeCard from './NoticeCard.jsx';
import NoticeForm from './NoticeForm.jsx';

const ALL = 'All';

export default function NoticeBoard({ session }) {
  const [notices, setNotices] = useState([]);
  const [filter, setFilter] = useState(ALL);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Initial fetch
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) {
        setErr(error.message);
      } else {
        setNotices(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notices-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notices' },
        (payload) => {
          setNotices((prev) => {
            if (prev.some((n) => n.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notices' },
        (payload) => {
          setNotices((prev) => prev.filter((n) => n.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const visible =
    filter === ALL ? notices : notices.filter((n) => n.category === filter);

  return (
    <div className="board">
      {session && <NoticeForm session={session} />}

      <section className="board-section">
        <div className="section-banner">
          <div className="section-banner-left">
            <span className="banner-eyebrow">Bulletin</span>
            <h2 className="section-title">Posted Notices</h2>
          </div>
          <span className="section-count">
            {visible.length} {visible.length === 1 ? 'notice' : 'notices'} on the board
          </span>
        </div>

        <div className="filters" role="tablist" aria-label="Filter by category">
          <span className="filter-label">Filter</span>
          <button
            role="tab"
            aria-selected={filter === ALL}
            className={`pill ${filter === ALL ? 'pill-active' : ''}`}
            onClick={() => setFilter(ALL)}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              className={`pill ${filter === c ? 'pill-active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {err && <div className="alert alert-err">{err}</div>}

        {loading ? (
          <div className="empty">Loading notices...</div>
        ) : visible.length === 0 ? (
          <div className="empty">
            {filter === ALL
              ? 'No notices yet. Be the first to post one.'
              : `No ${filter} notices yet.`}
          </div>
        ) : (
          <div className="grid">
            {visible.map((n) => (
              <NoticeCard key={n.id} notice={n} session={session} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
