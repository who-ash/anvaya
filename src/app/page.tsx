'use client';

import { useSession } from '@/server/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/auth/login');
            return;
        }

        if (!isPending && session && session.user.role === 'admin') {
            router.push('/admin');
            return;
        }

        if (!isPending && session) {
            router.push('/dashboard');
        }
    }, [session, isPending, router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-lg">Loading...</div>
        </div>
    );
}
