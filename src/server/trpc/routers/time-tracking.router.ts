import { z } from 'zod';
import { authenticatedProcedure, router } from '../router';
import { timeTrackingService } from '../services/time-tracking.service';
import {
    googleCalendarService,
    REMINDER_OPTIONS,
} from '../services/google-calendar.service';

export const timeTrackingRouter = router({
    // Time Tracking
    getTodayTime: authenticatedProcedure.query(async ({ ctx }) => {
        return timeTrackingService.getTodayTime(ctx.session.user.id);
    }),

    getWeekTime: authenticatedProcedure.query(async ({ ctx }) => {
        return timeTrackingService.getWeekTime(ctx.session.user.id);
    }),

    getMonthTime: authenticatedProcedure.query(async ({ ctx }) => {
        return timeTrackingService.getMonthTime(ctx.session.user.id);
    }),

    getUserTimeEntries: authenticatedProcedure
        .input(
            z
                .object({
                    startDate: z.date().optional(),
                    endDate: z.date().optional(),
                    limit: z.number().optional().default(50),
                })
                .optional(),
        )
        .query(async ({ ctx, input }) => {
            const dateRange =
                input?.startDate && input?.endDate
                    ? { start: input.startDate, end: input.endDate }
                    : undefined;

            return timeTrackingService.getUserTimeEntries(
                ctx.session.user.id,
                dateRange,
                input?.limit,
            );
        }),

    getProjectTimeBreakdown: authenticatedProcedure
        .input(
            z
                .object({
                    startDate: z.date().optional(),
                    endDate: z.date().optional(),
                })
                .optional(),
        )
        .query(async ({ ctx, input }) => {
            const dateRange =
                input?.startDate && input?.endDate
                    ? { start: input.startDate, end: input.endDate }
                    : undefined;

            return timeTrackingService.getProjectTimeBreakdown(
                ctx.session.user.id,
                dateRange,
            );
        }),

    getWeeklyHours: authenticatedProcedure
        .input(
            z.object({
                weekStart: z.date(),
            }),
        )
        .query(async ({ ctx, input }) => {
            return timeTrackingService.getWeeklyHours(
                ctx.session.user.id,
                input.weekStart,
            );
        }),

    getActiveTasksWithTimers: authenticatedProcedure.query(async ({ ctx }) => {
        return timeTrackingService.getActiveTasksWithTimers(
            ctx.session.user.id,
        );
    }),

    getTaskTotalTime: authenticatedProcedure
        .input(z.object({ taskId: z.number() }))
        .query(async ({ input }) => {
            return timeTrackingService.getTaskTotalTime(input.taskId);
        }),

    // Google Calendar
    getCalendarSettings: authenticatedProcedure.query(async ({ ctx }) => {
        return googleCalendarService.getSettings(ctx.session.user.id);
    }),

    getCalendarAuthUrl: authenticatedProcedure.query(async ({ ctx }) => {
        return { url: googleCalendarService.getAuthUrl(ctx.session.user.id) };
    }),

    updateCalendarSettings: authenticatedProcedure
        .input(
            z.object({
                defaultCalendarId: z.string().optional(),
                reminderIntervals: z
                    .array(
                        z.enum(
                            Object.keys(REMINDER_OPTIONS) as [
                                string,
                                ...string[],
                            ],
                        ),
                    )
                    .optional(),
                syncEnabled: z.boolean().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            return googleCalendarService.updateSettings(
                ctx.session.user.id,
                input,
            );
        }),

    disconnectCalendar: authenticatedProcedure.mutation(async ({ ctx }) => {
        return googleCalendarService.revokeAccess(ctx.session.user.id);
    }),

    getCalendars: authenticatedProcedure.query(async ({ ctx }) => {
        try {
            return await googleCalendarService.getCalendars(
                ctx.session.user.id,
            );
        } catch {
            return [];
        }
    }),

    syncTaskToCalendar: authenticatedProcedure
        .input(z.object({ taskId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            return googleCalendarService.createTaskEvent(
                ctx.session.user.id,
                input.taskId,
            );
        }),

    getReminderOptions: authenticatedProcedure.query(() => {
        return Object.entries(REMINDER_OPTIONS).map(([key, minutes]) => ({
            value: key,
            label: key.replace('_', ' ').replace('min', 'minutes'),
            minutes,
        }));
    }),

    // Project Calendar Settings (admin only)
    getProjectCalendarSettings: authenticatedProcedure
        .input(z.object({ projectId: z.number() }))
        .query(async ({ input }) => {
            return timeTrackingService.getProjectCalendarSettings(
                input.projectId,
            );
        }),

    updateProjectCalendarSettings: authenticatedProcedure
        .input(
            z.object({
                projectId: z.number(),
                reminderIntervals: z.array(z.string()).optional(),
                syncEnabled: z.boolean().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { projectId, ...data } = input;
            return timeTrackingService.updateProjectCalendarSettings(
                projectId,
                ctx.session.user.id,
                data,
            );
        }),

    getUserProjectCalendarSettings: authenticatedProcedure
        .input(z.object({ organizationId: z.number() }))
        .query(async ({ ctx, input }) => {
            return timeTrackingService.getUserProjectCalendarSettings(
                ctx.session.user.id,
                input.organizationId,
            );
        }),

    checkIsProjectAdmin: authenticatedProcedure
        .input(z.object({ projectId: z.number() }))
        .query(async ({ ctx, input }) => {
            return timeTrackingService.isProjectOrOrgAdmin(
                ctx.session.user.id,
                input.projectId,
            );
        }),
});
