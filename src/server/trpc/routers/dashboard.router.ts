import { z } from 'zod';
import { router, authenticatedProcedure } from '../router';
import { db } from '@/server/db';
import {
    organizationMembers,
    organizations,
    organizationGroups,
    organizationGroupMembers,
} from '@/server/db/schema/organization-schema';
import { users } from '@/server/db/schema/auth-schema';
import { projects, sprints, tasks } from '@/server/db/schema/project-schema';
import { requests } from '@/server/db/schema/request-schema';
import { taskTimeEntries } from '@/server/db/schema/time-tracking-schema';
import { eq, and, isNull, gte, sql, desc, inArray, lte } from 'drizzle-orm';
import Fuse from 'fuse.js';

export const dashboardRouter = router({
    // Get organizations where the user is a member
    getUserOrganizations: authenticatedProcedure
        .input(
            z.object({
                query: z.string().optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .query(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }

            const userId = ctx.session.user.id;

            // Get all organizations where user is a member
            const userOrgs = await db
                .select({
                    id: organizations.id,
                    name: organizations.name,
                    description: organizations.description,
                    type: organizations.type,
                    profilePicture: organizations.profilePicture,
                    createdAt: organizations.createdAt,
                })
                .from(organizationMembers)
                .innerJoin(
                    organizations,
                    eq(organizationMembers.organizationId, organizations.id),
                )
                .where(
                    and(
                        eq(organizationMembers.userId, userId),
                        isNull(organizationMembers.deletedAt),
                        isNull(organizations.deletedAt),
                    ),
                );

            let filteredOrganizations = userOrgs;

            // Apply search filter if query exists
            if (input.query && input.query.trim() !== '') {
                const fuse = new Fuse(userOrgs, {
                    keys: ['name', 'description', 'type'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(input.query);
                filteredOrganizations = results.map((result) => result.item);
            }

            // Calculate pagination
            const total = filteredOrganizations.length;
            const totalPages = Math.ceil(total / input.limit);
            const offset = (input.page - 1) * input.limit;
            const paginatedOrganizations = filteredOrganizations.slice(
                offset,
                offset + input.limit,
            );

            return {
                data: paginatedOrganizations,
                pagination: {
                    total,
                    totalPages,
                    currentPage: input.page,
                    limit: input.limit,
                    hasNextPage: input.page < totalPages,
                    hasPreviousPage: input.page > 1,
                },
            };
        }),

    // Get all groups where the user is a member (across all organizations)
    getUserGroups: authenticatedProcedure
        .input(
            z.object({
                query: z.string().optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .query(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }

            const userId = ctx.session.user.id;

            // Get all groups where user is a member
            const userGroups = await db
                .select({
                    id: organizationGroups.id,
                    name: organizationGroups.name,
                    description: organizationGroups.description,
                    profilePicture: organizationGroups.profilePicture,
                    organizationId: organizationGroups.organizationId,
                    organizationName: organizations.name,
                })
                .from(organizationGroupMembers)
                .innerJoin(
                    organizationGroups,
                    eq(organizationGroupMembers.groupId, organizationGroups.id),
                )
                .innerJoin(
                    organizations,
                    eq(organizationGroups.organizationId, organizations.id),
                )
                .where(
                    and(
                        eq(organizationGroupMembers.userId, userId),
                        isNull(organizationGroupMembers.deletedAt),
                        isNull(organizationGroups.deletedAt),
                        isNull(organizations.deletedAt),
                    ),
                );

            let filteredGroups = userGroups;

            // Apply search filter if query exists
            if (input.query && input.query.trim() !== '') {
                const fuse = new Fuse(userGroups, {
                    keys: ['name', 'description', 'organizationName'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(input.query);
                filteredGroups = results.map((result) => result.item);
            }

            // Calculate pagination
            const total = filteredGroups.length;
            const totalPages = Math.ceil(total / input.limit);
            const offset = (input.page - 1) * input.limit;
            const paginatedGroups = filteredGroups.slice(
                offset,
                offset + input.limit,
            );

            return {
                data: paginatedGroups,
                pagination: {
                    total,
                    totalPages,
                    currentPage: input.page,
                    limit: input.limit,
                    hasNextPage: input.page < totalPages,
                    hasPreviousPage: input.page > 1,
                },
            };
        }),

    // Get analytics for the dashboard
    getDashboardAnalytics: authenticatedProcedure
        .input(
            z.object({
                timeRange: z
                    .enum(['7d', '30d', '90d', 'all'])
                    .optional()
                    .default('30d'),
                organizationId: z.number().optional(),
            }),
        )
        .query(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }

            const userId = ctx.session.user.id;
            const now = new Date();
            let startDate: Date | null = null;

            if (input.timeRange !== 'all') {
                startDate = new Date();
                const days =
                    input.timeRange === '7d'
                        ? 7
                        : input.timeRange === '30d'
                          ? 30
                          : 90;
                startDate.setDate(now.getDate() - days);
            }

            // 1. Get Projects
            const userProjects = await db
                .select({
                    id: projects.id,
                    name: projects.name,
                    description: projects.description,
                    createdAt: projects.createdAt,
                })
                .from(projects)
                .innerJoin(
                    organizationMembers,
                    eq(
                        projects.organizationId,
                        organizationMembers.organizationId,
                    ),
                )
                .where(
                    and(
                        eq(organizationMembers.userId, userId),
                        input.organizationId
                            ? eq(projects.organizationId, input.organizationId)
                            : undefined,
                        isNull(projects.deletedAt),
                        isNull(organizationMembers.deletedAt),
                    ),
                )
                .orderBy(desc(projects.createdAt));

            const recentProjects = userProjects.slice(0, 5);

            const projectStats = {
                total: userProjects.length,
                active: userProjects.length, // Logic from before
                completed: 0,
                inactive: 0,
            };

            // 2. Get Sprint Stats
            const userSprints = await db
                .select({
                    id: sprints.id,
                    status: sprints.status,
                })
                .from(sprints)
                .innerJoin(projects, eq(sprints.projectId, projects.id))
                .innerJoin(
                    organizationMembers,
                    eq(
                        projects.organizationId,
                        organizationMembers.organizationId,
                    ),
                )
                .where(
                    and(
                        eq(organizationMembers.userId, userId),
                        input.organizationId
                            ? eq(projects.organizationId, input.organizationId)
                            : undefined,
                        isNull(sprints.deletedAt),
                        isNull(projects.deletedAt),
                        isNull(organizationMembers.deletedAt),
                    ),
                );

            const sprintStats = {
                total: userSprints.length,
                active: userSprints.filter((s) => s.status === 'active').length,
                completed: userSprints.filter((s) => s.status === 'completed')
                    .length,
                inactive: userSprints.filter((s) => s.status === 'inactive')
                    .length,
            };

            // 3. Get Task Stats
            const userTasks = await db
                .select({
                    id: tasks.id,
                    status: tasks.status,
                })
                .from(tasks)
                .innerJoin(projects, eq(tasks.projectId, projects.id))
                .innerJoin(
                    organizationMembers,
                    eq(
                        projects.organizationId,
                        organizationMembers.organizationId,
                    ),
                )
                .where(
                    and(
                        eq(organizationMembers.userId, userId),
                        input.organizationId
                            ? eq(projects.organizationId, input.organizationId)
                            : undefined,
                        isNull(tasks.deletedAt),
                        isNull(projects.deletedAt),
                        isNull(organizationMembers.deletedAt),
                    ),
                );

            const taskStats = {
                total: userTasks.length,
                todo: userTasks.filter((t) => t.status === 'todo').length,
                inProgress: userTasks.filter((t) => t.status === 'in-progress')
                    .length,
                done: userTasks.filter((t) => t.status === 'done').length,
                onHold: userTasks.filter((t) => t.status === 'on-hold').length,
                inReview: userTasks.filter((t) => t.status === 'in-review')
                    .length,
                rejected: userTasks.filter((t) => t.status === 'rejected')
                    .length,
            };

            // 4. Time Tracking Analytics (for charts)
            const timeEntriesQuery = db
                .select({
                    date: sql<string>`DATE(${taskTimeEntries.startedAt})`,
                    duration: sql<number>`SUM(${taskTimeEntries.durationSeconds})`,
                })
                .from(taskTimeEntries)
                .where(
                    and(
                        eq(taskTimeEntries.userId, userId),
                        startDate
                            ? gte(taskTimeEntries.startedAt, startDate)
                            : undefined,
                    ),
                )
                .groupBy(sql`DATE(${taskTimeEntries.startedAt})`)
                .orderBy(sql`DATE(${taskTimeEntries.startedAt})`);

            const timeEntries = await timeEntriesQuery;

            // 5. Mentioned Requests
            const mentionedRequests = await db
                .select({
                    id: requests.id,
                    title: requests.title,
                    status: requests.status,
                    priority: requests.priority,
                    createdAt: requests.createdAt,
                })
                .from(requests)
                .where(
                    and(
                        eq(requests.assigneeId, userId),
                        isNull(requests.deletedAt),
                    ),
                )
                .orderBy(desc(requests.createdAt))
                .limit(5);

            // 6. Task Time Breakdown (which task is taking more time)
            const taskTimeBreakdown = await db
                .select({
                    taskId: taskTimeEntries.taskId,
                    taskName: tasks.name,
                    totalDuration: sql<number>`SUM(${taskTimeEntries.durationSeconds})`,
                })
                .from(taskTimeEntries)
                .innerJoin(tasks, eq(taskTimeEntries.taskId, tasks.id))
                .where(
                    and(
                        eq(taskTimeEntries.userId, userId),
                        startDate
                            ? gte(taskTimeEntries.startedAt, startDate)
                            : undefined,
                    ),
                )
                .groupBy(taskTimeEntries.taskId, tasks.name)
                .orderBy(desc(sql`SUM(${taskTimeEntries.durationSeconds})`))
                .limit(10);

            return {
                projectStats,
                sprintStats,
                taskStats,
                timeAnalytics: timeEntries,
                recentRequests: mentionedRequests,
                taskTimeBreakdown,
                recentProjects,
            };
        }),
});
