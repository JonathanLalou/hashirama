# hashirama – Browser Extension

**Hashirama defeats Madara!**  
A lightweight Chrome / Firefox extension that automatically detects and saves all images (jpg, jpeg, png, webp) from the current tab — with sequential numbered filenames (`0001.webp`, `0002.webp`, …).

Perfect for archiving manga chapters, comics, or any image-heavy page that uses lazy-loading, blob URLs, or aggressive protections.

## Features

- One-click start/stop from the toolbar popup
- Saves **every** matching image loaded in the active tab
- Sequential naming: `0001.webp`, `0002.webp`, …
- Handles classic http/https URLs **and** short-lived `blob:` URLs
- Aggressive scanning + auto-scroll to force lazy-loaded images
- Live counter in popup (“Saved: 47 / 58”)
- Detailed console logging (blob vs http/fetch, queued status, errors)

## Screenshots

TODO

## Installation (Developer mode)

1. Clone or download this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the **root folder** of the project (the one containing `manifest.json`)
5. The Hashirama icon should appear in your toolbar

For Firefox: same process via `about:debugging#/runtime/this-firefox` → “Load Temporary Add-on…”

## Usage

1. Navigate to any page with images you want to save (e.g. a manga chapter)
2. Click the **Hashirama** icon in the toolbar
3. Click **🔴 Start Saving**
4. The extension auto-scrolls and saves images one by one
5. Watch the popup counter and browser console (F12)
6. When finished → click **⬛ Stop Saving**

Images are saved to your browser's default **Downloads** folder.

**Recommended setting:**  
Disable “Ask where to save each file before downloading” in browser settings for silent saving.

## Project structure
