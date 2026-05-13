export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  url: string;
  artwork: string;
}

export const SONGS_API_URL = 'https://music-api.ansh-srivastava01.workers.dev';

export async function fetchSongs(): Promise<Song[]> {
  try {
    const response = await fetch(`${SONGS_API_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch songs:', error);
    return [];
  }
}