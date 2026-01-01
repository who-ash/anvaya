import { db } from '@/server/db';
import {
    calendarSyncSettings,
    calendarEvents,
    projectCalendarSettings,
} from '@/server/db/schema/time-tracking-schema';
import { tasks } from '@/server/db/schema/project-schema';
import { eq, and } from 'drizzle-orm';
import { google } from 'googleapis';
import {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    DEFAULT_CALENDAR_REMINDERS,
} from '@/lib/const';

export const REMINDER_OPTIONS = {
    '30_min': 30,
    '1_hour': 60,
    '2_hours': 120,
    '1_day': 1440,
    '2_days': 2880,
    '1_week': 10080,
} as const;

function getOAuth2Client() {
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI,
    );
}

export const googleCalendarService = {
    /**
     * Generate OAuth URL for user to authorize
     */
    getAuthUrl(userId: string) {
        const oauth2Client = getOAuth2Client();

        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
        ];

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: userId, // Pass userId in state to retrieve later
            prompt: 'consent', // Force consent to get refresh token
        });

        return url;
    },

    /**
     * Handle OAuth callback - exchange code for tokens
     */
    async handleCallback(userId: string, code: string) {
        const oauth2Client = getOAuth2Client();

        const { tokens } = await oauth2Client.getToken(code);

        // Save tokens to database
        const existing = await db.query.calendarSyncSettings.findFirst({
            where: eq(calendarSyncSettings.userId, userId),
        });

        const tokenData = {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: tokens.expiry_date
                ? new Date(tokens.expiry_date)
                : null,
            syncEnabled: true,
        };

        if (existing) {
            await db
                .update(calendarSyncSettings)
                .set(tokenData)
                .where(eq(calendarSyncSettings.id, existing.id));
        } else {
            await db.insert(calendarSyncSettings).values({
                userId,
                ...tokenData,
                reminderIntervals: ['1_day', '1_hour'],
            });
        }

        return { success: true };
    },

    /**
     * Get authenticated client for a user
     */
    async getAuthenticatedClient(userId: string) {
        const settings = await db.query.calendarSyncSettings.findFirst({
            where: eq(calendarSyncSettings.userId, userId),
        });

        if (!settings?.googleRefreshToken) {
            throw new Error('User not connected to Google Calendar');
        }

        const oauth2Client = getOAuth2Client();

        oauth2Client.setCredentials({
            access_token: settings.googleAccessToken,
            refresh_token: settings.googleRefreshToken,
            expiry_date: settings.googleTokenExpiry?.getTime(),
        });

        // Refresh token if expired
        if (
            settings.googleTokenExpiry &&
            settings.googleTokenExpiry < new Date()
        ) {
            const { credentials } = await oauth2Client.refreshAccessToken();

            await db
                .update(calendarSyncSettings)
                .set({
                    googleAccessToken: credentials.access_token,
                    googleTokenExpiry: credentials.expiry_date
                        ? new Date(credentials.expiry_date)
                        : null,
                })
                .where(eq(calendarSyncSettings.id, settings.id));

            oauth2Client.setCredentials(credentials);
        }

        return oauth2Client;
    },

    /**
     * Create a calendar event for a task
     */
    async createTaskEvent(userId: string, taskId: number) {
        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId),
            with: {
                project: true,
            },
        });

        if (!task || !task.endDate) {
            throw new Error('Task not found or has no due date');
        }

        const settings = await db.query.calendarSyncSettings.findFirst({
            where: eq(calendarSyncSettings.userId, userId),
        });

        if (!settings?.syncEnabled) {
            throw new Error('Calendar sync not enabled');
        }

        const oauth2Client = await this.getAuthenticatedClient(userId);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const projectSettings = task.projectId
            ? await db.query.projectCalendarSettings.findFirst({
                  where: eq(projectCalendarSettings.projectId, task.projectId),
              })
            : null;

        const reminderIntervals =
            projectSettings?.reminderIntervals || DEFAULT_CALENDAR_REMINDERS;

        const reminders = reminderIntervals.map((interval) => ({
            method: 'popup' as const,
            minutes:
                REMINDER_OPTIONS[interval as keyof typeof REMINDER_OPTIONS] ||
                60,
        }));

        const event = {
            summary: `[Task Due] ${task.name}`,
            description: `Task: ${task.name}\nProject: ${task.project?.name || 'N/A'}\n\n${task.description || ''}`,
            start: {
                dateTime: task.endDate.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: new Date(
                    task.endDate.getTime() + 30 * 60 * 1000,
                ).toISOString(), // 30 min duration
                timeZone: 'UTC',
            },
            reminders: {
                useDefault: false,
                overrides: reminders,
            },
        };

        const response = await calendar.events.insert({
            calendarId: settings.defaultCalendarId || 'primary',
            requestBody: event,
        });

        // Save event reference
        await db.insert(calendarEvents).values({
            taskId,
            userId,
            googleEventId: response.data.id!,
        });

        return response.data;
    },

    /**
     * Update a calendar event for a task
     */
    async updateTaskEvent(userId: string, taskId: number) {
        const existingEvent = await db.query.calendarEvents.findFirst({
            where: and(
                eq(calendarEvents.taskId, taskId),
                eq(calendarEvents.userId, userId),
            ),
        });

        if (!existingEvent) {
            // No existing event, create one
            return this.createTaskEvent(userId, taskId);
        }

        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId),
            with: {
                project: true,
            },
        });

        if (!task) {
            throw new Error('Task not found');
        }

        const settings = await db.query.calendarSyncSettings.findFirst({
            where: eq(calendarSyncSettings.userId, userId),
        });

        if (!settings?.syncEnabled) {
            throw new Error('Calendar sync not enabled');
        }

        const oauth2Client = await this.getAuthenticatedClient(userId);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        if (!task.endDate) {
            // Task no longer has due date, delete the event
            await calendar.events.delete({
                calendarId: settings.defaultCalendarId || 'primary',
                eventId: existingEvent.googleEventId,
            });

            await db
                .delete(calendarEvents)
                .where(eq(calendarEvents.id, existingEvent.id));

            return { deleted: true };
        }

        const projectSettingsData = task.projectId
            ? await db.query.projectCalendarSettings.findFirst({
                  where: eq(projectCalendarSettings.projectId, task.projectId),
              })
            : null;

        const reminderIntervals =
            projectSettingsData?.reminderIntervals ||
            DEFAULT_CALENDAR_REMINDERS;

        const reminders = reminderIntervals.map((interval) => ({
            method: 'popup' as const,
            minutes:
                REMINDER_OPTIONS[interval as keyof typeof REMINDER_OPTIONS] ||
                60,
        }));

        const event = {
            summary: `[Task Due] ${task.name}`,
            description: `Task: ${task.name}\nProject: ${task.project?.name || 'N/A'}\n\n${task.description || ''}`,
            start: {
                dateTime: task.endDate.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: new Date(
                    task.endDate.getTime() + 30 * 60 * 1000,
                ).toISOString(),
                timeZone: 'UTC',
            },
            reminders: {
                useDefault: false,
                overrides: reminders,
            },
        };

        const response = await calendar.events.update({
            calendarId: settings.defaultCalendarId || 'primary',
            eventId: existingEvent.googleEventId,
            requestBody: event,
        });

        await db
            .update(calendarEvents)
            .set({ syncedAt: new Date() })
            .where(eq(calendarEvents.id, existingEvent.id));

        return response.data;
    },

    /**
     * Delete a calendar event for a task
     */
    async deleteTaskEvent(userId: string, taskId: number) {
        const existingEvent = await db.query.calendarEvents.findFirst({
            where: and(
                eq(calendarEvents.taskId, taskId),
                eq(calendarEvents.userId, userId),
            ),
        });

        if (!existingEvent) {
            return { success: true, message: 'No event to delete' };
        }

        const settings = await db.query.calendarSyncSettings.findFirst({
            where: eq(calendarSyncSettings.userId, userId),
        });

        if (!settings) {
            return { success: true, message: 'No calendar settings' };
        }

        try {
            const oauth2Client = await this.getAuthenticatedClient(userId);
            const calendar = google.calendar({
                version: 'v3',
                auth: oauth2Client,
            });

            await calendar.events.delete({
                calendarId: settings.defaultCalendarId || 'primary',
                eventId: existingEvent.googleEventId,
            });
        } catch {
            // Event might already be deleted, continue
        }

        await db
            .delete(calendarEvents)
            .where(eq(calendarEvents.id, existingEvent.id));

        return { success: true };
    },

    /**
     * Get user's calendar settings
     */
    async getSettings(userId: string) {
        const settings = await db.query.calendarSyncSettings.findFirst({
            where: eq(calendarSyncSettings.userId, userId),
        });

        return settings;
    },

    /**
     * Update user's calendar settings
     */
    async updateSettings(
        userId: string,
        data: {
            defaultCalendarId?: string;
            reminderIntervals?: string[];
            syncEnabled?: boolean;
        },
    ) {
        const existing = await db.query.calendarSyncSettings.findFirst({
            where: eq(calendarSyncSettings.userId, userId),
        });

        if (existing) {
            await db
                .update(calendarSyncSettings)
                .set(data)
                .where(eq(calendarSyncSettings.id, existing.id));
        } else {
            await db.insert(calendarSyncSettings).values({
                userId,
                ...data,
            });
        }

        return { success: true };
    },

    /**
     * Disconnect Google Calendar
     */
    async revokeAccess(userId: string) {
        const settings = await db.query.calendarSyncSettings.findFirst({
            where: eq(calendarSyncSettings.userId, userId),
        });

        if (settings?.googleAccessToken) {
            try {
                const oauth2Client = getOAuth2Client();
                await oauth2Client.revokeToken(settings.googleAccessToken);
            } catch {
                // Token might already be invalid
            }
        }

        if (settings) {
            await db
                .update(calendarSyncSettings)
                .set({
                    googleAccessToken: null,
                    googleRefreshToken: null,
                    googleTokenExpiry: null,
                    syncEnabled: false,
                })
                .where(eq(calendarSyncSettings.id, settings.id));
        }

        // Delete all calendar events for this user
        await db
            .delete(calendarEvents)
            .where(eq(calendarEvents.userId, userId));

        return { success: true };
    },

    /**
     * Get user's calendars list
     */
    async getCalendars(userId: string) {
        const oauth2Client = await this.getAuthenticatedClient(userId);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.calendarList.list();

        return (
            response.data.items?.map((cal) => ({
                id: cal.id,
                summary: cal.summary,
                primary: cal.primary,
            })) || []
        );
    },
};
