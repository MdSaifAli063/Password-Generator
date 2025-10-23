# 🔐 Password Generator

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=fff)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=000)](#)
[![Accessibility](https://img.shields.io/badge/a11y-friendly-3b82f6)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](#license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-FF69B4.svg)](#contributing)

A fast, accessible, and secure password generator with a modern UI, strength meter, and “Edit after copy” workflow.

- Demo-ready static site: just open index.html
- Crypto‑safe randomness using `window.crypto.getRandomValues`
- Keyboard-friendly and screen‑reader friendly
- Preview
![image](https://github.com/MdSaifAli063/Password-Generator/blob/7a5084130d302a322229c21b377db089d2b054b6/Screenshot%202025-09-11%20010252.png)
---

## 📁 Project Structure

. ├── index.html # Markup and UI controls ├── style.css # Neumorphic theme, colors, responsive styles └── script.js # Generator logic, strength meter, copy & edit flow

---

## ✨ Features

- 🔑 Generate strong passwords with:
  - Length slider + numeric input (6–64)
  - Character sets: lowercase, uppercase, numbers, symbols
  - Optional: avoid ambiguous characters (O/0, l/1, |, etc.)
  - Optional: disallow repeated characters
- 🧮 Strength meter with estimated entropy (bits)
- 📋 One‑click copy with toast feedback
- ✍️ Edit after Copy:
  - After a successful copy, the Show/Hide button becomes Edit
  - Edit switches the field to editable text and live-updates strength
  - Click Done (or Generate) to finish editing and restore normal toggle
- 👁️ Show/Hide password visibility
- 💾 Settings persist in localStorage
- ♿ Accessibility:
  - Screen‑reader labels (sr‑only)
  - aria-live status for messages/toast
  - Focus styles and keyboard controls
- 📱 Responsive layout and soft‑neumorphic theme

---

## 🚀 Getting Started

- Easiest: double‑click `index.html` to open in your browser.
- For the best clipboard support (modern Clipboard API requires a secure context), run a local server:
  - Python: `python -m http.server`
  - Node (serve): `npx serve`
  - VS Code: Live Server extension

Then open the shown URL in your browser.

Note: If not served over http(s), the app falls back to a legacy copy method when possible.

---

## 🧭 Usage Guide

1. Set desired length using the slider or number field.
2. Choose character types (a–z, A–Z, 0–9, symbols).  
   - Enable “Avoid ambiguous” to remove look‑alike characters.
   - Enable “No repeated characters” to prevent duplicates (requires a large enough pool).
3. Click Generate.  
   - The strength meter and entropy label update.
4. Click Copy. A “Copied!” toast will appear.
5. After copying, the Show/Hide toggle becomes Edit:
   - Click Edit to make the field editable and visible.
   - Type to tweak the password; strength updates live.
   - Click Done (or Generate again) to finish editing and restore the normal Show/Hide behavior.

Tip: Press Enter anywhere to quickly generate a new password.

---

## ⌨️ Keyboard Shortcuts

- Enter: Generate
- Tab: Move between inputs and buttons
- Space/Enter on focused buttons: Activate

---

## 🧠 How Strength Is Estimated

Entropy (in bits) is approximated as:
- bits ≈ length × log2(poolSize)

Where poolSize is the total count of unique characters available based on your selected character sets and filters. The bar caps visually at 128 bits for the meter.

---

## 🎨 Theming & Customization

The theme is powered by CSS variables in `style.css`. Adjust colors or add variants:

Key variables:
- Background and text
  - `--bg`, `--text`, `--muted`, `--primary`
- Status colors
  - `--danger`, `--warn`, `--mid`, `--ok`, `--good`, `--info`, `--purple`, `--teal`, `--cyan`, `--orange`
- Shadows (neumorphic)
  - `--sh-out`, `--sh-in`

Optional helpers already included:
- Button color variants: `.btn-info`, `.btn-success`, `.btn-warning`, etc.
- Text utilities: `.text-info`, `.text-success`, `.text-danger`, etc.
- Soft badges: `.badge.badge-info` (and other colors)
- Gradient title: add `.title-accent` to the `<h1>` if you want a colorful heading

Example (change primary accent):
```css
:root {
  --primary: #0f172a; /* deeper accent */
}
```

## ⚙️ Configuration (script.js)

- Default ranges:
- Length slider: min=6, max=64 (change in HTML if needed)
Character sets (edit with care):
```js
const CHARSETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  number: '0123456789',
  symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`',
};
```

Ambiguous characters filter:
```js
const AMBIGUOUS = new Set(['O','0','o','I','l','1','|','S','5','B','8','G','6','Z','2']);
```
- Settings persist under localStorage key: pwgen-settings.v1.
- Security note: Randomness uses crypto.getRandomValues with a modulo‑bias‑free sampler and Fisher–Yates shuffle.

## 🧩 Accessibility

Labels:
- Screen-reader label for the password field (sr-only)
- Live regions for messages and the “Copied!” toast
- Keyboard:
- Tabbable controls with visible focus states
- Enter to generate
Visual:
- High-contrast text and clear status color coding

## 🛠️ Troubleshooting

- Clipboard not copying?
- Serve the page over http(s) for the modern Clipboard API.
- The app falls back to a legacy execCommand('copy') when allowed by the browser.
- “No repeated characters” warning
- If your selected character pool is smaller than the desired length, repeats are allowed and a warning is shown.
- Strength looks “low”
- Reduce symbols/filters or increase length to raise entropy.

## 🌐 Deploy

- GitHub Pages: push to a repo and enable Pages on the main branch (root).
- Netlify/Vercel: drag‑and‑drop or import the repo as a static site.

## 🤝 Contributing

- Contributions, issues, and feature requests are welcome!
- Feel free to open an issue or a PR.

- Code style: keep code readable, comment nontrivial logic
- Accessibility: don’t regress keyboard or screen‑reader support
- Security: maintain crypto‑safe randomness and avoid bias

📜 License

MIT License. You’re free to use, modify, and distribute with attribution. See LICENSE if present.

❤️ Credits

UI/UX: soft‑neumorphic style with accessible contrast
Security: crypto‑safe RNG via Web Crypto API
You, for using and improving this tool!
Made in India !
