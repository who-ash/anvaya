'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { authClient } from '@/server/auth/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import GoogleIcon from '../icon/google';

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isGoogleLoginLoading, setIsGoogleLoginLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);

        try {
            setIsLoading(true);
            const { data, error: signInError } = await authClient.signIn.email({
                email: formData.email,
                password: formData.password,
                rememberMe: formData.rememberMe,
            });
            if (signInError) {
                setLoginError(signInError?.message ?? null);
                toast.error(
                    signInError?.message ??
                        'Failed to login. Please check your credentials.',
                );
                return;
            }
            toast.success('Logged in successfully!');
            router.push('/');
        } catch (error) {
            const errorMessage =
                (error as Error)?.message ?? 'Unexpected error';
            setLoginError(errorMessage);
            toast.error('Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginWithGoogle = async () => {
        setIsGoogleLoginLoading(true);
        setLoginError(null);
        try {
            const { data, error } = await authClient.signIn.social({
                provider: 'google',
            });
            if (error) {
                setLoginError(error?.message ?? null);
                toast.error(
                    error?.message ??
                        'Failed to login with Google. Please try again.',
                );
                return;
            }
            toast.success('Logged in successfully!');
            router.push('/');
        } catch (error) {
            const errorMessage =
                (error as Error)?.message ?? 'Unexpected error';
            setLoginError(errorMessage);
            toast.error('Failed to login with Google. Please try again.');
        } finally {
            setIsGoogleLoginLoading(false);
        }
    };

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-center">
                        Login to your account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@doe.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            email: e.currentTarget.value,
                                        })
                                    }
                                    required
                                    disabled={isLoading}
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">
                                        Password
                                    </FieldLabel>
                                    {/* <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a> */}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            password: e.currentTarget.value,
                                        })
                                    }
                                    disabled={isLoading}
                                />
                            </Field>
                            <div className="flex items-center">
                                <Checkbox
                                    id="remember-me"
                                    checked={formData.rememberMe}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            rememberMe: checked === true,
                                        })
                                    }
                                    disabled={isLoading}
                                />
                                <FieldLabel
                                    htmlFor="remember-me"
                                    className="ml-2"
                                >
                                    Remember me
                                </FieldLabel>
                            </div>
                            {loginError && (
                                <div className="text-sm font-medium text-red-500">
                                    {loginError}
                                </div>
                            )}
                            <Field>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </Button>

                                <div className="relative my-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background text-muted-foreground px-2">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={handleLoginWithGoogle}
                                    disabled={isGoogleLoginLoading}
                                >
                                    <GoogleIcon className="mr-2" />
                                    {isGoogleLoginLoading
                                        ? 'Continuing with Google...'
                                        : 'Continue with Google'}
                                </Button>

                                <FieldDescription className="text-center">
                                    Don&apos;t have an account?{' '}
                                    <a href="/auth/sign-up">Sign up</a>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
