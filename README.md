<p align="center">
  <img src="src/assets/logo.png" alt="Bon appétit Logo" width="120" />
</p>

# Bon appétit Flow Interface

The frontend of **Bon appétit Flow** is a high-fidelity dashboard built with **React**, **TypeScript**, and **Vite**, featuring interactive animations and state-driven pairing.

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** React 18
- **Build System:** Vite + TypeScript
- **Icons:** `react-icons` (FontAwesome, Material Design)
- **Styling:** Custom CSS with Warm Culinary Accents (`index.css`)

---

## 🌟 Key Architecture & Features

### 1. State-Based Session Hiding

Unlike traditional apps, there are no `#room/...` route tokens in the address bar. The URL remains strictly clean (`http://localhost:5173/`).

- The **Room ID** and **Secret Key** are managed entirely in React state.
- The session details are mirrored to `sessionStorage` so that the room remains active and synchronized upon page refresh.
- Leaving or exiting the room clears the `sessionStorage` and returns the user to the landing page.

### 2. Chrome-Style Navigation Tabs

The landing page features custom-designed Chrome-style tabs dividing the views into **Create Room** (pre-populated with a unique key) and **Join Room** (which accepts a Room ID and Secret Key pair for multiple terminals).

### 3. Interactive Restaurant Floor Plan (`CulinaryFlowSystem.tsx`)

Renders a visual spatial representation of the restaurant workflow:

- **Queue Board:** Clickable order tickets currently in line.
- **Cooking Stoves:** Active stoves showing flame and steam animations when cooking is underway. Clicking on active stoves lets chefs advance progress directly.
- **Waiter Corridor:** Wooden hallway that displays waiter sprites moving across the screen for 2.5 seconds when an order transitions from `cooking` to `done`.
- **Dining Tables Area:** Displays dishes that have successfully landed at customer tables.

---

## ⚙️ Vite Proxy Configuration

The React development server is pre-configured with a local proxy in `vite.config.ts` to redirect all `/rooms` API calls to the C++ server running on port `8080`:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/rooms': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

---

## 🚀 How to Run

### Install Node Modules

```bash
npm install
```

### Launch Development Server

```bash
npm run dev
```

_Open `http://localhost:5173` to interact with the frontend._

### Build Production Bundle

```bash
npm run build
```

_Compiles the static build assets into the `dist/` directory._
