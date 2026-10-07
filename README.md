# Baby Sign-ups (front end demo)

A React app (Create React App, JSX components) where expecting parents register their baby's due date and preferred delivery date, with a password-protected team desk.

**Front end only (for now).** There's no server. Everything is saved in the browser's **local storage**, starting from the test data in `src/data/testData.js`.

- Demo team login: `amanda@demo.com` / `demo1234`
- **Reset demo** (in the banner at the top) puts the test data back.
- Saved data lives in DevTools → Application → Local Storage, under keys starting with `dds-demo:`.

## Run it

```bash
npm install
npm start
```

Opens at http://localhost:3000.

## Folder structure

```
src/
├── index.js                ← starts the app
├── App.jsx                 ← puts the components together
├── styles.css              ← colours, fonts, phone-first layout
├── components/
│   ├── DemoBanner.jsx      ← "Demo mode" bar, login hint, reset button
│   ├── Header.jsx          ← heading and sign out
│   ├── TabBar.jsx          ← team tabs (bottom bar on phones)
│   ├── SignupForm.jsx      ← the customer form + thank-you screen
│   ├── Login.jsx           ← team password sign-in
│   ├── TeamDesk.jsx        ← list of enquiries, counts, search
│   ├── LeadCard.jsx        ← one enquiry: status, contact ticks, upsells
│   └── SettingsPanel.jsx   ← team emails, Shopify store, packages
├── services/
│   ├── api.js              ← what the components call
│   ├── demoApi.js          ← sign-ups, logins, settings…
│   └── localStore.js       ← reads and writes local storage
├── data/
│   └── testData.js         ← starting test data (edit freely)
├── hooks/
│   └── useTeamData.js      ← loads the team desk
└── lib/
    ├── constants.js        ← team names, statuses
    ├── dates.js            ← weeks along, Australian dates
    └── toast.jsx           ← confirmation messages
```

## Changing the test data

Edit `src/data/testData.js`. Browsers that already opened the demo keep their saved copy. To give everyone the new data, increase `VERSION` in `src/services/localStore.js`, or press **Reset demo**.

## Publish on GitHub Pages

Push to `main`, then in the repository go to **Settings → Pages → Source → GitHub Actions**. The workflow in `.github/workflows/deploy.yml` publishes it to `https://YOUR-USERNAME.github.io/REPO-NAME/`.

## Going to production later

The `production-kit/` folder holds everything for the real version: the PHP back end, the MySQL tables, real team logins, automatic team emails, and offline sync. The demo ignores it. When you're ready, follow `production-kit/README.md`.
