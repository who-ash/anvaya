import { router, authenticatedProcedure } from '../router';
import { rbacService } from '../services/rbac.service';

export const rbacRouter = router({
    /**
     * Get user's permissions for client-side CASL ability
     * Returns app role, org roles, and group roles with their org context
     */
    getUserPermissions: authenticatedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session!.user.id;

        const [appRole, orgIds, groupIds] = await Promise.all([
            rbacService.getUserAppRole(userId),
            rbacService.getUserOrganizations(userId),
            rbacService.getUserGroups(userId),
        ]);

        // Get roles for each org
        const orgRoles = await Promise.all(
            orgIds.map(async (orgId) => ({
                orgId,
                role: await rbacService.getUserOrgRole(userId, orgId),
            })),
        );

        // Find orgs where user is admin
        const adminOrgIds = orgRoles
            .filter(
                (r): r is { orgId: number; role: 'admin' } =>
                    r.role === 'admin',
            )
            .map((r) => r.orgId);

        // Get all groups for orgs where user is admin (for client-side CASL)
        const orgGroups = await Promise.all(
            adminOrgIds.map(async (orgId) => {
                const groups = await rbacService.getOrganizationGroups(orgId);
                return groups.map((groupId) => ({ groupId, orgId }));
            }),
        );
        const allOrgGroupIds = orgGroups.flat();

        // Get roles for each group with their org context
        // Include both groups the user is a member of AND groups in their admin orgs
        const allGroupIds = [
            ...new Set([...groupIds, ...allOrgGroupIds.map((g) => g.groupId)]),
        ];

        const groupRoles = await Promise.all(
            allGroupIds.map(async (groupId) => {
                const [role, orgId] = await Promise.all([
                    rbacService.getUserGroupRole(userId, groupId),
                    rbacService.getGroupOrganizationId(groupId),
                ]);
                const finalOrgId = orgId || 0;
                // If user is org admin but not group member, their role is null
                // We'll handle this in ability.ts
                return {
                    groupId,
                    orgId: finalOrgId,
                    role,
                };
            }),
        );

        return {
            appRole,
            orgRoles: orgRoles.filter(
                (r): r is { orgId: number; role: 'admin' | 'member' } =>
                    r.role !== null,
            ),
            groupRoles: groupRoles.filter(
                (
                    r,
                ): r is {
                    groupId: number;
                    orgId: number;
                    role: 'admin' | 'evaluator' | 'member' | null;
                } => r.orgId !== 0,
            ),
        };
    }),
});
