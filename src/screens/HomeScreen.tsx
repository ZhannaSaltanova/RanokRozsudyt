import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppButton} from '../components/AppButton';
import {useBlockedContacts} from '../context/ContactsContext';
import {DailyPredictionCard} from '../components/DailyPredictionCard';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {getGreeting} from '../utils/greeting';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const {isProtectionOn, setProtectionOn} = useBlockedContacts();
  const greeting = getGreeting();

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

      </ScrollView>
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
});
