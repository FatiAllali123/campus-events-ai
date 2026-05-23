import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import {
  callLLM,
  buildSearchPrompt,
  buildRecommendationPrompt,
  buildPlanningPrompt,
  buildQAPrompt,
} from '../../services/llm';
import { getAllEvents, getUpcomingEvents } from '../../database/events';
import { getFavoritesByUser } from '../../database/favorites';
import { getRegistrationsByUser } from '../../database/registrations';
import { saveLLMResult, getLLMResultByType } from '../../database/llmResults';
import { generateUUID } from '../../utils/uuid';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';

type AIType = 'search' | 'recommendation' | 'planning' | 'qa';

const TABS: { key: AIType; label: string; icon: string; color: string; bg: string; description: string; placeholder: string }[] = [
  {
    key: 'search',
    label: 'Recherche',
    icon: 'search-outline',
    color: Colors.talk,
    bg: Colors.talkBg,
    description: 'Trouvez des événements en langage naturel',
    placeholder: 'Ex: "quelque chose sur l\'IA ce weekend"',
  },
  {
    key: 'recommendation',
    label: 'Pour vous',
    icon: 'star-outline',
    color: Colors.accent,
    bg: Colors.accentLight,
    description: 'Recommandations personnalisées basées sur votre historique',
    placeholder: 'Appuyez sur Générer pour obtenir vos recommandations',
  },
  {
    key: 'planning',
    label: 'Planning',
    icon: 'calendar-outline',
    color: Colors.workshop,
    bg: Colors.workshopBg,
    description: 'Organisez votre semaine intelligemment',
    placeholder: 'Ex: "J\'ai cours lundi matin, aide-moi à planifier"',
  },
  {
    key: 'qa',
    label: 'Q & R',
    icon: 'chatbubble-outline',
    color: Colors.other,
    bg: Colors.otherBg,
    description: 'Posez n\'importe quelle question sur le catalogue',
    placeholder: 'Ex: "Y a-t-il des événements data science ?"',
  },
];

