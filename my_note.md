


To build

```
export NODE_OPTIONS=--openssl-legacy-provider
npm install
npm run build:prod
```

To run locally

Use Git Bash (build scripts need `rm` / `cp`).

```
export NODE_OPTIONS=--openssl-legacy-provider
npm install
npm run build
npm start
```

Open http://localhost:8080

After code changes, re-run `npm run build` and refresh the browser.

`npm run dev` does not work — `webpack.dev.config.js` is missing from this repo.

---

To deploy to Netlify

Drag the whole `deployment/server` folder (not just `Neon-gh/`).
Use `npm run build:prod` before uploading.