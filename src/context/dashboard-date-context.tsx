'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface DashboardDateContextValue {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const DashboardDateContext = createContext<DashboardDateContextValue | undefined>(undefined);

export function DashboardDateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const value = useMemo(
    () => ({ selectedDate, setSelectedDate }),
    [selectedDate]
  );

  return (
    <DashboardDateContext.Provider value={value}>
      {children}
    </DashboardDateContext.Provider>
  );
}

export function useDashboardDate(): DashboardDateContextValue {
  const ctx = useContext(DashboardDateContext);
  if (!ctx) {
    throw new Error('useDashboardDate must be used within a DashboardDateProvider');
  }
  return ctx;
}
