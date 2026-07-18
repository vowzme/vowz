
-- Add granular per-feature permissions for site collaborators
ALTER TABLE public.wedding_family_members
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.wedding_family_members.permissions IS
  'JSON map of feature keys -> boolean. Keys: manage_rsvp, manage_guests, manage_reminders, manage_album, manage_features, edit_content';

-- Helper: check whether a given auth user has a given permission on a site.
-- Returns true if the user is the site owner, an admin, or a family member
-- whose permissions map has the flag set to true.
CREATE OR REPLACE FUNCTION public.has_site_permission(
  _site_id uuid,
  _user_id uuid,
  _feature text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Site owner always has permission
    EXISTS (
      SELECT 1 FROM public.wedding_sites
      WHERE id = _site_id AND user_id = _user_id
    )
    -- Admins always have permission
    OR public.is_admin(_user_id)
    -- Family member with the feature flag set to true
    OR EXISTS (
      SELECT 1
      FROM public.wedding_family_members wfm
      JOIN auth.users u ON lower(u.email) = lower(wfm.email)
      WHERE wfm.wedding_site_id = _site_id
        AND u.id = _user_id
        AND wfm.can_edit = true
        AND COALESCE((wfm.permissions ->> _feature)::boolean, false) = true
    );
$$;

REVOKE ALL ON FUNCTION public.has_site_permission(uuid, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_site_permission(uuid, uuid, text) TO authenticated, service_role;

-- Convenience: list all effective permissions for the calling user on a site.
CREATE OR REPLACE FUNCTION public.get_my_site_permissions(_site_id uuid)
RETURNS TABLE(
  is_owner boolean,
  is_admin boolean,
  can_edit boolean,
  permissions jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _owner boolean := false;
  _admin boolean := false;
  _member RECORD;
BEGIN
  IF _uid IS NULL THEN
    RETURN QUERY SELECT false, false, false, '{}'::jsonb;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.wedding_sites WHERE id = _site_id AND user_id = _uid
  ) INTO _owner;

  SELECT public.is_admin(_uid) INTO _admin;

  IF _owner OR _admin THEN
    RETURN QUERY SELECT _owner, _admin, true, jsonb_build_object(
      'manage_rsvp', true,
      'manage_guests', true,
      'manage_reminders', true,
      'manage_album', true,
      'manage_features', true,
      'edit_content', true
    );
    RETURN;
  END IF;

  SELECT wfm.can_edit, wfm.permissions
    INTO _member
    FROM public.wedding_family_members wfm
    JOIN auth.users u ON lower(u.email) = lower(wfm.email)
    WHERE wfm.wedding_site_id = _site_id AND u.id = _uid
    LIMIT 1;

  IF _member IS NULL THEN
    RETURN QUERY SELECT false, false, false, '{}'::jsonb;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, false, COALESCE(_member.can_edit, false), COALESCE(_member.permissions, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_site_permissions(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_site_permissions(uuid) TO authenticated, service_role;
