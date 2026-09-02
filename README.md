# Contacts Manager

A small single-page contacts app: add, edit, search and delete contacts, stored
in the browser's localStorage.

## Getting started

```sh
npm install
npm run dev
```

## Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                     |
| `npm run build`     | Typecheck and build for production            |
| `npm run preview`   | Serve the production build                    |
| `npm test`          | Run the test suite once                       |
| `npm run test:watch`| Run the tests in watch mode                   |
| `npm run typecheck` | Typecheck without emitting                    |
| `npm run lint`      | Lint with oxlint                              |

## Layout

- `src/lib/` — pure contact logic: validation, uniqueness, sort, filter, storage
- `src/hooks/` — `useLocalStorage`
- `src/components/` — form, table, search, modal, confirm dialog, toast
- `src/App.tsx` — owns the contacts array, edit mode, and the delete flow

Tests live at two seams: the rendered `App` (user journeys) and the pure
functions in `src/lib/` (exhaustive input/output tables).
