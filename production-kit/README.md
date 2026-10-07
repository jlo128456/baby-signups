# Production kit (for later)

Everything needed to turn the demo into the real app is kept here, so it's saved on GitHub with the rest of the project.

The demo **ignores this folder**: React only builds `src/` and `public/`, so leaving it here changes nothing.

## What's inside

```
production-kit/
├── src/                    ← copy over the project's src/
│   ├── config.js           ← reads the demo/production switch
│   ├── App.jsx, index.js
│   ├── components/         SignupForm, Login, TeamDesk, LeadCard, OfflineBar (.jsx)
│   ├── services/           api.js (picks demo or production), productionApi.js, demoApi.js
│   └── hooks/              useOfflineQueue.js (offline saving + sync), useTeamData.js
├── public/                 ← copy over the project's public/
│   ├── config.js           ← ★ the switch: mode "demo" or "production"
│   ├── index.html, sw.js (works offline), .htaccess (HTTPS + caching)
├── server/                 ← PHP back end → upload to public_html/api on cPanel
└── database/schema.sql     ← MySQL tables → import in phpMyAdmin
```

## What production adds
- Real sign-ups saved in your MySQL database, from any phone or computer.
- Automatic emails to Amanda, Laura and Richard for every sign-up.
- Real team logins with secure passwords.
- Works offline as an installed app: sign-ups wait on the device and sync later.
- Demo mode still works. Set `mode: "demo"` in `public/config.js` any time.

## Going live, step by step

### 1. Add the kit to the app
From the project folder (where `package.json` is):

```bash
cp -r production-kit/src/. src/
cp -r production-kit/public/. public/
npm start
```

It still opens in **demo** mode, so check it works as before.

If you changed any of these files since the demo, copy your changes across by hand rather than overwriting them: `App.jsx`, `index.js`, `SignupForm.jsx`, `Login.jsx`, `TeamDesk.jsx`, `LeadCard.jsx`, `api.js`, `demoApi.js`, `useTeamData.js`. Styles, test data and the other components are shared and need nothing.

### 2. Database (cPanel → MySQL Databases)
1. Create a database and a user, and add the user to the database with **All privileges**.
2. In **phpMyAdmin**, select the database, then **Import** → `production-kit/database/schema.sql` → **Go**.

### 3. Sending email address (cPanel → Email Accounts)
Create e.g. `signups@yourshop.com.au`.

### 4. Build and upload
```bash
npm run build
```
In cPanel **File Manager** (turn on **Settings → Show Hidden Files**):
- the **contents** of `build/` → `public_html/`
- the **contents** of `production-kit/server/` → `public_html/api/`

### 5. Configure
- In `public_html/api`, copy `config.sample.php` to **`config.php`** and fill in the database name, user, password and sending email.
- In `public_html/config.js`, change `mode: "demo"` to **`mode: "production"`**.
- Visit `https://yourdomain.com.au/api/packages.php`. You should see `{"packages":[]}`.

Never put `config.php` on GitHub. It holds your database password.

### 6. Team logins
1. In `config.php`, set `'setup_key'` to a long random phrase.
2. Visit `https://yourdomain.com.au/api/add-staff.php` and add Amanda, Laura, Richard and yourself.
3. Set `'setup_key'` back to `''`.

### 7. Finish
1. Open `https://yourdomain.com.au/#team` and sign in.
2. In **Packages & settings**, add the team emails, your Shopify store and packages.
3. Send a test sign-up from your phone and check all three of you get the email.
4. On the iPad: Safari → **Share → Add to Home Screen**.

## The GitHub Pages demo
GitHub Pages can't run PHP, so it stays a demo. Production lives on cPanel. If you've copied the kit in, make sure the published copy stays in demo mode: in `.github/workflows/deploy.yml`, add this line before `touch build/.nojekyll`:

```yaml
      - run: sed -i 's/^  mode: "production",$/  mode: "demo",/' build/config.js
```
