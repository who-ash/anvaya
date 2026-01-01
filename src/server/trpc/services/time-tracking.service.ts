import { db } from '@/server/db';
import {
    taskTimeEntries,
    calendarSyncSettings,
    calendarEvents,
} from '@/server/db/schema/time-tracking-schema';
import { tasks, projects, sprints } from '@/server/db/schema/project-schema';
import { users } from '@/server/db/schema/auth-schema';
import { eq, and, isNull, gte, lte, desc, sql, sum } from 'drizzle-orm';

export const timeTrackingService = {
    /**
     * Record a task status change - creates a time entry
     * Called automatically when task status changes
     */
    async recordStatusChange(
        taskId: number,
        userId: string,
        oldStatus: string | null,
        newStatus: string,
    ) {
        const now = new Date();

        // If there was a previous status, end that time entry
        if (oldStatus) {
            const activeEntry = await db.query.taskTimeEntries.findFirst({
                where: and(
                    eq(taskTimeEntries.taskId, taskId),
                    eq(taskTimeEntries.status, oldStatus),
                    isNull(taskTimeEntries.endedAt),
                ),
            });

            if (activeEntry) {
                const durationSeconds = Math.floor(
                    (now.getTime() - activeEntry.startedAt.getTime()) / 1000,
                );

                await db
                    .update(taskTimeEntries)
                    .set({
                        endedAt: now,
                        durationSeconds,
                    })
                    .where(eq(taskTimeEntries.id, activeEntry.id));
            }
        }

        // Create a new time entry for the new status (only for in-progress status)
        if (newStatus === 'in-progress') {
            await db.insert(taskTimeEntries).values({
                taskId,
                userId,
                status: newStatus,
                startedAt: now,
            });
        }

        return { success: true };
    },

    /**
     * Get all time entries for a specific task
     */
    async getTaskTimeEntries(taskId: number) {
        const entries = await db.query.taskTimeEntries.findMany({
            where: eq(taskTimeEntries.taskId, taskId),
            orderBy: [desc(taskTimeEntries.startedAt)],
        });

        return entries;
    },

    /**
     * Get total time spent on a task (sum of all completed entries)
     */
    async getTaskTotalTime(taskId: number) {
        const result = await db
            .select({
                totalSeconds: sum(taskTimeEntries.durationSeconds),
            })
            .from(taskTimeEntries)
            .where(eq(taskTimeEntries.taskId, taskId));

        return result[0]?.totalSeconds ? Number(result[0].totalSeconds) : 0;
    },

    /**
     * Check if there's an active timer for a task
     */
    async getActiveTimer(taskId: number) {
        const activeEntry = await db.query.taskTimeEntries.findFirst({
            where: and(
                eq(taskTimeEntries.taskId, taskId),
                isNull(taskTimeEntries.endedAt),
            ),
        });

        return activeEntry;
    },

    /**
     * Get user's time summary for a date range
     */
    async getUserTimeSummary(
        userId: string,
        dateRange: { start: Date; end: Date },
    ) {
        const entries = await db
            .select({
                taskId: taskTimeEntries.taskId,
                totalSeconds: sum(taskTimeEntries.durationSeconds),
            })
            .from(taskTimeEntries)
            .where(
                and(
                    eq(taskTimeEntries.userId, userId),
                    gte(taskTimeEntries.startedAt, dateRange.start),
                    lte(taskTimeEntries.startedAt, dateRange.end),
                ),
            )
            .groupBy(taskTimeEntries.taskId);

        const totalSeconds = entries.reduce(
            (acc, entry) => acc + (Number(entry.totalSeconds) || 0),
            0,
        );

        return {
            totalSeconds,
            taskBreakdown: entries,
        };
    },

    /**
     * Get time entries with task and project details for a user
     */
    async getUserTimeEntries(
        userId: string,
        dateRange?: { start: Date; end: Date },
        limit = 50,
    ) {
        const conditions = [eq(taskTimeEntries.userId, userId)];

        if (dateRange) {
            conditions.push(gte(taskTimeEntries.startedAt, dateRange.start));
            conditions.push(lte(taskTimeEntries.startedAt, dateRange.end));
        }

        const entries = await db
            .select({
                id: taskTimeEntries.id,
                taskId: taskTimeEntries.taskId,
                status: taskTimeEntries.status,
                startedAt: taskTimeEntries.startedAt,
                endedAt: taskTimeEntries.endedAt,
                durationSeconds: taskTimeEntries.durationSeconds,
                taskName: tasks.name,
                projectId: tasks.projectId,
                projectName: projects.name,
            })
            .from(taskTimeEntries)
            .leftJoin(tasks, eq(taskTimeEntries.taskId, tasks.id))
            .leftJoin(projects, eq(tasks.projectId, projects.id))
            .where(and(...conditions))
            .orderBy(desc(taskTimeEntries.startedAt))
            .limit(limit);

        return entries;
    },

    /**
     * Get project time breakdown for a user
     */
    async getProjectTimeBreakdown(
        userId: string,
        dateRange?: { start: Date; end: Date },
    ) {
        const conditions = [eq(taskTimeEntries.userId, userId)];

        if (dateRange) {
            conditions.push(gte(taskTimeEntries.startedAt, dateRange.start));
            conditions.push(lte(taskTimeEntries.startedAt, dateRange.end));
        }

        const breakdown = await db
            .select({
                projectId: tasks.projectId,
                projectName: projects.name,
                totalSeconds: sum(taskTimeEntries.durationSeconds),
            })
            .from(taskTimeEntries)
            .leftJoin(tasks, eq(taskTimeEntries.taskId, tasks.id))
            .leftJoin(projects, eq(tasks.projectId, projects.id))
            .where(and(...conditions))
            .groupBy(tasks.projectId, projects.name);

        return breakdown.map((item) => ({
            ...item,
            totalSeconds: Number(item.totalSeconds) || 0,
        }));
    },

    /**
     * Get daily hours for a week (for bar chart)
     */
    async getWeeklyHours(userId: string, weekStart: Date) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const entries = await db
            .select({
                date: sql<string>`DATE(${taskTimeEntries.startedAt})`,
                totalSeconds: sum(taskTimeEntries.durationSeconds),
            })
            .from(taskTimeEntries)
            .where(
                and(
                    eq(taskTimeEntries.userId, userId),
                    gte(taskTimeEntries.startedAt, weekStart),
                    lte(taskTimeEntries.startedAt, weekEnd),
                ),
            )
            .groupBy(sql`DATE(${taskTimeEntries.startedAt})`);

        return entries.map((entry) => ({
            date: entry.date,
            totalSeconds: Number(entry.totalSeconds) || 0,
        }));
    },

    /**
     * Get today's tracked time for a user
     */
    async getTodayTime(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const result = await db
            .select({
                totalSeconds: sum(taskTimeEntries.durationSeconds),
            })
            .from(taskTimeEntries)
            .where(
                and(
                    eq(taskTimeEntries.userId, userId),
                    gte(taskTimeEntries.startedAt, today),
                    lte(taskTimeEntries.startedAt, tomorrow),
                ),
            );

        // Also get any currently running timer
        const activeTimers = await db.query.taskTimeEntries.findMany({
            where: and(
                eq(taskTimeEntries.userId, userId),
                isNull(taskTimeEntries.endedAt),
                gte(taskTimeEntries.startedAt, today),
            ),
        });

        let activeSeconds = 0;
        const now = new Date();
        for (const timer of activeTimers) {
            activeSeconds += Math.floor(
                (now.getTime() - timer.startedAt.getTime()) / 1000,
            );
        }

        return {
            completedSeconds: result[0]?.totalSeconds
                ? Number(result[0].totalSeconds)
                : 0,
            activeSeconds,
            totalSeconds:
                (result[0]?.totalSeconds ? Number(result[0].totalSeconds) : 0) +
                activeSeconds,
        };
    },

    /**
     * Get this week's tracked time for a user
     */
    async getWeekTime(userId: string) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const result = await db
            .select({
                totalSeconds: sum(taskTimeEntries.durationSeconds),
            })
            .from(taskTimeEntries)
            .where(
                and(
                    eq(taskTimeEntries.userId, userId),
                    gte(taskTimeEntries.startedAt, weekStart),
                    lte(taskTimeEntries.startedAt, weekEnd),
                ),
            );

        return result[0]?.totalSeconds ? Number(result[0].totalSeconds) : 0;
    },

    /**
     * Get this month's tracked time for a user
     */
    async getMonthTime(userId: string) {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const result = await db
            .select({
                totalSeconds: sum(taskTimeEntries.durationSeconds),
            })
            .from(taskTimeEntries)
            .where(
                and(
                    eq(taskTimeEntries.userId, userId),
                    gte(taskTimeEntries.startedAt, monthStart),
                    lte(taskTimeEntries.startedAt, monthEnd),
                ),
            );

        return result[0]?.totalSeconds ? Number(result[0].totalSeconds) : 0;
    },

    /**
     * Get tasks currently being worked on (has active timer)
     */
    async getActiveTasksWithTimers(userId: string) {
        const activeTasks = await db
            .select({
                entryId: taskTimeEntries.id,
                taskId: taskTimeEntries.taskId,
                startedAt: taskTimeEntries.startedAt,
                taskName: tasks.name,
                projectId: tasks.projectId,
                projectName: projects.name,
            })
            .from(taskTimeEntries)
            .leftJoin(tasks, eq(taskTimeEntries.taskId, tasks.id))
            .leftJoin(projects, eq(tasks.projectId, projects.id))
            .where(
                and(
                    eq(taskTimeEntries.userId, userId),
                    isNull(taskTimeEntries.endedAt),
                ),
            );

        return activeTasks;
    },

    /**
     * Check if user is project admin or org admin for a project
     */
    async isProjectOrOrgAdmin(
        userId: string,
        projectId: number,
    ): Promise<boolean> {
        const { projectMembers } =
            await import('@/server/db/schema/project-schema');
        const { organizationMembers } =
            await import('@/server/db/schema/organization-schema');

        // Check if user is project admin
        const projectMembership = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId),
                isNull(projectMembers.deletedAt),
            ),
        });

        if (projectMembership?.role === 'admin') {
            return true;
        }

        // Get project's organization
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
        });

        if (!project) {
            return false;
        }

        // Check if user is org admin
        const orgMembership = await db.query.organizationMembers.findFirst({
            where: and(
                eq(organizationMembers.organizationId, project.organizationId),
                eq(organizationMembers.userId, userId),
                isNull(organizationMembers.deletedAt),
            ),
        });

        return orgMembership?.role === 'admin';
    },

    /**
     * Get project calendar settings
     */
    async getProjectCalendarSettings(projectId: number) {
        const { projectCalendarSettings } =
            await import('@/server/db/schema/time-tracking-schema');

        const settings = await db.query.projectCalendarSettings.findFirst({
            where: eq(projectCalendarSettings.projectId, projectId),
        });

        return settings;
    },

    /**
     * Update project calendar settings (only project/org admin)
     */
    async updateProjectCalendarSettings(
        projectId: number,
        userId: string,
        data: {
            reminderIntervals?: string[];
            syncEnabled?: boolean;
        },
    ) {
        const { projectCalendarSettings } =
            await import('@/server/db/schema/time-tracking-schema');

        // Check if user is admin
        const isAdmin = await this.isProjectOrOrgAdmin(userId, projectId);
        if (!isAdmin) {
            throw new Error(
                'Only project or organization admins can update calendar settings',
            );
        }

        const existing = await db.query.projectCalendarSettings.findFirst({
            where: eq(projectCalendarSettings.projectId, projectId),
        });

        if (existing) {
            await db
                .update(projectCalendarSettings)
                .set({
                    ...data,
                    updatedBy: userId,
                })
                .where(eq(projectCalendarSettings.id, existing.id));
        } else {
            await db.insert(projectCalendarSettings).values({
                projectId,
                ...data,
                createdBy: userId,
            });
        }

        return { success: true };
    },

    /**
     * Get all project calendar settings for projects user has access to
     */
    async getUserProjectCalendarSettings(
        userId: string,
        organizationId: number,
    ) {
        const { projectCalendarSettings } =
            await import('@/server/db/schema/time-tracking-schema');
        const { projectMembers } =
            await import('@/server/db/schema/project-schema');

        // Get projects user is admin of
        const adminProjects = await db
            .select({
                projectId: projectMembers.projectId,
                projectName: projects.name,
            })
            .from(projectMembers)
            .leftJoin(projects, eq(projectMembers.projectId, projects.id))
            .where(
                and(
                    eq(projectMembers.userId, userId),
                    eq(projectMembers.role, 'admin'),
                    eq(projects.organizationId, organizationId),
                    isNull(projectMembers.deletedAt),
                ),
            );

        // Get settings for each project
        const projectIds = adminProjects.map((p) => p.projectId);

        if (projectIds.length === 0) {
            return [];
        }

        const { inArray } = await import('drizzle-orm');
        const settings = await db
            .select()
            .from(projectCalendarSettings)
            .where(inArray(projectCalendarSettings.projectId, projectIds));

        // Combine project info with settings
        return adminProjects.map((project) => ({
            projectId: project.projectId,
            projectName: project.projectName,
            settings:
                settings.find((s) => s.projectId === project.projectId) || null,
        }));
    },
};
