import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES } from '../../constants/categories';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useFiltersStore } from '../../store/filters.store';
import { Button } from '../../components/shared/Button';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const { type, radius, categorie, dateRange, statut, setFilters, resetFilters } = useFiltersStore();

  const applyChanges = () => {
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title} allowFontScaling minimumFontScale={0.9}>Filtres</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer les filtres"
              accessibilityHint="Ferme le panneau de filtres"
            >
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling minimumFontScale={0.9}>Type</Text>
              <View style={styles.rowWrap}>
                <Chip
                  label="Perdu"
                  selected={type === 'lost'}
                  onPress={() => setFilters({ type: 'lost' })}
                />
                <Chip
                  label="Trouvé"
                  selected={type === 'found'}
                  onPress={() => setFilters({ type: 'found' })}
                />
                <Chip
                  label="Les deux"
                  selected={type === 'all'}
                  onPress={() => setFilters({ type: 'all' })}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling minimumFontScale={0.9}>Rayon</Text>
              <View style={styles.rowWrap}>
                {[1000, 5000, 10000, 25000, 50000].map((value) => (
                  <Chip
                    key={value}
                    label={`${value / 1000} km`}
                    selected={radius === value}
                    onPress={() => setFilters({ radius: value as any })}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling minimumFontScale={0.9}>Catégorie</Text>
              <View style={styles.rowWrap}>
                <Chip
                  label="Toutes"
                  selected={categorie == null}
                  onPress={() => setFilters({ categorie: null })}
                />
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.value}
                    label={cat.label}
                    selected={categorie === cat.value}
                    onPress={() => setFilters({ categorie: cat.value })}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling minimumFontScale={0.9}>Période</Text>
              <View style={styles.rowWrap}>
                <Chip
                  label="Aujourd'hui"
                  selected={dateRange === 'today'}
                  onPress={() => setFilters({ dateRange: 'today' })}
                />
                <Chip
                  label="7 jours"
                  selected={dateRange === '7days'}
                  onPress={() => setFilters({ dateRange: '7days' })}
                />
                <Chip
                  label="30 jours"
                  selected={dateRange === '30days'}
                  onPress={() => setFilters({ dateRange: '30days' })}
                />
                <Chip
                  label="Tout"
                  selected={dateRange === 'all'}
                  onPress={() => setFilters({ dateRange: 'all' })}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling minimumFontScale={0.9}>Statut</Text>
              <View style={styles.rowWrap}>
                <Chip
                  label="En attente"
                  selected={statut === 'en_attente'}
                  onPress={() => setFilters({ statut: 'en_attente' })}
                />
                <Chip
                  label="Résolu"
                  selected={statut === 'resolu'}
                  onPress={() => setFilters({ statut: 'resolu' })}
                />
                <Chip
                  label="Tous"
                  selected={statut === 'all'}
                  onPress={() => setFilters({ statut: 'all' })}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Réinitialiser"
              variant="ghost"
              containerStyle={styles.footerButton}
              onPress={resetFilters}
            />
            <Button
              title="Appliquer"
              variant="primary"
              containerStyle={styles.footerButton}
              onPress={applyChanges}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={selected ? 'Filtre deja active' : 'Activer ce filtre'}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        selected && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
      ]}
    >
      <Text style={[styles.chipLabel, selected && { color: colors.primary }]} allowFontScaling minimumFontScale={0.9}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  section: {
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