export default function AssistantScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AIType>('search');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  const currentTab = TABS.find(t => t.key === activeTab)!;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (result) {
      resultAnim.setValue(0);
      Animated.timing(resultAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    }
  }, [result]);

  useEffect(() => {
    checkCache();
  }, [activeTab, input]);

  function checkCache() {
    if (!user || !input.trim()) return;
    const cached = getLLMResultByType(user.email, activeTab, input.trim());
    if (cached) {
      setResult(cached.outputText);
      setSubmitted(true);
    }
  }

  async function handleSubmit() {
    if (!input.trim() && activeTab !== 'recommendation') return;
    if (!user) return;
    setLoading(true);
    setError('');
    setResult('');
    setSubmitted(true);

    try {
      const cached = getLLMResultByType(user.email, activeTab, input.trim());
      if (cached) { setResult(cached.outputText); setLoading(false); return; }

      let prompt = '';
      const allEvents = getAllEvents();
      const upcoming = getUpcomingEvents();

      switch (activeTab) {
        case 'search':
          prompt = buildSearchPrompt(input.trim(), allEvents); break;
        case 'recommendation': {
          const favorites = getFavoritesByUser(user.email);
          const registrations = getRegistrationsByUser(user.email);
          const history = [...favorites, ...registrations].slice(0, 10);
          prompt = buildRecommendationPrompt(history, upcoming); break;
        }
        case 'planning':
          prompt = buildPlanningPrompt(input.trim(), upcoming); break;
        case 'qa':
          prompt = buildQAPrompt(input.trim(), allEvents); break;
      }

      const response = await callLLM({
        messages: [
          { role: 'system', content: 'Tu es un assistant utile et concis pour un campus universitaire.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      saveLLMResult({
        id: generateUUID(),
        userId: user.email,
        type: activeTab,
        inputText: input.trim(),
        outputText: response,
        createdAt: new Date().toISOString(),
      });

      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la requête. Vérifiez votre clé API.');
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(tab: AIType) {
    setActiveTab(tab);
    setInput('');
    setResult('');
    setError('');
    setSubmitted(false);
  }

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <Animated.View style={[
        styles.pageHeader,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
        }
      ]}>
        <View>
          <Text style={styles.pageTitle}>Assistant IA</Text>
          <Text style={styles.pageSub}>Propulsé par l'intelligence artificielle</Text>
        </View>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={14} color={Colors.accent} />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </Animated.View>

      {/* ── Avertissement ──────────────────────────────────────── */}
      <View style={styles.warningBanner}>
        <Ionicons name="shield-outline" size={13} color={Colors.warning} />
        <Text style={styles.warningText}>Ne soumettez pas de données personnelles sensibles</Text>
      </View>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <Animated.View style={[styles.tabsWrap, { opacity: contentAnim }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          bounces={false}
        >
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  { backgroundColor: active ? tab.color : tab.bg },
                ]}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={15}
                  color={active ? '#fff' : tab.color}
                />
                <Text style={[styles.tabText, { color: active ? '#fff' : tab.color }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Carte contexte ────────────────────────────────────── */}
        <Animated.View style={[
          styles.contextCard,
          { borderLeftColor: currentTab.color, opacity: contentAnim },
        ]}>
          <View style={[styles.contextIcon, { backgroundColor: currentTab.bg }]}>
            <Ionicons name={currentTab.icon as any} size={18} color={currentTab.color} />
          </View>
          <Text style={styles.contextText}>{currentTab.description}</Text>
        </Animated.View>

        {/* ── Input ─────────────────────────────────────────────── */}
        <View style={styles.inputWrap}>
          <TextInput
            style={[
              styles.input,
              activeTab === 'recommendation' && styles.inputDisabled,
            ]}
            placeholder={currentTab.placeholder}
            value={input}
            onChangeText={setInput}
            multiline
            numberOfLines={3}
            editable={activeTab !== 'recommendation'}
            placeholderTextColor={Colors.textMuted}
            textAlignVertical="top"
          />
          {input.length > 0 && activeTab !== 'recommendation' && (
            <TouchableOpacity
              style={styles.clearInput}
              onPress={() => setInput('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.clearInputBtn}>
                <Ionicons name="close" size={11} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Bouton submit ─────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: currentTab.color },
            (loading || (!input.trim() && activeTab !== 'recommendation')) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || (!input.trim() && activeTab !== 'recommendation')}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={17} color="#fff" />
              <Text style={styles.submitText}>
                {activeTab === 'recommendation' ? 'Générer mes recommandations' : "Envoyer à l'IA"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Chargement ────────────────────────────────────────── */}
        {loading && (
          <View style={styles.loadingCard}>
            <View style={[styles.loadingDot, { backgroundColor: currentTab.color }]} />
            <Text style={styles.loadingText}>L'IA analyse votre demande...</Text>
          </View>
        )}

        {/* ── Erreur ────────────────────────────────────────────── */}
        {error ? (
          <View style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorTitle}>Une erreur est survenue</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleSubmit} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={14} color="#fff" />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Résultat ──────────────────────────────────────────── */}
        {result ? (
          <Animated.View style={[
            styles.resultCard,
            { borderTopColor: currentTab.color },
            {
              opacity: resultAnim,
              transform: [{ translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }
          ]}>
            <View style={styles.resultHeader}>
              <View style={[styles.resultIconWrap, { backgroundColor: currentTab.bg }]}>
                <Ionicons name="sparkles" size={14} color={currentTab.color} />
              </View>
              <Text style={[styles.resultTitle, { color: currentTab.color }]}>Réponse de l'IA</Text>
              <View style={styles.cacheBadge}>
                <Ionicons name="flash" size={10} color={Colors.warning} />
                <Text style={styles.cacheText}>IA</Text>
              </View>
            </View>
            <View style={styles.resultDivider} />
            <Text style={styles.resultText}>{result}</Text>
          </Animated.View>
        ) : null}

        {/* ── État vide ─────────────────────────────────────────── */}
        {!loading && !error && !result && submitted && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={28} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptySub}>
              L'IA n'a pas trouvé de réponse. Essayez de reformuler votre requête.
            </Text>
          </View>
        )}

        {/* ── État initial ──────────────────────────────────────── */}
        {!loading && !error && !result && !submitted && (
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>Comment ça marche ?</Text>
            <View style={styles.hintList}>
              {[
                { icon: 'create-outline', text: 'Tapez votre question ou requête' },
                { icon: 'sparkles-outline', text: "L'IA analyse le catalogue en temps réel" },
                { icon: 'flash-outline', text: 'Les résultats sont mis en cache pour aller plus vite' },
              ].map((hint, i) => (
                <View key={i} style={styles.hintRow}>
                  <View style={[styles.hintNum, { backgroundColor: currentTab.bg }]}>
                    <Ionicons name={hint.icon as any} size={13} color={currentTab.color} />
                  </View>
                  <Text style={styles.hintText}>{hint.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // ── Header ──
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
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
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.5,
  },

  // ── Warning ──
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(217,119,6,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.15)',
  },
  warningText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
    flex: 1,
  },

  // ── Tabs ──
  tabsWrap: { marginBottom: Spacing.lg },
  tabsScroll: { paddingHorizontal: Spacing.xl, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: '700' },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 32 },

  // ── Contexte ──
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  contextIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  contextText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 19,
  },

  // ── Input ──
  inputWrap: { position: 'relative', marginBottom: Spacing.md },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    paddingRight: 44,
    fontSize: 15,
    color: Colors.text,
    minHeight: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceAlt,
    color: Colors.textMuted,
  },
  clearInput: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  clearInputBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Submit ──
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: Radius.md,
    gap: 8,
    marginBottom: Spacing.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Chargement ──
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // ── Erreur ──
  errorCard: {
    backgroundColor: Colors.examBg,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.15)',
    gap: 10,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    opacity: 0.8,
    lineHeight: 19,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.danger,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.sm,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ── Résultat ──
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  cacheBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  cacheText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.warning,
    letterSpacing: 0.3,
  },
  resultDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 23,
  },

  // ── État vide ──
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // ── Hint initial ──
  hintCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  hintList: { gap: 12 },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hintNum: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  hintText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 19,
  },
});