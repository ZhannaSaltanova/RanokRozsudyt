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

const STORAGE_KEY = '@blocked_contacts';

type ContactsContextType = {
  contacts: BlockedContact[];
  isLoading: boolean;
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

  // Завантаження при старті
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(json => {
        if (json) {
          const parsed: BlockedContact[] = JSON.parse(json);
          const active = parsed.filter(
            c => c.blockedUntil === null || c.blockedUntil > Date.now(),
          );
          setContacts(active);
        }
      })
      .finally(() => setIsLoading(false));
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
        phone: params.phone,
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
            phone: params.phone,
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
      value={{contacts, isLoading, addContact, removeContact, updateContact}}>
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
