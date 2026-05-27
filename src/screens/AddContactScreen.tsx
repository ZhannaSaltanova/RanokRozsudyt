import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Contacts from 'react-native-contacts';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppButton} from '../components/AppButton';
import {BackButton} from '../components/BackButton';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {BlockDuration, DURATION_LABELS} from '../types/contact';
import {useBlockedContacts} from '../context/ContactsContext';
import {validatePhone} from '../utils/phoneUtils';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddContact'>;
type Route = RouteProp<RootStackParamList, 'AddContact'>;

type PhoneContact = {
  recordID: string;
  displayName: string;
  phoneNumbers: {number: string}[];
};

// Модульний кеш — контакти завантажуються один раз за сесію
let cachedContacts: PhoneContact[] | null = null;

const DURATIONS: BlockDuration[] = ['morning', '3days', '7days', 'forever'];

const REASON_SUGGESTIONS = [
  'Краще зачекати до ранку',
  'Пауза перед важливою розмовою',
  'Емоції ще надто свіжі',
  'Просто для підстраховки',
];

export function AddContactScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const contactId = route.params?.contactId;

  const {addContact, updateContact, contacts} = useBlockedContacts();
  const editingContact = contactId
    ? contacts.find(c => c.id === contactId)
    : undefined;
  const isEditing = !!editingContact;

  const [mode, setMode] = useState<'choose' | 'phonebook' | 'manual'>('choose');
  const editInitialized = useRef(false);

  // Phone book picker state
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>(
    cachedContacts ?? [],
  );
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<PhoneContact | null>(null);

  // Form fields
  const [name, setName] = useState('');   // прізвисько
  const [phone, setPhone] = useState(''); // номер (тільки якщо нема в книзі)
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');   // крик душі
  const [duration, setDuration] = useState<BlockDuration>('morning');

  // Заповнюємо поля при редагуванні — чекаємо поки contacts завантажиться
  useEffect(() => {
    if (editingContact && !editInitialized.current) {
      editInitialized.current = true;
      setName(editingContact.name);
      setPhone(editingContact.phone ?? '');
      setReason(editingContact.reason);
      setNote(editingContact.note ?? '');
      setDuration(editingContact.duration);
      setPhoneError(null);
      setMode(editingContact.phone ? 'phonebook' : 'manual');
    }
  }, [editingContact]);

  const loadPhoneContacts = async () => {
    // Кеш є — миттєво
    if (cachedContacts) {
      setPhoneContacts(cachedContacts);
      return;
    }

    setLoadingContacts(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setLoadingContacts(false);
          return;
        }
      }
      const all = await Contacts.getAll();
      const filtered = all
        .filter(c => c.phoneNumbers.length > 0)
        .map(c => ({
          recordID: c.recordID,
          displayName:
            c.displayName || `${c.givenName} ${c.familyName}`.trim(),
          phoneNumbers: c.phoneNumbers,
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'uk'));

      cachedContacts = filtered; // зберігаємо в кеш
      setPhoneContacts(filtered);
    } finally {
      setLoadingContacts(false);
    }
  };

  const openPhonebook = () => {
    setMode('phonebook');
    loadPhoneContacts();
  };

  const filteredContacts = phoneContacts.filter(c =>
    c.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  // Чи є номер телефону (з книги або вже збережений)
  const hasPhone =
    isEditing
      ? !!editingContact?.phone
      : mode === 'phonebook' && !!selectedContact;

  const canSave = (isEditing
    ? name.trim().length > 0
    : mode === 'phonebook'
    ? !!selectedContact
    : name.trim().length > 0) && !phoneError;

  const handleSave = () => {
    // Фінальна перевірка номера перед збереженням
    const error = validatePhone(phone);
    if (error) {
      setPhoneError(error);
      return;
    }

    if (!canSave) {return;}

    const finalName =
      name.trim() ||
      (!isEditing && selectedContact ? selectedContact.displayName : '') ||
      editingContact?.name ||
      '';

    if (!finalName) {return;}

    if (isEditing && editingContact) {
      updateContact(editingContact.id, {
        name: finalName,
        phone: editingContact.phone ?? (phone.trim() || undefined),
        reason: reason.trim() || editingContact.reason,
        note: note.trim() || undefined,
        duration,
      });
    } else {
      addContact({
        name: finalName,
        phone:
          mode === 'phonebook'
            ? selectedContact?.phoneNumbers[0]?.number
            : phone.trim() || undefined,
        reason: reason.trim() || REASON_SUGGESTIONS[0],
        note: note.trim() || undefined,
        duration,
      });
    }
    navigation.goBack();
  };

  // ─── Вибір способу (лише для нових) ────────────────────────
  if (mode === 'choose' && !isEditing) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Додати контакт</Text>
          <Text style={styles.subtitle}>Як хочеш додати?</Text>
        </View>
        <View style={styles.chooseCards}>
          <Pressable style={styles.chooseCard} onPress={openPhonebook}>
            <Text style={styles.chooseIcon}>📱</Text>
            <Text style={styles.chooseLabel}>З телефонної книги</Text>
            <Text style={styles.chooseSub}>Вибрати з існуючих контактів</Text>
          </Pressable>
          <Pressable
            style={styles.chooseCard}
            onPress={() => setMode('manual')}>
            <Text style={styles.chooseIcon}>✏️</Text>
            <Text style={styles.chooseLabel}>Вручну</Text>
            <Text style={styles.chooseSub}>Ввести прізвисько і номер самостійно</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Вибір контакту з книги ─────────────────────────────────
  if (mode === 'phonebook' && !selectedContact && !isEditing) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <BackButton onPress={() => setMode('choose')} />
          <Text style={styles.title}>Вибрати контакт</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Пошук..."
            placeholderTextColor={colors.subtleText}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loadingContacts ? (
          <ActivityIndicator color={colors.primary} style={{marginTop: 40}} />
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={item => item.recordID}
            contentContainerStyle={styles.contactsList}
            renderItem={({item}) => (
              <Pressable
                style={styles.contactRow}
                onPress={() => setSelectedContact(item)}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>
                    {item.displayName[0]?.toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.contactName}>{item.displayName}</Text>
                  <Text style={styles.contactPhone}>
                    {item.phoneNumbers[0]?.number}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // ─── Форма ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.formScroll}
        keyboardShouldPersistTaps="handled">

        <BackButton
          onPress={() => {
            if (isEditing) {navigation.goBack();}
            else if (mode === 'manual') {setMode('choose');}
            else {setSelectedContact(null);}
          }}
        />

        <Text style={styles.title}>
          {isEditing ? 'Редагувати контакт' : 'Налаштувати блокування'}
        </Text>

        {/* Контакт з книги — картка (тільки новий) */}
        {!isEditing && mode === 'phonebook' && selectedContact && (
          <View style={styles.section}>
            <Text style={styles.label}>Контакт з книги</Text>
            <View style={styles.selectedContactRow}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>
                  {selectedContact.displayName[0]?.toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.selectedName}>
                  {selectedContact.displayName}
                </Text>
                <Text style={styles.contactPhone}>
                  {selectedContact.phoneNumbers[0]?.number}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Номер (тільки редагування з наявним номером — показуємо як read-only) */}
        {isEditing && editingContact?.phone && (
          <View style={styles.section}>
            <Text style={styles.label}>Номер телефону</Text>
            <View style={styles.phoneReadOnly}>
              <Text style={styles.phoneReadOnlyText}>{editingContact.phone}</Text>
            </View>
          </View>
        )}

        {/* Прізвисько — завжди */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {hasPhone ? 'Прізвисько' : 'Прізвисько або ім\'я'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={
              hasPhone && !isEditing
                ? `${selectedContact?.displayName} (необов'язково)`
                : 'Як звати цю людину?'
            }
            placeholderTextColor={colors.subtleText}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Номер телефону — якщо нема (manual або edit без номера) */}
        {!hasPhone && (
          <View style={styles.section}>
            <Text style={styles.label}>Номер телефону</Text>
            <TextInput
              style={[styles.input, phoneError ? styles.inputError : null]}
              placeholder="0971234567"
              placeholderTextColor={colors.subtleText}
              value={phone}
              onChangeText={text => {
                setPhone(text);
                setPhoneError(validatePhone(text));
              }}
              onBlur={() => setPhoneError(validatePhone(phone))}
              keyboardType="phone-pad"
            />
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}
          </View>
        )}

        {/* Тривалість */}
        <View style={styles.section}>
          <Text style={styles.label}>Заблокувати на</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map(d => (
              <Pressable
                key={d}
                style={[
                  styles.durationChip,
                  duration === d && styles.durationChipActive,
                ]}
                onPress={() => setDuration(d)}>
                <Text
                  style={[
                    styles.durationChipText,
                    duration === d && styles.durationChipTextActive,
                  ]}>
                  {DURATION_LABELS[d]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Причина */}
        <View style={styles.section}>
          <Text style={styles.label}>Причина (необов'язково)</Text>
          <TextInput
            style={styles.input}
            placeholder="Навіщо блокуємо?"
            placeholderTextColor={colors.subtleText}
            value={reason}
            onChangeText={setReason}
          />
          <View style={styles.suggestions}>
            {REASON_SUGGESTIONS.map(s => (
              <Pressable
                key={s}
                style={styles.suggestionChip}
                onPress={() => setReason(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Крик душі */}
        <View style={styles.section}>
          <Text style={styles.label}>Крик душі 🫀</Text>
          <Text style={styles.labelHint}>Необов'язково. Тільки для тебе.</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder={'Що ти зараз відчуваєш? Вилий сюди.'}
            placeholderTextColor={colors.subtleText}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <AppButton
          label={isEditing ? 'Зберегти' : 'Заблокувати'}
          onPress={handleSave}
          disabled={!canSave}
        />
      </ScrollView>
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
    paddingBottom: 12,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 24,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  chooseCards: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  chooseCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 4,
  },
  chooseIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  chooseLabel: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  chooseSub: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 14,
  },
  chooseLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 16,
    marginTop: 12,
  },
  contactsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  contactName: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  contactPhone: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 13,
    marginTop: 2,
  },
  selectedContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  selectedName: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  phoneReadOnly: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  phoneReadOnlyText: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 16,
  },
  section: {
    gap: 10,
  },
  label: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#E05555',
  },
  errorText: {
    color: '#E05555',
    fontFamily: fonts.primary,
    fontSize: 12,
    marginTop: -4,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  durationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationChipText: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  durationChipTextActive: {
    color: colors.onPrimary,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  suggestionText: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 13,
  },
  labelHint: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 12,
    marginTop: -6,
  },
  noteInput: {
    minHeight: 100,
    paddingTop: 14,
  },
});
