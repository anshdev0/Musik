import { fetchSongs, Song } from '@/constants/songs';
import { useAudio } from '@/context/AudioContext';
import { Playlist, usePlaylists } from '@/hooks/usePlaylists';
import { fetchArtwork } from '@/utils/artwork';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

// ── Icons ────────────────────────────────────────────────────────────────────
const PlayIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Polygon points="6,3 20,12 6,21" fill="#ffffff" />
  </Svg>
);
const TrashIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);
const PlusIcon = ({ color = '#fff' }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </Svg>
);
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path d="M15 18l-6-6 6-6" stroke="#4da3ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);
const MusicIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24">
    <Path d="M9 18V5l12-2v13" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M6 21a3 3 0 100-6 3 3 0 000 6zM18 19a3 3 0 100-6 3 3 0 000 6z" stroke="#3b82f6" strokeWidth="2" fill="none" />
  </Svg>
);

// ── Song Picker Modal ────────────────────────────────────────────────────────
function SongPickerModal({
  visible, onClose, onAdd, existingIds,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (song: Song) => void;
  existingIds: Set<string>;
}) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchSongs().then((data) => { setSongs(data); setLoading(false); });
    }
  }, [visible]);

  const filtered = query.trim()
    ? songs.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()) || s.artist.toLowerCase().includes(query.toLowerCase()))
    : songs;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Songs</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>Done</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs..."
            placeholderTextColor="#3a6080"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        </View>
        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const already = existingIds.has(item.id);
              return (
                <TouchableOpacity
                  style={[styles.pickerItem, already && styles.pickerItemAdded]}
                  onPress={() => !already && onAdd(item)}
                  activeOpacity={already ? 1 : 0.7}
                >
                  <View style={styles.pickerArt}>
                    <Text style={styles.pickerArtText}>{item.title.charAt(0)}</Text>
                  </View>
                  <View style={styles.pickerInfo}>
                    <Text style={styles.pickerTitle} numberOfLines={1}>{item.title}</Text>
                    {item.artist ? <Text style={styles.pickerArtist} numberOfLines={1}>{item.artist}</Text> : null}
                  </View>
                  <View style={[styles.addBtn, already && styles.addBtnDone]}>
                    {already
                      ? <Text style={styles.addBtnDoneText}>✓</Text>
                      : <PlusIcon color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </Modal>
  );
}

