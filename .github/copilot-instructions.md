<!-- Copilot / AI agent instructions for RECETTES-APP -->
# RECETTES-APP — Agent Guidance

Purpose: quickly orient an AI coding agent so it can make safe, useful edits in this Create React App project.

- **Big picture**: this is a client-side React app (Create React App) that stores data in Firebase Realtime Database and uses Firebase Auth. Routing is handled with `react-router-dom` (v6) and key views are lazily loaded from `src/`.

- **Key files to read first**:
  - `src/Root.js` — app routing and lazy-loading strategy.
  - `src/base.js` — Firebase initialization and exported `database`, `auth`, `storage` objects.
  - `src/App.js` — main feed: subscribes to `recettes` DB path and renders `Card` entries.
  - `src/components/*` — UI and auth flows (notably `Login.jsx`, `Signup.jsx`, `Profile.jsx`, `Recette.js`, `Card.js`).

- **Architecture & data flows**:
  - Firebase Realtime DB is the single source of truth. Two primary top-level collections/paths are used: `recettes` (recipes) and `users` (profiles).
  - `App.js` listens to `ref(database, 'recettes')` using `onValue` and renders cards.
  - Auth state is surfaced via `onAuthStateChanged(auth, ...)` in `App.js` and `Profile.jsx`.
  - Recipes can be accessed by ID (`/recette/:nom` first tries the id) or by decoded `nom` (human-friendly fallback) in `src/components/Recette.js`.

- **Important conventions found in code**:
  - New recipe keys are created as `recette-<timestamp>` (see `ajouterRecette` in `src/App.js`).
  - Recipe objects commonly include: `nom`, `ingredients`, `instructions`, `image`, `authorId`, `createdAt`.
  - Images may be stored in one of three ways: remote URL (http...), absolute path (`/...`), or local filename stored in DB and loaded via `require('../img/<name>')` (see `Card.js` and `Recette.js` resolveImage helpers).
  - User profiles are stored under `users/<uid>` and can contain `photo` (URL or base64), `prenom`, `nom`, `bio`, etc. `Signup.jsx` writes initial profile fields after creating an auth user.
  - The app uses React.lazy + Suspense for code-splitting. Keep lazy imports in `src/Root.js` consistent.

- **Auth & protected routes**:
  - `ProtectedRoute` component expects `{ user, children }` and redirects to `/login` when `user` is falsy (see `src/ProtectedRoute.js`).
  - Editing/deleting recipes relies on `auth.currentUser.uid` and DB writes/removals under `recettes/<id>`.

- **Patterns that matter for code edits**:
  - Prefer using `ref(database, '...')` and Firebase helpers already imported from `src/base.js` rather than creating new Firebase instances.
  - When adding new routes, follow the `Root.js` pattern: lazy-import the view and add a `Route` inside `Routes`.
  - When handling images, replicate the `resolveImage` fallback logic so local image filenames continue to work with `require()`.

- **Dev + build commands** (CRA defaults in `README.md`):
  - `npm start` — run dev server (http://localhost:3000).
  - `npm test` — run tests (watch mode).
  - `npm run build` — production build.

- **Testing & debugging notes**:
  - There is a small test file `src/App.test.js` — run `npm test` to run it.
  - To debug Firebase reads/writes, check browser console for Firebase errors and the Realtime Database view in Firebase console for current data under `recettes` and `users`.

- **When making changes an agent should check**:
  1. If introducing Firebase writes, ensure the path (`recettes` or `users`) and object shape match existing entries.
 2. If changing routing, update `src/Root.js` and ensure lazy imports have a Suspense fallback.
 3. If changing image handling, maintain compatibility with local `src/img/` filenames loaded via `require` and with remote URLs/base64.

If anything here is unclear or you want examples for a specific change (tests, a new route, or a DB migration script), tell me which area and I'll extend these instructions.
