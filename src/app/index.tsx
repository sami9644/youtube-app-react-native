import { useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

// ⚠️ Replace with your actual YouTube Data API v3 Key
const YOUTUBE_API_KEY = 'AIzaSyDkno8X5J4WaCg9e9wSj9MMpCfDWMyWnsI';

// function getDevMenuHint() {
//   if (Platform.OS === 'web') {
//     return <ThemedText type="small">use browser devtools</ThemedText>;
//   }
//   if (Device.isDevice) {
//     return (
//       <ThemedText type="small">
//         shake device or press <ThemedText type="code">m</ThemedText> in terminal
//       </ThemedText>
//     );
//   }
//   const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
//   return (
//     <ThemedText type="small">
//       press <ThemedText type="code">{shortcut}</ThemedText>
//     </ThemedText>
//   );
// }

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
  };
}

export default function HomeScreen() {
  const [channelInput, setChannelInput] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchChannelVideos = async () => {
    if (!channelInput.trim()) return;
    setLoading(true);
    setError('');
    setVideos([]);

    try {
      let channelId = channelInput.trim();

      // If the user inputs a handle (starts with @) or a username, we first look up the channel ID
      if (channelId.startsWith('@') || !channelId.startsWith('UC')) {
        const cleanInput = channelId.replace('@', '');
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${cleanInput}&key=${YOUTUBE_API_KEY}`;
        
        const channelRes = await fetch(channelUrl);
        const channelData = await channelRes.json();

        if (channelData.items && channelData.items.length > 0) {
          channelId = channelData.items[0].id;
        } else {
          // Fallback check for older usernames if handle search yields nothing
          const fallbackUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${cleanInput}&key=${YOUTUBE_API_KEY}`;
          const fallbackRes = await fetch(fallbackUrl);
          const fallbackData = await fallbackRes.json();
          
          if (fallbackData.items && fallbackData.items.length > 0) {
            channelId = fallbackData.items[0].id;
          } else {
            throw new Error('Channel not found');
          }
        }
      }

      // Fetch the public videos using the search endpoint filtered by channel ID
      const videosUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10&type=video`;
      const videosRes = await fetch(videosUrl);
      const videosData = await videosRes.json();

      if (videosData.items) {
        setVideos(videosData.items);
      } else {
        throw new Error('No videos found or API limit reached');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const openVideo = (videoId: string) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id.videoId}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>

              {/* API Input Form */}
              <ThemedView type="backgroundElement" style={styles.formContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter YouTube Channel ID or @handle"
                  placeholderTextColor="#000"
                  value={channelInput}
                  onChangeText={setChannelInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.button} onPress={fetchChannelVideos} disabled={loading}>
                  <ThemedText style={styles.buttonText}>{loading ? 'Searching...' : 'Get Videos'}</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {loading && <ActivityIndicator size="large" color="#fff" style={{ marginVertical: Spacing.four }} />}
              {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

              {/* Original Dev Environment Hint UI */}
              {videos.length === 0 && !loading && (
                <ThemedView type="backgroundElement" style={styles.stepContainer}>
                </ThemedView>
              )}
            </>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.videoItem} onPress={() => openVideo(item.id.videoId)}>
              <ThemedText style={styles.videoTitle}>{item.snippet.title}</ThemedText>
              <ThemedText type="small" numberOfLines={2}>{item.snippet.description}</ThemedText>
            </TouchableOpacity>
          )}
          ListFooterComponent={() => (Platform.OS === 'web' ? <WebBadge /> : null)}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    marginTop: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
    textAlign: 'center',
    marginVertical: Spacing.two,
  },
  formContainer: {
    gap: Spacing.two,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    marginVertical: Spacing.two,
    width: '100%',
  },
  input: {
    color: '#000000',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    fontSize: 16,
    alignSelf: 'stretch'
  },
  button: {
    backgroundColor: '#FF0000', // YouTube Red
    padding: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    width: '100%',
  },
  videoItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    alignSelf: 'stretch',
    width: '100%',
    marginVertical: 2,
  },
  videoTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginVertical: Spacing.two,
  },
});