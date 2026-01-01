import { db } from '@/server/db';
import { eq, and, isNull, inArray, SQL, exists } from 'drizzle-orm';
import {
    sprints,
    projects,
    projectMembers,
} from '@/server/db/schema/project-schema';
import Fuse from 'fuse.js';

export const sprintService = {
    createSprint: async (
        input: {
            projectId: number;
            name: string;
            description?: string;
            status: 'active' | 'inactive' | 'completed';
            startDate?: Date;
            endDate?: Date;
        },
        userId: string,
    ) => {
        try {
            const [sprint] = await db
                .insert(sprints)
                .values({
                    projectId: input.projectId,
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

            return sprint;
        } catch (error) {
            throw error;
        }
    },

    getSprintById: async (id: number) => {
        try {
            const [result] = await db
                .select({
                    sprint: sprints,
                    project: {
                        id: projects.id,
                        name: projects.name,
                        organizationId: projects.organizationId,
                    },
                })
                .from(sprints)
                .leftJoin(projects, eq(sprints.projectId, projects.id))
                .where(and(eq(sprints.id, id), isNull(sprints.deletedAt)));

            if (!result) {
                throw new Error('Sprint not found');
            }

            return {
                ...result.sprint,
                project: result.project,
            };
        } catch (error) {
            throw error;
        }
    },

    getSprints: async (
        organizationId?: number,
        projectIds?: number[],
        statuses?: string[],
        userId?: string,
    ) => {
        try {
            const conditions: (SQL | undefined)[] = [isNull(sprints.deletedAt)];

            if (projectIds && projectIds.length > 0) {
                conditions.push(inArray(sprints.projectId, projectIds));
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

            if (statuses && statuses.length > 0) {
                conditions.push(inArray(sprints.status, statuses as any));
            }

            const results = await db
                .select({
                    sprint: sprints,
                    project: {
                        id: projects.id,
                        name: projects.name,
                    },
                })
                .from(sprints)
                .leftJoin(projects, eq(sprints.projectId, projects.id))
                .where(and(...conditions));

            return results.map((row) => ({
                ...row.sprint,
                project: row.project,
            }));
        } catch (error) {
            throw error;
        }
    },

    searchSprints: async (input: {
        organizationId?: number;
        projectIds?: number[];
        query?: string;
        statuses?: string[];
        page?: number;
        limit?: number;
        userId?: string;
    }) => {
        const {
            organizationId,
            projectIds,
            query = '',
            statuses,
            page = 1,
            limit = 10,
            userId,
        } = input;
        try {
            const allSprints = await sprintService.getSprints(
                organizationId,
                projectIds,
                statuses,
                userId,
            );

            let filteredSprints = allSprints;

            if (query && query.trim() !== '') {
                const fuse = new Fuse(allSprints, {
                    keys: ['name', 'description', 'project.name'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredSprints = results.map((result) => result.item);
            }

            const total = filteredSprints.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedSprints = filteredSprints.slice(
                offset,
                offset + limit,
            );

            return {
                data: paginatedSprints,
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

    updateSprint: async (
        id: number,
        data: {
            name?: string;
            description?: string;
            status?: 'active' | 'inactive' | 'completed';
            startDate?: Date | null;
            endDate?: Date | null;
        },
        userId: string,
    ) => {
        try {
            const [updatedSprint] = await db
                .update(sprints)
                .set({
                    ...data,
                    updatedAt: new Date(),
                    updatedBy: userId,
                })
                .where(eq(sprints.id, id))
                .returning();

            if (!updatedSprint) {
                throw new Error('Sprint not found');
            }

            return updatedSprint;
        } catch (error) {
            throw error;
        }
    },

    deleteSprint: async (id: number, userId: string) => {
        try {
            const [deletedSprint] = await db
                .update(sprints)
                .set({
                    deletedAt: new Date(),
                    deletedBy: userId,
                    updatedAt: new Date(),
                })
                .where(eq(sprints.id, id))
                .returning();

            if (!deletedSprint) {
                throw new Error('Sprint not found');
            }

            return deletedSprint;
        } catch (error) {
            throw error;
        }
    },
};
