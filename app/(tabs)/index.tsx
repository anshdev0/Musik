import { fetchSongs, Song } from '@/constants/songs';
import { useAudio } from '@/context/AudioContext';
import { useDownload } from '@/hooks/useDownload';
import { fetchArtwork } from '@/utils/artwork';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const SearchIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Circle cx="11" cy="11" r="7" stroke="#3a6080" strokeWidth="2" fill="none" />
    <Path d="M16.5 16.5l4 4" stroke="#3a6080" strokeWidth="2" strokeLinecap="round" fill="none" />
  </Svg>
);
const ClearIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path d="M18 6L6 18M6 6l12 12" stroke="#3a6080" strokeWidth="2" strokeLinecap="round" fill="none" />
  </Svg>
);
const PlayIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M6 3l15 9-15 9V3z" fill="#ffffff" />
  </Svg>
);
const PauseIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="#ffffff" />
  </Svg>
);
const NextIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M5 3l14 9-14 9V3z" fill="#c8deff" />
    <Path d="M19 3h2v18h-2z" fill="#c8deff" />
  </Svg>
);
const DownloadIcon = ({ color = '#3a6080' }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M12 3v12M8 11l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M4 19h16" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
  </Svg>
);
const CheckIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M5 12l5 5L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

// ── Mini Player ──────────────────────────────────────────────────────────────
function MiniPlayer() {
  const { currentSong, isPlaying, isLoading, position, duration, togglePlay, playNext } = useAudio();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(80)).current;
  const [artwork, setArtwork] = useState('');

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: currentSong ? 0 : 80,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
    if (currentSong) {
      fetchArtwork(currentSong.title, currentSong.artist ?? '').then(setArtwork);
    }
  }, [currentSong?.id]);

  if (!currentSong) return null;
  const progress = duration > 0 ? position / duration : 0;

  return (
    <Animated.View style={[styles.miniPlayer, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.miniProgressTrack}>
        <View style={[styles.miniProgressFill, { width: `${progress * 100}%` }]} />
      </View>
      <TouchableOpacity style={styles.miniPlayerInner} onPress={() => router.push('/player')} activeOpacity={0.9}>
        <View style={styles.miniArt}>
          {artwork
            ? <Image source={{ uri: artwork }} style={styles.miniArtImage} />
            : <Text style={styles.miniArtText}>{currentSong.title.charAt(0).toUpperCase()}</Text>}
        </View>
        <View style={styles.miniInfo}>
          <Text style={styles.miniTitle} numberOfLines={1}>{currentSong.title}</Text>
          {currentSong.artist ? <Text style={styles.miniArtist} numberOfLines={1}>{currentSong.artist}</Text> : null}
        </View>
        <View style={styles.miniControls}>
          <TouchableOpacity onPress={togglePlay} style={styles.miniBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {isLoading ? <ActivityIndicator color="#fff" size="small" /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
          </TouchableOpacity>
          <TouchableOpacity onPress={playNext} style={styles.miniBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <NextIcon />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Song Item ────────────────────────────────────────────────────────────────
const SongItem = ({
  song, onPress, isDownloaded, isDownloading, downloadProgress, onDownload,
}: {
  song: Song; onPress: () => void; isDownloaded: boolean;
  isDownloading: boolean; downloadProgress: number; onDownload: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { currentSong, isPlaying } = useAudio();
  const isActive = currentSong?.id === song.id;
  const [artwork, setArtwork] = useState('');

  useEffect(() => {
    fetchArtwork(song.title, song.artist ?? '').then(setArtwork);
  }, [song.id]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.songItem, isActive && styles.songItemActive]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        activeOpacity={1}
      >
        <View style={[styles.albumArtPlaceholder, isActive && styles.albumArtActive]}>
          {artwork
            ? <Image source={{ uri: artwork }} style={styles.albumArtImage} />
            : <Text style={[styles.albumArtText, isActive && styles.albumArtTextActive]}>{song.title.charAt(0).toUpperCase()}</Text>}
        </View>

        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, isActive && styles.songTitleActive]} numberOfLines={1}>{song.title}</Text>
          {song.artist ? <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text> : null}
          {song.album ? <Text style={styles.songAlbum} numberOfLines={1}>{song.album}</Text> : null}
        </View>

        <TouchableOpacity onPress={onDownload} style={styles.downloadBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isDownloaded || isDownloading}>
          {isDownloading
            ? <View style={styles.downloadProgress}><ActivityIndicator size="small" color="#3b82f6" /><Text style={styles.downloadPct}>{Math.round(downloadProgress * 100)}%</Text></View>
            : isDownloaded ? <CheckIcon /> : <DownloadIcon color="#3a6080" />}
        </TouchableOpacity>

        {isActive && isPlaying
          ? <View style={styles.playingIndicator}>{[1, 2, 3].map((i) => <View key={i} style={[styles.playingBar, { height: 8 + i * 5 }]} />)}</View>
          : <View style={styles.playIcon}><PlayIcon /></View>}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filtered, setFiltered] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const { playSong, currentSong } = useAudio();
  const { downloadedIds, downloadingIds, progressMap, downloadSong } = useDownload();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchSongs().then((data) => {
      setSongs(data);
      setFiltered(data);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  }, []);

  useEffect(() => {
    if (!query.trim()) { setFiltered(songs); return; }
    const q = query.toLowerCase();
    setFiltered(songs.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.album ?? '').toLowerCase().includes(q)
    ));
  }, [query, songs]);

  const handleSongPress = (song: Song) => {
    playSong(songs.findIndex((s) => s.id === song.id), songs);
    router.push('/player');
  };

  const downloadAll = () => songs.forEach((s) => {
    if (!downloadedIds.has(s.id) && !downloadingIds.has(s.id)) downloadSong(s);
  });

  const downloadedCount = songs.filter((s) => downloadedIds.has(s.id)).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Music</Text>
          <Text style={styles.headerSubtitle}>{loading ? '...' : `${songs.length} songs · ${downloadedCount} offline`}</Text>
        </View>
        {!loading && downloadedCount < songs.length && (
          <TouchableOpacity onPress={downloadAll} style={styles.downloadAllBtn}>
            <DownloadIcon color="#3b82f6" />
            <Text style={styles.downloadAllText}>All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchIcon}><SearchIcon /></View>
        <TextInput style={styles.searchInput} placeholder="Search songs, artists..."
          placeholderTextColor="#3a6080" value={query} onChangeText={setQuery}
          returnKeyType="search" autoCorrect={false} />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ClearIcon />
          </TouchableOpacity>
        )}
      </View>

      {!loading && filtered.length === 0 && query.length > 0 && (
        <View style={styles.emptyContainer}><Text style={styles.emptyText}>No songs match "{query}"</Text></View>
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your music...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SongItem song={item} onPress={() => handleSongPress(item)}
                isDownloaded={downloadedIds.has(item.id)}
                isDownloading={downloadingIds.has(item.id)}
                downloadProgress={progressMap[item.id] ?? 0}
                onDownload={() => downloadSong(item)} />
            )}
            contentContainerStyle={[styles.listContent, currentSong && { paddingBottom: 90 }]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyboardShouldPersistTaps="handled"
          />
        </Animated.View>
      )}
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#ffffff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 14, color: '#3b82f6', marginTop: 4, fontWeight: '500' },
  downloadAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#0f1f3d', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#1e3a5f',
  },
  downloadAllText: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14, marginBottom: 8,
    backgroundColor: '#111827', borderRadius: 12,
    borderWidth: 1, borderColor: '#1e293b',
    paddingHorizontal: 14, height: 46,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 14, paddingVertical: 0 },
  clearBtn: { marginLeft: 8, padding: 2 },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#3a6080', fontSize: 15 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#6b7280', fontSize: 15 },
  listContent: { paddingVertical: 12, paddingHorizontal: 16, paddingBottom: 32 },
  songItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111827', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#1e293b',
  },
  songItemActive: { borderColor: '#3b82f6', backgroundColor: '#0f1f3d' },
  albumArtPlaceholder: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: '#1d3461', justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: '#3b82f6', overflow: 'hidden',
  },
  albumArtActive: { backgroundColor: '#1d4ed8', borderColor: '#60a5fa' },
  albumArtImage: { width: 52, height: 52, borderRadius: 10 },
  albumArtText: { color: '#3b82f6', fontSize: 22, fontWeight: '700' },
  albumArtTextActive: { color: '#ffffff' },
  songInfo: { flex: 1, marginLeft: 14, gap: 3 },
  songTitle: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  songTitleActive: { color: '#60a5fa' },
  songArtist: { color: '#3b82f6', fontSize: 13, fontWeight: '500' },
  songAlbum: { color: '#4b5563', fontSize: 12 },
  separator: { height: 10 },
  downloadBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  downloadProgress: { alignItems: 'center', gap: 2 },
  downloadPct: { color: '#3b82f6', fontSize: 9, fontWeight: '600' },
  playIcon: {
    marginLeft: 4, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center',
  },
  playingIndicator: {
    flexDirection: 'row', alignItems: 'flex-end',
    marginLeft: 4, width: 32, height: 32, justifyContent: 'center', gap: 3,
  },
  playingBar: { width: 3, backgroundColor: '#3b82f6', borderRadius: 2 },
  miniPlayer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0d1b2e', borderTopWidth: 1, borderTopColor: '#1e3a5f',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 20,
  },
  miniProgressTrack: { height: 2, backgroundColor: '#1a2e47' },
  miniProgressFill: { height: 2, backgroundColor: '#3b82f6' },
  miniPlayerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  miniArt: {
    width: 42, height: 42, borderRadius: 8,
    backgroundColor: '#1d3461', justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: '#3b82f6', overflow: 'hidden',
  },
  miniArtImage: { width: 42, height: 42, borderRadius: 8 },
  miniArtText: { color: '#3b82f6', fontSize: 18, fontWeight: '700' },
  miniInfo: { flex: 1, marginLeft: 12 },
  miniTitle: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  miniArtist: { color: '#3b82f6', fontSize: 12, marginTop: 2 },
  miniControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center',
  },
});