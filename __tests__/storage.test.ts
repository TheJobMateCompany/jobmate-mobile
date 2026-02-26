import {
  deletePreference,
  deleteToken,
  getPreference,
  getToken,
  savePreference,
  saveToken,
  STORAGE_KEYS,
} from '../src/lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

describe('storage wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveToken/getToken/deleteToken use SecureStore with AUTH_TOKEN key', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('token-123');

    await saveToken('token-123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN, 'token-123');

    const token = await getToken();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
    expect(token).toBe('token-123');

    await deleteToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
  });

  it('savePreference/getPreference/deletePreference proxy AsyncStorage', async () => {
    await savePreference(STORAGE_KEYS.LANG, 'fr');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.LANG, 'fr');

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('fr');
    const lang = await getPreference(STORAGE_KEYS.LANG);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.LANG);
    expect(lang).toBe('fr');

    await deletePreference(STORAGE_KEYS.LANG);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.LANG);
  });
});
