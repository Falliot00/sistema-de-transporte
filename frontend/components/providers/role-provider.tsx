'use client';

import { createContext, useContext, ReactNode } from 'react';

export type RoleContextValue = {
  role: string;
  username?: string;
};

const RoleContext = createContext<RoleContextValue>({ role: 'USER' });

export function RoleProvider({
  value,
  children,
}: {
  value: RoleContextValue;
  children: ReactNode;
}) {
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}
