import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppButton} from '../components/AppButton';
import {useBlockedContacts} from '../context/ContactsContext';
import {DailyPredictionCard} from '../components/DailyPredictionCard';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {getGreeting} from '../utils/greeting';
import {PARTY_MODE_OPTIONS, PartyModeDuration} from '../types/lock';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const {isProtectionOn, setProtectionOn, partyMode, isPartyModeActive, activatePartyMode, deactivatePartyMode} = useBlockedContacts();
  const greeting = getGreeting();
  const [showPartyModal, setShowPartyModal] = useState(false);

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

        {/* Статус захисту */}
        <Pressable
          style={[
            styles.protectionCard,
            isProtectionOn ? styles.protectionOn : styles.protectionOff,
          ]}
          onPress={() => setProtectionOn(!isProtectionOn)}>
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
          <Text style={styles.protectionIcon}>
            {isProtectionOn ? '🛡️' : '💤'}
          </Text>
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

        {/* Party Mode */}
        <View style={styles.partySection}>
          <Text style={styles.sectionTitle}>Ручний захист</Text>
          {isPartyModeActive && partyMode ? (
            <View style={styles.partyActiveCard}>
              <View style={styles.partyActiveInfo}>
                <Text style={styles.partyActiveLabel}>{partyMode.label}</Text>
                <Text style={styles.partyActiveSub}>
                  Активно до {formatTime(partyMode.activeUntil)}
                </Text>
              </View>
              <Pressable style={styles.partyDeactivateBtn} onPress={deactivatePartyMode}>
                <Text style={styles.partyDeactivateBtnText}>Вимкнути</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.partyActivateBtn}
              onPress={() => setShowPartyModal(true)}>
              <Text style={styles.partyActivateBtnText}>🍷 Увімкнути захист</Text>
            </Pressable>
          )}
        </View>

      </ScrollView>

      {/* Modal вибору режиму */}
      <Modal
        visible={showPartyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPartyModal(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPartyModal(false)}>
          <Pressable style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Обери режим захисту</Text>
            {PARTY_MODE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.label}
                style={styles.modalOption}
                onPress={() => {
                  activatePartyMode(opt.duration as PartyModeDuration, opt.label);
                  setShowPartyModal(false);
                }}>
                <Text style={styles.modalOptionLabel}>{opt.label}</Text>
                <Text style={styles.modalOptionDesc}>{opt.description}</Text>
              </TouchableOpacity>
            ))}
            <Pressable
              style={styles.modalCancel}
              onPress={() => setShowPartyModal(false)}>
              <Text style={styles.modalCancelText}>Скасувати</Text>
            </Pressable>
          </Pressable>
        </Pressable>
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
    backgroundColor: '#0F2E0A',
    borderColor: colors.primary + '60',
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
  protectionIcon: {
    fontSize: 32,
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
  partySection: {
    gap: 8,
    paddingTop: 8,
  },
  partyActivateBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  partyActivateBtnText: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  partyActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  partyActiveInfo: {gap: 2},
  partyActiveLabel: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  partyActiveSub: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 13,
  },
  partyDeactivateBtn: {paddingVertical: 6, paddingHorizontal: 4},
  partyDeactivateBtnText: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 13,
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
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  modalOptionLabel: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  modalOptionDesc: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 13,
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
});
