import { createContext, ReactNode, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

export type CourtRole = "clerk" | "judge" | "observer" | "police" | "lawyer";
export type RoleCategory =
  | "judiciary"
  | "lawyer"
  | "clerk"
  | "public_party"
  | "police";

export interface CourtUser {
  id: string;
  name: string;
  role: CourtRole;
  roleCategory: RoleCategory;
  department?: string;
  title?: string;
}

interface RoleContextType {
  currentUser: CourtUser | null;
  hasPermission: (action: PermissionAction) => boolean;
  // Permission flags for easy access
  canSeal: boolean;
  canUpload: boolean;
  canEditMetadata: boolean;
  canDeleteEvidence: boolean;
  canViewAuditLog: boolean;
  canViewEvidence: boolean;
  // Role-specific theming
  roleTheme: {
    primary: string;
    border: string;
    badge: string;
    glow: string;
  };
}

type PermissionAction =
  | "upload"
  | "edit_metadata"
  | "seal_evidence"
  | "view_evidence"
  | "delete_evidence"
  | "view_audit_log"
  | "start_session"
  | "end_session"
  | "grant_permission";

const ROLE_PERMISSIONS: Record<CourtRole, PermissionAction[]> = {
  clerk: [
    "upload",
    "edit_metadata",
    "view_evidence",
    "view_audit_log",
  ],
  police: [
    "upload",
    "edit_metadata",
    "view_evidence",
    "view_audit_log",
  ],
  lawyer: [
    "view_evidence",
    "upload",
    "edit_metadata",
    "view_audit_log",
  ],
  judge: [
    "view_evidence",
    "seal_evidence",
    "view_audit_log",
    "start_session",
    "end_session",
    "grant_permission",
  ],
  observer: ["view_evidence", "view_audit_log"],
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Map role_category to CourtRole
const mapRoleCategoryToCourtRole = (roleCategory: string): CourtRole => {
  switch (roleCategory) {
    case "police":
      return "police";
    case "judiciary":
      return "judge";
    case "lawyer":
      return "lawyer";
    case "clerk":
      return "clerk";
    case "legal_practitioner": // Legacy support
      return "clerk";
    case "public_party":
    default:
      return "observer";
  }
};

// Role-specific theme configuration
const getRoleTheme = (roleCategory: RoleCategory) => {
  switch (roleCategory) {
    case "judiciary":
      return {
        primary: "amber-500",
        border: "amber-500/30",
        badge: "amber-500/20",
        glow: "amber-500/10",
      };
    case "lawyer":
      return {
        primary: "blue-600",
        border: "blue-500/30",
        badge: "blue-500/20",
        glow: "blue-500/10",
      };
    case "clerk":
      return {
        primary: "cyan-500",
        border: "cyan-500/30",
        badge: "cyan-500/20",
        glow: "cyan-500/10",
      };
    case "police":
      return {
        primary: "emerald-500",
        border: "emerald-500/30",
        badge: "emerald-500/20",
        glow: "emerald-500/10",
      };
    case "public_party":
    default:
      return {
        primary: "slate-400",
        border: "slate-500/30",
        badge: "slate-500/20",
        glow: "slate-500/10",
      };
  }
};

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();

  const currentUser: CourtUser | null = useMemo(() => {
    if (!profile) return null;

    const roleCategory = profile.role_category as RoleCategory;
    const role = mapRoleCategoryToCourtRole(roleCategory);

    return {
      id: profile.id,
      name: profile.full_name,
      role,
      roleCategory,
      title: roleCategory === "judiciary"
        ? "Presiding Judge"
        : roleCategory === "legal_practitioner"
        ? "Legal Practitioner"
        : "Observer",
    };
  }, [profile]);

  const hasPermission = (action: PermissionAction): boolean => {
    if (!currentUser) return false;
    return ROLE_PERMISSIONS[currentUser.role].includes(action);
  };

  // Permission flags
  const permissions = useMemo(() => {
    if (!currentUser) {
      return {
        canSeal: false,
        canUpload: false,
        canEditMetadata: false,
        canDeleteEvidence: false,
        canViewAuditLog: false,
        canViewEvidence: false,
      };
    }

    return {
      canSeal: hasPermission("seal_evidence"),
      canUpload: hasPermission("upload"),
      canEditMetadata: hasPermission("edit_metadata"),
      canDeleteEvidence: false, // Only before sealing
      canViewAuditLog: hasPermission("view_audit_log"),
      canViewEvidence: hasPermission("view_evidence"),
    };
  }, [currentUser]);

  const roleTheme = useMemo(() => {
    if (!currentUser) {
      return getRoleTheme("public_party");
    }
    return getRoleTheme(currentUser.roleCategory);
  }, [currentUser]);

  const value: RoleContextType = {
    currentUser,
    hasPermission,
    ...permissions,
    roleTheme,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};

export const getRoleColor = (role: CourtRole) => {
  switch (role) {
    case "judge":
      return "amber-500";
    case "lawyer":
      return "blue-600";
    case "clerk":
      return "cyan-500";
    case "police":
      return "emerald-500";
    case "observer":
      return "slate-400";
    default:
      return "slate-400";
  }
};

export const getRoleLabel = (role: CourtRole) => {
  switch (role) {
    case "judge":
      return "Presiding Judge";
    case "lawyer":
      return "Lawyer";
    case "clerk":
      return "Court Clerk";
    case "police":
      return "Police Officer";
    case "observer":
      return "Observer";
    default:
      return "Unknown";
  }
};
