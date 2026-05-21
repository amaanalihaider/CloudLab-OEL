import { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { CATEGORIES } from '../constants.js';

export default function NoticeForm({ session }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from('notices').insert({
      user_id: session.user.id,
      title: title.trim(),
      body: body.trim(),
      category,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setTitle('');
    setBody('');
    setCategory(CATEGORIES[0]);
  };

  return (
    <form className="notice-form" onSubmit={handleSubmit}>
      <h3 className="form-title">Post a notice</h3>

      <div className="form-row">
        <label className="field">
          <span>Title</span>
          <input
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mid-term schedule released"
            disabled={busy}
          />
        </label>

        <label className="field field-narrow">
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={busy}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Body</span>
        <textarea
          required
          rows={3}
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details, location, time, links..."
          disabled={busy}
        />
      </label>

      {err && <div className="alert alert-err">{err}</div>}

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Posting...' : 'Post notice'}
        </button>
      </div>
    </form>
  );
}
