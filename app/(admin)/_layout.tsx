import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navy },
        headerTintColor: Colors.textLight,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen
        name="events/index"
        options={{ title: 'Gestion des événements' }}
      />
      <Stack.Screen
        name="events/create"
        options={{ title: 'Nouvel événement' }}
      />
      <Stack.Screen
        name="events/[id]/edit"
        options={{ title: 'Modifier l\'événement' }}
      />
    </Stack>
  );
}