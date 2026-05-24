import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createEvent } from '../../../database/events';
import { generateUUID } from '../../../utils/uuid';
import { Category } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, getCategoryColor, getCategoryBg, getCategoryEmoji } from '../../../constants/theme';

const CATEGORIES: Category[] = ['Talk', 'Workshop', 'Club', 'Exam', 'Other'];

export default function CreateEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Talk');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [tags, setTags] = useState('');
  const [hasEndDate, setHasEndDate] = useState(false);

  function validate(): boolean {
    if (!title.trim()) { Alert.alert('Erreur', 'Le titre est obligatoire'); return false; }
    if (!description.trim()) { Alert.alert('Erreur', 'La description est obligatoire'); return false; }
    if (!locationName.trim()) { Alert.alert('Erreur', 'Le lieu est obligatoire'); return false; }
    if (!startDate || !startTime) { Alert.alert('Erreur', 'La date et heure de début sont obligatoires'); return false; }
    const startDateTime = new Date(`${startDate}T${startTime}`);
    if (isNaN(startDateTime.getTime())) { Alert.alert('Erreur', 'Date de début invalide'); return false; }
    if (hasEndDate && endDate && endTime) {
      const endDateTime = new Date(`${endDate}T${endTime}`);
      if (endDateTime <= startDateTime) { Alert.alert('Erreur', 'La date de fin doit être postérieure au début'); return false; }
    }
    if (capacity && (isNaN(Number(capacity)) || Number(capacity) <= 0)) { Alert.alert('Erreur', 'Capacité invalide'); return false; }
    return true;
  }

  function handleSubmit() {
    if (!validate()) return;
    createEvent({
      id: generateUUID(),
      title: title.trim(),
      description: description.trim(),
      category,
      startDateTime: `${startDate}T${startTime}:00`,
      endDateTime: hasEndDate && endDate && endTime ? `${endDate}T${endTime}:00` : undefined,
      locationName: locationName.trim(),
      locationAddress: locationAddress.trim() || undefined,
      organizerName: organizerName.trim() || 'Non spécifié',
      capacity: capacity ? Number(capacity) : undefined,
      registeredCount: 0,
      imageUrl: undefined,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      createdAt: new Date().toISOString(),
    });
    Alert.alert('Succès', 'Événement créé !', [
      { text: 'OK', onPress: () => router.replace('/(admin)/events') },
    ]);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Section : Informations générales ─── */}
      <SectionCard icon="information-circle-outline" title="Informations générales">
        <FieldLabel label="Titre" required />
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Titre de l'événement"
          placeholderTextColor={Colors.textMuted}
        />

        <FieldLabel label="Description" required />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Description détaillée de l'événement"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <FieldLabel label="Catégorie" required />
        <View style={styles.catRow}>
          {CATEGORIES.map(cat => {
            const active = category === cat;
            const color = getCategoryColor(cat);
            const bg = getCategoryBg(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, { backgroundColor: active ? color : bg }]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.75}
              >
                <Text style={styles.catEmoji}>{getCategoryEmoji(cat)}</Text>
                <Text style={[styles.catChipText, { color: active ? '#fff' : color }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SectionCard>

      {/* ── Section : Date & Heure ─── */}
      <SectionCard icon="calendar-outline" title="Date & Heure">
        <View style={styles.row}>
<View style={styles.rowItem}>
  <FieldLabel label="Date début" required />
  <TextInput
    style={[
      styles.input,
      startDate.length > 0 && !isValidDate(startDate) && styles.inputError,
    ]}
    value={startDate}
    onChangeText={setStartDate}
    placeholder="2026-05-25"
    placeholderTextColor={Colors.textMuted}
    keyboardType="numeric"
    maxLength={10}
  />
  {startDate.length > 0 && !isValidDate(startDate) && (
    <Text style={styles.fieldError}>Format attendu : YYYY-MM-DD</Text>
  )}
</View>

<View style={styles.rowItem}>
  <FieldLabel label="Heure début" required />
  <TextInput
    style={[
      styles.input,
      startTime.length > 0 && !isValidTime(startTime) && styles.inputError,
    ]}
    value={startTime}
    onChangeText={setStartTime}
    placeholder="14:00"
    placeholderTextColor={Colors.textMuted}
    keyboardType="numeric"
    maxLength={5}
  />
  {startTime.length > 0 && !isValidTime(startTime) && (
    <Text style={styles.fieldError}>Format attendu : HH:MM</Text>
  )}
</View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.switchLabel}>Date de fin</Text>
          </View>
          <Switch
            value={hasEndDate}
            onValueChange={setHasEndDate}
            trackColor={{ false: Colors.border, true: Colors.accentBorder }}
            thumbColor={hasEndDate ? Colors.accent : Colors.textMuted}
          />
        </View>

        {hasEndDate && (
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <FieldLabel label="Date fin" />
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="2026-05-25"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.rowItem}>
              <FieldLabel label="Heure fin" />
              <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="16:00"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        )}
      </SectionCard>

      {/* ── Section : Lieu ─── */}
      <SectionCard icon="location-outline" title="Lieu">
        <FieldLabel label="Nom du lieu" required />
        <TextInput
          style={styles.input}
          value={locationName}
          onChangeText={setLocationName}
          placeholder="Ex: Amphithéâtre A"
          placeholderTextColor={Colors.textMuted}
        />
        <FieldLabel label="Adresse" />
        <TextInput
          style={styles.input}
          value={locationAddress}
          onChangeText={setLocationAddress}
          placeholder="Adresse complète (optionnel)"
          placeholderTextColor={Colors.textMuted}
        />
      </SectionCard>

      {/* ── Section : Détails ─── */}
      <SectionCard icon="settings-outline" title="Détails supplémentaires">
        <FieldLabel label="Organisateur" />
        <TextInput
          style={styles.input}
          value={organizerName}
          onChangeText={setOrganizerName}
          placeholder="Nom de l'organisateur"
          placeholderTextColor={Colors.textMuted}
        />
        <FieldLabel label="Capacité maximale" />
        <TextInput
          style={styles.input}
          value={capacity}
          onChangeText={setCapacity}
          placeholder="Ex: 100 (laisser vide = illimité)"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
        />
        <FieldLabel label="Tags" />
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="IA, workshop, campus (séparés par virgules)"
          placeholderTextColor={Colors.textMuted}
        />
      </SectionCard>

      {/* ── Bouton submit ─── */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <Text style={styles.submitText}>Créer l'événement</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Composants helpers ───────────────────────────────────────────────────
function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.card}>
      <View style={sectionStyles.header}>
        <View style={sectionStyles.iconWrap}>
          <Ionicons name={icon as any} size={15} color={Colors.navy} />
        </View>
        <Text style={sectionStyles.title}>{title}</Text>
      </View>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 7, marginTop: 12 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {required && <Text style={fieldStyles.required}>*</Text>}
    </View>
  );
}

function isValidDate(str: string): boolean {
  // Format attendu : YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

function isValidTime(str: string): boolean {
  // Format attendu : HH:MM
  return /^\d{2}:\d{2}$/.test(str);
}

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surfaceAlt,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.navyMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 14, fontWeight: '700', color: Colors.text },
  body: { padding: Spacing.lg },
});

const fieldStyles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  required: { fontSize: 13, fontWeight: '700', color: Colors.danger },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl },

  input: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    minHeight: 90,
    paddingTop: Spacing.md,
  },

  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },

  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full,
  },
  catEmoji: { fontSize: 13 },
  catChipText: { fontSize: 12, fontWeight: '700' },

  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  switchLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
inputError: {
  borderColor: Colors.danger,
  backgroundColor: Colors.examBg,
},
fieldError: {
  fontSize: 11,
  color: Colors.danger,
  fontWeight: '600',
  marginTop: 4,
},
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16, borderRadius: Radius.md,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});