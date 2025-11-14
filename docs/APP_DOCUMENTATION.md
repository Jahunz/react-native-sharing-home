# React Native Sharing Home — App Documentation

Last updated: 2025-11-13

This documentation describes the purpose, architecture, and main files of the "react-native-sharing-home" app. The app's purpose: help manage a rental property (rooms, invoices, members, roles). This document is intended for maintainers and new contributors.

## Purpose

The app helps a property owner or manager track rooms, tenants (members), and invoices. It supports multiple roles (home_master, room_master, room_member) and offers separate screens and flows for each.

## Tech stack

- React Native (0.81.5)
- Expo (SDK ~54)
- Expo Router for navigation
- NativeWind + Tailwind for styling
- Gluestack UI primitives
- AsyncStorage for simple local persistence
- TypeScript

## How to run

Prerequisites: node.js and `expo` installed. Use the project's scripts in `package.json`.

Common commands (run from repository root):

```powershell
# install deps (if not already)
npm install

# start metro/dev server
npm run start

# run on android device/emulator
npm run android

# run on web
npm run web
```

There is also a helper script `npm run reset-project` which runs `./scripts/reset-project.js`.

## Project layout (high level)

- `app/` — main app code (screens, components, constants, hooks, storage)
  - `_layout.tsx` — root layout with the Expo Router `Stack` screens
  - `index.tsx` — app landing UI (root)
  - `screens/` — app screens (login, signup, profile, role-selection, notifications, and role-specific folders)
    - `home-master/` — dashboard, invoice history, room detail (for property owner)
    - `room-master/` — room view selection and per-room management
    - `room-member/` — member dashboard and per-room views for individual tenants
  - `components/` — reusable UI components (cards, inputs, buttons, icons, and smaller UI primitives)
  - `storage/` — AsyncStorage helpers (`async_storage.ts`)
  - `constants/` — shared constants (`Routes.tsx`, enums, types)
  - `hooks/` — custom hooks used across screens
- `assets/` — images and static assets
- `android/` — Android native project (gradle files, keystore)
- `package.json` — project scripts and dependencies
- `docs/` — (this file)

## Navigation and routes

The app uses `expo-router` with a `Stack` declared in `app/_layout.tsx`. The `Routes` helper in `app/constants/Routes.tsx` centralizes route names and patterns; the Login route accepts an optional `role` query parameter. The layout registers screens such as:

- `index` (root)
- Role selection
- Login
- Signup
- Profile
- Notifications
- Home master screens (dashboard, room detail, invoice history)
- Room master screens (dashboard / room view selection)
- Room member screens

This centralized registration ensures consistent header options and screen ordering.

## Authentication and login flow

Currently the `Login` screen (`app/screens/login.tsx`) implements a simple demo-based login using hardcoded demo passwords. Behavior:

- Inputs: phoneNumber, password
- `handleLogin` checks the typed password and maps it to a role:
  - `home_master` → stores `userRole=home_master` and navigates to home master dashboard
  - `room_master` → stores `userRole=room_master` and navigates to room member dashboard
  - `room_member` → stores `userRole=room_member` and navigates to room member dashboard
  - otherwise, warns via `console.warn`
- Storage: saves the role using `storeData('userRole', role)` implemented in `app/storage/async_storage.ts` (wraps `@react-native-async-storage/async-storage`)

Note: There is no real backend authentication implemented yet. This is a demo flow for role-selection/testing.

## Storage

`app/storage/async_storage.ts` exposes two helpers:

- `storeData(key: string, value: string)` — stores a string value; logs an error on failure
- `getData(key: string)` — retrieves a string value; logs an error on failure

These are thin wrappers around `@react-native-async-storage/async-storage`.

The `Login` screen uses `storeData("userRole", ...)` to persist the selected role.

## Main screens and responsibilities

High-level list of screens (non-exhaustive):

- `app/index.tsx` — app root/landing
- `app/screens/role-selection.tsx` — choose role (owner/member) and navigate to `login` with role param
- `app/screens/login.tsx` — demo login (role-mapping via password)
- `app/screens/signup.tsx` — sign-up screen
- `app/screens/profile.tsx` — user profile
- `app/screens/notifications.tsx` — notifications center

Role-specific groups:
- `app/screens/home-master/` — for property owners (dashboard, invoice history, room details)
- `app/screens/room-master/` — for room managers (room list/selection, room detail with tabs)
- `app/screens/room-member/` — for tenants (dashboard, room detail tabs such as invoices, members, current invoice)

Sub-screens inside room detail generally use nested layouts and tabs (files like `_layout.tsx` inside the room-detail folders and separate tab files such as `members.tsx`, `current-invoice.tsx`, etc.)

## Components and UI

- The app relies on a `components/ui` library (Gluestack UI provider) and several shared components in `components/` and `app/components/`. These include:
  - `AppIcon` — app logo component
  - `StyledButton`, `StyledInput`, `StyledModal`, `StyledTabs` — UI primitives used across screens
  - Card components for rooms and invoices under `app/components` and `app/components/commons`

UI is styled using NativeWind/Tailwind and the project includes `tailwind.config.js` and `global.css`.

## Hooks

There are custom hooks in `app/hooks` and `hooks/`, such as color-scheme utilities and a room-detail helper (`app/hooks/hm-room-detail.ts`) that are used by screens. These encapsulate business logic and data transformations.

## Tests and linting

- The repository contains `eslint` and `typescript` dev deps. No explicit test framework or tests were found in the scanned files.

## Known limitations / TODOs / future improvements

- Replace demo login with a real authentication backend (JWT or session), including secure token storage and refresh.
- Add explicit UI error handling and loading states for network operations.
- Add unit tests for critical logic (login flow, storage wrapper, core hooks).
- Add role-based route guards (protect screens behind auth/role checks).
- Consider centralizing API client code (axios/fetch wrapper) with error handling and interceptors.

## Where to look next (important files)

- `app/screens/login.tsx` — demo login implementation
- `app/storage/async_storage.ts` — local storage helpers
- `app/_layout.tsx` — navigation registration
- `app/constants/Routes.tsx` — route name helpers
- `app/components/` and `app/components/commons/` — shared UI
- `app/screens/` (all) — feature screens per role

## If you'd like, I can also:

- Replace `login.tsx` with a scaffold for a real API-based login (network call + token storage + error UI + loading state).
- Generate a smaller per-file reference docs (one MD per screen/component) automatically.
- Add basic unit tests for `async_storage.ts` (mocking AsyncStorage) and `login.tsx` logic.

---

If you want me to proceed and generate per-screen docs or implement a particular improvement (e.g., real login flow or UI error handling), tell me which one and I'll update the todo list and implement it next.