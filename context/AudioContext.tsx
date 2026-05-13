import { Song } from '@/constants/songs';
import { getBestUrl } from '@/hooks/useDownload';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type AudioContextType = {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  repeatMode: 'none' | 'all' | 'one';
  playSong: (index: number, songs: Song[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  seekTo: (ms: number) => void;
  cycleRepeat: () => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');

  const repeatModeRef = useRef(repeatMode);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  const currentIndexRef = useRef(currentIndex);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const queueRef = useRef(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  const currentSong = queue[currentIndex] ?? null;

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    });
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPosition(status.positionMillis);
    setDuration(status.durationMillis ?? 0);
    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      const mode = repeatModeRef.current;
      const idx = currentIndexRef.current;
      const q = queueRef.current;

      if (mode === 'one') {
        soundRef.current?.replayAsync();
      } else if (mode === 'all') {
        const next = (idx + 1) % q.length;
        setCurrentIndex(next);
        loadAndPlay(next, q);
      } else if (idx < q.length - 1) {
        const next = idx + 1;
        setCurrentIndex(next);
        loadAndPlay(next, q);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const loadAndPlay = useCallback(async (index: number, songs: Song[]) => {
    setIsLoading(true);
    setPosition(0);
    setDuration(0);

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    try {
      // ✅ Use local file if downloaded, otherwise stream from R2
      const uri = await getBestUrl(songs[index]);

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
    } catch (e) {
      console.error('Failed to load song:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const playSong = useCallback((index: number, songs: Song[]) => {
    setQueue(songs);
    setCurrentIndex(index);
    queueRef.current = songs;
    loadAndPlay(index, songs);
  }, [loadAndPlay]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) return;
    if (isPlaying) await soundRef.current.pauseAsync();
    else await soundRef.current.playAsync();
  }, [isPlaying]);

  const playNext = useCallback(() => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const next = (idx + 1) % q.length;
    setCurrentIndex(next);
    loadAndPlay(next, q);
  }, [loadAndPlay]);

  const playPrev = useCallback(() => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    if (position > 3000) {
      soundRef.current?.setPositionAsync(0);
      return;
    }
    const prev = (idx - 1 + q.length) % q.length;
    setCurrentIndex(prev);
    loadAndPlay(prev, q);
  }, [position, loadAndPlay]);

  const seekTo = useCallback(async (ms: number) => {
    await soundRef.current?.setPositionAsync(ms);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === 'none' ? 'all' : m === 'all' ? 'one' : 'none'));
  }, []);

  return (
    <AudioContext.Provider value={{
      currentSong,
      queue,
      currentIndex,
      isPlaying,
      isLoading,
      position,
      duration,
      repeatMode,
      playSong,
      togglePlay,
      playNext,
      playPrev,
      seekTo,
      cycleRepeat,
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}