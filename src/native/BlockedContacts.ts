import {NativeModules, Platform} from 'react-native';

const {BlockedContactsModule} = NativeModules;

export type BlockedCallInfo = {
  contactId: string;
  contactName: string;
  contactReason: string;
  contactNote: string;
};

type ContactEntry = {
  id: string;
  name: string;
  phone: string;
  reason: string;
};

const isAndroid = Platform.OS === 'android';

export const BlockedContacts = {
  syncBlockedList(contacts: ContactEntry[], isProtectionOn: boolean): void {
    if (!isAndroid || !BlockedContactsModule) {return;}
    BlockedContactsModule.syncBlockedList(contacts, isProtectionOn);
  },

  async getPendingBlockedCall(): Promise<BlockedCallInfo | null> {
    if (!isAndroid || !BlockedContactsModule) {return null;}
    return BlockedContactsModule.getPendingBlockedCall();
  },

  async isCallRedirectionRoleGranted(): Promise<boolean> {
    if (!isAndroid || !BlockedContactsModule) {return false;}
    return BlockedContactsModule.isCallRedirectionRoleGranted();
  },

  async requestCallRedirectionRole(): Promise<void> {
    if (!isAndroid || !BlockedContactsModule) {return;}
    return BlockedContactsModule.requestCallRedirectionRole();
  },
};
