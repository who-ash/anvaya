import { db } from '@/server/db';
import { CreateOrganizationInput } from '../routers/organization.router';
import {
    organizations,
    organizationMembers,
    organizationGroups,
    organizationGroupMembers,
} from '@/server/db/schema/organization-schema';
import { users } from '@/server/db/schema/auth-schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import Fuse from 'fuse.js';

type OrganizationMemberRole = 'member' | 'admin';
type GroupMemberRole = 'member' | 'admin' | 'evaluator';

export const organizationService = {
    createOrganization: async (
        input: CreateOrganizationInput,
        userId: string,
    ) => {
        try {
            const [organization] = await db
                .insert(organizations)
                .values({
                    name: input.name,
                    description: input.description,
                    type: input.type,
                    profilePicture: input.profilePicture,
                    createdBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            return organization;
        } catch (error) {
            throw error;
        }
    },

    getAllOrganizations: async () => {
        try {
            const allOrganizations = await db
                .select({
                    id: organizations.id,
                    name: organizations.name,
                    description: organizations.description,
                    type: organizations.type,
                    profilePicture: organizations.profilePicture,
                    createdAt: organizations.createdAt,
                    updatedAt: organizations.updatedAt,
                    createdBy: organizations.createdBy,
                })
                .from(organizations);

            return allOrganizations;
        } catch (error) {
            throw error;
        }
    },

    getOrganizationById: async (id: number) => {
        try {
            const [organization] = await db
                .select({
                    id: organizations.id,
                    name: organizations.name,
                    description: organizations.description,
                    type: organizations.type,
                    profilePicture: organizations.profilePicture,
                    createdAt: organizations.createdAt,
                })
                .from(organizations)
                .where(eq(organizations.id, id));

            if (!organization) {
                throw new Error('Organization not found');
            }

            return organization;
        } catch (error) {
            throw error;
        }
    },

    searchOrganizations: async (
        query: string,
        page: number = 1,
        limit: number = 10,
    ) => {
        try {
            let filteredOrganizations;

            if (!query || query.trim() === '') {
                filteredOrganizations =
                    await organizationService.getAllOrganizations();
            } else {
                const allOrganizations =
                    await organizationService.getAllOrganizations();

                const fuse = new Fuse(allOrganizations, {
                    keys: ['name', 'description', 'type'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredOrganizations = results.map((result) => result.item);
            }

            // Calculate pagination
            const total = filteredOrganizations.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedOrganizations = filteredOrganizations.slice(
                offset,
                offset + limit,
            );

            return {
                data: paginatedOrganizations,
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

    updateOrganization: async (
        id: number,
        data: { name?: string; description?: string; profilePicture?: string },
    ) => {
        try {
            const [updatedOrganization] = await db
                .update(organizations)
                .set({
                    ...data,
                    updatedAt: new Date(),
                })
                .where(eq(organizations.id, id))
                .returning();

            if (!updatedOrganization) {
                throw new Error('Organization not found');
            }

            return updatedOrganization;
        } catch (error) {
            throw error;
        }
    },

    deleteOrganization: async (id: number, deletedBy: string) => {
        try {
            return await db.transaction(async (tx) => {
                const [deletedOrganization] = await tx
                    .update(organizations)
                    .set({
                        deletedAt: new Date(),
                        deletedBy,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(organizations.id, id),
                            isNull(organizations.deletedAt),
                        ),
                    )
                    .returning();

                if (!deletedOrganization) {
                    throw new Error('Organization not found');
                }

                await tx
                    .update(organizationMembers)
                    .set({
                        deletedAt: new Date(),
                        deletedBy,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(organizationMembers.organizationId, id),
                            isNull(organizationMembers.deletedAt),
                        ),
                    );

                await tx
                    .update(organizationGroups)
                    .set({
                        deletedAt: new Date(),
                        deletedBy,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(organizationGroups.organizationId, id),
                            isNull(organizationGroups.deletedAt),
                        ),
                    );

                await tx
                    .update(organizationGroupMembers)
                    .set({
                        deletedAt: new Date(),
                        deletedBy,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(organizationGroupMembers.organizationId, id),
                            isNull(organizationGroupMembers.deletedAt),
                        ),
                    );

                return deletedOrganization;
            });
        } catch (error) {
            throw error;
        }
    },

    // Member management
    getMembers: async (
        organizationId: number,
        query: string,
        page: number = 1,
        limit: number = 10,
    ) => {
        try {
            // Get all members with user details (excluding soft-deleted)
            const allMembers = await db
                .select({
                    id: organizationMembers.id,
                    userId: organizationMembers.userId,
                    role: organizationMembers.role,
                    userName: users.name,
                    userEmail: users.email,
                    userImage: users.image,
                })
                .from(organizationMembers)
                .innerJoin(users, eq(organizationMembers.userId, users.id))
                .where(
                    and(
                        eq(organizationMembers.organizationId, organizationId),
                        isNull(organizationMembers.deletedAt),
                    ),
                );

            // Transform to expected format
            const membersWithUserDetails = allMembers.map((member) => ({
                id: member.id,
                userId: member.userId,
                role: member.role,
                user: {
                    id: member.userId,
                    name: member.userName,
                    email: member.userEmail,
                    image: member.userImage,
                },
            }));

            let filteredMembers = membersWithUserDetails;

            // Apply search filter if query exists
            if (query && query.trim() !== '') {
                const fuse = new Fuse(membersWithUserDetails, {
                    keys: ['user.name', 'user.email', 'role'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredMembers = results.map((result) => result.item);
            }

            // Calculate pagination
            const total = filteredMembers.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedMembers = filteredMembers.slice(
                offset,
                offset + limit,
            );

            return {
                data: paginatedMembers,
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

    // Get organization members in simplified format for adding to groups
    getOrgMembersForGroups: async (
        organizationId: number,
        query: string,
        page: number = 1,
        limit: number = 10,
    ) => {
        try {
            // Get all members with user details (excluding soft-deleted)
            const allMembers = await db
                .select({
                    id: organizationMembers.id,
                    userId: organizationMembers.userId,
                    userName: users.name,
                    userEmail: users.email,
                    userImage: users.image,
                })
                .from(organizationMembers)
                .innerJoin(users, eq(organizationMembers.userId, users.id))
                .where(
                    and(
                        eq(organizationMembers.organizationId, organizationId),
                        isNull(organizationMembers.deletedAt),
                    ),
                );

            // Transform to simplified format
            const simplifiedMembers = allMembers.map((member) => ({
                id: member.id,
                userId: member.userId,
                name: member.userName,
                email: member.userEmail,
                image: member.userImage,
            }));

            let filteredMembers = simplifiedMembers;

            // Apply search filter if query exists
            if (query && query.trim() !== '') {
                const fuse = new Fuse(simplifiedMembers, {
                    keys: ['name', 'email'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredMembers = results.map((result) => result.item);
            }

            // Calculate pagination
            const total = filteredMembers.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedMembers = filteredMembers.slice(
                offset,
                offset + limit,
            );

            return {
                data: paginatedMembers,
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

    addMembers: async (
        organizationId: number,
        members: { userId: string; role: OrganizationMemberRole }[],
        createdBy: string,
    ) => {
        try {
            // Check for existing members (including soft-deleted)
            const userIds = members.map((m) => m.userId);
            const existingMembers = await db
                .select({
                    userId: organizationMembers.userId,
                    deletedAt: organizationMembers.deletedAt,
                })
                .from(organizationMembers)
                .where(
                    and(
                        eq(organizationMembers.organizationId, organizationId),
                        sql`${organizationMembers.userId} IN ${userIds}`,
                    ),
                );

            const existingMap = new Map(
                existingMembers.map((m) => [m.userId, m.deletedAt]),
            );

            const membersToInsert = [];
            const membersToRestore = [];

            for (const member of members) {
                const existingDeletedAt = existingMap.get(member.userId);

                if (existingDeletedAt === undefined) {
                    // Member doesn't exist, add to insert list
                    membersToInsert.push(member);
                } else if (existingDeletedAt !== null) {
                    // Member was soft-deleted, add to restore list
                    membersToRestore.push(member);
                } else {
                    // Member already exists and is active
                    throw new Error(
                        `User ${member.userId} is already a member of this organization`,
                    );
                }
            }

            // Insert new members
            let addedMembers: (typeof organizationMembers.$inferSelect)[] = [];
            if (membersToInsert.length > 0) {
                const insertValues = membersToInsert.map((member) => ({
                    organizationId,
                    userId: member.userId,
                    role: member.role,
                    createdBy,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));

                addedMembers = await db
                    .insert(organizationMembers)
                    .values(insertValues)
                    .returning();
            }

            // Restore soft-deleted members
            let restoredMembers: (typeof organizationMembers.$inferSelect)[] =
                [];
            for (const member of membersToRestore) {
                const [restored] = await db
                    .update(organizationMembers)
                    .set({
                        role: member.role,
                        deletedAt: null,
                        deletedBy: null,
                        updatedBy: createdBy,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(
                                organizationMembers.organizationId,
                                organizationId,
                            ),
                            eq(organizationMembers.userId, member.userId),
                        ),
                    )
                    .returning();

                if (restored) {
                    restoredMembers.push(restored);
                }
            }

            return [...addedMembers, ...restoredMembers];
        } catch (error) {
            throw error;
        }
    },

    removeMember: async (
        organizationId: number,
        userId: string,
        deletedBy: string,
    ) => {
        try {
            const [deletedMember] = await db
                .update(organizationMembers)
                .set({
                    deletedAt: new Date(),
                    deletedBy,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(organizationMembers.organizationId, organizationId),
                        eq(organizationMembers.userId, userId),
                        isNull(organizationMembers.deletedAt),
                    ),
                )
                .returning();

            if (!deletedMember) {
                throw new Error('Member not found or already deleted');
            }

            return deletedMember;
        } catch (error) {
            throw error;
        }
    },

    updateMemberRole: async (
        organizationId: number,
        userId: string,
        role: OrganizationMemberRole,
    ) => {
        try {
            const [updatedMember] = await db
                .update(organizationMembers)
                .set({
                    role,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(organizationMembers.organizationId, organizationId),
                        eq(organizationMembers.userId, userId),
                    ),
                )
                .returning();

            if (!updatedMember) {
                throw new Error('Member not found');
            }

            return updatedMember;
        } catch (error) {
            throw error;
        }
    },

    getAvailableUsersForOrg: async (
        organizationId: number,
        query: string,
        page: number = 1,
        limit: number = 10,
    ) => {
        try {
            const existingMemberIds = await db
                .select({ userId: organizationMembers.userId })
                .from(organizationMembers)
                .where(
                    and(
                        eq(organizationMembers.organizationId, organizationId),
                        isNull(organizationMembers.deletedAt),
                    ),
                );

            const existingUserIds = existingMemberIds.map((m) => m.userId);

            let allUsers = await db
                .select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    image: users.image,
                })
                .from(users)
                .where(isNull(users.deletedAt));

            const availableUsers = allUsers.filter(
                (user) => !existingUserIds.includes(user.id),
            );

            let filteredUsers = availableUsers;
            if (query && query.trim() !== '') {
                const fuse = new Fuse(availableUsers, {
                    keys: ['name', 'email'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredUsers = results.map((result) => result.item);
            }

            const total = filteredUsers.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedUsers = filteredUsers.slice(offset, offset + limit);

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

    getAvailableMembersForGroup: async (
        groupId: number,
        organizationId: number,
        query: string,
        page: number = 1,
        limit: number = 10,
    ) => {
        try {
            const existingGroupMemberIds = await db
                .select({ userId: organizationGroupMembers.userId })
                .from(organizationGroupMembers)
                .where(
                    and(
                        eq(organizationGroupMembers.groupId, groupId),
                        isNull(organizationGroupMembers.deletedAt),
                    ),
                );

            const existingUserIds = existingGroupMemberIds.map((m) => m.userId);

            const allOrgMembers = await db
                .select({
                    id: organizationMembers.id,
                    userId: organizationMembers.userId,
                    userName: users.name,
                    userEmail: users.email,
                    userImage: users.image,
                })
                .from(organizationMembers)
                .innerJoin(users, eq(organizationMembers.userId, users.id))
                .where(
                    and(
                        eq(organizationMembers.organizationId, organizationId),
                        isNull(organizationMembers.deletedAt),
                    ),
                );

            const availableMembers = allOrgMembers
                .filter((member) => !existingUserIds.includes(member.userId))
                .map((member) => ({
                    id: member.id,
                    userId: member.userId,
                    name: member.userName,
                    email: member.userEmail,
                    image: member.userImage,
                }));

            let filteredMembers = availableMembers;

            if (query && query.trim() !== '') {
                const fuse = new Fuse(availableMembers, {
                    keys: ['name', 'email'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredMembers = results.map((result) => result.item);
            }

            const total = filteredMembers.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedMembers = filteredMembers.slice(
                offset,
                offset + limit,
            );

            return {
                data: paginatedMembers,
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

    // Group management
    getGroups: async (
        organizationId: number,
        query: string,
        page: number = 1,
        limit: number = 10,
    ) => {
        try {
            // Get all groups with member count
            const allGroups = await db
                .select({
                    id: organizationGroups.id,
                    name: organizationGroups.name,
                    description: organizationGroups.description,
                    profilePicture: organizationGroups.profilePicture,
                })
                .from(organizationGroups)
                .where(
                    and(
                        eq(organizationGroups.organizationId, organizationId),
                        isNull(organizationGroups.deletedAt),
                    ),
                );

            let filteredGroups = allGroups;

            // Apply search filter if query exists
            if (query && query.trim() !== '') {
                const fuse = new Fuse(allGroups, {
                    keys: ['name', 'description'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredGroups = results.map((result) => result.item);
            }

            // Calculate pagination
            const total = filteredGroups.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedGroups = filteredGroups.slice(
                offset,
                offset + limit,
            );

            return {
                data: paginatedGroups,
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

    createGroup: async (
        input: {
            organizationId: number;
            name: string;
            description?: string;
            profilePicture?: string;
            members?: string[];
        },
        userId: string,
    ) => {
        try {
            const [group] = await db
                .insert(organizationGroups)
                .values({
                    organizationId: input.organizationId,
                    name: input.name,
                    description: input.description,
                    profilePicture: input.profilePicture,
                    createdBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            if (input.members && input.members.length > 0) {
                const memberValues = input.members.map((memberId) => ({
                    groupId: group.id,
                    organizationId: input.organizationId,
                    userId: memberId,
                    role: 'member' as GroupMemberRole,
                    createdBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));

                await db.insert(organizationGroupMembers).values(memberValues);
            }

            return group;
        } catch (error) {
            throw error;
        }
    },

    updateGroup: async (
        groupId: number,
        data: { name?: string; description?: string; profilePicture?: string },
    ) => {
        try {
            const [updatedGroup] = await db
                .update(organizationGroups)
                .set({
                    ...data,
                    updatedAt: new Date(),
                })
                .where(eq(organizationGroups.id, groupId))
                .returning();

            if (!updatedGroup) {
                throw new Error('Group not found');
            }

            return updatedGroup;
        } catch (error) {
            throw error;
        }
    },

    // Group member management
    getGroupMembers: async (
        groupId: number,
        query: string,
        page: number = 1,
        limit: number = 10,
    ) => {
        try {
            // Get all group members with user details (excluding soft-deleted)
            const allMembers = await db
                .select({
                    id: organizationGroupMembers.id,
                    userId: organizationGroupMembers.userId,
                    role: organizationGroupMembers.role,
                    userName: users.name,
                    userEmail: users.email,
                    userImage: users.image,
                })
                .from(organizationGroupMembers)
                .innerJoin(users, eq(organizationGroupMembers.userId, users.id))
                .where(
                    and(
                        eq(organizationGroupMembers.groupId, groupId),
                        isNull(organizationGroupMembers.deletedAt),
                    ),
                );

            // Transform to expected format
            const membersWithUserDetails = allMembers.map((member) => ({
                id: member.id,
                userId: member.userId,
                role: member.role,
                user: {
                    id: member.userId,
                    name: member.userName,
                    email: member.userEmail,
                    image: member.userImage,
                },
            }));

            let filteredMembers = membersWithUserDetails;

            // Apply search filter if query exists
            if (query && query.trim() !== '') {
                const fuse = new Fuse(membersWithUserDetails, {
                    keys: ['user.name', 'user.email', 'role'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredMembers = results.map((result) => result.item);
            }

            // Calculate pagination
            const total = filteredMembers.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedMembers = filteredMembers.slice(
                offset,
                offset + limit,
            );

            return {
                data: paginatedMembers,
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

    addGroupMembers: async (
        groupId: number,
        members: { userId: string; role: GroupMemberRole }[],
        createdBy: string,
    ) => {
        try {
            // First, get the group to retrieve organizationId
            const [group] = await db
                .select({ organizationId: organizationGroups.organizationId })
                .from(organizationGroups)
                .where(eq(organizationGroups.id, groupId));

            if (!group) {
                throw new Error('Group not found');
            }

            // Check for existing group members (including soft-deleted)
            const userIds = members.map((m) => m.userId);
            const existingMembers = await db
                .select({
                    userId: organizationGroupMembers.userId,
                    deletedAt: organizationGroupMembers.deletedAt,
                })
                .from(organizationGroupMembers)
                .where(
                    and(
                        eq(organizationGroupMembers.groupId, groupId),
                        sql`${organizationGroupMembers.userId} IN ${userIds}`,
                    ),
                );

            const existingMap = new Map(
                existingMembers.map((m) => [m.userId, m.deletedAt]),
            );

            const membersToInsert = [];
            const membersToRestore = [];

            for (const member of members) {
                const existingDeletedAt = existingMap.get(member.userId);

                if (existingDeletedAt === undefined) {
                    // Member doesn't exist, add to insert list
                    membersToInsert.push(member);
                } else if (existingDeletedAt !== null) {
                    // Member was soft-deleted, add to restore list
                    membersToRestore.push(member);
                } else {
                    // Member already exists and is active
                    throw new Error(
                        `User ${member.userId} is already a member of this group`,
                    );
                }
            }

            // Insert new members
            let addedMembers: (typeof organizationGroupMembers.$inferSelect)[] =
                [];
            if (membersToInsert.length > 0) {
                const insertValues = membersToInsert.map((member) => ({
                    groupId,
                    organizationId: group.organizationId,
                    userId: member.userId,
                    role: member.role,
                    createdBy,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));

                addedMembers = await db
                    .insert(organizationGroupMembers)
                    .values(insertValues)
                    .returning();
            }

            // Restore soft-deleted members
            let restoredMembers: (typeof organizationGroupMembers.$inferSelect)[] =
                [];
            for (const member of membersToRestore) {
                const [restored] = await db
                    .update(organizationGroupMembers)
                    .set({
                        role: member.role,
                        deletedAt: null,
                        deletedBy: null,
                        updatedBy: createdBy,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(organizationGroupMembers.groupId, groupId),
                            eq(organizationGroupMembers.userId, member.userId),
                        ),
                    )
                    .returning();

                if (restored) {
                    restoredMembers.push(restored);
                }
            }

            return [...addedMembers, ...restoredMembers];
        } catch (error) {
            throw error;
        }
    },

    updateGroupMemberRole: async (
        groupId: number,
        userId: string,
        role: GroupMemberRole,
    ) => {
        try {
            const [updatedMember] = await db
                .update(organizationGroupMembers)
                .set({
                    role,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(organizationGroupMembers.groupId, groupId),
                        eq(organizationGroupMembers.userId, userId),
                    ),
                )
                .returning();

            if (!updatedMember) {
                throw new Error('Group member not found');
            }

            return updatedMember;
        } catch (error) {
            throw error;
        }
    },

    removeGroupMember: async (
        groupId: number,
        userId: string,
        deletedBy: string,
    ) => {
        try {
            const [deletedMember] = await db
                .update(organizationGroupMembers)
                .set({
                    deletedAt: new Date(),
                    deletedBy,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(organizationGroupMembers.groupId, groupId),
                        eq(organizationGroupMembers.userId, userId),
                        isNull(organizationGroupMembers.deletedAt),
                    ),
                )
                .returning();

            if (!deletedMember) {
                throw new Error('Group member not found or already deleted');
            }

            return deletedMember;
        } catch (error) {
            throw error;
        }
    },

    deleteGroup: async (groupId: number, deletedBy: string) => {
        try {
            return await db.transaction(async (tx) => {
                // 1. Soft delete group
                const [deletedGroup] = await tx
                    .update(organizationGroups)
                    .set({
                        deletedAt: new Date(),
                        deletedBy,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(organizationGroups.id, groupId),
                            isNull(organizationGroups.deletedAt),
                        ),
                    )
                    .returning();

                if (!deletedGroup) {
                    throw new Error('Group not found or already deleted');
                }

                await tx
                    .update(organizationGroupMembers)
                    .set({
                        deletedAt: new Date(),
                        deletedBy,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(organizationGroupMembers.groupId, groupId),
                            isNull(organizationGroupMembers.deletedAt),
                        ),
                    );

                return deletedGroup;
            });
        } catch (error) {
            throw error;
        }
    },

    getUserOrganizations: async (userId: string) => {
        try {
            const userOrgs = await db
                .select({
                    id: organizations.id,
                    name: organizations.name,
                    description: organizations.description,
                    type: organizations.type,
                    profilePicture: organizations.profilePicture,
                    role: organizationMembers.role,
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

            return userOrgs;
        } catch (error) {
            throw error;
        }
    },
};
