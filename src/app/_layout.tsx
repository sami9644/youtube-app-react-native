import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* This makes your index.tsx screen the main, full-screen view without tabs */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}