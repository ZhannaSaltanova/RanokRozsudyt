import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BackButton} from '../components/BackButton';
import {useBlockedContacts} from '../context/ContactsContext';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {getTimeLeftLabel} from '../types/contact';
import {formatPhoneDisplay} from '../utils/phoneUtils';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BlockedContacts'>;

export function BlockedContactsScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const {contacts, isLoading, removeContact, attempts} = useBlockedContacts();

  const confirmRemove = (id: string, name: string) => {
    Alert.alert(
      'Видалити контакт?',
      `"${name}" більше не буде заблокований.`,
      [
        {text: 'Скасувати', style: 'cancel'},
        {text: 'Видалити', style: 'destructive', onPress: () => removeContact(id)},
      ],
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.eyebrow}>Захист увімкнено</Text>
        <Text style={styles.title}>Заблоковані контакти</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddContact')}>
          <Text style={styles.addBtnText}>+ Додати контакт</Text>
        </Pressable>
      </View>

      {isLoading ? null : contacts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.emptyTitle}>Список порожній</Text>
          <Text style={styles.emptySub}>
            Додай контакти, яким краще не писати після опівночі
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={contacts}
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            const attemptCount = attempts.filter(
              a => a.contactId === item.id && a.timestamp > Date.now() - 86400000,
            ).length;

            const attemptsLabel =
              attemptCount === 1
                ? '1 спроба сьогодні'
                : attemptCount < 5
                ? `${attemptCount} спроби сьогодні`
                : `${attemptCount} спроб сьогодні`;

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarText}>
                      {item.name[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    {item.phone ? (
                      <Text style={styles.contactPhone}>
                        {formatPhoneDisplay(item.phone)}
                      </Text>
                    ) : null}
                    <Text style={styles.reason}>{item.reason}</Text>
                  </View>
                  <Text style={styles.badge}>
                    {getTimeLeftLabel(item.blockedUntil)}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  {attemptCount > 0 ? (
                    <Text style={styles.attemptsBadge}>{attemptsLabel}</Text>
                  ) : (
                    <View />
                  )}
                  <View style={styles.cardActions}>
                    <Pressable
                      hitSlop={8}
                      onPress={() =>
                        navigation.navigate('AddContact', {contactId: item.id})
                      }>
                      <Text style={styles.editBtnText}>Редагувати</Text>
                    </Pressable>
                    <Pressable
                      hitSlop={8}
                      onPress={() => confirmRemove(item.id, item.name)}>
                      <Text style={styles.removeBtnText}>Видалити</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  eyebrow: {
    marginBottom: 6,
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  addBtnText: {
    color: colors.onPrimary,
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 40,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  cardAvatarText: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  contactPhone: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 13,
  },
  reason: {
    marginTop: 2,
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    fontFamily: fonts.primary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attemptsBadge: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  editBtnText: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  removeBtnText: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
