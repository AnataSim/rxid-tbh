import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  loginUser, logoutUser, registerUser, fetchUserProfile,
  type RegisterData,
} from '../services/authService';
import type { Role, User } from '../types/bounty';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  authError: string | null;
  activeRole: Role;
  tempRoleOverride: Role | null;
  toggleTemporaryRole: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  clearError: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser]   = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading]           = useState(true);
  const [authError, setAuthError]       = useState<string | null>(null);
  const [tempRoleOverride, setTempRoleOverride] = useState<Role | null>(null);

  // Listen to Firebase Auth state + Real-time Firestore user profile updates
  useEffect(() => {
    let userDocUnsub: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (userDocUnsub) {
        userDocUnsub();
        userDocUnsub = null;
      }

      if (fbUser) {
        // Initial fetch
        const profile = await fetchUserProfile(fbUser.uid);
        setCurrentUser(profile);

        // Real-time listener for user profile changes (bountyPoints, rank, etc.)
        userDocUnsub = onSnapshot(doc(db, 'users', fbUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const freshData = docSnap.data() as User;
            setCurrentUser(prev => prev ? { ...prev, ...freshData } : freshData);
          }
        }, (err) => {
          console.warn('Realtime user profile listener error:', err);
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (userDocUnsub) userDocUnsub();
    };
  }, []);

  // Compute activeRole (Default 'bounty_giver' if profile role is explicitly 'bounty_giver', otherwise 'bounty_hunter' (TBH))
  const defaultRole: Role = currentUser?.role === 'bounty_giver'
    ? 'bounty_giver'
    : 'bounty_hunter';

  const activeRole: Role = tempRoleOverride ?? defaultRole;

  const toggleTemporaryRole = useCallback(() => {
    setTempRoleOverride(prev => {
      const current = prev ?? defaultRole;
      return current === 'bounty_giver' ? 'bounty_hunter' : 'bounty_giver';
    });
  }, [defaultRole]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const profile = await loginUser(email, password);
      setCurrentUser(profile);
    } catch (err: any) {
      const msg = err.code ? friendlyError(err.code) : (err.message || 'Gagal login.');
      setAuthError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setCurrentUser(null);
    setFirebaseUser(null);
    setTempRoleOverride(null);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setAuthError(null);
    try {
      const profile = await registerUser(data);
      setCurrentUser(profile);
    } catch (err: any) {
      setAuthError(friendlyError(err.code));
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider value={{
      currentUser, firebaseUser, loading, authError,
      activeRole, tempRoleOverride, toggleTemporaryRole,
      login, logout, register, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ── Error messages ────────────────────────────────────────────────────────────

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found':        'Akun tidak ditemukan. Cek email kamu.',
    'auth/wrong-password':        'Password salah.',
    'auth/email-already-in-use':  'Email sudah terdaftar.',
    'auth/weak-password':         'Password terlalu lemah (minimal 6 karakter).',
    'auth/invalid-email':         'Format email tidak valid.',
    'auth/network-request-failed':'Gagal connect ke server. Cek koneksimu.',
    'auth/too-many-requests':     'Terlalu banyak percobaan. Coba lagi nanti.',
    'auth/invalid-credential':    'Email atau password salah.',
  };
  return map[code] ?? `Error: ${code}`;
}
