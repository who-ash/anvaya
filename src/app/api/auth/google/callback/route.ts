import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/server/trpc/services/google-calendar.service';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        console.error('Google OAuth error:', error);
        return NextResponse.redirect(
            new URL('/dashboard/time-tracking?error=oauth_error', request.url),
        );
    }

    if (!code || !state) {
        return NextResponse.redirect(
            new URL(
                '/dashboard/time-tracking?error=missing_params',
                request.url,
            ),
        );
    }

    try {
        await googleCalendarService.handleCallback(state, code);

        return NextResponse.redirect(
            new URL(
                '/dashboard/time-tracking?success=calendar_connected',
                request.url,
            ),
        );
    } catch (error) {
        console.error('Failed to handle Google OAuth callback:', error);
        return NextResponse.redirect(
            new URL(
                '/dashboard/time-tracking?error=callback_failed',
                request.url,
            ),
        );
    }
}
