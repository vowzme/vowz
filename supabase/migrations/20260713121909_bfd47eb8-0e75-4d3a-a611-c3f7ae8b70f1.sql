CREATE UNIQUE INDEX IF NOT EXISTS guest_moderation_events_post_action_uniq
  ON public.guest_moderation_events (post_id, action)
  WHERE post_id IS NOT NULL;