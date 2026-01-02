import {
    AbilityBuilder,
    createMongoAbility,
    MongoAbility,
} from '@casl/ability';

// Actions match policy.csv
type Actions = 'create' | 'read' | 'update' | 'delete';

// Subject can be a string pattern
type Subjects = string;

// Use MongoAbility which supports conditions
type AppAbility = MongoAbility<[Actions, Subjects]>;

// Permission info from server
export type UserPermissions = {
    appRole: 'admin' | 'user' | null;
    orgRoles: { orgId: number; role: 'admin' | 'member' }[];
    // role can be null if user is org admin but not a direct group member
    groupRoles: {
        groupId: number;
        orgId: number;
        role: 'admin' | 'evaluator' | 'member' | null;
    }[];
    projectRoles: {
        projectId: number;
        orgId: number;
        role: 'admin' | 'member';
    }[];
};

/**
 * Build CASL ability from user permissions
 * Mirrors the policy.csv rules from Casbin with hierarchical checks
 *
 * Note: We use simple subject names () instead of
 * patterns (e.g) because CASL doesn't support glob matching on subjects.
 * The backend handles the hierarchical checks via organizationId context.
 */
export function buildAbility(permissions: UserPermissions): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // App admin - full access
    if (permissions.appRole === 'admin') {
        can('create', 'all');
        can('read', 'all');
        can('update', 'all');
        can('delete', 'all');
        return build();
    }

    // Org admin permissions
    const orgAdminOrgIds = new Set(
        permissions.orgRoles
            .filter((r) => r.role === 'admin')
            .map((r) => r.orgId),
    );

    permissions.orgRoles
        .filter((r) => r.role === 'admin')
        .forEach(({ orgId }) => {
            // org:* permissions
            can('read', `org:${orgId}`);
            can('update', `org:${orgId}`);
            can('delete', `org:${orgId}`);

            // org:*:members
            can('create', `org:${orgId}:members`);
            can('read', `org:${orgId}:members`);
            can('update', `org:${orgId}:members`);
            can('delete', `org:${orgId}:members`);

            // org:*:groups
            can('create', `org:${orgId}:groups`);
            can('read', `org:${orgId}:groups`);
            can('update', `org:${orgId}:groups`);
            can('delete', `org:${orgId}:groups`);

            // org:*:projects
            can('create', `org:${orgId}:projects`);
            can('read', `org:${orgId}:projects`);
            can('update', `org:${orgId}:projects`);
            can('delete', `org:${orgId}:projects`);

            // org:*:projects:sprints
            can('create', `org:${orgId}:projects:sprints`);
            can('read', `org:${orgId}:projects:sprints`);
            can('update', `org:${orgId}:projects:sprints`);
            can('delete', `org:${orgId}:projects:sprints`);

            // org:*:projects:tasks
            can('create', `org:${orgId}:projects:tasks`);
            can('read', `org:${orgId}:projects:tasks`);
            can('update', `org:${orgId}:projects:tasks`);
            can('delete', `org:${orgId}:projects:tasks`);
        });

    // Grant org admins permissions on groups within their orgs (hierarchical)
    permissions.groupRoles.forEach(({ groupId, orgId }) => {
        if (orgAdminOrgIds.has(orgId)) {
            // Org admin has full permissions on groups in their org
            can('read', `group:${groupId}`);
            can('update', `group:${groupId}`);
            can('delete', `group:${groupId}`);
            can('create', `group:${groupId}:members`);
            can('read', `group:${groupId}:members`);
            can('update', `group:${groupId}:members`);
            can('delete', `group:${groupId}:members`);
        }
    });

    // Org member permissions
    permissions.orgRoles
        .filter((r) => r.role === 'member')
        .forEach(({ orgId }) => {
            can('read', `org:${orgId}`);
            can('read', `org:${orgId}:members`);
            can('read', `org:${orgId}:groups`);
            can('read', 'course');

            // Projects
            can('read', `org:${orgId}:projects`);
            can('create', `org:${orgId}:projects:sprints`);
            can('read', `org:${orgId}:projects:sprints`);
            can('create', `org:${orgId}:projects:tasks`);
            can('read', `org:${orgId}:projects:tasks`);
        });

    // Group admin permissions
    permissions.groupRoles
        .filter((r) => r.role === 'admin')
        .forEach(({ groupId, orgId }) => {
            can('read', `group:${groupId}`);
            can('update', `group:${groupId}`);
            can('delete', `group:${groupId}`);
            can('create', `group:${groupId}:members`);
            can('read', `group:${groupId}:members`);
            can('update', `group:${groupId}:members`);
            can('delete', `group:${groupId}:members`);
        });

    // Group evaluator permissions
    permissions.groupRoles
        .filter((r) => r.role === 'evaluator')
        .forEach(({ groupId, orgId }) => {
            can('read', `group:${groupId}`);
            can('read', `group:${groupId}:members`);
        });

    // Group member permissions
    permissions.groupRoles
        .filter((r) => r.role === 'member')
        .forEach(({ groupId, orgId }) => {
            can('read', `group:${groupId}`);
            can('read', `group:${groupId}:members`);
        });

    // Project admin permissions
    permissions.projectRoles
        .filter((r) => r.role === 'admin')
        .forEach(({ projectId, orgId }) => {
            // Project admins can manage tasks and sprints within their projects
            can('create', `org:${orgId}:projects:tasks`);
            can('read', `org:${orgId}:projects:tasks`);
            can('update', `org:${orgId}:projects:tasks`);
            can('delete', `org:${orgId}:projects:tasks`);

            can('create', `org:${orgId}:projects:sprints`);
            can('read', `org:${orgId}:projects:sprints`);
            can('update', `org:${orgId}:projects:sprints`);
            can('delete', `org:${orgId}:projects:sprints`);

            // Project admins can also update the project itself
            can('read', `org:${orgId}:projects`);
            can('update', `org:${orgId}:projects`);
        });

    // Project member permissions
    permissions.projectRoles
        .filter((r) => r.role === 'member')
        .forEach(({ projectId, orgId }) => {
            can('read', `org:${orgId}:projects`);
            can('read', `org:${orgId}:projects:tasks`);
            can('read', `org:${orgId}:projects:sprints`);
        });

    return build();
}

export type { AppAbility };
