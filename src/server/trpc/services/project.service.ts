import { db } from '@/server/db';
import {
    projects,
    projectMembers,
    sprints,
    tasks,
} from '@/server/db/schema/project-schema';
import { users } from '@/server/db/schema/auth-schema';
import { eq, and, sql, isNull, ilike, or, inArray } from 'drizzle-orm';
import Fuse from 'fuse.js';

export const projectService = {
    createProject: async (
        input: {
            name: string;
            description?: string;
            profilePicture?: string;
            organizationId: number;
        },
        userId: string,
    ) => {
        try {
            return await db.transaction(async (tx) => {
                const [project] = await tx
                    .insert(projects)
                    .values({
                        name: input.name,
                        description: input.description,
                        profilePicture: input.profilePicture,
                        organizationId: input.organizationId,
                        createdBy: userId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning();

                // Add creator as admin member
                await tx.insert(projectMembers).values({
                    projectId: project.id,
                    userId: userId,
                    role: 'admin',
                    createdBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                return project;
            });
        } catch (error) {
            throw error;
        }
    },

    getProjects: async (organizationId: number) => {
        try {
            const result = await db
                .select({
                    id: projects.id,
                    name: projects.name,
                    description: projects.description,
                    profilePicture: projects.profilePicture,
                    createdAt: projects.createdAt,
                    organizationId: projects.organizationId,
                    sprintCount: sql<number>`(SELECT count(*) FROM ${sprints} WHERE ${sprints.projectId} = ${projects.id} AND ${sprints.deletedAt} IS NULL)`,
                    taskCount: sql<number>`(SELECT count(*) FROM ${tasks} WHERE ${tasks.projectId} = ${projects.id} AND ${tasks.deletedAt} IS NULL)`,
                })
                .from(projects)
                .where(
                    and(
                        eq(projects.organizationId, organizationId),
                        isNull(projects.deletedAt),
                    ),
                );

            // Fetch members for these projects
            const projectIds = result.map((p) => p.id);
            if (projectIds.length === 0) return [];

            const members = await db.query.projectMembers.findMany({
                where: and(
                    inArray(projectMembers.projectId, projectIds),
                    isNull(projectMembers.deletedAt),
                ),
                with: {
                    user: true,
                },
            });

            // Map members back to projects
            return result.map((p) => ({
                ...p,
                members: members
                    .filter((m) => m.projectId === p.id)
                    .map((m) => (m as any).user)
                    .filter(Boolean),
            }));
        } catch (error) {
            throw error;
        }
    },

    searchProjects: async (
        organizationId: number,
        query: string,
        page: number = 1,
        limit: number = 10,
    ) => {
        try {
            const allProjects =
                await projectService.getProjects(organizationId);

            let filteredProjects = allProjects;

            if (query && query.trim() !== '') {
                const fuse = new Fuse(allProjects, {
                    keys: ['name', 'description'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredProjects = results.map((result) => result.item);
            }

            const total = filteredProjects.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedProjects = filteredProjects.slice(
                offset,
                offset + limit,
            );

            return {
                data: paginatedProjects,
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

    getProjectById: async (id: number) => {
        try {
            const [project] = await db
                .select({
                    id: projects.id,
                    name: projects.name,
                    description: projects.description,
                    profilePicture: projects.profilePicture,
                    organizationId: projects.organizationId,
                    createdAt: projects.createdAt,
                })
                .from(projects)
                .where(eq(projects.id, id));
            return project;
        } catch (error) {
            throw error;
        }
    },

    getProjectMembers: async (projectId: number) => {
        try {
            return await db.query.projectMembers.findMany({
                where: and(
                    eq(projectMembers.projectId, projectId),
                    isNull(projectMembers.deletedAt),
                ),
                with: {
                    user: true,
                },
            });
        } catch (error) {
            throw error;
        }
    },

    addMembers: async (
        input: {
            projectId: number;
            members: { userId: string; role: 'member' | 'admin' }[];
        },
        currentUserId: string,
    ) => {
        try {
            return await db.transaction(async (tx) => {
                const results = [];
                for (const member of input.members) {
                    const [newMember] = await tx
                        .insert(projectMembers)
                        .values({
                            projectId: input.projectId,
                            userId: member.userId,
                            role: member.role,
                            createdBy: currentUserId,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                        .returning();
                    results.push(newMember);
                }
                return results;
            });
        } catch (error) {
            throw error;
        }
    },

    removeMember: async (id: number, userId: string) => {
        try {
            const [deletedMember] = await db
                .update(projectMembers)
                .set({
                    deletedAt: new Date(),
                    deletedBy: userId,
                    updatedAt: new Date(),
                })
                .where(eq(projectMembers.id, id))
                .returning();
            return deletedMember;
        } catch (error) {
            throw error;
        }
    },

    getAvailableMembersForProject: async (
        projectId: number,
        organizationId: number,
        query: string = '',
        page: number = 1,
        limit: number = 10,
    ) => {
        try {
            // Get all organization members
            const orgMembers = await db
                .select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    image: users.image,
                })
                .from(users)
                .innerJoin(
                    sql`(SELECT user_id FROM organization_members WHERE organization_id = ${organizationId} AND deleted_at IS NULL) as om`,
                    eq(users.id, sql`om.user_id`),
                )
                .where(
                    and(
                        isNull(users.deletedAt),
                        or(
                            ilike(users.name, `%${query}%`),
                            ilike(users.email, `%${query}%`),
                        ),
                    ),
                );

            // Get existing project members
            const existingProjectMembers = await db
                .select({ userId: projectMembers.userId })
                .from(projectMembers)
                .where(
                    and(
                        eq(projectMembers.projectId, projectId),
                        isNull(projectMembers.deletedAt),
                    ),
                );

            const existingUserIds = new Set(
                existingProjectMembers.map((m) => m.userId),
            );

            // Filter out existing members
            const availableUsers = orgMembers.filter(
                (u) => !existingUserIds.has(u.id),
            );

            const total = availableUsers.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedUsers = availableUsers.slice(offset, offset + limit);

            return {
                data: paginatedUsers,
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

    updateProject: async (
        id: number,
        data: { name?: string; description?: string; profilePicture?: string },
        userId: string,
    ) => {
        try {
            const [updatedProject] = await db
                .update(projects)
                .set({
                    ...data,
                    updatedAt: new Date(),
                    updatedBy: userId,
                })
                .where(eq(projects.id, id))
                .returning();

            if (!updatedProject) {
                throw new Error('Project not found');
            }

            return updatedProject;
        } catch (error) {
            throw error;
        }
    },

    deleteProject: async (id: number, userId: string) => {
        try {
            const [deletedProject] = await db
                .update(projects)
                .set({
                    deletedAt: new Date(),
                    deletedBy: userId,
                    updatedAt: new Date(),
                })
                .where(eq(projects.id, id))
                .returning();

            if (!deletedProject) {
                throw new Error('Project not found');
            }

            return deletedProject;
        } catch (error) {
            throw error;
        }
    },
};
