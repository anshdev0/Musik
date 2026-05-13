const artworkCache: Record<string, string> = {};

export async function fetchArtwork(title: string, artist: string): Promise<string> {
  const key = `${title}-${artist}`;
  if (artworkCache[key]) return artworkCache[key];

  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const response = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&limit=1`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const url = data.results[0].artworkUrl100.replace('100x100', '500x500');
      artworkCache[key] = url;
      return url;
    }
  } catch (e) {
    console.log('Artwork fetch failed:', e);
  }

  return '';
}