/**
 * Tests — useTheme hook
 * Phase 7.4
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../src/context/ThemeContext';
import { useTheme } from '../src/hooks/useTheme';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(ThemeProvider, null, children);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useTheme', () => {
  it('returns default mode as "system" after provider ready', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    // ThemeProvider returns null until AsyncStorage resolves — wait for it
    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });
    expect(result.current.mode).toBe('system');
  });

  it('exposes colors, typography, spacing, radius, shadows', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.colors).toBeDefined();
    expect(result.current.typography).toBeDefined();
    expect(result.current.spacing).toBeDefined();
    expect(result.current.radius).toBeDefined();
    expect(result.current.shadows).toBeDefined();
  });

  it('exposes setMode function', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(typeof result.current.setMode).toBe('function');
  });

  it('isDark is a boolean', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(typeof result.current.isDark).toBe('boolean');
  });
});
