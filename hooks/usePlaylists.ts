import { Song } from '@/constants/songs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
}

const STORAGE_KEY = 'playlists_v1';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setPlaylists(JSON.parse(raw));
    });
  }, []);

  const save = async (updated: Playlist[]) => {
    setPlaylists(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const createPlaylist = useCallback(async (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: name.trim(),
      songs: [],
      createdAt: Date.now(),
    };
    await save([...playlists, newPlaylist]);
    return newPlaylist;
  }, [playlists]);

  const deletePlaylist = useCallback(async (id: string) => {
    await save(playlists.filter((p) => p.id !== id));
  }, [playlists]);

  const addSongToPlaylist = useCallback(async (playlistId: string, song: Song) => {
    const updated = playlists.map((p) => {
      if (p.id !== playlistId) return p;
      if (p.songs.find((s) => s.id === song.id)) return p; // already in
      return { ...p, songs: [...p.songs, song] };
    });
    await save(updated);
  }, [playlists]);

  const removeSongFromPlaylist = useCallback(async (playlistId: string, songId: string) => {
    const updated = playlists.map((p) => {
      if (p.id !== playlistId) return p;
      return { ...p, songs: p.songs.filter((s) => s.id !== songId) };
    });
    await save(updated);
  }, [playlists]);

  const renamePlaylist = useCallback(async (id: string, name: string) => {
    const updated = playlists.map((p) => p.id === id ? { ...p, name: name.trim() } : p);
    await save(updated);
  }, [playlists]);

  return { playlists, createPlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist, renamePlaylist };
}