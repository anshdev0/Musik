import { Tabs } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';

const LibraryIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path d="M9 18V5l12-2v13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth="2" fill="none" />
    <Circle cx="18" cy="16" r="3" stroke={color} strokeWidth="2" fill="none" />
  </Svg>
);

const PlaylistIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path d="M3 6h18M3 12h12M3 18h8" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    <Path d="M16 14l5 3-5 3V14z" fill={color} />
  </Svg>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d1b2e',
          borderTopColor: '#1e3a5f',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#3a6080',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => <LibraryIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: 'Playlists',
          tabBarIcon: ({ color }) => <PlaylistIcon color={color} />,
        }}
      />
    </Tabs>
  );
}