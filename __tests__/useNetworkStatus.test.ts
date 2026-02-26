/**
 * Tests — useNetworkStatus hook
 * Phase 7.4
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock before imports are processed (hoisted by Babel)
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
    addEventListener: jest.fn(),
  },
}));

const mockedFetch = NetInfo.fetch as jest.MockedFunction<typeof NetInfo.fetch>;
const mockedAddEventListener = NetInfo.addEventListener as jest.MockedFunction<
  typeof NetInfo.addEventListener
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeState(isConnected: boolean, isInternetReachable: boolean) {
  return {
    isConnected,
    isInternetReachable,
    type: (isConnected
      ? 'wifi'
      : 'none') as import('@react-native-community/netinfo').NetInfoStateType,
    details: null,
    isConnectionExpensive: false,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAddEventListener.mockReturnValue(jest.fn());
  });

  it('starts with isLoading=true', () => {
    mockedFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isLoading).toBe(true);
  });

  it('resolves isLoading=false when connected', async () => {
    mockedFetch.mockResolvedValue(makeState(true, true) as never);
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isInternetReachable).toBe(true);
    expect(result.current.type).toBe('wifi');
  });

  it('correctly reflects offline state', async () => {
    mockedFetch.mockResolvedValue(makeState(false, false) as never);
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isInternetReachable).toBe(false);
  });

  it('calls NetInfo.addEventListener on mount and unsubscribes on unmount', () => {
    const unsub = jest.fn();
    mockedFetch.mockResolvedValue(makeState(true, true) as never);
    mockedAddEventListener.mockReturnValue(unsub);

    const { unmount } = renderHook(() => useNetworkStatus());
    expect(mockedAddEventListener).toHaveBeenCalledTimes(1);
    unmount();
    expect(unsub).toHaveBeenCalledTimes(1);
  });
});
