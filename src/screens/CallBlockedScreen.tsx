import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {
  calculateRiskScore,
  DEFAULT_LOCK_RULE,
  getProtectionLevel,
  isLockActive,
} from '../types/lock';
import {useBlockedContacts} from '../context/ContactsContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CallBlocked'>;
type Route = RouteProp<RootStackParamList, 'CallBlocked'>;

export function CallBlockedScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {contactId, contactName, contactReason, contactNote, attemptNumber} = route.params;
  const {attempts, isPartyModeActive} = useBlockedContacts();

  const now = new Date();
  const day = now.getDay();

  const recentAttempts = attempts.filter(
    a => a.contactId === contactId && a.timestamp > Date.now() - 5 * 60 * 1000,
  ).length;

  const score = calculateRiskScore({
    isLockTime: isLockActive(DEFAULT_LOCK_RULE),
    isWeekend: day === 5 || day === 6 || day === 0,
    isBlockedContact: true,
    partyModeActive: isPartyModeActive,
    failedSoberTest: false,
    repeatedAttempts: recentAttempts,
  });

  const displayScore = Math.round(score / 10);
  const level = getProtectionLevel(score);
  const canTakeSoberTest = level === 'sober_test' || level === 'cooldown';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={40} color={colors.primary} />
        </View>

        <Text style={styles.title}>Дзвінок заблоковано</Text>
        <Text style={styles.name}>{contactName}</Text>
        {!!contactReason && (
          <Text style={styles.reason}>{contactReason}</Text>
        )}

        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreLabel}>Індекс імпульсу</Text>
              <Text style={styles.scoreValue}>{displayScore}<Text style={styles.scoreMax}>/10</Text></Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreLabel}>Спроб цієї ночі</Text>
              <Text style={styles.scoreValue}>{attemptNumber}<Text style={styles.scoreMax}> раз</Text></Text>
            </View>
          </View>
          <Text style={styles.scoreHint}>
            {displayScore >= 8
              ? 'Ранок буде мудрішим. Обіцяємо 🌅'
              : displayScore >= 6
              ? 'Схоже на імпульс. Пройди тест — і побачимо 🤔'
              : 'Майже вільна! Пройди швидкий тест ✨'}
          </Text>
          {!!contactNote && (
            <View style={styles.noteBlock}>
              <Text style={styles.noteLabel}>Крик душі</Text>
              <Text style={styles.noteText}>{contactNote}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {canTakeSoberTest ? (
          <Pressable
            style={styles.testBtn}
            onPress={() =>
              navigation.replace('SoberTest', {
                contactId,
                contactName,
                action: 'call',
                riskScore: score,
              })
            }>
            <Text style={styles.testBtnText}>Пройти тест тверезості</Text>
          </Pressable>
        ) : (
          <View style={styles.blockNotice}>
            <Text style={styles.blockNoticeText}>
              Занадто ризиковано. Повернись до цього вранці.
            </Text>
          </View>
        )}

        <Pressable
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtnText}>На головну</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  name: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  reason: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  scoreCard: {
    marginTop: 16,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  noteBlock: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 4,
  },
  noteLabel: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  scoreRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  scoreBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  scoreDivider: {
    width: 1,
    height: 48,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  scoreLabel: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scoreValue: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 36,
    fontWeight: '800',
  },
  scoreMax: {
    color: colors.mutedText,
    fontSize: 18,
    fontWeight: '400',
  },
  scoreHint: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  testBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  testBtnText: {
    color: colors.onPrimary,
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  blockNotice: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  blockNoticeText: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  homeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  homeBtnText: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 14,
  },
});
