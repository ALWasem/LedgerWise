import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { usePlaidLink as usePlaidLinkWeb } from 'react-plaid-link';
import type { PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';
import { createPlaidLinkToken, exchangePlaidToken } from '../api/client';

interface UsePlaidLinkReturn {
  openPlaidLink: () => void;
  linkLoading: boolean;
  enrolling: boolean;
}

export function usePlaidLink(
  token: string | null,
  onSuccess: () => void,
  onError: (message: string) => void,
): UsePlaidLinkReturn {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handlePlaidSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken) => {
      setEnrolling(true);
      try {
        await exchangePlaidToken(tokenRef.current!, publicToken);
        if (mountedRef.current) onSuccessRef.current();
      } catch (err) {
        if (mountedRef.current) {
          onErrorRef.current(
            err instanceof Error ? err.message : 'Failed to link account',
          );
        }
      } finally {
        if (mountedRef.current) {
          setEnrolling(false);
          setLinkToken(null);
        }
      }
    },
    [],
  );

  const handlePlaidExit: PlaidLinkOnExit = useCallback(() => {
    setLinkToken(null);
  }, []);

  const { open: openPlaidLinkWeb, ready } = usePlaidLinkWeb({
    token: linkToken,
    onSuccess: handlePlaidSuccess,
    onExit: handlePlaidExit,
  });

  const openPlaidLink = useCallback(async () => {
    if (!tokenRef.current) {
      onErrorRef.current('Not authenticated');
      return;
    }

    setLinkLoading(true);
    try {
      const newLinkToken = await createPlaidLinkToken(tokenRef.current);
      if (mountedRef.current) setLinkToken(newLinkToken);
    } catch (err) {
      if (mountedRef.current) {
        onErrorRef.current(
          err instanceof Error ? err.message : 'Failed to initialize bank connection',
        );
        setLinkLoading(false);
      }
    }
  }, []);

  // Auto-open Plaid Link when link token is set and SDK is ready (web only)
  const hasOpened = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web' && linkToken && ready && hasOpened.current !== linkToken) {
      hasOpened.current = linkToken;
      setLinkLoading(false);
      openPlaidLinkWeb();
    }
  }, [linkToken, ready, openPlaidLinkWeb]);

  return { openPlaidLink, linkLoading, enrolling };
}
