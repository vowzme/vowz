import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteFeaturePermission =
  | "manage_rsvp"
  | "manage_guests"
  | "manage_reminders"
  | "manage_album"
  | "manage_features"
  | "edit_content";

export type SitePermissions = {
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  permissions: Partial<Record<SiteFeaturePermission, boolean>>;
  /** Returns true if user is owner, admin, or has the feature flag. */
  can: (feature: SiteFeaturePermission) => boolean;
  refresh: () => Promise<void>;
};

const EMPTY: SitePermissions = {
  loading: true,
  isOwner: false,
  isAdmin: false,
  canEdit: false,
  permissions: {},
  can: () => false,
  refresh: async () => {},
};

/**
 * Fetches the current user's effective permissions on a wedding site.
 * Owners and admins get every permission; family collaborators get only what
 * has been explicitly granted in `wedding_family_members.permissions`.
 */
export function useSitePermissions(siteId: string | undefined | null): SitePermissions {
  const [state, setState] = useState<SitePermissions>(EMPTY);

  const load = async () => {
    if (!siteId) {
      setState({ ...EMPTY, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const { data, error } = await supabase.rpc("get_my_site_permissions", { _site_id: siteId });
    if (error || !data || !Array.isArray(data) || data.length === 0) {
      setState({ ...EMPTY, loading: false, refresh: load });
      return;
    }
    const row = data[0] as {
      is_owner: boolean;
      is_admin: boolean;
      can_edit: boolean;
      permissions: Record<string, boolean> | null;
    };
    const perms = (row.permissions ?? {}) as Partial<Record<SiteFeaturePermission, boolean>>;
    const owner = !!row.is_owner;
    const admin = !!row.is_admin;
    setState({
      loading: false,
      isOwner: owner,
      isAdmin: admin,
      canEdit: !!row.can_edit,
      permissions: perms,
      can: (f) => owner || admin || !!perms[f],
      refresh: load,
    });
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  return state;
}