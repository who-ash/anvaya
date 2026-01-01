import { db } from '@/server/db';
import { CreateAdminUserInput } from '../routers/user.router';
import { eq, or, ilike, isNull, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { hashPassword } from 'better-auth/crypto';
import Fuse from 'fuse.js';
import { accounts, users } from '@/server/db/schema/auth-schema';

export const userService = {
    hasUser: async (email: string): Promise<boolean> => {
        const user = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        return user.length > 0;
    },
    createAdminUser: async (input: CreateAdminUserInput) => {
        try {
            const hasUser = await userService.hasUser(input.email);
            if (hasUser) {
                throw new Error('User already exists');
            }

            const userId = `user-${randomUUID()}`;
            const hashedPassword = await hashPassword(input.password);

            const [user] = await db
                .insert(users)
                .values({
                    id: userId,
                    name: input.name,
                    email: input.email,
                    role: input.role,
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            await db.insert(accounts).values({
                id: `account-${randomUUID()}`,
                userId,
                providerId: 'credential',
                accountId: userId,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return user;
        } catch (error) {
            throw error;
        }
    },

    getAllUsers: async () => {
        try {
            const allUsers = await db
                .select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    role: users.role,
                    image: users.image,
                    emailVerified: users.emailVerified,
                    createdAt: users.createdAt,
                    updatedAt: users.updatedAt,
                })
                .from(users)
                .where(isNull(users.deletedAt));

            return allUsers;
        } catch (error) {
            throw error;
        }
    },

    searchUsers: async (
        query: string,
        page: number = 1,
        limit: number = 10,
    ) => {
        try {
            let filteredUsers;

            if (!query || query.trim() === '') {
                filteredUsers = await userService.getAllUsers();
            } else {
                const allUsers = await userService.getAllUsers();

                const fuse = new Fuse(allUsers, {
                    keys: ['name', 'email'],
                    threshold: 0.3,
                    includeScore: true,
                });

                const results = fuse.search(query);
                filteredUsers = results.map((result) => result.item);
            }

            // Calculate pagination
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

    updateUser: async (
        id: string,
        data: { name?: string; email?: string; role?: 'admin' | 'user' },
    ) => {
        try {
            const [updatedUser] = await db
                .update(users)
                .set({
                    ...data,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, id))
                .returning();

            if (!updatedUser) {
                throw new Error('User not found');
            }

            return updatedUser;
        } catch (error) {
            throw error;
        }
    },

    deleteUser: async (id: string, deletedBy: string) => {
        try {
            const [deletedUser] = await db
                .update(users)
                .set({
                    deletedAt: new Date(),
                    deletedBy,
                    updatedAt: new Date(),
                })
                .where(and(eq(users.id, id), isNull(users.deletedAt)))
                .returning();

            if (!deletedUser) {
                throw new Error('User not found or already deleted');
            }

            return deletedUser;
        } catch (error) {
            throw error;
        }
    },
};
