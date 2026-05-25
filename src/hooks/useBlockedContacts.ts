import AsyncStorage from '@react-native-async-storage/async-storage';
import {useCallback, useEffect, useState} from 'react';
import {
  BlockedContact,
  BlockDuration,
  calcBlockedUntil,
} from '../types/contact';

const STORAGE_KEY = '@blocked_contacts';

export function useBlockedContacts() {
  const [contacts, setContacts] = useState<BlockedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Завантаження при старті
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(json => {
        if (json) {
          const parsed: BlockedContact[] = JSON.parse(json);
          // Видаляємо контакти з минулим строком блокування
          const active = parsed.filter(
            c => c.blockedUntil === null || c.blockedUntil > Date.now(),
          );
          setContacts(active);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Зберігання при кожній зміні
  const save = useCallback((updated: BlockedContact[]) => {
    setContacts(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addContact = useCallback(
    (params: {
      name: string;
      phone?: string;
      reason: string;
      note?: string;
      duration: BlockDuration;
    }) => {
      const newContact: BlockedContact = {
        id: Date.now().toString(),
        name: params.name,
        phone: params.phone,
        reason: params.reason,
        note: params.note,
        duration: params.duration,
        blockedUntil: calcBlockedUntil(params.duration),
        addedAt: Date.now(),
      };
      save([newContact, ...contacts]);
    },
    [contacts, save],
  );

  const removeContact = useCallback(
    (id: string) => {
      save(contacts.filter(c => c.id !== id));
    },
    [contacts, save],
  );

  const updateContact = useCallback(
    (id: string, params: {
      name: string;
      phone?: string;
      reason: string;
      note?: string;
      duration: BlockDuration;
    }) => {
      const updated = contacts.map(c => {
        if (c.id !== id) {return c;}
        return {
          ...c,
          name: params.name,
          phone: params.phone,
          reason: params.reason,
          note: params.note,
          duration: params.duration,
          blockedUntil: calcBlockedUntil(params.duration),
        };
      });
      save(updated);
    },
    [contacts, save],
  );

  return {contacts, isLoading, addContact, removeContact, updateContact};
}
