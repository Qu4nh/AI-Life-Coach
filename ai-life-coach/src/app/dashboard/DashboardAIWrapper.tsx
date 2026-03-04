'use client'

import { AIRefreshProvider } from './AIRefreshContext';
import { ReactNode } from 'react';

export default function DashboardAIWrapper({ children }: { children: ReactNode }) {
    return <AIRefreshProvider>{children}</AIRefreshProvider>;
}
