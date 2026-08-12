export type PermissionGroup = {
  name: string;
  label: string;
  badgeTone: "info" | "success" | "warning" | "danger" | "secondary" | "outline";
  permissions: { id: number; name: string }[];
};

/**
 * Phân loại các permissionname (VD: "users.create", "doctor.appointments", "roles.manage")
 * thành các nhóm chức năng thân thiện dễ đọc.
 */
export function groupPermissions(
  permissions: { id: number; name: string }[]
): PermissionGroup[] {
  const groups: Record<
    string,
    {
      name: string;
      label: string;
      badgeTone: "info" | "success" | "warning" | "danger" | "secondary" | "outline";
      permissions: { id: number; name: string }[];
    }
  > = {
    clinical: {
      name: "clinical",
      label: "Lâm sàng & Khám chữa bệnh",
      badgeTone: "info",
      permissions: [],
    },
    users: {
      name: "users",
      label: "Quản lý Người dùng & Bệnh nhân",
      badgeTone: "success",
      permissions: [],
    },
    governance: {
      name: "governance",
      label: "Quản trị & Phân quyền",
      badgeTone: "warning",
      permissions: [],
    },
    content: {
      name: "content",
      label: "Nội dung & Bài viết",
      badgeTone: "secondary",
      permissions: [],
    },
    other: {
      name: "other",
      label: "Hệ thống & Khác",
      badgeTone: "outline",
      permissions: [],
    },
  };

  permissions.forEach((perm) => {
    const lower = perm.name.toLowerCase();

    if (
      lower.includes("doctor") ||
      lower.includes("patient") ||
      lower.includes("appointment") ||
      lower.includes("schedule") ||
      lower.includes("exam") ||
      lower.includes("record") ||
      lower.includes("specialty") ||
      lower.includes("relative") ||
      lower.includes("health")
    ) {
      groups.clinical.permissions.push(perm);
    } else if (
      lower.includes("user") ||
      lower.includes("profile") ||
      lower.includes("relationship")
    ) {
      groups.users.permissions.push(perm);
    } else if (
      lower.includes("role") ||
      lower.includes("permission") ||
      lower.includes("audit") ||
      lower.includes("complaint") ||
      lower.includes("rating") ||
      lower.includes("notification")
    ) {
      groups.governance.permissions.push(perm);
    } else if (
      lower.includes("article") ||
      lower.includes("tag") ||
      lower.includes("topic") ||
      lower.includes("message")
    ) {
      groups.content.permissions.push(perm);
    } else {
      groups.other.permissions.push(perm);
    }
  });

  return Object.values(groups).filter((g) => g.permissions.length > 0);
}
