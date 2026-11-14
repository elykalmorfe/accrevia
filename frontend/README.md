# Accrevia - Accreditation Evidence & Compliance Portal

Accrevia is an accreditation management and evidence indexing platform built with React, TypeScript, Tailwind CSS, and Vite.

## Getting Started

### 1. Prerequisites

- Node.js (v18+)
- npm

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

By default, the server runs at [http://localhost:5173/](http://localhost:5173/).

#### Default administrator account

On first launch the app seeds a default administrator into the account store (only if it does not already exist):

| Email | Password |
| --- | --- |
| `admin@nemsu.edu.ph` | `Admin@Accrevia2026` |

The password is stored as a bcrypt hash. After signing in, a banner prompts you to change it under **My Account → Account Settings**. The defaults live in `src/utils/auth.ts`.

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

### 6. Lint Code

```bash
npm run lint
```
