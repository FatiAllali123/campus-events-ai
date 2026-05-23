import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(-15)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(logoY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    const success = login(email, password);
    if (!success) {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <Animated.View
              style={[
                styles.logoContainer,
                { opacity: logoOpacity, transform: [{ translateY: logoY }] },
              ]}
            >
              <View style={styles.logoCircle}>
                <Ionicons name="school" size={36} color="#fff" />
              </View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>CampusEvents</Text>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiText}>AI</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>Votre agenda intelligent</Text>
            </Animated.View>

            {/* Carte formulaire */}
            <Animated.View
              style={[
                styles.card,
                { opacity: cardOpacity, transform: [{ translateY: cardY }] },
              ]}
            >
              <Text style={styles.cardTitle}>Connexion</Text>

              {/* Email */}
              <View style={[styles.inputWrap, emailFocused && styles.inputFocused]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={emailFocused ? Colors.accent : 'rgba(148, 163, 184, 0.7)'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="rgba(148, 163, 184, 0.5)"
                />
              </View>

              {/* Mot de passe */}
              <View style={[styles.inputWrap, passwordFocused && styles.inputFocused]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={passwordFocused ? Colors.accent : 'rgba(148, 163, 184, 0.7)'}
                />
                <TextInput
                  style={[styles.input, { paddingRight: 40 }]}
                  placeholder="Mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="rgba(148, 163, 184, 0.5)"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="rgba(148, 163, 184, 0.7)"
                  />
                </TouchableOpacity>
              </View>

              {/* Bouton */}
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
                <Text style={styles.loginBtnText}>Se connecter</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>

              {/* Séparateur */}
              <View style={styles.dividerWrap}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>Comptes de démo</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Démo */}
              <View style={styles.demos}>
                <TouchableOpacity
                  style={styles.demoCard}
                  onPress={() => fillDemo('admin@campus.ma', 'admin123')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.demoIcon, { backgroundColor: 'rgba(217, 119, 6, 0.12)' }]}>
                    <Ionicons name="shield-checkmark" size={16} color={Colors.accent} />
                  </View>
                  <View style={styles.demoInfo}>
                    <Text style={styles.demoRole}>Admin</Text>
                    <Text style={styles.demoEmail}>admin@campus.ma</Text>
                  </View>
                  <Text style={styles.demoPwd}>admin123</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoCard}
                  onPress={() => fillDemo('etudiant@campus.ma', 'etudiant123')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.demoIcon, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                    <Ionicons name="person" size={16} color={Colors.talk} />
                  </View>
                  <View style={styles.demoInfo}>
                    <Text style={styles.demoRole}>Étudiant</Text>
                    <Text style={styles.demoEmail}>etudiant@campus.ma</Text>
                  </View>
                  <Text style={styles.demoPwd}>etudiant123</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },

  // ── Logo ──
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textLight,
    letterSpacing: -0.5,
  },
  aiBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  aiText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 0.8)',
    fontWeight: '500',
  },

  // ── Carte ──
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // ── Inputs ──
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    gap: 10,
    height: 48,
  },
  inputFocused: {
    borderColor: 'rgba(217, 119, 6, 0.35)',
    backgroundColor: 'rgba(217, 119, 6, 0.04)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textLight,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },

  // ── Bouton ──
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 15,
    borderRadius: Radius.md,
    gap: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Séparateur ──
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  dividerLabel: {
    color: 'rgba(148, 163, 184, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Démo ──
  demos: {
    gap: 8,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.07)',
    gap: 10,
  },
  demoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoInfo: {
    flex: 1,
  },
  demoRole: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textLight,
  },
  demoEmail: {
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.7)',
    marginTop: 1,
  },
  demoPwd: {
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.4)',
    fontWeight: '500',
  },
});
