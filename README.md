🎵 Musik
A personal music player app built with React Native (Expo) that streams your music collection from the cloud — anywhere, anytime.
✨ Features

Cloud streaming — Music stored on Cloudflare R2, streamed from anywhere with internet
Auto library — Add an MP3 to R2 and it appears in the app instantly (via Cloudflare Worker)
Offline support — Download songs to your phone and listen without internet
Playlists — Create, manage and play custom playlists stored locally on device
Album art — Automatically fetched from the iTunes API
Mini player — Controls visible while browsing your library
Search — Filter songs by title, artist or album
Repeat modes — Repeat off / repeat all / repeat one
Dark theme — Deep navy and blue UI designed for AMOLED screens

🛠 Tech Stack
LayerTechnologyApp frameworkReact Native (Expo)Audio playbackexpo-avCloud storageCloudflare R2Auto song APICloudflare WorkerAlbum artiTunes Search APIOffline storageexpo-file-systemPlaylistsAsyncStorageNavigationExpo Router
🚀 Architecture
Phone App (React Native)
      │
      ├── Cloudflare Worker ──► R2 Bucket (MP3 files)
      │   (auto song list)
      │
      ├── iTunes API (album art)
      │
      └── Local Storage (playlists, downloaded songs)
📱 Getting Started
Prerequisites

Node.js
Expo CLI (npm install -g expo-cli)
Expo Go app on your phone (for development)

Run locally
bashgit clone https://github.com/YOUR_USERNAME/MusicPlayer.git
cd MusicPlayer
npm install
npx expo start
Scan the QR code with Expo Go.
Adding new music

Upload any MP3 file to your Cloudflare R2 bucket
Open the app — your song appears automatically

Building APK
basheas build -p android --profile preview
📁 Project Structure
MusicPlayer/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Library screen
│   │   ├── playlists.tsx    # Playlists screen
│   │   └── _layout.tsx      # Tab navigation
│   ├── player.tsx           # Player screen
│   └── _layout.tsx          # Root layout
├── context/
│   └── AudioContext.tsx     # Global audio state
├── hooks/
│   ├── useDownload.ts       # Offline download logic
│   └── usePlaylists.ts      # Playlist management
├── constants/
│   └── songs.ts             # Fetches song list from Worker
└── utils/
    └── artwork.ts           # iTunes album art fetcher
☁️ Cloudflare Setup

R2 Bucket — stores all MP3 files with public access enabled
Worker — scans the bucket and returns a JSON song list automatically

🔒 Notes

This app is for personal use only
Music is streamed from your own Cloudflare R2 bucket
No user data is collected or shared