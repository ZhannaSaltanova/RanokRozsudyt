import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AppState, KeyboardAvoidingView, Modal, PermissionsAndroid, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppButton} from '../components/AppButton';
import {useBlockedContacts} from '../context/ContactsContext';
import {DailyPredictionCard} from '../components/DailyPredictionCard';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {BlockedContacts} from '../native/BlockedContacts';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {getGreeting} from '../utils/greeting';


type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const UNLOCK_PHRASES = ['ДОБРА НІЧ', 'НЕ ДЗВОНИ', 'ЧАС СПАТИ', 'СТОП ДУМАЙ', 'НОЧІ КІНЕЦЬ', 'ПАУЗА ЗАРАЗ'];

type UnlockChallenge =
  | {type: 'reverse'; display: string; answer: string}
  | {type: 'math'; display: string; answer: number};

function generateUnlockChallenge(): UnlockChallenge {
  if (Math.random() > 0.5) {
    const phrase = UNLOCK_PHRASES[Math.floor(Math.random() * UNLOCK_PHRASES.length)];
    const answer = phrase.split(' ').map(w => w.split('').reverse().join('')).join(' ');
    return {type: 'reverse', display: phrase, answer};
  }
  let a: number, b: number, c: number, d: number;
  do {
    a = Math.floor(Math.random() * 6) + 4;
    b = Math.floor(Math.random() * 6) + 4;
    c = Math.floor(Math.random() * 5) + 2;
    d = Math.floor(Math.random() * 5) + 2;
  } while (a * b - c * d <= 5);
  const useAdd = Math.random() > 0.6;
  return useAdd
    ? {type: 'math', display: `${a} × ${b} + ${c} × ${d} = ?`, answer: a * b + c * d}
    : {type: 'math', display: `${a} × ${b} − ${c} × ${d} = ?`, answer: a * b - c * d};
}

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const {isProtectionOn, setProtectionOn, deactivatePartyMode, attempts} = useBlockedContacts();
  const greeting = getGreeting();
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<'protection' | 'party' | null>(null);
  const [unlockChallenge, setUnlockChallenge] = useState<UnlockChallenge | null>(null);
  const [unlockInput, setUnlockInput] = useState('');

  const openUnlockTest = useCallback((target: 'protection' | 'party') => {
    setUnlockChallenge(generateUnlockChallenge());
    setUnlockInput('');
    setUnlockTarget(target);
  }, []);

  const handleProtectionToggle = useCallback(() => {
    if (!isProtectionOn) {
      setShowEnableConfirm(true);
    } else {
      openUnlockTest('protection');
    }
  }, [isProtectionOn, openUnlockTest]);


  const handleUnlockConfirm = useCallback(() => {
    if (unlockTarget === 'protection') {setProtectionOn(false);}
    else if (unlockTarget === 'party') {deactivatePartyMode();}
    setUnlockTarget(null);
    setUnlockChallenge(null);
  }, [unlockTarget, setProtectionOn, deactivatePartyMode]);

  const isUnlockCorrect = unlockChallenge !== null && (
    unlockChallenge.type === 'reverse'
      ? unlockInput.trim().toUpperCase() === unlockChallenge.answer
      : unlockInput.trim() !== '' && parseInt(unlockInput.trim(), 10) === unlockChallenge.answer
  );

  const nightReport = useMemo(() => {
    const nightStart = (() => {
      const t = new Date();
      t.setHours(22, 0, 0, 0);
      if (t.getTime() > Date.now()) {t.setDate(t.getDate() - 1);}
      return t.getTime();
    })();
    const recent = attempts.filter(a => a.result === 'blocked' && a.timestamp > nightStart);
    const map = new Map<string, {name: string; count: number}>();
    for (const a of recent) {
      const key = a.contactName.trim().toLowerCase();
      const entry = map.get(key);
      if (entry) {entry.count++;}
      else {map.set(key, {name: a.contactName, count: 1});}
    }
    return [...map.values()];
  }, [attempts]);
  const [redirectionRoleGranted, setRedirectionRoleGranted] = useState<boolean | null>(null);
  const isMounted = useRef(true);

  const checkRedirectionRole = useCallback(async () => {
    try {
      const granted = await BlockedContacts.isCallRedirectionRoleGranted();
      if (isMounted.current) {setRedirectionRoleGranted(granted ?? false);}
    } catch {
      if (isMounted.current) {setRedirectionRoleGranted(false);}
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    checkRedirectionRole();
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {checkRedirectionRole();}
    });
    return () => {
      isMounted.current = false;
      sub.remove();
    };
  }, [checkRedirectionRole]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Хедер */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Ранок Розсудить</Text>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>

        {/* Банер запиту дозволу на перевірку дзвінків */}
        {redirectionRoleGranted === false && (
          <Pressable
            style={styles.setupBanner}
            android_ripple={{color: colors.primary + '40', borderless: false}}
            onPress={() => BlockedContacts.requestCallRedirectionRole()}>
            <View style={styles.setupBannerText}>
              <Text style={styles.setupBannerTitle}>Потрібен дозвіл</Text>
              <Text style={styles.setupBannerSub}>
                Дозволь додатку перевіряти вихідні дзвінки щоб блокувати небажані контакти
              </Text>
            </View>
            <Text style={styles.setupBannerArrow}>›</Text>
          </Pressable>
        )}

        {/* Ранковий звіт */}
        {nightReport.length > 0 && (
          <View style={styles.nightReport}>
            <Text style={styles.nightReportTitle}>Звіт ночі</Text>
            {nightReport.map(item => (
              <View key={item.name} style={styles.nightReportRow}>
                <Text style={styles.nightReportName}>{item.name}</Text>
                <Text style={styles.nightReportCount}>
                  {item.count} {item.count === 1 ? 'спроба' : item.count < 5 ? 'спроби' : 'спроб'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Статус захисту */}
        <Pressable
          style={[
            styles.protectionCard,
            isProtectionOn ? styles.protectionOn : styles.protectionOff,
          ]}
          onPress={handleProtectionToggle}>
          <View style={styles.protectionText}>
            <Text style={styles.protectionLabel}>
              {isProtectionOn ? 'Захист увімкнено' : 'Захист вимкнено'}
            </Text>
            <Text style={styles.protectionSub}>
              {isProtectionOn
                ? 'Контакти заблоковані до ранку'
                : 'Натисни щоб увімкнути'}
            </Text>
          </View>
          <Ionicons
            name={isProtectionOn ? 'shield-checkmark-outline' : 'moon-outline'}
            size={36}
            color={isProtectionOn ? colors.primary : colors.subtleText}
          />
        </Pressable>

        {/* Передбачення дня */}
        <DailyPredictionCard />

        {/* Контакти */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Заблоковані контакти</Text>
          <Text style={styles.sectionSub}>
            Додай людей, яким краще не писати після опівночі
          </Text>
          <AppButton
            label="Керувати контактами"
            onPress={() => navigation.navigate('BlockedContacts')}
          />
        </View>

      </ScrollView>

      {/* Підтвердження вмикання захисту */}
      <Modal
        visible={showEnableConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEnableConfirm(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEnableConfirm(false)}>
          <Pressable style={[styles.modalSheet, styles.confirmSheet]}>
            <Text style={styles.modalTitle}>Вмикаємо захист? 🛡️</Text>
            <Text style={styles.confirmText}>
              Чудово! Щоб потім вимкнути — доведеться трохи попрацювати головою. Ми захищаємо тебе навіть від тебе самої.
            </Text>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => {
                setProtectionOn(true);
                setShowEnableConfirm(false);
              }}>
              <Text style={styles.confirmBtnText}>Так, захищай мене</Text>
            </TouchableOpacity>
            <Pressable style={styles.modalCancel} onPress={() => setShowEnableConfirm(false)}>
              <Text style={styles.modalCancelText}>Поки що ні</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Тест для вимикання захисту / party mode */}
      <Modal
        visible={unlockTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setUnlockTarget(null)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={[styles.modalSheet, styles.unlockSheet]}>
            <Text style={styles.modalTitle}>
              {unlockTarget === 'party' ? 'Вимкнути захист всіх?' : 'Точно хочеш вимкнутись?'}
            </Text>
            <Text style={styles.confirmText}>
              {unlockChallenge?.type === 'math'
                ? 'Розв\'яжи приклад 🧮'
                : 'Напиши кожне слово навпаки 😏'}
            </Text>
            {unlockChallenge && (
              <>
                <Text style={styles.unlockQuestion}>{unlockChallenge.display}</Text>
                <TextInput
                  style={[styles.unlockInput, isUnlockCorrect && styles.unlockInputCorrect]}
                  value={unlockInput}
                  onChangeText={setUnlockInput}
                  placeholder={unlockChallenge.type === 'math' ? 'Відповідь...' : 'Навпаки...'}
                  placeholderTextColor={colors.subtleText}
                  keyboardType={unlockChallenge.type === 'math' ? 'number-pad' : 'default'}
                  autoCapitalize={unlockChallenge.type === 'reverse' ? 'characters' : 'none'}
                  autoCorrect={false}
                  textAlign="center"
                  autoFocus
                />
              </>
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, !isUnlockCorrect && styles.confirmBtnDisabled]}
              onPress={isUnlockCorrect ? handleUnlockConfirm : undefined}>
              <Text style={[styles.confirmBtnText, !isUnlockCorrect && styles.confirmBtnTextDisabled]}>
                Вимкнути
              </Text>
            </TouchableOpacity>
            <Pressable style={styles.modalCancel} onPress={() => setUnlockTarget(null)}>
              <Text style={styles.modalCancelText}>Ні, нехай захищає</Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  greeting: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  setupBannerText: {
    flex: 1,
    gap: 2,
  },
  setupBannerTitle: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  setupBannerSub: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  setupBannerArrow: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '300',
  },
  protectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
  },
  protectionOn: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  protectionOff: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  protectionText: {
    flex: 1,
  },
  protectionLabel: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  protectionSub: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  contactsSection: {
    gap: 8,
    paddingTop: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSub: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 4,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalCancel: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 14,
  },
  confirmSheet: {
    paddingBottom: 32,
  },
  confirmText: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: colors.border,
  },
  confirmBtnText: {
    color: colors.onPrimary,
    fontFamily: fonts.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtnTextDisabled: {
    color: colors.subtleText,
  },
  unlockSheet: {
    paddingBottom: 32,
    gap: 12,
  },
  unlockQuestion: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 4,
  },
  unlockInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  unlockInputCorrect: {
    borderColor: colors.primary,
  },
  nightReport: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  nightReportTitle: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nightReportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nightReportName: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  nightReportCount: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
