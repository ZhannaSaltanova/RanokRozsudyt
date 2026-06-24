import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

  type DeleteChallenge =
    | {type: 'reverse'; display: string; answer: string}
    | {type: 'math'; display: string; answer: number};

  const [deleteTarget, setDeleteTarget] = useState<{id: string; name: string} | null>(null);
  const [deleteChallenge, setDeleteChallenge] = useState<DeleteChallenge | null>(null);
  const [deleteInput, setDeleteInput] = useState('');

  const openDeleteTest = useCallback((id: string, name: string) => {
    const phrases = [
      'пауза зараз і назавжди',
      'не дзвони йому сьогодні',
      'час лягати спати зараз',
      'добра ніч і крапка',
      'ранок розсудить краще тебе',
      'стоп думай двічі потім дзвони',
    ];
    let challenge: DeleteChallenge;
    if (Math.random() > 0.5) {
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      const answer = phrase.split(' ').map(w => w.split('').reverse().join('')).join(' ');
      challenge = {type: 'reverse', display: phrase, answer};
    } else {
      let a: number, b: number, c: number, d: number;
      do {
        a = Math.floor(Math.random() * 6) + 4;
        b = Math.floor(Math.random() * 6) + 4;
        c = Math.floor(Math.random() * 5) + 2;
        d = Math.floor(Math.random() * 5) + 2;
      } while (a * b - c * d <= 5);
      const useAdd = Math.random() > 0.6;
      challenge = useAdd
        ? {type: 'math', display: `${a} × ${b} + ${c} × ${d} = ?`, answer: a * b + c * d}
        : {type: 'math', display: `${a} × ${b} − ${c} × ${d} = ?`, answer: a * b - c * d};
    }
    setDeleteChallenge(challenge);
    setDeleteInput('');
    setDeleteTarget({id, name});
  }, []);

  const isDeleteCorrect = deleteChallenge !== null && (
    deleteChallenge.type === 'reverse'
      ? deleteInput.trim().toLowerCase() === deleteChallenge.answer
      : deleteInput.trim() !== '' && parseInt(deleteInput.trim(), 10) === deleteChallenge.answer
  );

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
          <Ionicons name="shield-outline" size={56} color={colors.subtleText} style={styles.emptyIcon} />
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
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('AddContact', {contactId: item.id})}>
                <View style={styles.cardTop}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarText}>
                      {item.name[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    {item.phones.length > 0 ? (
                      <Text style={styles.contactPhone}>
                        {item.phones.map(formatPhoneDisplay).join(' · ')}
                      </Text>
                    ) : null}
                    <Text style={styles.reason}>{item.reason}</Text>
                    {!!item.note && (
                      <Text style={styles.note}>{item.note}</Text>
                    )}
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
                  <Pressable onPress={() => openDeleteTest(item.id, item.name)}>
                    <Text style={styles.removeBtnText}>Видалити</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteTarget(null)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Видалити {deleteTarget?.name}?</Text>
            <Text style={styles.modalSub}>
              {deleteChallenge?.type === 'math'
                ? 'Розв\'яжи приклад щоб підтвердити 🧮'
                : 'Напиши кожне слово навпаки — подивимось, чи ти готова'}
            </Text>
            {deleteChallenge && (
              <>
                <Text style={styles.mathQuestion}>{deleteChallenge.display}</Text>
                <TextInput
                  style={[styles.mathInput, isDeleteCorrect && styles.mathInputCorrect]}
                  value={deleteInput}
                  onChangeText={setDeleteInput}
                  placeholder={deleteChallenge.type === 'math' ? 'Відповідь...' : 'Навпаки...'}
                  placeholderTextColor={colors.subtleText}
                  keyboardType={deleteChallenge.type === 'math' ? 'number-pad' : 'default'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="center"
                  autoFocus
                />
              </>
            )}
            <TouchableOpacity
              style={[styles.deleteBtn, !isDeleteCorrect && styles.deleteBtnDisabled]}
              onPress={isDeleteCorrect ? () => {
                removeContact(deleteTarget!.id);
                setDeleteTarget(null);
              } : undefined}>
              <Text style={[styles.deleteBtnText, !isDeleteCorrect && styles.deleteBtnTextDisabled]}>
                Видалити
              </Text>
            </TouchableOpacity>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setDeleteTarget(null)}>
              <Text style={styles.cancelBtnText}>Ні, нехай захищає</Text>
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
  note: {
    marginTop: 4,
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  mathQuestion: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 4,
  },
  mathInput: {
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
  mathInputCorrect: {
    borderColor: colors.primary,
  },
  deleteBtn: {
    backgroundColor: '#C62828',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteBtnDisabled: {
    backgroundColor: colors.border,
  },
  deleteBtnText: {
    color: '#fff',
    fontFamily: fonts.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtnTextDisabled: {
    color: colors.subtleText,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 14,
  },
});
