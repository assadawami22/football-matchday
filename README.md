# Matchday — weekly football registration & payment tracker

A small private site for a football group: players register for Sunday/Tuesday
matches, confirm their STC Pay payment, get approved by an admin, and land on
a public main list (18 spots) or bench (5 spots). Late players get locked
until they pay a late fee.

## What's included

- **`/`** — registration page (pick match → find name → confirm payment → submit)
- **`/list`** — public squad sheet (main list, bench, locked players)
- **`/status`** — a player looks themselves up to pay a late fee or confirm
  payment after being promoted from the bench
- **`/admin`** — admin login
- **`/admin/dashboard`** — approve payments, mark players late, manage the
  roster, promote from bench (with a one-tap WhatsApp link)

No payment gateway is wired in — STC Pay/Apple Pay payments happen **outside**
the system (player pays you directly), and the site is where the player
declares "I paid" and the admin confirms it against what actually landed in
your account. This matches how you described the flow and avoids any gateway
integration/fees for v1.

---

## 1. Create your Supabase project (free)

1. Go to https://supabase.com and create a free account + new project.
2. Once it's created, go to **Project Settings → API**. You'll need:
   - `Project URL` → this is your `SUPABASE_URL`
   - `service_role` key (NOT the `anon` key) → this is your `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ The service role key bypasses all database security rules. Never put it
   in any client-side code or commit it to a public repo — it only belongs in
   your server environment variables. This project already keeps it
   server-side only (see `lib/supabaseServer.js`).

3. Go to **SQL Editor → New query**, paste the entire contents of
   `supabase/schema.sql` from this project, and click **Run**. This creates
   all the tables (`players`, `matches`, `registrations`, `late_fee_payments`,
   `player_add_requests`, `settings`).

4. (Optional but recommended) Seed your roster. Easiest way: in Supabase, go
   to **Table Editor → players**, and either:
   - add rows manually one by one (name + phone), or
   - click **Insert → Import data from CSV** if you have your 90 names in a
     spreadsheet already (just a `name` column, `phone` is optional).

---

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...        # whatever you want the admin password to be
ADMIN_SESSION_SECRET=...  # any long random string, e.g. from https://1password.com/password-generator
```

You (and any co-admin) will use `ADMIN_PASSWORD` to log into `/admin`. There's
only one shared admin password for v1 — no need for multiple accounts for a
2-person admin team.

To change the default match fee (15 SAR) or late fee, edit the `settings`
table directly in Supabase's Table Editor (`match_fee`, `late_fee` rows).

---

## 3. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — that's the registration page.
Open http://localhost:3000/admin to log in as admin.

Before players can register, open a match from the admin dashboard
("Open next Sunday" / "Open next Tuesday" button) — this is what makes the
registration page show that match as available.

---

## 4. Deploy for free on Vercel

1. Push this project to a GitHub repo (private repo is fine and recommended,
   since it contains your app's logic even though secrets stay in env vars).
2. Go to https://vercel.com, sign in with GitHub, click **New Project**, and
   import the repo.
3. In the import screen, expand **Environment Variables** and add the same
   four variables from your `.env.local`.
4. Click **Deploy**. You'll get a URL like `https://your-project.vercel.app`
   — that's the link you share in the WhatsApp group.

Vercel's free tier comfortably covers this (low traffic, 2 matches/week,
~90 players). Supabase's free tier is also more than enough at this scale.

---

## 5. How the weekly flow works in practice

1. A day or two before Sunday/Tuesday, you open the admin dashboard and click
   "Open next Sunday" (or Tuesday). This makes the registration link live.
2. You drop the registration link in the WhatsApp group.
3. Players open it, find their name, confirm they paid via STC Pay, and
   submit. First 18 confirmed → main list, next 5 → bench (no payment yet).
4. As STC Pay payments land in your account, you match them by name/phone in
   the admin dashboard and hit **Approve**. Approved players appear on the
   public `/list` page.
5. If someone drops out, open **Bench & promotion** in the dashboard and hit
   **Promote to main** next to the first bench player — this opens a
   pre-filled WhatsApp message to them automatically (asking them to pay),
   and moves them to "pending payment" on their `/status` page.
6. After a match, if someone was late, find them under **Roster** and click
   **Mark late** — this locks them and adds the late fee to their balance.
   They'll see it next time they try to register, and can pay + confirm on
   `/status`, which you then approve to unlock them.

---

## Notes on what's intentionally simple in v1

- **No payment gateway** — STC Pay/Apple Pay happen outside the app; the app
  only tracks declared-paid + admin-approved. This can be upgraded later
  (e.g. Moyasar or Tap Payments) if manual matching becomes a hassle at scale.
- **No automated WhatsApp messages** — the promote action opens a prefilled
  `wa.me` link for you to send with one tap, rather than sending
  automatically via the WhatsApp Business API (which requires business
  verification, template approval, and has per-message cost).
- **One shared admin password** — fine for a 1–2 person admin team. If you
  want individual admin logins later, that's a bigger change (real auth
  system) worth doing only if you actually need audit trails per admin.
- **Bench order is first-come-first-served**, exactly as agreed — the first
  person who registered when the main list was full is first in line to be
  promoted.
