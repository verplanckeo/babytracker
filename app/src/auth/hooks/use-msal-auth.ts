import { useEffect, useState, useCallback } from "react";
import {
  type AccountInfo,
  type AuthenticationResult,
  type SilentRequest,
  type RedirectRequest,
  type EventMessage,
  EventType
} from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { LogError, LogWarn } from "../../services/logging.service";


/**
 * Response returned by useMsalAuth hook.
 */
export interface UseMsalAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  account: AccountInfo | null;
  token: string | null;
  acquiringToken: boolean;
  acquireToken: (scopes: string[]) => Promise<string | null>;
  loginRedirect: (request?: RedirectRequest) => void;
  logoutRedirect: () => void;
}

/**
 * Custom hook to manage MSAL authentication, token acquisition, login and logout redirects.
 */
export const useMsalAuth = (): UseMsalAuthResult => {
  const { instance, accounts } = useMsal();
  const [token, setToken] = useState<string | null>(null);
  const [acquiringToken, setAcquiringToken] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const account = accounts && accounts.length > 0 ? accounts[0] : null;
  const isAuthenticated = !!account;
  const isLoading = acquiringToken || initializing;


  useEffect(() => {
    // Set initializing to false once MSAL has determined auth state
    if (accounts !== undefined) {
      setInitializing(false);
    }
  }, [accounts]);

  /**
   * Acquire token silently, or fallback to redirect if necessary.
   * @param scopes Scopes to request in the token.
   */
  const acquireToken = useCallback(
    async (scopes: string[]): Promise<string | null> => {
      if (!account) return null;
      setAcquiringToken(true);

      const silentRequest: SilentRequest = {
        account,
        scopes,
      };
      try {
        const response: AuthenticationResult = await instance.acquireTokenSilent(silentRequest);
        setToken(response.accessToken);
        return response.accessToken;
      } catch (error) {
        LogWarn("Error on callback after login. Fallback to redirect ...", error);
        // Fallback to redirect
        const redirectRequest: RedirectRequest = {
          scopes,
        };
        instance.acquireTokenRedirect(redirectRequest);
        return null;
      } finally {
        setAcquiringToken(false);
      }
    },
    [instance, account]
  );

  /**
   * Initiates login redirect flow.
   * @param request Optional redirect request configuration.
   */
  const loginRedirect = useCallback(
    (request?: RedirectRequest) => instance.loginRedirect(request),
    [instance]
  );

  /**
   * Initiates logout redirect flow.
   */
  const logoutRedirect = useCallback(
    () => instance.logoutRedirect(),
    [instance]
  );

  /**
   * Listen to MSAL events for handling login and token acquisition events.
   */
  useEffect(() => {
    const callbackId = instance.addEventCallback((event: EventMessage) => {
      switch (event.eventType) {
        case EventType.LOGIN_SUCCESS: {
          const authResult = event.payload as AuthenticationResult;
          setToken(authResult.accessToken);
          break;
        }
        case EventType.ACQUIRE_TOKEN_SUCCESS: {
          const tokenResult = event.payload as AuthenticationResult;
          setToken(tokenResult.accessToken);
          break;
        }
        case EventType.LOGIN_FAILURE:
        case EventType.ACQUIRE_TOKEN_FAILURE:
          // You may want to log or display error
          LogError("Error on callback after login.", event.error);
          break;
        default:
          break;
      }
    });


    return () => {
      if(callbackId)
        instance.removeEventCallback(callbackId);
    }
  }, [instance]);

  /**
   * Auto-acquire default scopes on authentication.
   */
  useEffect(() => {
    if (isAuthenticated && account) {
      // Acquire default "openid" and "profile" scopes
      acquireToken(["openid", "profile"]);
    }
  }, [isAuthenticated, account, acquireToken]);

  useEffect(() => {
    if (!account) {
      setToken(null);
    }
  }, [account]);

  return {
    isAuthenticated,
    isLoading,
    account,
    token,
    acquiringToken,
    acquireToken,
    loginRedirect,
    logoutRedirect,
  };
};
