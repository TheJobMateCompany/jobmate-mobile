/**
 * Tests — useAuth hook
 * Phase 7.4
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/context/AuthContext';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock expo-router
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthProvider, null, children);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAuth', () => {
  it('starts with token null and user null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Wait for async rehydration to finish
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('isLoading resolves to false after mount', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('provides login and logout functions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('login sets token and user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const fakeUser = {
      id: 'u1',
      email: 'test@example.com',
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      role: 'CANDIDATE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: null,
    };
    // Use a non-expired JWT (fake — just needs to not be expired)
    // Header.Payload.Signature where exp is far in the future
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ sub: 'u1', exp: futureExp }));
    const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`;

    await act(async () => {
      await result.current.login(fakeToken, fakeUser);
    });

    expect(result.current.token).toBe(fakeToken);
    expect(result.current.user?.email).toBe('test@example.com');
  });
});
