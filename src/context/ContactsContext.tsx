import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {BlockedContacts} from '../native/BlockedContacts';
import {
  BlockedContact,
  BlockDuration,
  calcBlockedUntil,
} from '../types/contact';
import {
  AttemptLog,
  PartyMode,
  PartyModeDuration,
  calcPartyModeUntil,
} from '../types/lock';
import {normalizePhone} from '../utils/phoneUtils';

const STORAGE_KEY = '@blocked_contacts';
const PROTECTION_KEY = '@protection_on';
const ATTEMPT_LOGS_KEY = '@attempt_logs';
const PARTY_MODE_KEY = '@party_mode';

type ContactParams = {
  name: string;
  phones?: string[];
  reason: string;
  note?: string;
  duration: BlockDuration;
  customHours?: number;
};

type ContactsContextType = {
  contacts: BlockedContact[];
  isLoading: boolean;
  isProtectionOn: boolean;
  setProtectionOn: (value: boolean) => void;
  addContact: (params: ContactParams) => void;
  removeContact: (id: string) => void;
  updateContact: (id: string, params: ContactParams) => void;
  attempts: AttemptLog[];
  partyMode: PartyMode | null;
  isPartyModeActive: boolean;
  logAttempt: (log: Omit<AttemptLog, 'id'>) => void;
  activatePartyMode: (duration: PartyModeDuration, label: string) => void;
  deactivatePartyMode: () => void;
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
  const [attempts, setAttempts] = useState<AttemptLog[]>([]);
  const [partyMode, setPartyMode] = useState<PartyMode | null>(null);

  const isPartyModeActive =
    partyMode !== null && partyMode.activeUntil > Date.now();

  // Sync to SharedPreferences whenever contacts or protection state changes
  // so CallBlockerService can read them without going through React Native
  useEffect(() => {
    if (isLoading) {return;}
    const entries = contacts
      .filter(c => c.phones.length > 0)
      .flatMap(c =>
        c.phones.map(phone => ({
          id: c.id,
          name: c.name,
          phone,
          reason: c.reason,
          note: c.note ?? '',
        })),
      );
    BlockedContacts.syncBlockedList(entries, isProtectionOn);
  }, [contacts, isProtectionOn, isLoading]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(PROTECTION_KEY),
      AsyncStorage.getItem(ATTEMPT_LOGS_KEY),
      AsyncStorage.getItem(PARTY_MODE_KEY),
    ]).then(([contactsJson, protectionJson, attemptsJson, partyModeJson]) => {
      if (contactsJson) {
        try {
          const parsed = JSON.parse(contactsJson) as (BlockedContact & {phone?: string})[];
          const migrated: BlockedContact[] = parsed.map(c => ({
            ...c,
            phones: c.phones ?? (c.phone ? [c.phone] : []),
          }));
          const active = migrated.filter(
            c => c.blockedUntil === null || c.blockedUntil > Date.now(),
          );
          setContacts(active);
        } catch {
          AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
      if (protectionJson !== null) {
        try {
          setIsProtectionOn(JSON.parse(protectionJson));
        } catch {}
      }
      if (attemptsJson) {
        try {
          setAttempts(JSON.parse(attemptsJson));
        } catch {
          AsyncStorage.removeItem(ATTEMPT_LOGS_KEY);
        }
      }
      if (partyModeJson) {
        try {
          setPartyMode(JSON.parse(partyModeJson));
        } catch {
          AsyncStorage.removeItem(PARTY_MODE_KEY);
        }
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const setProtectionOn = useCallback((value: boolean) => {
    setIsProtectionOn(value);
    AsyncStorage.setItem(PROTECTION_KEY, JSON.stringify(value));
  }, []);

  const addContact = useCallback((params: ContactParams) => {
    const newContact: BlockedContact = {
      id: Date.now().toString(),
      name: params.name,
      phones: (params.phones ?? []).map(normalizePhone).filter(Boolean),
      reason: params.reason,
      note: params.note,
      duration: params.duration,
      customHours: params.customHours,
      blockedUntil: calcBlockedUntil(params.duration, params.customHours),
      addedAt: Date.now(),
    };
    setContacts(prev => {
      const updated = [newContact, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeContact = useCallback((id: string) => {
    setContacts(prev => {
      const updated = prev.filter(c => c.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateContact = useCallback((id: string, params: ContactParams) => {
    setContacts(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) {return c;}
        return {
          ...c,
          name: params.name,
          phones: (params.phones ?? c.phones ?? []).map(normalizePhone).filter(Boolean),
          reason: params.reason,
          note: params.note,
          duration: params.duration,
          customHours: params.customHours,
          blockedUntil: calcBlockedUntil(params.duration, params.customHours),
        };
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logAttempt = useCallback((log: Omit<AttemptLog, 'id'>) => {
    const newLog: AttemptLog = {...log, id: Date.now().toString()};
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    setAttempts(prev => {
      const updated = [newLog, ...prev].filter(a => a.timestamp > cutoff);
      AsyncStorage.setItem(ATTEMPT_LOGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const activatePartyMode = useCallback(
    (duration: PartyModeDuration, label: string) => {
      const newPartyMode: PartyMode = {
        label,
        duration,
        activatedAt: Date.now(),
        activeUntil: calcPartyModeUntil(duration),
      };
      setPartyMode(newPartyMode);
      AsyncStorage.setItem(PARTY_MODE_KEY, JSON.stringify(newPartyMode));
    },
    [],
  );

  const deactivatePartyMode = useCallback(() => {
    setPartyMode(null);
    AsyncStorage.removeItem(PARTY_MODE_KEY);
  }, []);

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        isLoading,
        isProtectionOn,
        setProtectionOn,
        addContact,
        removeContact,
        updateContact,
        attempts,
        partyMode,
        isPartyModeActive,
        logAttempt,
        activatePartyMode,
        deactivatePartyMode,
      }}>
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
