# BSE-6 Campus Notice Board — Lab 10A

Open-ended cloud lab for BSE-6 Section A, Cloud Computing.
Stack: **Supabase** (Auth + Postgres + Realtime) · **React + Vite** · **Vercel**.

Project ref (Supabase): `tuqjtxsjbvgobyparuik`
URL: `https://tuqjtxsjbvgobyparuik.supabase.co`

---

## 1. Run Supabase setup (one time)

1. Open the Supabase dashboard for the `CloudOpenEnded` project.
2. Open **SQL Editor → New query**, paste the entire contents of `supabase_setup.sql`, and click **Run**.
3. Confirm the three verification queries at the bottom of `supabase_setup.sql` (run them one at a time):

   ```sql
   -- 5 policies
   select tablename, polname, polcmd
   from pg_policies
   where tablename in ('profiles','notices');

   -- trigger
   select trigger_name, event_object_table
   from information_schema.triggers
   where trigger_schema = 'public';

   -- realtime
   select schemaname, tablename
   from pg_publication_tables
   where pubname = 'supabase_realtime';
   ```

4. Open **Authentication → Settings**: confirm *Email Signup* is **ON** and *Email Confirmations* is **OFF**. Save.

---

## 2. Run the app locally

Requires Node 18+.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. `.env.local` is already filled in with the project URL and anon key.

Sanity checks while local:
- The notice feed renders even before sign-in (public read).
- Sign up with any email + a 6-char password → you're logged in immediately.
- Post form appears only when signed in.
- Open a second browser window → post in one → the other updates without refresh.

---

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "feat: campus notice board scaffold"
# create a public repo on github.com, then:
git remote add origin https://github.com/<your-username>/bse6-noticeboard.git
git branch -M main
git push -u origin main
```

The `.gitignore` excludes `node_modules/` and `.env.local`. Verify before the first push:

```bash
cat .gitignore | grep env
cat .gitignore | grep node
git status   # .env.local should NOT appear
```

Make at least **3 meaningful commits** before evaluation (the lab marks for this).

---

## 4. Deploy to Vercel

1. Go to `vercel.com` → sign in with GitHub → **Add New Project** → import the repo.
2. Framework preset: **Vite**. Build command: `npm run build`. Output dir: `dist`. (Vercel auto-detects.)
3. Before clicking **Deploy**, open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = `https://tuqjtxsjbvgobyparuik.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (the anon key from `.env.local`)
4. Click **Deploy**. After ~45s, click **Visit**.

---

## 5. Point Supabase at the live URL

1. Copy the Vercel URL (e.g. `https://bse6-noticeboard.vercel.app`).
2. In Supabase: **Authentication → URL Configuration**.
3. Set **Site URL** to the Vercel URL.
4. Add the same URL to **Redirect URLs**. Save.

If auth ever silently fails on the live URL, this is almost always the cause.

---

## 6. Verification checklist (the lab's evaluation gate)

Tick every box on the live URL before calling the instructor:

- [ ] Notices load on the live URL without signing in.
- [ ] Sign up with a new email creates an account.
- [ ] Signed in → post form is visible. Signed out → post form is gone.
- [ ] Posting a notice makes it appear immediately.
- [ ] Two tabs open: posting in one shows up in the other **without refresh**.
- [ ] Deleting your own notice removes it immediately.
- [ ] Signed in as a second account → no delete button on the first account's notices.
- [ ] Supabase **Table Editor → notices** shows your posted rows.
- [ ] GitHub repo is public, ≥ 3 commits.

---

## 7. File map

```
.
├── supabase_setup.sql          ← run once in Supabase SQL Editor
├── package.json
├── vite.config.js
├── index.html
├── .gitignore
├── .env.local                  ← NOT committed (real keys)
├── .env.example                ← committed placeholder
└── src/
    ├── main.jsx
    ├── App.jsx                 ← session + layout
    ├── supabaseClient.js
    ├── constants.js            ← single source of truth for categories
    ├── styles.css              ← dark-mode minimalist theme
    └── components/
        ├── Auth.jsx            ← sign in / sign up toggle
        ├── NoticeBoard.jsx     ← fetch + filter + realtime subscription
        ├── NoticeCard.jsx      ← author-only delete button
        └── NoticeForm.jsx      ← visible only when signed in
```

---

## 8. Viva cheat-sheet

> **`USING (true)` on the notices SELECT policy** — `true` makes the row filter unconditional, so every row passes for every caller (anon or authenticated). We want the notice feed public; the lab's R1 spec requires it.

> **Malicious user hits REST API directly** — Supabase still evaluates RLS on the underlying Postgres role. Calling `DELETE /rest/v1/notices?id=eq.X` with another user's JWT goes through PostgREST, which authenticates as the `authenticated` role and runs the query under RLS. The `notices_delete_own` policy's `USING (user_id = auth.uid())` evaluates to false for someone else's row, Postgres returns 0 rows affected, and nothing is deleted. Bypassing the React UI changes nothing because the security check is on the database.

> **Why anon key is safe, service_role is not** — The anon key is a JWT signed with role `anon`. Every query it makes is subject to RLS, so all it can do is what your policies allow. The service_role key carries role `service_role`, which **bypasses RLS entirely**. Leaking it gives an attacker full read/write on every table. Anon → frontend; service_role → server-only.

> **Where `auth.uid()` is evaluated** — Inside Postgres, at query execution time. The Supabase JS client sends the user's JWT as the `Authorization` header; PostgREST passes it to Postgres, which decodes it and exposes the user's UUID via `auth.uid()`. Your React code never computes it.

> **Works on localhost, broken on Vercel** — almost always one of (a) `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` not set in Vercel project env vars (and not redeployed after setting), or (b) Site URL / Redirect URLs in Supabase **Authentication → URL Configuration** still pointing at localhost.

> **DaaS vs BaaS** — *DaaS:* the Postgres database itself is managed for us — backups, scaling, connection pooling. We just store and query the `notices` table. *BaaS:* the auth flow (sign up, sign in, JWT issuance) is provided by Supabase Auth — we never wrote a user table, password hashing, or token logic.

---

## 9. Common errors

| Symptom | Cause | Fix |
|---|---|---|
| Empty notice list | SELECT policy missing/wrong | Re-run `supabase_setup.sql` |
| Insert returns 403 | Not signed in, or INSERT policy wrong | Check session; re-run setup script |
| Realtime not firing | Publication missing | `alter publication supabase_realtime add table notices;` |
| Blank Vercel page | Env vars missing | Add both `VITE_*` vars, **redeploy** |
| Auth fails on live URL | Site URL not configured | Auth → URL Configuration → set Vercel URL |
| Delete button on all notices | Ownership check missing | Already handled in `NoticeCard.jsx` via `session.user.id === notice.user_id` |
