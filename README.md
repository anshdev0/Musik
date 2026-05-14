# Musik 🎵

A personal music player app built with React Native (Expo). Stream your music collection from the cloud — anywhere, anytime.

---

## Features

- 🌐 **Cloud streaming** — Music stored on Cloudflare R2, streamed from anywhere
- ⚡ **Auto library** — Upload an MP3 to R2 and it appears in the app instantly
- 📥 **Offline support** — Download songs to your phone for listening without internet
- 🎵 **Playlists** — Create, manage and play custom playlists
- 🖼 **Album art** — Automatically fetched from the iTunes API
- 🎛 **Mini player** — Controls visible while browsing your library
- 🔍 **Search** — Filter by title, artist or album
- 🔁 **Repeat modes** — Off / All / One
- 🌑 **Dark theme** — Deep navy and blue, designed for AMOLED screens

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo) |
| Audio | expo-av |
| Cloud storage | Cloudflare R2 |
| Song API | Cloudflare Worker |
| Album art | iTunes Search API |
| Offline files | expo-file-system |
| Playlists | AsyncStorage |
| Navigation | Expo Router |

---

## Architecture

```
Musik App
  ├── Cloudflare Worker  →  R2 Bucket (your MP3s)
  ├── iTunes API         →  Album art
  └── Local storage      →  Playlists + downloaded songs
```

---

## Getting Started

### Prerequisites
- Node.js
- Expo CLI — `npm install -g expo-cli`
- Expo Go on your phone

### Run locally
```bash
git clone https://github.com/anshdev0/Musik.git
cd Musik
npm install
npx expo start
```

### Add new music
Upload any MP3 to your Cloudflare R2 bucket — it appears in the app automatically.

### Build APK
```bash
eas build -p android --profile preview
```

---

## Project Structure

```
Musik/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx       # Library screen
│   │   ├── playlists.tsx   # Playlists screen
│   │   └── _layout.tsx     # Tab navigation
│   ├── player.tsx          # Player screen
│   └── _layout.tsx         # Root layout
├── context/
│   └── AudioContext.tsx    # Global audio state
├── hooks/
│   ├── useDownload.ts      # Offline download logic
│   └── usePlaylists.ts     # Playlist management
├── constants/
│   └── songs.ts            # Fetches songs from Worker
└── utils/
    └── artwork.ts          # iTunes album art fetcher
```

---

## Notes

- Built for personal use
- Music is streamed from my own Cloudflare R2 bucket
- No user data is collected or shared
