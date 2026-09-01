import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../schemas/auth.schema';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  submitVerification: (status: 'UNVERIFIED' | 'PENDING_UPLOAD' | 'PENDING' | 'APPROVED' | 'REJECTED') => Promise<void>;
  selectedMode: 'GIG' | 'HIRING' | null;
  setSelectedMode: (mode: 'GIG' | 'HIRING') => void;
  updateAccountMode: (mode: 'GIG' | 'HIRING' | 'BOTH') => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true until hydrated
  selectedMode: null,

  setUser: (user) => {
    // Determine the initial selected mode based on accountMode
    let initialSelectedMode: 'GIG' | 'HIRING' | null = null;
    if (user) {
      if (user.accountMode === 'GIG') initialSelectedMode = 'GIG';
      else if (user.accountMode === 'HIRING') initialSelectedMode = 'HIRING';
      // If BOTH, we will try to load from SecureStore in hydrate, otherwise default to GIG later
    }
    set({ user, isAuthenticated: !!user, selectedMode: initialSelectedMode || get().selectedMode });
  },

  login: async (accessToken, refreshToken, user) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('userProfile', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userProfile');
    set({ user: null, isAuthenticated: false });
  },

  submitVerification: async (status) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, verificationStatus: status };
      SecureStore.setItemAsync('userProfile', JSON.stringify(updatedUser)).catch(console.error);
      return { user: updatedUser };
    });
  },

  setSelectedMode: (mode) => {
    set({ selectedMode: mode });
    SecureStore.setItemAsync('selectedMode', mode).catch(console.error);
  },

  updateAccountMode: async (mode) => {
    set((state) => {
      if (!state.user) return state;
      const initialSelected = mode === 'BOTH' ? (state.selectedMode || 'GIG') : mode;
      const updatedUser = { ...state.user, accountMode: mode };
      SecureStore.setItemAsync('userProfile', JSON.stringify(updatedUser)).catch(console.error);
      return {
        user: updatedUser,
        selectedMode: initialSelected,
      };
    });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        const userJson = await SecureStore.getItemAsync('userProfile');
        let currentUser = userJson ? JSON.parse(userJson) : null;
        
        // Optimistically set authenticated state
        set({ isAuthenticated: true, user: currentUser });

        try {
          const { verificationApi } = require('../api/verification.api');
          const statusData = await verificationApi.getStatus();
          if (currentUser) {
            currentUser = { ...currentUser, verificationStatus: statusData.verificationStatus };
            await SecureStore.setItemAsync('userProfile', JSON.stringify(currentUser));
            set({ user: currentUser });
          }
        } catch (apiErr) {
          console.warn('Failed to fetch fresh verification status, using cached state', apiErr);
        }

        const savedMode = await SecureStore.getItemAsync('selectedMode');
        if (savedMode === 'GIG' || savedMode === 'HIRING') {
          set({ selectedMode: savedMode });
        } else {
          set({ selectedMode: 'GIG' });
        }
      }
    } catch (e) {
      console.error('Failed to hydrate auth state', e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
