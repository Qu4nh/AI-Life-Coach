'use client'

import { createContext, useContext, useState, ReactNode } from 'react';

type AIMeta = {
    goalCount: number;
    memoryCount: number;
    hardDeadlineCount: number;
    pendingCount: number;
    avgEnergy: string;
};

type ProcessingStep = {
    label: string;
    done: boolean;
};

type AIRefreshContextType = {
    isRefreshing: boolean;
    processingSteps: ProcessingStep[];
    coachNote: string | null;
    aiMeta: AIMeta | null;
    setIsRefreshing: (v: boolean) => void;
    setProcessingSteps: (steps: ProcessingStep[] | ((prev: ProcessingStep[]) => ProcessingStep[])) => void;
    setCoachNote: (v: string | null) => void;
    setAiMeta: (v: AIMeta | null) => void;
};

const AIRefreshContext = createContext<AIRefreshContextType | null>(null);

export function AIRefreshProvider({ children }: { children: ReactNode }) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
    const [coachNote, setCoachNote] = useState<string | null>(null);
    const [aiMeta, setAiMeta] = useState<AIMeta | null>(null);

    return (
        <AIRefreshContext.Provider value={{
            isRefreshing, processingSteps, coachNote, aiMeta,
            setIsRefreshing, setProcessingSteps, setCoachNote, setAiMeta
        }}>
            {children}
        </AIRefreshContext.Provider>
    );
}

export function useAIRefresh() {
    const ctx = useContext(AIRefreshContext);
    if (!ctx) throw new Error('useAIRefresh must be used within AIRefreshProvider');
    return ctx;
}
