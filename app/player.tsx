import { useAudio } from '@/context/AudioContext';
import { fetchArtwork } from '@/utils/artwork';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// ── Icons ────────────────────────────────────────────────────────────────────
const PlayIcon = ({ size = 28, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Polygon points="6,3 20,12 6,21" fill={color} /></Svg>
);
const PauseIcon = ({ size = 28, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="5" y="3" width="4" height="18" rx="1" fill={color} />
    <Rect x="15" y="3" width="4" height="18" rx="1" fill={color} />
  </Svg>
);
const NextIcon = ({ size = 28, color = '#c8deff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Polygon points="5,3 18,12 5,21" fill={color} />
    <Rect x="19" y="3" width="2.5" height="18" rx="1" fill={color} />
  </Svg>
);
const PrevIcon = ({ size = 28, color = '#c8deff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Polygon points="19,3 6,12 19,21" fill={color} />
    <Rect x="2.5" y="3" width="2.5" height="18" rx="1" fill={color} />
  </Svg>
);
const RepeatIcon = ({ size = 22, color = '#fff', active = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" opacity={active ? 1 : 0.3}>
    <Path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);
const RepeatOneIcon = ({ size = 22, color = '#4da3ff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Circle cx="12" cy="12" r="4" fill={color} opacity={0.25} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
  </Svg>
);
const BackIcon = ({ size = 28, color = '#4da3ff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ── SeekBar ──────────────────────────────────────────────────────────────────
function SeekBar({ position, duration, onSeek }: { position: number; duration: number; onSeek: (ms: number) => void }) {
  const barRef = useRef<View>(null);
  const progress = duration > 0 ? position / duration : 0;

  const handlePress = (evt: any) => {
    barRef.current?.measure((_x, _y, w, _h, pageX) => {
      const ratio = Math.max(0, Math.min(1, (evt.nativeEvent.pageX - pageX) / w));
      onSeek(ratio * duration);
    });
  };

  return (
    <View style={styles.seekContainer}>
      <Text style={styles.timeText}>{formatTime(position)}</Text>
      <TouchableOpacity activeOpacity={1} onPress={handlePress} style={styles.seekBarWrapper}>
        <View ref={barRef} style={styles.seekTrack}>
          <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.seekThumb, { left: `${Math.min(progress * 100, 97)}%` }]} />
        </View>
      </TouchableOpacity>
      <Text style={styles.timeText}>{formatTime(duration)}</Text>
    </View>
  );
}

// ── AlbumArt ─────────────────────────────────────────────────────────────────
function AlbumArt({ title, artist }: { title: string; artist?: string }) {
  const [artwork, setArtwork] = useState('');
  const initials = title.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  useEffect(() => {
    setArtwork('');
    fetchArtwork(title, artist ?? '').then(setArtwork);
  }, [title]);

  if (artwork) {
    return <Image source={{ uri: artwork }} style={styles.albumArt} />;
  }
  return (
    <LinearGradient colors={['#1a3a5c', '#0d5e9e', '#1a3a5c']} style={styles.albumArt}>
      <Text style={styles.albumInitials}>{initials}</Text>
    </LinearGradient>
  );
}

// ── Player Screen ─────────────────────────────────────────────────────────────
export default function PlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ songIndex: string; songs: string }>();
  const audio = useAudio();

  useEffect(() => {
    if (params.songs && params.songIndex !== undefined) {
      const songs = JSON.parse(params.songs);
      const index = parseInt(params.songIndex ?? '0');
      if (!audio.currentSong || audio.currentSong.id !== songs[index]?.id) {
        audio.playSong(index, songs);
      }
    }
  }, []);

  const { currentSong, isPlaying, isLoading, position, duration, repeatMode } = audio;
  if (!currentSong) return null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#050d1a', '#0a1628', '#06121f']} style={StyleSheet.absoluteFill} />
        <View style={styles.glowCircle} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NOW PLAYING</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.artContainer}>
          <AlbumArt title={currentSong.title} artist={currentSong.artist} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.songTitle} numberOfLines={1}>{currentSong.title}</Text>
          {currentSong.artist ? <Text style={styles.artistName} numberOfLines={1}>{currentSong.artist}</Text> : null}
          {currentSong.album ? <Text style={styles.albumName} numberOfLines={1}>{currentSong.album}</Text> : null}
        </View>

        <SeekBar position={position} duration={duration} onSeek={audio.seekTo} />

        <View style={styles.controls}>
          <TouchableOpacity onPress={audio.cycleRepeat} style={styles.sideBtn}>
            {repeatMode === 'one' ? <RepeatOneIcon /> : <RepeatIcon active={repeatMode === 'all'} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={audio.playPrev} style={styles.controlBtn}><PrevIcon /></TouchableOpacity>
          <TouchableOpacity onPress={audio.togglePlay} style={styles.playBtn}>
            <LinearGradient colors={['#2a7fd4', '#0d4fa0']} style={styles.playBtnInner}>
              {isLoading
                ? <ActivityIndicator color="#fff" size="large" />
                : isPlaying ? <PauseIcon /> : <PlayIcon />}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={audio.playNext} style={styles.controlBtn}><NextIcon /></TouchableOpacity>
          <View style={styles.sideBtn} />
        </View>

        {audio.queue.length > 1 && (
          <Text style={styles.queueHint}>{audio.currentIndex + 1} / {audio.queue.length}</Text>
        )}
      </View>
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const ART_SIZE = width * 0.72;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050d1a', alignItems: 'center' },
  glowCircle: {
    position: 'absolute', top: height * 0.15,
    width: ART_SIZE * 1.4, height: ART_SIZE * 1.4,
    borderRadius: (ART_SIZE * 1.4) / 2,
    backgroundColor: '#0d4fa0', opacity: 0.12,
  },
  header: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: 54,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#4da3ff', fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  artContainer: {
    marginTop: 16,
    shadowColor: '#1a6fc4', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6, shadowRadius: 30, elevation: 20,
  },
  albumArt: { width: ART_SIZE, height: ART_SIZE, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  albumInitials: { fontSize: ART_SIZE * 0.22, fontWeight: '800', color: 'rgba(255,255,255,0.75)', letterSpacing: 4 },
  infoContainer: { width: '100%', paddingHorizontal: 32, marginTop: 28, marginBottom: 4 },
  songTitle: { color: '#f0f8ff', fontSize: 22, fontWeight: '700', letterSpacing: 0.3, marginBottom: 5 },
  artistName: { color: '#4da3ff', fontSize: 14, fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 },
  albumName: { color: '#2a4a6a', fontSize: 12, letterSpacing: 0.3 },
  seekContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, width: '100%', marginTop: 24, marginBottom: 8 },
  timeText: { color: '#3a6080', fontSize: 11, width: 36, textAlign: 'center' },
  seekBarWrapper: { flex: 1, paddingVertical: 14, marginHorizontal: 8 },
  seekTrack: { height: 3, backgroundColor: '#0e2035', borderRadius: 2, position: 'relative', justifyContent: 'center' },
  seekFill: { height: 3, backgroundColor: '#2a7fd4', borderRadius: 2, position: 'absolute', left: 0 },
  seekThumb: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4da3ff', marginLeft: -7, top: -5.5,
    shadowColor: '#4da3ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 4,
  },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, marginTop: 20 },
  sideBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  controlBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  playBtn: { shadowColor: '#1e6fc4', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.8, shadowRadius: 18, elevation: 14 },
  playBtnInner: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
  queueHint: { marginTop: 24, color: '#1e3a55', fontSize: 12, letterSpacing: 2, fontWeight: '600' },
});