export interface RolePermissions {
    id: number;
    action: string;
}

export interface Role {
    id: number;
    name: string;
    description: string;
    permissions: RolePermissions[];
}