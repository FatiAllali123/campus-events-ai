import { createContext, createElement, useContext, useState, ReactNode } from 'react';

interface RefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  function triggerRefresh() {
    setRefreshKey(prev => prev + 1);
  }

  return createElement(
    RefreshContext.Provider,
    { value: { refreshKey, triggerRefresh } },
    children
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh doit être utilisé dans un RefreshProvider');
  }
  return context;
}