// ── Playlist Detail ───────────────────────────────────────────────────────────
function PlaylistDetail({
  playlist, onBack, onAddSongs, onRemoveSong,
}: {
  playlist: Playlist;
  onBack: () => void;
  onAddSongs: () => void;
  onRemoveSong: (songId: string) => void;
}) {
  const { playSong } = useAudio();
  const router = useRouter();
  const [artworkMap, setArtworkMap] = useState<Record<string, string>>({});

  useEffect(() => {
    playlist.songs.forEach((s) => {
      fetchArtwork(s.title, s.artist ?? '').then((url) => {
        if (url) setArtworkMap((prev) => ({ ...prev, [s.id]: url }));
      });
    });
  }, [playlist.songs.length]);

  const handlePlay = (index: number) => {
    playSong(index, playlist.songs);
    router.push('/player');
  };

  return (
    <View style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.detailTitle} numberOfLines={1}>{playlist.name}</Text>
        <TouchableOpacity onPress={onAddSongs} style={styles.addSongsBtn}>
          <PlusIcon color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <Text style={styles.detailSubtitle}>{playlist.songs.length} songs</Text>

      {playlist.songs.length === 0 ? (
        <View style={styles.emptyDetail}>
          <MusicIcon />
          <Text style={styles.emptyDetailText}>No songs yet</Text>
          <TouchableOpacity onPress={onAddSongs} style={styles.emptyAddBtn}>
            <Text style={styles.emptyAddBtnText}>Add songs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlist.songs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.songItem} onPress={() => handlePlay(index)} activeOpacity={0.8}>
              <View style={styles.songArt}>
                {artworkMap[item.id]
                  ? <Image source={{ uri: artworkMap[item.id] }} style={styles.songArtImage} />
                  : <Text style={styles.songArtText}>{item.title.charAt(0)}</Text>}
              </View>
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                {item.artist ? <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text> : null}
              </View>
              <TouchableOpacity
                onPress={() => onRemoveSong(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.removeBtn}
              >
                <TrashIcon />
              </TouchableOpacity>
              <View style={styles.playBtn}>
                <PlayIcon />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// ── Main Playlists Screen ─────────────────────────────────────────────────────
export default function PlaylistsScreen() {
  const { playlists, createPlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist } = usePlaylists();
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { playSong } = useAudio();
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createPlaylist(newName);
    setNewName('');
    setShowCreate(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Playlist', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlaylist(id) },
    ]);
  };

  const handleAddSong = async (song: Song) => {
    if (!selectedPlaylist) return;
    await addSongToPlaylist(selectedPlaylist.id, song);
    // update local ref
    setSelectedPlaylist((prev) =>
      prev ? { ...prev, songs: prev.songs.find((s) => s.id === song.id) ? prev.songs : [...prev.songs, song] } : prev
    );
  };

  const handleRemoveSong = async (songId: string) => {
    if (!selectedPlaylist) return;
    await removeSongFromPlaylist(selectedPlaylist.id, songId);
    setSelectedPlaylist((prev) =>
      prev ? { ...prev, songs: prev.songs.filter((s) => s.id !== songId) } : prev
    );
  };

  const openPlaylist = (playlist: Playlist) => {
    const fresh = playlists.find((p) => p.id === playlist.id) ?? playlist;
    setSelectedPlaylist(fresh);
  };

  // Sync selectedPlaylist when playlists update
  useEffect(() => {
    if (selectedPlaylist) {
      const fresh = playlists.find((p) => p.id === selectedPlaylist.id);
      if (fresh) setSelectedPlaylist(fresh);
    }
  }, [playlists]);

  if (selectedPlaylist) {
    const fresh = playlists.find((p) => p.id === selectedPlaylist.id) ?? selectedPlaylist;
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
        <PlaylistDetail
          playlist={fresh}
          onBack={() => setSelectedPlaylist(null)}
          onAddSongs={() => setShowPicker(true)}
          onRemoveSong={handleRemoveSong}
        />
        <SongPickerModal
          visible={showPicker}
          onClose={() => setShowPicker(false)}
          onAdd={handleAddSong}
          existingIds={new Set(fresh.songs.map((s) => s.id))}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Playlists</Text>
          <Text style={styles.headerSubtitle}>{playlists.length} playlists</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.createBtn}>
          <PlusIcon color="#3b82f6" />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Create playlist modal */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.createOverlay}>
          <View style={styles.createDialog}>
            <Text style={styles.createDialogTitle}>New Playlist</Text>
            <TextInput
              style={styles.createInput}
              placeholder="Playlist name..."
              placeholderTextColor="#3a6080"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleCreate}
              returnKeyType="done"
            />
            <View style={styles.createDialogBtns}>
              <TouchableOpacity onPress={() => { setShowCreate(false); setNewName(''); }} style={styles.createCancelBtn}>
                <Text style={styles.createCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={styles.createConfirmBtn}>
                <Text style={styles.createConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {playlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MusicIcon />
          <Text style={styles.emptyText}>No playlists yet</Text>
          <Text style={styles.emptySubtext}>Tap "New" to create your first playlist</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.playlistCard} onPress={() => openPlaylist(item)} activeOpacity={0.8}>
              <View style={styles.playlistArt}>
                <MusicIcon />
              </View>
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.playlistCount}>{item.songs.length} songs</Text>
              </View>
              {item.songs.length > 0 && (
                <TouchableOpacity
                  style={styles.playlistPlayBtn}
                  onPress={() => { playSong(0, item.songs); router.push('/player'); }}
                >
                  <PlayIcon />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.name)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.deleteBtn}
              >
                <TrashIcon />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#ffffff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 14, color: '#3b82f6', marginTop: 4, fontWeight: '500' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0f1f3d', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#1e3a5f',
  },
  createBtnText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  playlistCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111827', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#1e293b',
  },
  playlistArt: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: '#0f1f3d', justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: '#1e3a5f',
  },
  playlistInfo: { flex: 1, marginLeft: 14 },
  playlistName: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  playlistCount: { color: '#4b5563', fontSize: 12, marginTop: 3 },
  playlistPlayBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  deleteBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: '#f1f5f9', fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: '#4b5563', fontSize: 13 },
  // Create dialog
  createOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  createDialog: { width: '100%', backgroundColor: '#111827', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1e293b' },
  createDialogTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  createInput: {
    backgroundColor: '#0a0a0f', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b',
    color: '#f1f5f9', fontSize: 15, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
  },
  createDialogBtns: { flexDirection: 'row', gap: 12 },
  createCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  createCancelText: { color: '#6b7280', fontWeight: '600' },
  createConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1d4ed8', alignItems: 'center' },
  createConfirmText: { color: '#fff', fontWeight: '700' },
  // Detail view
  detailHeader: {
    paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  detailTitle: { flex: 1, color: '#f1f5f9', fontSize: 20, fontWeight: '700', marginHorizontal: 8 },
  addSongsBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  detailSubtitle: { color: '#3b82f6', fontSize: 13, fontWeight: '500', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  emptyDetail: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyDetailText: { color: '#6b7280', fontSize: 16 },
  emptyAddBtn: { backgroundColor: '#1d4ed8', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  emptyAddBtnText: { color: '#fff', fontWeight: '700' },
  // Song item in detail
  songItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111827', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#1e293b',
  },
  songArt: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: '#0f1f3d', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#1e3a5f', overflow: 'hidden',
  },
  songArtImage: { width: 44, height: 44, borderRadius: 8 },
  songArtText: { color: '#3b82f6', fontSize: 18, fontWeight: '700' },
  songInfo: { flex: 1, marginLeft: 12 },
  songTitle: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  songArtist: { color: '#3b82f6', fontSize: 12, marginTop: 2 },
  removeBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  playBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center' },
  // Song picker modal
  modalContainer: { flex: 1, backgroundColor: '#0a0a0f' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  modalTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  modalCloseBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1d4ed8', borderRadius: 8 },
  modalCloseText: { color: '#fff', fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: {
    backgroundColor: '#111827', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b',
    color: '#f1f5f9', fontSize: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#0f172a',
  },
  pickerItemAdded: { opacity: 0.5 },
  pickerArt: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#0f1f3d', justifyContent: 'center', alignItems: 'center',
  },
  pickerArtText: { color: '#3b82f6', fontSize: 16, fontWeight: '700' },
  pickerInfo: { flex: 1, marginLeft: 12 },
  pickerTitle: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  pickerArtist: { color: '#4b5563', fontSize: 12, marginTop: 2 },
  addBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center',
  },
  addBtnDone: { backgroundColor: '#166534' },
  addBtnDoneText: { color: '#22c55e', fontWeight: '700' },
});