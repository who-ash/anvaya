import { db } from '@/server/db';
import { users } from '@/server/db/schema/auth-schema';
import {
    tasks,
    taskMembers,
    projects,
    sprints as sprintsTable,
    projectMembers,
} from '@/server/db/schema/project-schema';
import { eq, and, isNull, inArray, SQL, exists } from 'drizzle-orm';
import Fuse from 'fuse.js';

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
                .filter((r) => r.user)
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

            return memberResults.filter((r) => r.user).map((r) => r.user);
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

            return deletedTask;
        } catch (error) {
            throw error;
        }
    },
};
