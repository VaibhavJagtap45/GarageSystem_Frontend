import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

export const saveToken = (token) => AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
export const getToken = async () => AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
export const saveTokenExpiry = (expiresAt) =>
  expiresAt
    ? AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt)
    : AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
export const getTokenExpiry = async () =>
  AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);

export const saveUser = (user) => AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
export const getUser = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

export const saveGarage = (garage) => AsyncStorage.setItem(STORAGE_KEYS.GARAGE, JSON.stringify(garage));
export const getGarage = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.GARAGE);
  return raw ? JSON.parse(raw) : null;
};

export const clearStorage = () => AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
