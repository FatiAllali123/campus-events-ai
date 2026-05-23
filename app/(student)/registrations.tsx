import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useRefresh } from '../../hooks/useRefresh';
import { getRegistrationsByUser } from '../../database/registrations';
import { getEventById } from '../../database/events';
import { Event, Registration } from '../../types';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, getCategoryColor, getCategoryBg, getCategoryEmoji } from '../../constants/theme';

function AnimatedCard({ children, index }: { children: React.ReactNode; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, delay: index * 55, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

export default function RegistrationsScreen() {
  const { user } = useAuth();
  const { refreshKey } = useRefresh();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (user) loadRegistrations();
  }, [user, refreshKey]);

  function loadRegistrations() {
    const regs = getRegistrationsByUser(user!.email);
    const evts = regs.map((r: Registration) => getEventById(r.eventId)).filter((e): e is Event => e !== null);
    setEvents(evts);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  const upcoming = events.filter(e => e.startDateTime >= new Date().toISOString());
  const past = events.filter(e => e.startDateTime < new Date().toISOString());

  function renderCard(item: Event, index: number) {
    const color = getCategoryColor(item.category);
    const bg = getCategoryBg(item.category);
    const emoji = getCategoryEmoji(item.category);
    const isUpcoming = item.startDateTime >= new Date().toISOString();

    return (
      <AnimatedCard key={item.id} index={index}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push({ pathname: '/(student)/events', params: { openEventId: item.id } })}
          activeOpacity={0.85}
        >
          <View style={[styles.cardBar, { backgroundColor: color }]} />
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <View style={[styles.catPill, { backgroundColor: bg }]}>
                <Text style={styles.catEmoji}>{emoji}</Text>
                <Text style={[styles.catText, { color }]}>{item.category}</Text>
              </View>
              <View style={[styles.statusBadge, isUpcoming ? styles.statusUpcoming : styles.statusPast]}>
                <Ionicons
                  name={isUpcoming ? 'checkmark-circle' : 'time-outline'}
                  size={11}
                  color={isUpcoming ? Colors.success : Colors.textMuted}
                />
                <Text style={[styles.statusText, !isUpcoming && { color: Colors.textMuted }]}>
                  {isUpcoming ? 'Confirmé' : 'Terminé'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{formatDate(item.startDateTime)}</Text>
              <View style={styles.metaDot} />
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>{item.locationName}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes inscriptions</Text>
          <Text style={styles.sub}>{events.length} inscription{events.length > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.ticketBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
        </View>
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          events.length > 0 ? (
            <>
              {upcoming.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>À venir · {upcoming.length}</Text>
                  {upcoming.map((item, i) => renderCard(item, i))}
                </>
              )}
              {past.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Passés · {past.length}</Text>
                  {past.map((item, i) => renderCard(item, i + upcoming.length))}
                </>
              )}
            </>
          ) : null
        }
        ListEmptyComponent={
          events.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-circle-outline" size={32} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Aucune inscription</Text>
              <Text style={styles.emptySub}>Inscrivez-vous à des événements depuis le catalogue</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.6 },
  sub: { fontSize: 13, color: Colors.textMuted, fontWeight: '500', marginTop: 3 },
  ticketBadge: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: Colors.workshopBg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(5,150,105,0.15)',
  },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 24 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBar: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  catEmoji: { fontSize: 12 },
  catText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusUpcoming: { backgroundColor: Colors.workshopBg },
  statusPast: { backgroundColor: Colors.surfaceAlt },
  statusText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, lineHeight: 22, marginBottom: 10, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500', flex: 1 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  empty: { alignItems: 'center', paddingTop: 70, gap: 10 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, marginBottom: 6,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textSecondary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});