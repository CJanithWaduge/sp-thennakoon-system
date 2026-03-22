# Agency Management System v1.1.1

A complete desktop/web application for managing agency operations with sales, inventory, expenses, and analytics modules.

**Current Version:** 1.1.1 (February 27, 2026)

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for detailed release information.

## Quick Start

### Development
```bash
npm install
npm run dev              # Web development server
npm run dev:electron    # Desktop development
npm run dev:all         # Both simultaneously
```

### Production
```bash
npm run build           # Build web bundle
npm run dist            # Build Electron installers
```

## Features
- Dashboard with KPI metrics and charts
- Sales, Inventory, Expenses, Creditors modules
- Analytics and reporting with PDF/CSV export
- User authentication and app settings
- Cross-platform desktop (Windows, macOS, Linux)
- Offline-capable with local database storage

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
