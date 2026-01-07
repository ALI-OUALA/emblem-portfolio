# Repository Guidelines

## Project Structure & Modules
- Entry: `src/main.tsx` → `src/App.tsx`.
- Sections in `src/sections/` (`Hero.tsx`, `Services.tsx`, `Work.tsx`, `Contact.tsx`, `Footer.tsx`).
- UI primitives under `src/components/ui/` (shadcn/Radix). App components under `src/components/`.
- Styles: `src/index.css` (Tailwind v4 build) + tokens in `src/styles/globals.css`. HTML shell in `index.html`.
- Vite config in `vite.config.ts` (dev on `:3000`, build to `build/`). Alias: `@` → `src`.

## Build & Development
- `npm i` — install deps.
- `npm run dev` — run locally at `http://localhost:3000`.
- `npm run build` — production build to `build/`.
- Preview build: `npx vite preview`.

## Style & Conventions
- TypeScript + React (TSX), 2-space indent. Components in PascalCase.
- Design: minimal, light theme, high contrast, generous spacing, no decorative orbs/gradients.
- Use Tailwind utilities and CSS variables from `globals.css`. Avoid inline styles.
- Organize by feature/section; keep components small and focused.

## Testing
- No tests included. If adding: Vitest + React Testing Library.
- Name tests `*.test.tsx`; place beside source or `src/__tests__/`.
- Favor behavior tests over snapshots; add an `npm test` script if needed.

## Commits & PRs
- Conventional Commits encouraged (`feat:`, `fix:`, `chore:`, `refactor:`).
- PRs: clear description, linked issues, and screenshots for UI changes.
- Keep scope tight; update `README.md` if commands/UX change.

## Notes for Agents
- Don’t modify `vite.config.ts` or dependency versions unless necessary.
- New primitives → `src/components/ui/`; new sections → `src/sections/`.
- Preserve `@` alias and import patterns.
