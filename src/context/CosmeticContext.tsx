import React, { createContext, useContext, useState } from 'react';
import type { RankTier } from '../components/CowboyRankBadge';

export const RANK_PALETTES: Record<RankTier, string[]> = {
  Copper:   ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#ffffff'],
  Tungsten: ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#ffffff'],
  Silver:   ['#94a3b8', '#cbd5e1', '#e2e8f0', '#ffffff', '#f8fafc'],
  Gold:     ['#d97706', '#f59e0b', '#fbbf24', '#fef08a', '#ffffff'],
  Platinum: ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#ffffff'],
  Diamond:  ['#a855f7', '#c084fc', '#38bdf8', '#e879f9', '#ec4899', '#ffffff'],
};

export const DEFAULT_PALETTE = ['#ff7b00', '#f59e0b', '#38bdf8', '#ff66aa', '#c084fc', '#eab308'];

interface CosmeticContextType {
  equippedRankTier: RankTier | null;
  equipTier: (tier: RankTier) => void;
  unequipTier: () => void;
  toggleTier: (tier: RankTier) => void;
  getCursorPalette: () => string[];
}

const CosmeticContext = createContext<CosmeticContextType>({
  equippedRankTier: null,
  equipTier: () => {},
  unequipTier: () => {},
  toggleTier: () => {},
  getCursorPalette: () => DEFAULT_PALETTE,
});

const STORAGE_KEY = 'bountyosu_equipped_rank_tier';

export const CosmeticProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equippedRankTier, setEquippedRankTier] = useState<RankTier | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['Copper', 'Tungsten', 'Silver', 'Gold', 'Platinum', 'Diamond'].includes(saved)) {
        return saved as RankTier;
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  const equipTier = (tier: RankTier) => {
    setEquippedRankTier(tier);
    try {
      localStorage.setItem(STORAGE_KEY, tier);
    } catch (e) {}
  };

  const unequipTier = () => {
    setEquippedRankTier(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const toggleTier = (tier: RankTier) => {
    if (equippedRankTier === tier) {
      unequipTier();
    } else {
      equipTier(tier);
    }
  };

  const getCursorPalette = () => {
    if (equippedRankTier && RANK_PALETTES[equippedRankTier]) {
      return RANK_PALETTES[equippedRankTier];
    }
    return DEFAULT_PALETTE;
  };

  return (
    <CosmeticContext.Provider
      value={{
        equippedRankTier,
        equipTier,
        unequipTier,
        toggleTier,
        getCursorPalette,
      }}
    >
      {children}
    </CosmeticContext.Provider>
  );
};

export const useCosmetics = () => useContext(CosmeticContext);
