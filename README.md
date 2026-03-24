# Agency Management System v1.1.1

A complete desktop/web application for managing agency operations with sales, inventory, expenses, and analytics modules.

**Current Version:** 1.1.1 (February 27, 2026)

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for detailed release information.

## What We Solve Here

**Problem:** Agencies often struggle with manual tracking of inventory, sales, expenses, and creditor relationships, leading to inefficiencies, errors in financial reporting, and lack of real-time insights into business performance.

**Solution:** Our Agency Management System provides a centralized, user-friendly platform that automates and streamlines agency operations. It offers comprehensive modules for inventory management, sales tracking, expense monitoring, creditor management, and financial analytics. The system includes offline capability, secure user authentication, automated report generation in PDF and Excel formats, and a responsive dashboard with visual analytics to help agencies make data-driven decisions.

## Tech Stack We Used Currently

- **Frontend Framework:** React 19 with Vite for fast development and building
- **Routing:** React Router DOM for client-side navigation
- **Database:** Firebase Firestore with offline persistence (IndexedDB)
- **Authentication:** Firebase Auth
- **Charts & Visualizations:** Recharts for interactive data visualizations
- **PDF Generation:** jsPDF and jsPDF-Autotable for report exports
- **Excel Export:** xlsx library for spreadsheet exports
- **Icons:** Lucide React for consistent iconography
- **Encryption:** CryptoJS for data security
- **PWA Features:** Vite PWA plugin for offline functionality and installability
- **Testing:** Vitest with React Testing Library
- **Code Quality:** ESLint for linting and code standards
- **Build Tool:** Vite for development server and production builds

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
