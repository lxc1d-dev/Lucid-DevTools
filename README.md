# Lucid DevTools

**by Lucid Studios**

A fast, offline desktop toolbox for developers. Nine everyday utilities in one clean, dark app. No accounts, no internet, no tracking. Everything runs on your own computer.

---

## Contents

1. [What's inside](#whats-inside)
2. [Getting it running](#getting-it-running)
3. [Turning it into a Mac app](#turning-it-into-a-mac-app)
4. [Fixing the "contains malware" message](#fixing-the-contains-malware-message)
5. [Sharing it on GitHub](#sharing-it-on-github)
6. [Keyboard shortcuts](#keyboard-shortcuts)
7. [How it works](#how-it-works)
8. [Project files](#project-files)
9. [Privacy](#privacy)
10. [Troubleshooting](#troubleshooting)

---

## What's inside

| Tool | What it does |
| --- | --- |
| **JSON Formatter** | Prettify, minify and validate JSON, with clear error messages |
| **Base64** | Encode text to Base64 or decode it back (handles emoji and accents) |
| **UUID Generator** | Create 1–100 random v4 UUIDs at once |
| **Text Tools** | Live character, word, line and UTF-8 byte counts |
| **Timestamp Converter** | Unix timestamp ↔ readable date, plus a "current timestamp" button |
| **Color Tools** | HEX → RGB and HSL, live preview, preset swatches |
| **CSS Gradient** | Pick two colors and an angle, copy the CSS |
| **Password Generator** | Secure random passwords with adjustable length and character types |
| **Regex Tester** | Test patterns with flags, highlighted matches and clear errors |

Every tool has Copy and Clear/Reset buttons.

---

## Getting it running

You only need to do the setup once.

### 1. Install Node.js

Download the **LTS** version from https://nodejs.org and install it like any other app. To check it worked, open Terminal and run:

```
node -v
```

You should see a version number.

### 2. Open Terminal in this folder

Type `cd ` (with a space after it), then drag the `Lucid-DevTools` folder from Finder into the Terminal window and press Enter.

### 3. Install and start

```
npm install
npm start
```

- `npm install` downloads Electron and the build tools. It takes a minute or two and creates a `node_modules` folder. You only need to run it once.
- `npm start` opens the app. Run this any time you want to launch it from the project folder.

---

## Turning it into a Mac app

With the setup above done, run:

```
npm run package:mac
```

The first build takes a few minutes. When it finishes you'll have a new `dist` folder containing:

- A `.dmg` installer, such as `Lucid DevTools-1.0.0-arm64.dmg`. Open it and drag **Lucid DevTools** into **Applications**.
- A folder named `mac-arm64` (or `mac` on Intel Macs) containing `Lucid DevTools.app` directly.

The build matches the chip in the Mac you build on (Apple Silicon or Intel). To make one that runs on both, change the `mac` section of `package.json` to build a universal version.

**Optional custom icon:** create a folder named `build`, put an `icon.icns` file inside it, and run the package command again.

---

## Fixing the "contains malware" message

Mac apps you build yourself aren't signed or notarized by Apple, so macOS may refuse to open them with a message like *"Lucid DevTools.app was not opened because it contains malware."* The app is not harmful. macOS shows this for any unsigned app.

Try these in order.

**1. Remove the quarantine flag** (fixes it most of the time):

```
xattr -cr "/Applications/Lucid DevTools.app"
```

**2. Sign it locally** (if step 1 isn't enough):

```
codesign --force --deep --sign - "/Applications/Lucid DevTools.app"
xattr -cr "/Applications/Lucid DevTools.app"
```

**3. Use Privacy & Security.** Open **System Settings → Privacy & Security**, scroll to the bottom, and click **Open Anyway** next to Lucid DevTools.

If you've put the app somewhere other than Applications, change the path in the commands. You can type `xattr -cr ` and drag the app into Terminal to fill in the path.

---

## Sharing it on GitHub

- Don't upload the `dist` or `node_modules` folders. The included `.gitignore` already skips them.
- Upload the source files normally. To share the app itself, create a **Release** on your repository and attach the `.dmg` file.
- People who download an unsigned app will see the same macOS warning. Add a note to your release such as:

  > This app isn't notarized by Apple. After installing, run this once in Terminal, then open it normally:
  > `xattr -cr "/Applications/Lucid DevTools.app"`

- To remove the warning completely you need to sign and notarize the app, which requires a paid Apple Developer account ($99/year).

---

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl + K` | Jump to the search bar |
| `Cmd/Ctrl + Enter` | Run the current tool's main action |
| `Cmd/Ctrl + 1` to `9` | Open the 1st to 9th tool in the sidebar |
| `Enter` (in search) | Open the first matching tool |
| `Esc` (in search) | Clear the search |

---

## How it works

Lucid DevTools is built with **Electron**, which lets you make a desktop app out of normal web technologies (HTML, CSS and JavaScript). Electron bundles a browser engine and a small runtime so the app runs on its own, with no internet connection and no web server.

An Electron app has two parts that talk to each other:

**The main process (`main.js`).** This is the app's "back office." It creates the window, sets the Mac-style title bar, blocks any attempt to open new windows or navigate elsewhere, and handles one job for the interface: writing text to your clipboard.

**The renderer (`index.html`, `style.css`, `renderer.js`).** This is everything you see and click. `index.html` is the layout (sidebar, title bar, workspace, status bar), `style.css` is the dark purple design, and `renderer.js` contains all nine tools.

**The bridge (`preload.js`).** For safety, the interface isn't allowed to touch your computer directly. The preload file exposes exactly two things to it: which operating system you're on, and a `copy` function. When you click a Copy button, the interface asks the main process to put the text on your clipboard.

### How the tools are built

In `renderer.js`, each tool is a small block with a name, a description, the HTML for its panel, and an `init` function that wires up its buttons. The sidebar is generated from that list. When you click a tool, the app swaps its panel into the workspace. That's why switching tools is instant and never opens a browser tab. Search simply filters the list by name and keywords.

All the work happens with standard browser features built into Electron:

- JSON uses `JSON.parse` and `JSON.stringify`
- Base64 uses `btoa` / `atob` with UTF-8 handling
- UUIDs use `crypto.randomUUID()`
- Passwords use `crypto.getRandomValues()`, a cryptographically secure random source
- Regex uses JavaScript's built-in `RegExp`

### Built-in safety

- `contextIsolation` and `sandbox` are on and `nodeIntegration` is off, so the page can't reach into your system
- A Content Security Policy in `index.html` only allows the app's own local files to load, which blocks any external scripts or requests
- The app contains no network code at all

---

## Project files

```
Lucid-DevTools/
├── package.json   App name, version, scripts and packaging settings
├── main.js        Creates the window and handles clipboard copying
├── preload.js     Safe bridge between the window and the main process
├── index.html     App layout
├── style.css      Dark purple design
├── renderer.js    Sidebar, search, shortcuts and all nine tools
├── README.md      This file
└── .gitignore     Tells Git which files to skip
```

`package.json` holds two commands:

- `npm start` runs the app for development
- `npm run package:mac` builds the Mac installer with electron-builder

---

## Privacy

- No accounts, backend, database, analytics or telemetry
- No network requests of any kind
- Nothing you type is saved. The only thing stored is which tool you last had open (in the app's local storage on your Mac), so it reopens there next time

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `npm: command not found` | Install Node.js (see above), then reopen Terminal |
| `npm start` shows errors | Run `npm install` first and make sure you're in the `Lucid-DevTools` folder |
| Build fails | Delete the `node_modules` folder, run `npm install` again, then retry |
| App won't open ("malware" message) | See the fix section above |
| Changes don't appear in the built app | Run `npm run package:mac` again, because the app is a snapshot of your files |

---

© Lucid Studios. Released under the MIT license.
