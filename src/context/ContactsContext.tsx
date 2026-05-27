import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  BlockedContact,
  BlockDuration,
  calcBlockedUntil,
} from '../types/contact';
import {normalizePhone} from '../utils/phoneUtils';

const STORAGE_KEY = '@blocked_contacts';
const PROTECTION_KEY = '@protection_on';

type ContactsContextType = {
  contacts: BlockedContact[];
  isLoading: boolean;
  isProtectionOn: boolean;
  setProtectionOn: (value: boolean) => void;
  addContact: (params: {
    name: string;
    phone?: string;
    reason: string;
    note?: string;
    duration: BlockDuration;
  }) => void;
  removeContact: (id: string) => void;
  updateContact: (
    id: string,
    params: {
      name: string;
      phone?: string;
      reason: string;
      note?: string;
      duration: BlockDuration;
    },
  ) => void;
};

const ContactsContext = createContext<ContactsContextType | null>(null);

export function ContactsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [contacts, setContacts] = useState<BlockedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProtectionOn, setIsProtectionOn] = useState(false);

  // Завантаження при старті
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(PROTECTION_KEY),
    ]).then(([contactsJson, protectionJson]) => {
      if (contactsJson) {
        try {
          const parsed: BlockedContact[] = JSON.parse(contactsJson);
          const active = parsed.filter(
            c => c.blockedUntil === null || c.blockedUntil > Date.now(),
          );
          setContacts(active);
        } catch {
          // Дані пошкоджені — починаємо з чистого списку
          AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
      if (protectionJson !== null) {
        try {
          setIsProtectionOn(JSON.parse(protectionJson));
        } catch {
          // Ігноруємо пошкоджений стан захисту
        }
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const setProtectionOn = useCallback((value: boolean) => {
    setIsProtectionOn(value);
    AsyncStorage.setItem(PROTECTION_KEY, JSON.stringify(value));
  }, []);

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
        phone: params.phone ? normalizePhone(params.phone) : undefined,
        reason: params.reason,
        note: params.note,
        duration: params.duration,
        blockedUntil: calcBlockedUntil(params.duration),
        addedAt: Date.now(),
      };
      setContacts(prev => {
        const updated = [newContact, ...prev];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  const removeContact = useCallback((id: string) => {
    setContacts(prev => {
      const updated = prev.filter(c => c.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateContact = useCallback(
    (
      id: string,
      params: {
        name: string;
        phone?: string;
        reason: string;
        note?: string;
        duration: BlockDuration;
      },
    ) => {
      setContacts(prev => {
        const updated = prev.map(c => {
          if (c.id !== id) {return c;}
          return {
            ...c,
            name: params.name,
            phone: params.phone ? normalizePhone(params.phone) : undefined,
            reason: params.reason,
            note: params.note,
            duration: params.duration,
            blockedUntil: calcBlockedUntil(params.duration),
          };
        });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  return (
    <ContactsContext.Provider
      value={{contacts, isLoading, isProtectionOn, setProtectionOn, addContact, removeContact, updateContact}}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useBlockedContacts(): ContactsContextType {
  const ctx = useContext(ContactsContext);
  if (!ctx) {
    throw new Error('useBlockedContacts must be used within ContactsProvider');
  }
  return ctx;
}
