import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert, Animated,
} from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllEvents, deleteEvent } from '../../../database/events';
import { Event } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import { useRefresh } from '../../../hooks/useRefresh';
import { Colors, Spacing, Radius, getCategoryColor, getCategoryBg, getCategoryEmoji } from '../../../constants/theme';

function AnimatedCard({ children, index }: { children: React.ReactNode; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 350,
      delay: Math.min(index * 55, 280),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }}>
      {children}
    </Animated.View>
  );
}

export default function AdminEventsScreen() {
  const { user, logout } = useAuth();
  const { refreshKey } = useRefresh();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(useCallback(() => { loadEvents(); }, [refreshKey]));
  useEffect(() => { loadEvents(); }, []);

  function loadEvents() { setEvents(getAllEvents()); }

  function handleDelete(eventId: string) {
    Alert.alert(
      'Supprimer l\'événement',
      'Cette action est irréversible. Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => { deleteEvent(eventId); loadEvents(); },
        },
      ]
    );
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const upcoming = events.filter(e => e.startDateTime >= new Date().toISOString()).length;

  return (
    <View style={styles.container}>
      {/* ── Banner admin ──────────────────────────────────── */}
      <Animated.View style={[
        styles.banner,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
        }
      ]}>
        <View style={styles.bannerLeft}>
          <View style={styles.adminAvatar}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.accent} />
          </View>
          <View>
            <Text style={styles.bannerGreeting}>Espace Admin</Text>
            <Text style={styles.bannerName}>{user?.name || 'Administrateur'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={16} color="#FCA5A5" />
          <Text style={styles.logoutText}>Quitter</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Stats ─────────────────────────────────────────── */}
      <Animated.View style={[styles.statsRow, { opacity: headerAnim }]}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{events.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statCardAccent]}>
          <Text style={[styles.statNum, { color: Colors.accent }]}>{upcoming}</Text>
          <Text style={styles.statLabel}>À venir</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{events.length - upcoming}</Text>
          <Text style={styles.statLabel}>Passés</Text>
        </View>
      </Animated.View>

      {/* ── Bouton créer ──────────────────────────────────── */}
      <Animated.View style={[{ opacity: headerAnim }, styles.createWrap]}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(admin)/events/create')}
          activeOpacity={0.85}
        >
          <View style={styles.createBtnIcon}>
            <Ionicons name="add" size={20} color={Colors.navy} />
          </View>
          <Text style={styles.createBtnText}>Créer un événement</Text>
          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Liste ─────────────────────────────────────────── */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Tous les événements</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{events.length}</Text>
        </View>
      </View>

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const color = getCategoryColor(item.category);
          const bg = getCategoryBg(item.category);
          const emoji = getCategoryEmoji(item.category);
          const isUpcoming = item.startDateTime >= new Date().toISOString();

          return (
            <AnimatedCard index={index}>
              <View style={styles.card}>
                <View style={[styles.cardBar, { backgroundColor: color }]} />
                <View style={styles.cardBody}>
                  {/* Top */}
                  <View style={styles.cardTop}>
                    <View style={[styles.catPill, { backgroundColor: bg }]}>
                      <Text style={styles.catEmoji}>{emoji}</Text>
                      <Text style={[styles.catLabel, { color }]}>{item.category}</Text>
                    </View>
                    <View style={[
                      styles.statusPill,
                      isUpcoming ? styles.statusUpcoming : styles.statusPast
                    ]}>
                      <View style={[styles.statusDot, { backgroundColor: isUpcoming ? Colors.success : Colors.textMuted }]} />
                      <Text style={[styles.statusText, !isUpcoming && { color: Colors.textMuted }]}>
                        {isUpcoming ? 'À venir' : 'Passé'}
                      </Text>
                    </View>
                  </View>

                  {/* Titre */}
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

                  {/* Méta */}
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{formatDate(item.startDateTime)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText} numberOfLines={1}>{item.locationName}</Text>
                  </View>

                  {/* Capacité */}
                  {item.capacity ? (
                    <View style={styles.capRow}>
                      <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.metaText}>
                        {item.registeredCount}/{item.capacity} inscrits
                      </Text>
                      <View style={styles.capTrack}>
                        <View style={[
                          styles.capFill,
                          {
                            width: `${Math.min(100, (item.registeredCount / item.capacity) * 100)}%`,
                            backgroundColor: item.registeredCount >= item.capacity ? Colors.danger : color,
                          }
                        ]} />
                      </View>
                    </View>
                  ) : null}

                  {/* Actions */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => router.push(`/(admin)/events/${item.id}/edit`)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={15} color={Colors.navy} />
                      <Text style={styles.editBtnText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                      <Text style={styles.deleteBtnText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </AnimatedCard>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={30} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Aucun événement</Text>
            <Text style={styles.emptySub}>Créez votre premier événement ci-dessus</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // ── Banner ──
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminAvatar: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accentBorder,
  },
  bannerGreeting: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  bannerName: { fontSize: 15, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(252,165,165,0.1)',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1, borderColor: 'rgba(252,165,165,0.15)',
  },
  logoutText: { color: '#FCA5A5', fontSize: 12, fontWeight: '700' },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: 10,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statCardAccent: { borderColor: Colors.accentBorder, backgroundColor: Colors.accentLighter },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },

  // ── Créer ──
  createWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.navy,
    paddingVertical: 15, paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  createBtnIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  createBtnText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── Liste ──
  listHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.md,
  },
  listTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  countBadge: {
    backgroundColor: Colors.navyMuted, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  countText: { fontSize: 12, fontWeight: '700', color: Colors.navy },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 32 },

  // ── Carte ──
  card: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardBar: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.lg, gap: 6 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  catEmoji: { fontSize: 11 },
  catLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },

  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: Radius.full },
  statusUpcoming: { backgroundColor: Colors.workshopBg },
  statusPast: { backgroundColor: Colors.surfaceAlt },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', color: Colors.success },

  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 21, letterSpacing: -0.2 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500', flex: 1 },

  capRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  capTrack: { flex: 1, height: 4, backgroundColor: Colors.surfaceAlt, borderRadius: 2, overflow: 'hidden' },
  capFill: { height: '100%', borderRadius: 2 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: Colors.navyMuted, paddingVertical: 9, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.navyBorder,
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: Colors.navy },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: Colors.examBg, paddingVertical: 9, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.12)',
  },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: Colors.danger },

  // ── Vide ──
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, marginBottom: 6,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textSecondary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});