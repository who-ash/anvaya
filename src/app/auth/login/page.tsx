import { LoginForm } from '@/components/app/auth/login-form';

export default function SignInPage() {
    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <LoginForm className="w-full" />
            </div>
        </main>
    );
}
