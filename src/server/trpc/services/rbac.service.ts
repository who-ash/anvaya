import { newEnforcer, Enforcer } from 'casbin';
import path from 'path';
import { db } from '@/server/db';
import {
    organizationMembers,
    organizationGroupMembers,
    organizationGroups,
} from '@/server/db/schema/organization-schema';
import { eq, and, isNull } from 'drizzle-orm';
import { users } from '@/server/db/schema/auth-schema';

class RBACService {
    private enforcer: Enforcer | null = null;
    private initPromise: Promise<void> | null = null;

    private async initializeEnforcer(): Promise<void> {
        if (this.enforcer) return;

        const modelPath = path.join(
            process.cwd(),
            'src/server/rbac/model.conf',
        );
        const policyPath = path.join(
            process.cwd(),
            'src/server/rbac/policy.csv',
        );

        this.enforcer = await newEnforcer(modelPath, policyPath);
    }

    private async getEnforcer(): Promise<Enforcer> {
        if (!this.initPromise) {
            this.initPromise = this.initializeEnforcer();
        }
        await this.initPromise;

        if (!this.enforcer) {
            throw new Error('Failed to initialize RBAC enforcer');
        }

        return this.enforcer;
    }

    /**
     * Get user's app-level role from database
     */
    async getUserAppRole(userId: string): Promise<'admin' | 'user' | null> {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.role) return null;
        return user.role as 'admin' | 'user';
    }

    /**
     * Get user's role in a specific organization from database
     */
    async getUserOrgRole(
        userId: string,
        organizationId: number,
    ): Promise<'admin' | 'member' | null> {
        const membership = await db.query.organizationMembers.findFirst({
            where: and(
                eq(organizationMembers.userId, userId),
                eq(organizationMembers.organizationId, organizationId),
                isNull(organizationMembers.deletedAt),
            ),
        });

        if (!membership) return null;
        return membership.role as 'admin' | 'member';
    }

    /**
     * Get user's role in a specific group from database
     */
    async getUserGroupRole(
        userId: string,
        groupId: number,
    ): Promise<'admin' | 'evaluator' | 'member' | null> {
        const membership = await db.query.organizationGroupMembers.findFirst({
            where: and(
                eq(organizationGroupMembers.userId, userId),
                eq(organizationGroupMembers.groupId, groupId),
                isNull(organizationGroupMembers.deletedAt),
            ),
        });

        if (!membership) return null;
        return membership.role as 'admin' | 'evaluator' | 'member';
    }

    /**
     * Get organization ID for a group
     */
    async getGroupOrganizationId(groupId: number): Promise<number | null> {
        const group = await db.query.organizationGroups.findFirst({
            where: eq(organizationGroups.id, groupId),
        });

        return group?.organizationId || null;
    }

    /**
     * Get all group IDs for an organization
     */
    async getOrganizationGroups(organizationId: number): Promise<number[]> {
        const groups = await db.query.organizationGroups.findMany({
            where: and(
                eq(organizationGroups.organizationId, organizationId),
                isNull(organizationGroups.deletedAt),
            ),
            columns: { id: true },
        });

        return groups.map((g) => g.id);
    }

    /**
     * Build user's role subjects based on their database memberships
     */
    private async getUserRoleSubjects(
        userId: string,
        organizationId?: number,
        groupId?: number,
    ): Promise<string[]> {
        const subjects: string[] = [`user:${userId}`];

        // Get app role
        const appRole = await this.getUserAppRole(userId);
        if (appRole) {
            subjects.push(`app:${appRole}`);
        }

        // Get organization role if organizationId provided
        if (organizationId !== undefined) {
            const orgRole = await this.getUserOrgRole(userId, organizationId);
            if (orgRole) {
                subjects.push(`org:${organizationId}:${orgRole}`);
                subjects.push(`org:${orgRole}`); // Generic role for policy matching
            }
        }

        // Get group role if groupId provided
        if (groupId !== undefined) {
            const groupRole = await this.getUserGroupRole(userId, groupId);
            if (groupRole) {
                subjects.push(`group:${groupId}:${groupRole}`);
                subjects.push(`group:${groupRole}`); // Generic role for policy matching
            }

            // Also get organization role for the group
            const orgId = await this.getGroupOrganizationId(groupId);
            if (orgId) {
                const orgRole = await this.getUserOrgRole(userId, orgId);
                if (orgRole) {
                    subjects.push(`org:${orgId}:${orgRole}`);
                    subjects.push(`org:${orgRole}`);
                }
            }
        }

        return subjects;
    }

    /**
     * Check if a user has permission to perform an action on a resource
     * This checks the user's actual roles from the database against the static policies
     */
    async checkPermission(
        userId: string,
        resource: string,
        action: string,
    ): Promise<boolean> {
        const enforcer = await this.getEnforcer();

        // Extract organization ID and group ID from resource if present
        let organizationId: number | undefined;
        let groupId: number | undefined;

        const orgMatch = resource.match(/^org:(\d+)/);
        if (orgMatch) {
            organizationId = parseInt(orgMatch[1]);
        }

        const groupMatch = resource.match(/^group:(\d+)/);
        if (groupMatch) {
            groupId = parseInt(groupMatch[1]);
        }

        // Get all role subjects for this user based on database state
        const subjects = await this.getUserRoleSubjects(
            userId,
            organizationId,
            groupId,
        );

        // Log all policies for debugging
        const allPolicies = await enforcer.getPolicy();

        // Show relevant policies
        const relevantPolicies = allPolicies.filter(
            (p) => p[0] === 'app:admin',
        );

        // Check if ANY of the user's roles have permission
        for (const subject of subjects) {
            const hasPermission = await enforcer.enforce(
                subject,
                resource,
                action,
            );
            if (hasPermission) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user is a member of an organization
     */
    async isOrganizationMember(
        userId: string,
        organizationId: number,
    ): Promise<boolean> {
        const role = await this.getUserOrgRole(userId, organizationId);
        return role !== null;
    }

    /**
     * Check if user is a member of a group
     */
    async isGroupMember(userId: string, groupId: number): Promise<boolean> {
        const role = await this.getUserGroupRole(userId, groupId);
        return role !== null;
    }

    /**
     * Get user's organization IDs
     */
    async getUserOrganizations(userId: string): Promise<number[]> {
        const memberships = await db.query.organizationMembers.findMany({
            where: and(
                eq(organizationMembers.userId, userId),
                isNull(organizationMembers.deletedAt),
            ),
        });

        return memberships.map((m) => m.organizationId);
    }

    /**
     * Get user's group IDs
     */
    async getUserGroups(userId: string): Promise<number[]> {
        const memberships = await db.query.organizationGroupMembers.findMany({
            where: and(
                eq(organizationGroupMembers.userId, userId),
                isNull(organizationGroupMembers.deletedAt),
            ),
        });

        return memberships.map((m) => m.groupId);
    }
}

export const rbacService = new RBACService();
