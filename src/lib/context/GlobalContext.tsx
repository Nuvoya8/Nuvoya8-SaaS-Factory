
// src/lib/context/GlobalContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSPASassClientAuthenticated as createSPASassClient } from '@/lib/supabase/client';

type User = {
    email: string;
    id: string;
    registered_at: Date;
};

interface GlobalContextType {
    loading: boolean;
    user: User | null;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = await createSPASassClient();
                const client = supabase.getSupabaseClient();
                const { data: { user: supabaseUser } } = await client.auth.getUser();
                
                if (!supabaseUser) {
                    throw new Error('User not found');
                }

                // Appeler l'API route pour récupérer le user Prisma
                const response = await fetch('/api/user/me');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                
                const prismaUser = await response.json();

                setUser({
                    email: prismaUser.email,
                    id: prismaUser.id,
                    registered_at: new Date(prismaUser.created_at)
                });

            } catch (error) {
                console.error('Error loading user data:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    return (
        <GlobalContext.Provider value={{ loading, user }}>
            {children}
        </GlobalContext.Provider>
    );
}

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};