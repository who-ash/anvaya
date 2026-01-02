import { db } from '@/server/db';
import { users } from '@/server/db/schema/auth-schema';
import {
    tasks,
    taskMembers,
    projects,
    sprints as sprintsTable,
    projectMembers,
} from '@/server/db/schema/project-schema';
import { calendarEvents } from '@/server/db/schema/time-tracking-schema';
import { eq, and, isNull, inArray, SQL, exists } from 'drizzle-orm';
import Fuse from 'fuse.js';
import { googleCalendarService } from './google-calendar.service';

export const taskService = {
    createTask: async (
        input: {
            projectId: number;
            sprintId?: number;
            name: string;
            description?: string;
            status:
                | 'todo'
                | 'in-progress'
                | 'done'
                | 'on-hold'
                | 'in-review'
                | 'rejected';
            assignees?: string[];
            startDate?: Date;
            endDate?: Date;
        },
        userId: string,
    ) => {
        try {
            return await db.transaction(async (tx) => {
                const [task] = await tx
                    .insert(tasks)
                    .values({
                        projectId: input.projectId,
                        sprintId: input.sprintId,
                        name: input.name,
                        description: input.description,
                        status: input.status,
                        startDate: input.startDate,
                        endDate: input.endDate,
                        createdBy: userId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning();

                if (input.assignees && input.assignees.length > 0) {
                    const memberValues = input.assignees.map((assigneeId) => ({
                        taskId: task.id,
                        userId: assigneeId,
                        role: 'member' as const,
                        createdBy: userId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }));

                    await tx.insert(taskMembers).values(memberValues);
                }

                taskService.triggerCalendarSync(task.id).catch(console.error);

                return task;
            });
        } catch (error) {
            throw error;
        }
    },

    getTaskById: async (id: number) => {
        try {
            const { users } = await import('@/server/db/schema/auth-schema');

            const [result] = await db
                .select({
                    task: tasks,
                    project: {
                        id: projects.id,
                        name: projects.name,
                        organizationId: projects.organizationId,
                    },
                    sprint: {
                        id: sprintsTable.id,
                        name: sprintsTable.name,
                    },
                })
                .from(tasks)
                .leftJoin(projects, eq(tasks.projectId, projects.id))
                .leftJoin(sprintsTable, eq(tasks.sprintId, sprintsTable.id))
                .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)));

            if (!result) {
                throw new Error('Task not found');
            }

            // Get task members
            const memberResults = await db
                .select({
                    taskMember: taskMembers,
                    user: {
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        image: users.image,
                    },
                })
                .from(taskMembers)
                .leftJoin(users, eq(taskMembers.userId, users.id))
                .where(
                    and(
                        eq(taskMembers.taskId, id),
                        isNull(taskMembers.deletedAt),
                    ),
                );

            const members = memberResults
                .filter(
                    (r): r is typeof r & { user: NonNullable<typeof r.user> } =>
                        !!r.user,
                )
                .map((r) => r.user);

            return {
                ...result.task,
                project: result.project,
                sprint: result.sprint,
                members,
            };
        } catch (error) {
            throw error;
        }
    },

    getTasks: async (
        organizationId?: number,
        projectIds?: number[],
        sprintIds?: number[],
        statuses?: string[],
        userId?: string,
    ) => {
        try {
            const conditions: (SQL | undefined)[] = [isNull(tasks.deletedAt)];

            if (projectIds && projectIds.length > 0) {
                conditions.push(inArray(tasks.projectId, projectIds));
            } else if (organizationId) {
                conditions.push(eq(projects.organizationId, organizationId));

                // If userId is provided, further restrict to projects where the user is a member
                if (userId) {
                    conditions.push(
                        exists(
                            db
                                .select()
                                .from(projectMembers)
                                .where(
                                    and(
                                        eq(
                                            projectMembers.projectId,
                                            projects.id,
                                        ),
                                        eq(projectMembers.userId, userId),
                                        isNull(projectMembers.deletedAt),
                                    ),
                                ),
                        ),
                    );
                }
            }

            if (sprintIds && sprintIds.length > 0) {
                conditions.push(inArray(tasks.sprintId, sprintIds));
            }

            if (statuses && statuses.length > 0) {
                conditions.push(inArray(tasks.status, statuses as any[]));
            }

            const results = await db
                .select({
                    task: tasks,
                    project: {
                        id: projects.id,
                        name: projects.name,
                    },
                    sprint: {
                        id: sprintsTable.id,
                        name: sprintsTable.name,
                    },
                    creator: {
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        image: users.image,
                    },
                })
                .from(tasks)
                .leftJoin(projects, eq(tasks.projectId, projects.id))
                .leftJoin(sprintsTable, eq(tasks.sprintId, sprintsTable.id))
                .leftJoin(users, eq(tasks.createdBy, users.id))
                .where(and(...conditions));

            // Get all task IDs to fetch members
            const taskIds = results.map((r) => r.task.id);

            // Fetch members for all tasks
            let membersByTask: Record<number, any[]> = {};
            if (taskIds.length > 0) {
                const memberResults = await db
                    .select({
                        taskMember: taskMembers,
                        user: {
                            id: users.id,
                            name: users.name,
                            email: users.email,
                            image: users.image,
                        },
                    })
                    .from(taskMembers)
                    .leftJoin(users, eq(taskMembers.userId, users.id))
                    .where(
                        and(
                            inArray(taskMembers.taskId, taskIds),
                            isNull(taskMembers.deletedAt),
                        ),
                    );

                for (const result of memberResults) {
                    const taskId = result.taskMember.taskId;
                    if (!membersByTask[taskId]) {
                        membersByTask[taskId] = [];
                    }
                    if (result.user) {
                        membersByTask[taskId].push(result.user);
                    }
                }
            }

            return results.map((row) => ({
                ...row.task,
                project: row.project,
                sprint: row.sprint,
                creator: row.creator,
                members: membersByTask[row.task.id] || [],
            }));
        } catch (error) {
            throw error;
        }
    },

    getTasksWithMembers: async (sprintId: number) => {
        try {
            // First get all tasks for the sprint
            const taskResults = await db
                .select({
                    task: tasks,
                    project: {
                        id: projects.id,
                        name: projects.name,
                    },
                })
                .from(tasks)
                .leftJoin(projects, eq(tasks.projectId, projects.id))
                .where(
                    and(eq(tasks.sprintId, sprintId), isNull(tasks.deletedAt)),
                );

            // Get all task members for these tasks
            const taskIds = taskResults.map((r) => r.task.id);

            if (taskIds.length === 0) {
                return [];
            }

            // Import users dynamically to avoid circular deps
            const { users } = await import('@/server/db/schema/auth-schema');

            const memberResults = await db
                .select({
                    taskMember: taskMembers,
                    user: {
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        image: users.image,
                    },
                })
                .from(taskMembers)
                .leftJoin(users, eq(taskMembers.userId, users.id))
                .where(
                    and(
                        inArray(taskMembers.taskId, taskIds),
                        isNull(taskMembers.deletedAt),
                    ),
                );

            // Group members by task
            const membersByTask: Record<number, any[]> = {};
            for (const result of memberResults) {
                const taskId = result.taskMember.taskId;
                if (!membersByTask[taskId]) {
                    membersByTask[taskId] = [];
                }
                if (result.user) {
                    membersByTask[taskId].push(result.user);
                }
            }

            return taskResults.map((row) => ({
                ...row.task,
                project: row.project,
                members: membersByTask[row.task.id] || [],
            }));
        } catch (error) {
            throw error;
        }
    },

    searchTasks: async (input: {
        organizationId?: number;
        projectIds?: number[];
        sprintIds?: number[];
        statuses?: string[];
        query?: string;
        page?: number;
        limit?: number;
        userId?: string;
    }) => {
        const {
            organizationId,
            projectIds,
            sprintIds,
            statuses,
            query = '',
            page = 1,
            limit = 10,
            userId,
        } = input;
        try {
            const allTasks = await taskService.getTasks(
                organizationId,
                projectIds,
                sprintIds,
                statuses,
                userId,
            );

            let filteredTasks = allTasks;

            if (query && query.trim() !== '') {
                const fuse = new Fuse(allTasks, {
                    keys: [
                        'name',
                        'description',
                        'project.name',
                        'sprint.name',
                    ],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredTasks = results.map((result) => result.item);
            }

            const total = filteredTasks.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedTasks = filteredTasks.slice(offset, offset + limit);

            return {
                data: paginatedTasks,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            };
        } catch (error) {
            throw error;
        }
    },

    updateTask: async (
        id: number,
        data: {
            name?: string;
            description?: string;
            status?:
                | 'todo'
                | 'in-progress'
                | 'done'
                | 'on-hold'
                | 'in-review'
                | 'rejected';
            sprintId?: number | null;
            startDate?: Date | null;
            endDate?: Date | null;
            assignees?: string[];
        },
        userId: string,
    ) => {
        try {
            // Get current task to detect status change
            const currentTask = await db.query.tasks.findFirst({
                where: eq(tasks.id, id),
            });

            const oldStatus = currentTask?.status;
            const newStatus = data.status;

            return await db.transaction(async (tx) => {
                const { assignees, ...taskData } = data;

                // If status is changing, update statusChangedAt
                const updateData: any = {
                    ...taskData,
                    updatedAt: new Date(),
                    updatedBy: userId,
                };

                if (newStatus && newStatus !== oldStatus) {
                    updateData.statusChangedAt = new Date();
                }

                const [updatedTask] = await tx
                    .update(tasks)
                    .set(updateData)
                    .where(eq(tasks.id, id))
                    .returning();

                if (!updatedTask) {
                    throw new Error('Task not found');
                }

                // Update assignees if provided
                if (assignees !== undefined) {
                    // Soft delete all existing task members
                    await tx
                        .update(taskMembers)
                        .set({
                            deletedAt: new Date(),
                            deletedBy: userId,
                            updatedAt: new Date(),
                        })
                        .where(
                            and(
                                eq(taskMembers.taskId, id),
                                isNull(taskMembers.deletedAt),
                            ),
                        );

                    // Add new assignees
                    if (assignees.length > 0) {
                        const memberValues = assignees.map((assigneeId) => ({
                            taskId: id,
                            userId: assigneeId,
                            role: 'member' as const,
                            createdBy: userId,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }));

                        await tx.insert(taskMembers).values(memberValues);
                    }
                }

                // Record status change for time tracking (after transaction commits)
                if (newStatus && newStatus !== oldStatus) {
                    // Import dynamically to avoid circular dependency
                    const { timeTrackingService } =
                        await import('./time-tracking.service');
                    await timeTrackingService.recordStatusChange(
                        id,
                        userId,
                        oldStatus || null,
                        newStatus,
                    );
                }

                console.log('Triggering calendar sync for task:', id);
                taskService.triggerCalendarSync(id).catch(console.error);
                console.log('Calendar sync triggered for task:', id);
                return updatedTask;
            });
        } catch (error) {
            throw error;
        }
    },

    getTaskAssignees: async (taskId: number) => {
        try {
            const { users } = await import('@/server/db/schema/auth-schema');

            const memberResults = await db
                .select({
                    taskMember: taskMembers,
                    user: {
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        image: users.image,
                    },
                })
                .from(taskMembers)
                .leftJoin(users, eq(taskMembers.userId, users.id))
                .where(
                    and(
                        eq(taskMembers.taskId, taskId),
                        isNull(taskMembers.deletedAt),
                    ),
                );

            return memberResults
                .filter(
                    (r): r is typeof r & { user: NonNullable<typeof r.user> } =>
                        !!r.user,
                )
                .map((r) => r.user);
        } catch (error) {
            throw error;
        }
    },

    deleteTask: async (id: number, userId: string) => {
        try {
            const [deletedTask] = await db
                .update(tasks)
                .set({
                    deletedAt: new Date(),
                    deletedBy: userId,
                    updatedAt: new Date(),
                })
                .where(eq(tasks.id, id))
                .returning();

            if (!deletedTask) {
                throw new Error('Task not found');
            }

            if (deletedTask) {
                taskService.triggerCalendarSync(id, true).catch(console.error);
            }

            return deletedTask;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Trigger Google Calendar sync for all assignees of a task
     */
    triggerCalendarSync: async (taskId: number, isDeleted = false) => {
        try {
            // If task is deleted, remove all calendar events
            if (isDeleted) {
                const existingEvents = await db.query.calendarEvents.findMany({
                    where: eq(calendarEvents.taskId, taskId),
                });
                for (const event of existingEvents) {
                    await googleCalendarService
                        .deleteTaskEvent(event.userId, taskId)
                        .catch(() => {});
                }
                return;
            }

            // Get the task to check its status
            const task = await db.query.tasks.findFirst({
                where: eq(tasks.id, taskId),
            });

            if (!task) {
                console.warn(`[CalendarSync] Task ${taskId} not found`);
                return;
            }

            // Statuses that should have calendar events
            const activeStatuses = [
                'todo',
                'in-progress',
                'in-review',
                'on-hold',
            ];
            // Statuses that should NOT have calendar events (delete if exists)
            const completedStatuses = ['done', 'rejected'];

            const existingEvents = await db.query.calendarEvents.findMany({
                where: eq(calendarEvents.taskId, taskId),
            });
            const usersWithEvents = new Set(
                existingEvents.map((e) => e.userId),
            );

            // If task is completed or rejected, delete all calendar events
            if (completedStatuses.includes(task.status)) {
                console.log(
                    `[CalendarSync] Task ${taskId} is ${task.status}, removing calendar events`,
                );
                for (const event of existingEvents) {
                    await googleCalendarService
                        .deleteTaskEvent(event.userId, taskId)
                        .then(() =>
                            console.log(
                                `Successfully deleted calendar event for user: ${event.userId}`,
                            ),
                        )
                        .catch((err) => {
                            console.error(
                                `Failed to delete calendar event for user ${event.userId}:`,
                                err.message,
                            );
                        });
                }
                return;
            }

            // If task has an active status, create/update events for assignees
            if (activeStatuses.includes(task.status)) {
                const assignees = await taskService.getTaskAssignees(taskId);
                const assigneeIds = new Set(assignees.map((a) => a.id));

                // Create/Update for all current assignees
                for (const assigneeId of assigneeIds) {
                    console.log(
                        `Updating calendar event for assignee: ${assigneeId}`,
                    );
                    await googleCalendarService
                        .updateTaskEvent(assigneeId, taskId)
                        .then(() =>
                            console.log(
                                `Successfully updated calendar event for assignee: ${assigneeId}`,
                            ),
                        )
                        .catch((err) => {
                            console.error(
                                `Failed to update calendar event for assignee ${assigneeId}:`,
                                err.message,
                            );
                        });
                }

                // Delete for users who were assignees but are no longer
                for (const userId of usersWithEvents) {
                    if (!assigneeIds.has(userId)) {
                        console.log(
                            `Deleting calendar event for former assignee: ${userId}`,
                        );
                        await googleCalendarService
                            .deleteTaskEvent(userId, taskId)
                            .then(() =>
                                console.log(
                                    `Successfully deleted calendar event for former assignee: ${userId}`,
                                ),
                            )
                            .catch((err) => {
                                console.error(
                                    `Failed to delete calendar event for former assignee ${userId}:`,
                                    err.message,
                                );
                            });
                    }
                }
            }
        } catch (error) {
            console.error('Error triggering calendar sync:', error);
        }
    },
};
