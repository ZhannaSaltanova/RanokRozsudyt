import React from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppButton} from '../components/AppButton';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import type {BlockedContact} from '../types/contact';

const blockedContacts: BlockedContact[] = [
  {
    id: '1',
    name: 'Олег',
    reason: 'Не писати після 23:00',
    blockedUntil: 'До ранку',
  },
  {
    id: '2',
    name: 'Марина',
    reason: 'Пауза перед важкою розмовою',
    blockedUntil: '8 годин',
  },
];

type BlockedContactsScreenProps = {
  onBack: () => void;
};

export function BlockedContactsScreen({
  onBack,
}: BlockedContactsScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Захист увімкнено</Text>
        <Text style={styles.title}>Заблоковані контакти</Text>
        <Text style={styles.subtitle}>
          Тут будуть люди, яким краще не писати до ранку.
        </Text>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={blockedContacts}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.reason}>{item.reason}</Text>
            </View>
            <Text style={styles.badge}>{item.blockedUntil}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <AppButton label="Назад" onPress={onBack} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  footer: {
    paddingBottom: 16,
  },
  header: {
    paddingTop: 28,
    paddingBottom: 24,
  },
  eyebrow: {
    marginBottom: 10,
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  subtitle: {
    marginTop: 12,
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 16,
    lineHeight: 24,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contactName: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  reason: {
    marginTop: 6,
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    fontFamily: fonts.primary,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
});
