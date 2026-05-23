import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import {
  getAllEvents,
  searchEvents,
  getUpcomingEvents,
  getPastEvents,
} from '../../../database/events';
import { addFavorite, removeFavorite, isFavorite } from '../../../database/favorites';
import {
  createRegistration,
  getRegistrationByEventAndUser,
  cancelRegistration,
} from '../../../database/registrations';
import { Event, Category } from '../../../types';
import { generateUUID } from '../../../utils/uuid';
import { Ionicons } from '@expo/vector-icons';
import { useRefresh } from '../../../hooks/useRefresh';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Colors,
  Spacing,
  Radius,
  getCategoryColor,
  getCategoryBg,
  getCategoryGradient,
  getCategoryEmoji,
} from '../../../constants/theme';

const CATEGORIES: Category[] = ['Talk', 'Workshop', 'Club', 'Exam', 'Other'];
type CategoryOrAll = Category | 'all';

// ─── Carte animée ───────────────────────────────────────────────────────────
function AnimatedCard({ children, index }: { children: React.ReactNode; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: Math.min(index * 60, 300),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function StudentEventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryOrAll>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [registered, setRegistered] = useState(false);

  const { triggerRefresh } = useRefresh();
  const params = useLocalSearchParams();
  const openEventId = typeof params.openEventId === 'string' ? params.openEventId : undefined;
  const router = useRouter();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(searchAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => { loadEvents(); }, [selectedCategory, periodFilter]);

  useEffect(() => {
    if (!openEventId) return;
    const allEvts = getAllEvents();
    const ev = allEvts.find(e => e.id === openEventId);
    if (ev) openEventDetail(ev);
    router.setParams({ openEventId: '' });
  }, [openEventId]);

  function loadEvents() {
    try {
      setLoading(true); setError('');
      let result: Event[] = [];
      if (periodFilter === 'upcoming') result = getUpcomingEvents();
      else if (periodFilter === 'past') result = getPastEvents();
      else result = getAllEvents();
      if (selectedCategory !== 'all') result = result.filter(e => e.category === selectedCategory);
      setEvents(result);
    } catch { setError('Erreur lors du chargement.'); }
    finally { setLoading(false); }
  }

  function openEventDetail(event: Event) {
    setSelectedEvent(event);
    if (user) {
      setFavorited(isFavorite(event.id, user.email));
      setRegistered(!!getRegistrationByEventAndUser(event.id, user.email));
    }
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setTimeout(() => setSelectedEvent(null), 300);
  }

  function handleFavorite() {
    if (!user || !selectedEvent) return;
    if (favorited) { removeFavorite(selectedEvent.id, user.email); setFavorited(false); }
    else { addFavorite({ eventId: selectedEvent.id, userId: user.email, createdAt: new Date().toISOString() }); setFavorited(true); }
    triggerRefresh();
  }

  function handleRegister() {
    if (!user || !selectedEvent) return;
    const now = new Date().toISOString();
    if (selectedEvent.startDateTime < now) { Alert.alert('Erreur', 'Cet événement est déjà passé'); return; }
    if (selectedEvent.capacity && selectedEvent.registeredCount >= selectedEvent.capacity && !registered) { Alert.alert('Erreur', 'Complet'); return; }
    if (registered) {
      cancelRegistration(selectedEvent.id, user.email);
      setRegistered(false);
      Alert.alert('Succès', 'Inscription annulée');
    } else {
      createRegistration({ id: generateUUID(), eventId: selectedEvent.id, userId: user.email, createdAt: now, status: 'confirmed' });
      setRegistered(true);
      Alert.alert('Succès', 'Inscription confirmée !');
    }
    triggerRefresh(); loadEvents();
  }

  function handleSearch(text: string) {
    setSearchQuery(text);
    if (text.trim()) {
      try { setLoading(true); setError(''); setEvents(searchEvents(text)); }
      catch { setError('Erreur de recherche'); }
      finally { setLoading(false); }
    } else { loadEvents(); }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  function formatDateLong(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ─── Carte événement premium ─────────────────────────────────────────────
  function renderCard({ item, index }: { item: Event; index: number }) {
    const color = getCategoryColor(item.category);
    const bg = getCategoryBg(item.category);
    const gradBg = getCategoryGradient(item.category);
    const emoji = getCategoryEmoji(item.category);
    const spots = item.capacity ? item.capacity - item.registeredCount : null;
    const isFull = spots !== null && spots <= 0;
    const pct = item.capacity ? Math.min(100, (item.registeredCount / item.capacity) * 100) : 0;
    const isUpcoming = item.startDateTime >= new Date().toISOString();

    return (
      <AnimatedCard index={index}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => openEventDetail(item)}
          activeOpacity={0.88}
        >
          {/* Barre de couleur gauche */}
          <View style={[styles.cardAccentBar, { backgroundColor: color }]} />

          {/* Contenu */}
          <View style={styles.cardInner}>
            {/* Header de la carte */}
            <View style={styles.cardHead}>
              <View style={[styles.catPill, { backgroundColor: bg }]}>
                <Text style={styles.catEmoji}>{emoji}</Text>
                <Text style={[styles.catLabel, { color }]}>{item.category}</Text>
              </View>
              <View style={styles.cardHeadRight}>
                {!isUpcoming && (
                  <View style={styles.pastPill}>
                    <Text style={styles.pastPillText}>Passé</Text>
                  </View>
                )}
                {isFull && (
                  <View style={styles.fullPill}>
                    <Ionicons name="close-circle" size={10} color="#fff" />
                    <Text style={styles.fullPillText}>Complet</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Titre */}
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

            {/* Méta */}
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>{formatDate(item.startDateTime)}</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>{item.locationName}</Text>
              </View>
            </View>

            {/* Organisateur + capacité */}
            <View style={styles.cardFooter}>
              <View style={styles.organizerWrap}>
                <View style={[styles.orgAvatar, { backgroundColor: gradBg }]}>
                  <Text style={[styles.orgAvatarText, { color }]}>
                    {item.organizerName?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.orgName} numberOfLines={1}>{item.organizerName}</Text>
              </View>

              {item.capacity ? (
                <View style={styles.capacityWrap}>
                  <View style={styles.capacityTrackSmall}>
                    <View style={[
                      styles.capacityFillSmall,
                      { width: `${pct}%`, backgroundColor: isFull ? Colors.danger : color }
                    ]} />
                  </View>
                  <Text style={[styles.capacityCount, isFull && { color: Colors.danger }]}>
                    {item.registeredCount}/{item.capacity}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  }

  // ─── Chip catégorie ───────────────────────────────────────────────────────
  function CatChip({ cat }: { cat: CategoryOrAll }) {
    const active = selectedCategory === cat;
    const isAll = cat === 'all';
    const color = isAll ? Colors.navy : getCategoryColor(cat as Category);
    const bg = isAll ? Colors.navyMuted : getCategoryBg(cat as Category);
    const emoji = isAll ? '🗂️' : getCategoryEmoji(cat as Category);
    return (
      <TouchableOpacity
        style={[styles.chip, { backgroundColor: active ? color : bg }]}
        onPress={() => setSelectedCategory(cat)}
        activeOpacity={0.75}
      >
        <Text style={styles.chipEmoji}>{emoji}</Text>
        <Text style={[styles.chipText, { color: active ? '#fff' : color }]}>
          {isAll ? 'Tous' : cat}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <Animated.View style={[
        styles.pageHeader,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
        }
      ]}>
        <View>
          <Text style={styles.pageTitle}>Catalogue</Text>
          <Text style={styles.pageSub}>
            {events.length} événement{events.length > 1 ? 's' : ''} disponible{events.length > 1 ? 's' : ''}
          </Text>
        </View>
        {/* Indicateur période active */}
        <View style={[
          styles.periodIndicator,
          periodFilter === 'upcoming' && { backgroundColor: Colors.accentLight, borderColor: Colors.accentBorder },
          periodFilter === 'past' && { backgroundColor: Colors.surfaceAlt },
        ]}>
          <Ionicons
            name={periodFilter === 'upcoming' ? 'trending-up' : periodFilter === 'past' ? 'archive' : 'apps'}
            size={14}
            color={periodFilter === 'upcoming' ? Colors.accent : Colors.textMuted}
          />
          <Text style={[styles.periodIndicatorText, periodFilter === 'upcoming' && { color: Colors.accent }]}>
            {periodFilter === 'all' ? 'Tous' : periodFilter === 'upcoming' ? 'À venir' : 'Passés'}
          </Text>
        </View>
      </Animated.View>

      {/* ── Recherche ─────────────────────────────────────────────── */}
      <Animated.View style={[
        styles.searchWrap,
        {
          opacity: searchAnim,
          transform: [{ translateY: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }
      ]}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un événement..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={styles.clearBtn}>
                <Ionicons name="close" size={12} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* ── Catégories ────────────────────────────────────────────── */}
      <View style={styles.catSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
          bounces={false}
        >
          {(['all', ...CATEGORIES] as const).map(cat => (
            <CatChip key={cat} cat={cat} />
          ))}
        </ScrollView>
      </View>

      {/* ── Filtres période ───────────────────────────────────────── */}
      <View style={styles.periodRow}>
        {([
          { key: 'all', label: 'Tous', icon: 'apps-outline' },
          { key: 'upcoming', label: 'À venir', icon: 'arrow-up-circle-outline' },
          { key: 'past', label: 'Passés', icon: 'time-outline' },
        ] as const).map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodBtn, periodFilter === p.key && styles.periodBtnActive]}
            onPress={() => setPeriodFilter(p.key)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={p.icon as any}
              size={13}
              color={periodFilter === p.key ? Colors.accent : Colors.textMuted}
            />
            <Text style={[styles.periodText, periodFilter === p.key && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Contenu ───────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.stateText}>Chargement...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateWrap}>
          <View style={styles.stateIcon}>
            <Ionicons name="cloud-offline-outline" size={32} color={Colors.textMuted} />
          </View>
          <Text style={styles.stateTitle}>Une erreur est survenue</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadEvents} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={14} color="#fff" />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => renderCard({ item, index })}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.stateWrap}>
              <View style={styles.stateIcon}>
                <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
              </View>
              <Text style={styles.stateTitle}>Aucun événement</Text>
              <Text style={styles.stateText}>Modifiez vos filtres pour voir plus de résultats</Text>
            </View>
          }
        />
      )}

      {/* ── Modal détail ──────────────────────────────────────────── */}
      <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalRoot}>
          {selectedEvent && (
            <>
              {/* Header modal coloré */}
              <View style={[styles.modalHeader, { backgroundColor: getCategoryBg(selectedEvent.category) }]}>
                <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={20} color={Colors.text} />
                </TouchableOpacity>
                <View style={[styles.modalCatBadge, { backgroundColor: getCategoryBg(selectedEvent.category) }]}>
                  <Text style={styles.modalCatEmoji}>{getCategoryEmoji(selectedEvent.category)}</Text>
                  <Text style={[styles.modalCatLabel, { color: getCategoryColor(selectedEvent.category) }]}>
                    {selectedEvent.category}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleFavorite} style={styles.modalFavBtn} activeOpacity={0.7}>
                  <Ionicons
                    name={favorited ? 'heart' : 'heart-outline'}
                    size={20}
                    color={favorited ? Colors.danger : Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScroll}
              >
                <Text style={styles.modalTitle}>{selectedEvent.title}</Text>

                {/* Infos clés */}
                <View style={styles.modalInfoGrid}>
                  <InfoTile icon="calendar" color={Colors.talk} bg={Colors.talkBg} text={formatDateLong(selectedEvent.startDateTime)} />
                  <InfoTile icon="location" color={Colors.danger} bg={Colors.examBg} text={selectedEvent.locationName} sub={selectedEvent.locationAddress} />
                  <InfoTile icon="person" color={Colors.workshop} bg={Colors.workshopBg} text={selectedEvent.organizerName} />
                  {selectedEvent.endDateTime && (
                    <InfoTile icon="time" color={Colors.other} bg={Colors.otherBg} text={`Fin : ${formatDateLong(selectedEvent.endDateTime)}`} />
                  )}
                </View>

                {/* Capacité */}
                {selectedEvent.capacity && (
                  <View style={styles.modalCapCard}>
                    <View style={styles.modalCapHeader}>
                      <View style={styles.modalCapLeft}>
                        <Ionicons name="people" size={16} color={Colors.warning} />
                        <Text style={styles.modalCapTitle}>Inscriptions</Text>
                      </View>
                      <Text style={[
                        styles.modalCapCount,
                        selectedEvent.registeredCount >= selectedEvent.capacity && { color: Colors.danger }
                      ]}>
                        {selectedEvent.registeredCount} / {selectedEvent.capacity}
                        {selectedEvent.registeredCount >= selectedEvent.capacity && '  COMPLET'}
                      </Text>
                    </View>
                    <View style={styles.modalCapTrack}>
                      <View style={[
                        styles.modalCapFill,
                        {
                          width: `${Math.min(100, (selectedEvent.registeredCount / selectedEvent.capacity) * 100)}%`,
                          backgroundColor: selectedEvent.registeredCount >= selectedEvent.capacity ? Colors.danger : Colors.accent,
                        }
                      ]} />
                    </View>
                  </View>
                )}

                {/* Description */}
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.modalDesc}>{selectedEvent.description}</Text>

                {/* Tags */}
                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Tags</Text>
                    <View style={styles.tagsRow}>
                      {selectedEvent.tags.map((tag, i) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionFav, favorited && styles.actionFavActive]}
                    onPress={handleFavorite}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={18} color={favorited ? '#fff' : Colors.danger} />
                    <Text style={[styles.actionFavText, favorited && { color: '#fff' }]}>
                      {favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    </Text>
                  </TouchableOpacity>

                  {selectedEvent.startDateTime >= new Date().toISOString() && (
                    <TouchableOpacity
                      style={[
                        styles.actionRegister,
                        registered && styles.actionCancel,
                       (!registered && !!selectedEvent.capacity && selectedEvent.registeredCount >= selectedEvent.capacity) && styles.actionDisabled,
                      ]}
                      onPress={handleRegister}
                      disabled={!registered && !!(selectedEvent.capacity && selectedEvent.registeredCount >= selectedEvent.capacity)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={registered ? 'close-circle-outline' : 'checkmark-circle-outline'}
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.actionRegisterText}>
                        {registered
                          ? "Annuler l'inscription"
                          : selectedEvent.capacity && selectedEvent.registeredCount >= selectedEvent.capacity
                            ? 'Complet'
                            : "S'inscrire"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Composant InfoTile ───────────────────────────────────────────────────
function InfoTile({ icon, color, bg, text, sub }: { icon: string; color: string; bg: string; text: string; sub?: string }) {
  return (
    <View style={tileStyles.wrap}>
      <View style={[tileStyles.icon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <View style={tileStyles.content}>
        <Text style={tileStyles.text}>{text}</Text>
        {sub && <Text style={tileStyles.sub}>{sub}</Text>}
      </View>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  content: { flex: 1 },
  text: { fontSize: 13.5, color: Colors.text, lineHeight: 19, fontWeight: '500' },
  sub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // ── Header ──
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.8,
  },
  pageSub: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 3,
  },
  periodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },

  // ── Recherche ──
  searchWrap: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Catégories ──
  catSection: { paddingBottom: Spacing.sm },
  catScroll: { paddingHorizontal: Spacing.xl, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    gap: 5,
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: '700' },

  // ── Période ──
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  periodBtnActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentBorder,
  },
  periodText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  periodTextActive: { color: Colors.accent },

  // ── États ──
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 24, paddingTop: 4 },
  stateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 70, gap: 10 },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  stateTitle: { fontSize: 17, fontWeight: '700', color: Colors.textSecondary },
  stateText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    marginTop: 6,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ── Carte ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccentBar: { width: 4, flexShrink: 0 },
  cardInner: { flex: 1, padding: Spacing.lg },

  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 5,
  },
  catEmoji: { fontSize: 12 },
  catLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },

  cardHeadRight: { flexDirection: 'row', gap: 6 },
  pastPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
  },
  pastPillText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  fullPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  fullPillText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500', flex: 1 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.border },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  organizerWrap: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  orgAvatar: {
    width: 24,
    height: 24,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgAvatarText: { fontSize: 11, fontWeight: '800' },
  orgName: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, flex: 1 },

  capacityWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  capacityTrackSmall: {
    width: 50,
    height: 4,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityFillSmall: { height: '100%', borderRadius: 2 },
  capacityCount: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },

  // ── Modal ──
  modalRoot: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: Spacing.lg,
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFavBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  modalCatEmoji: { fontSize: 15 },
  modalCatLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  modalScroll: { padding: Spacing.xl, paddingBottom: 48 },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: Spacing.xl,
  },

  modalInfoGrid: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  modalCapCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  modalCapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalCapLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  modalCapTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  modalCapCount: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  modalCapTrack: { height: 6, backgroundColor: Colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  modalCapFill: { height: '100%', borderRadius: 3 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  modalDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.xl },
  tag: {
    backgroundColor: Colors.navyMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  tagText: { color: Colors.navy, fontSize: 12, fontWeight: '700' },

  modalActions: { gap: 10, marginTop: 4 },
  actionFav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.examBg,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.15)',
  },
  actionFavActive: { backgroundColor: Colors.danger, borderColor: 'transparent' },
  actionFavText: { fontSize: 14, fontWeight: '700', color: Colors.danger },

  actionRegister: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  actionCancel: { backgroundColor: Colors.warning, shadowColor: Colors.warning },
  actionDisabled: { backgroundColor: Colors.surfaceAlt, shadowOpacity: 0, elevation: 0 },
  actionRegisterText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});