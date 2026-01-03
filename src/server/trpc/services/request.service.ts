import { db } from '@/server/db';
import { users } from '@/server/db/schema/auth-schema';
import {
    requests,
    requestTemplates,
    requestComments,
    requestAttachments,
} from '@/server/db/schema/request-schema';
import { projects, sprints, tasks } from '@/server/db/schema/project-schema';
import { eq, and, isNull, inArray, SQL, desc } from 'drizzle-orm';
import Fuse from 'fuse.js';

export const requestService = {
    createRequest: async (
        input: {
            organizationId: number;
            projectId: number;
            sprintId?: number;
            taskId?: number;
            templateId?: number;
            type: 'bug' | 'feature_request' | 'feedback' | 'query';
            title: string;
            content?: Record<string, any>;
            description?: string;
            priority?: 'low' | 'medium' | 'high' | 'critical';
            assigneeId?: string;
        },
        userId: string,
    ) => {
        try {
            const [request] = await db
                .insert(requests)
                .values({
                    organizationId: input.organizationId,
                    projectId: input.projectId,
                    sprintId: input.sprintId,
                    taskId: input.taskId,
                    templateId: input.templateId,
                    type: input.type,
                    title: input.title,
                    content: input.content,
                    description: input.description,
                    priority: input.priority || 'medium',
                    assigneeId: input.assigneeId,
                    createdBy: userId,
                })
                .returning();

            return request;
        } catch (error) {
            throw error;
        }
    },

    getRequestById: async (id: number) => {
        try {
            const [result] = await db
                .select({
                    request: requests,
                    assignee: {
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        image: users.image,
                    },
                    project: {
                        id: projects.id,
                        name: projects.name,
                    },
                    sprint: {
                        id: sprints.id,
                        name: sprints.name,
                    },
                    task: {
                        id: tasks.id,
                        name: tasks.name,
                    },
                })
                .from(requests)
                .leftJoin(users, eq(requests.assigneeId, users.id))
                .leftJoin(projects, eq(requests.projectId, projects.id))
                .leftJoin(sprints, eq(requests.sprintId, sprints.id))
                .leftJoin(tasks, eq(requests.taskId, tasks.id))
                .where(and(eq(requests.id, id), isNull(requests.deletedAt)));

            if (!result) {
                throw new Error('Request not found');
            }

            // Get creator info
            const [creator] = await db
                .select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    image: users.image,
                })
                .from(users)
                .where(eq(users.id, result.request.createdBy));

            // Get comments count
            const comments = await db
                .select()
                .from(requestComments)
                .where(
                    and(
                        eq(requestComments.requestId, id),
                        isNull(requestComments.deletedAt),
                    ),
                );

            // Get attachments
            const attachments = await db
                .select()
                .from(requestAttachments)
                .where(eq(requestAttachments.requestId, id));

            return {
                ...result.request,
                assignee: result.assignee,
                project: result.project,
                sprint: result.sprint,
                task: result.task,
                creator,
                commentsCount: comments.length,
                attachments,
            };
        } catch (error) {
            throw error;
        }
    },

    getRequests: async (
        organizationId: number,
        types?: string[],
        statuses?: string[],
        priorities?: string[],
        projectId?: number,
    ) => {
        try {
            const conditions: (SQL | undefined)[] = [
                isNull(requests.deletedAt),
                eq(requests.organizationId, organizationId),
            ];

            if (projectId) {
                conditions.push(eq(requests.projectId, projectId));
            }

            if (types && types.length > 0) {
                conditions.push(inArray(requests.type, types as any[]));
            }

            if (statuses && statuses.length > 0) {
                conditions.push(inArray(requests.status, statuses as any[]));
            }

            if (priorities && priorities.length > 0) {
                conditions.push(
                    inArray(requests.priority, priorities as any[]),
                );
            }

            const results = await db
                .select({
                    request: requests,
                    assignee: {
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        image: users.image,
                    },
                })
                .from(requests)
                .leftJoin(users, eq(requests.assigneeId, users.id))
                .where(and(...conditions))
                .orderBy(desc(requests.createdAt));

            return results.map((row) => ({
                ...row.request,
                assignee: row.assignee,
            }));
        } catch (error) {
            throw error;
        }
    },

    searchRequests: async (input: {
        organizationId: number;
        types?: string[];
        statuses?: string[];
        priorities?: string[];
        query?: string;
        page?: number;
        limit?: number;
        projectId?: number;
    }) => {
        const {
            organizationId,
            types,
            statuses,
            priorities,
            query = '',
            page = 1,
            limit = 10,
            projectId,
        } = input;

        try {
            const allRequests = await requestService.getRequests(
                organizationId,
                types,
                statuses,
                priorities,
                projectId,
            );

            let filteredRequests = allRequests;

            if (query && query.trim() !== '') {
                const fuse = new Fuse(allRequests, {
                    keys: ['title', 'description', 'type'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredRequests = results.map((result) => result.item);
            }

            const total = filteredRequests.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedRequests = filteredRequests.slice(
                offset,
                offset + limit,
            );

            return {
                data: paginatedRequests,
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

    updateRequest: async (
        id: number,
        data: {
            title?: string;
            description?: string;
            content?: Record<string, any>;
            status?:
                | 'open'
                | 'in-progress'
                | 'resolved'
                | 'closed'
                | 'rejected';
            priority?: 'low' | 'medium' | 'high' | 'critical';
            assigneeId?: string | null;
            projectId?: number;
            sprintId?: number | null;
            taskId?: number | null;
        },
        userId: string,
    ) => {
        try {
            const [updatedRequest] = await db
                .update(requests)
                .set({
                    ...data,
                    updatedAt: new Date(),
                    updatedBy: userId,
                })
                .where(eq(requests.id, id))
                .returning();

            if (!updatedRequest) {
                throw new Error('Request not found');
            }

            return updatedRequest;
        } catch (error) {
            throw error;
        }
    },

    deleteRequest: async (id: number, userId: string) => {
        try {
            const [deletedRequest] = await db
                .update(requests)
                .set({
                    deletedAt: new Date(),
                    updatedBy: userId,
                    updatedAt: new Date(),
                })
                .where(eq(requests.id, id))
                .returning();

            if (!deletedRequest) {
                throw new Error('Request not found');
            }

            return deletedRequest;
        } catch (error) {
            throw error;
        }
    },

    // Template operations
    getTemplates: async (organizationId: number) => {
        try {
            return await db
                .select()
                .from(requestTemplates)
                .where(
                    and(
                        eq(requestTemplates.organizationId, organizationId),
                        isNull(requestTemplates.deletedAt),
                    ),
                );
        } catch (error) {
            throw error;
        }
    },

    createTemplate: async (
        input: {
            organizationId: number;
            type: 'bug' | 'feature_request' | 'feedback' | 'query';
            name: string;
            description?: string;
            schema: Record<string, any>;
            isDefault?: boolean;
        },
        userId: string,
    ) => {
        try {
            const [template] = await db
                .insert(requestTemplates)
                .values({
                    ...input,
                    createdBy: userId,
                })
                .returning();

            return template;
        } catch (error) {
            throw error;
        }
    },
};
