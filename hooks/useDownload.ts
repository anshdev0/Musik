import { Song } from '@/constants/songs';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useState } from 'react';

const BASE_DIR = FileSystem.documentDirectory ?? '';
const DOWNLOAD_DIR = `${BASE_DIR}songs/`;

// Ensure the songs directory exists
async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

// Get local path for a song
export function getLocalPath(song: Song): string {
  return `${DOWNLOAD_DIR}${song.id}.mp3`;
}

// Get the best URL to play a song (local if downloaded, else remote)
export async function getBestUrl(song: Song): Promise<string> {
  try {
    const localPath = getLocalPath(song);
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;
  } catch (_) {}
  return song.url;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useDownload() {
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  // On mount, scan which songs are already downloaded
  useEffect(() => {
    (async () => {
      try {
        await ensureDir();
        const files = await FileSystem.readDirectoryAsync(DOWNLOAD_DIR);
        const ids = new Set(files.map((f) => f.replace('.mp3', '')));
        setDownloadedIds(ids);
      } catch (_) {
        setDownloadedIds(new Set());
      }
    })();
  }, []);

  const downloadSong = useCallback(async (song: Song) => {
    if (downloadingIds.has(song.id) || downloadedIds.has(song.id)) return;

    await ensureDir();
    const localPath = getLocalPath(song);

    setDownloadingIds((prev) => new Set(prev).add(song.id));
    setProgressMap((prev) => ({ ...prev, [song.id]: 0 }));

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        song.url,
        localPath,
        {},
        (progress) => {
          const pct =
            progress.totalBytesExpectedToWrite > 0
              ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
              : 0;
          setProgressMap((prev) => ({ ...prev, [song.id]: pct }));
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result?.uri) {
        setDownloadedIds((prev) => new Set(prev).add(song.id));
      } else {
        // Download failed, clean up
        await FileSystem.deleteAsync(localPath, { idempotent: true });
      }
    } catch (e) {
      console.error('Download failed for', song.title, e);
      await FileSystem.deleteAsync(localPath, { idempotent: true });
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(song.id);
        return next;
      });
      setProgressMap((prev) => {
        const next = { ...prev };
        delete next[song.id];
        return next;
      });
    }
  }, [downloadingIds, downloadedIds]);

  const deleteSong = useCallback(async (song: Song) => {
    try {
      const localPath = getLocalPath(song);
      await FileSystem.deleteAsync(localPath, { idempotent: true });
      setDownloadedIds((prev) => {
        const next = new Set(prev);
        next.delete(song.id);
        return next;
      });
    } catch (e) {
      console.error('Delete failed:', e);
    }
  }, []);

  return {
    downloadedIds,
    downloadingIds,
    progressMap,
    downloadSong,
    deleteSong,
  };
}