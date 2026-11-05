CREATE OR REPLACE FUNCTION public.can_read_clip_profile(_profile uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _profile = auth.uid()
    OR EXISTS (SELECT 1 FROM public.videos v WHERE v.user_id = _profile AND v.visibility = 'public' AND v.status = 'published' AND v.source <> 'tiktok' AND v.expires_at > now())
    OR EXISTS (SELECT 1 FROM public.comments c JOIN public.videos v ON v.id = c.video_id WHERE c.user_id = _profile AND v.visibility = 'public' AND v.status = 'published' AND v.source <> 'tiktok' AND v.expires_at > now())
    OR EXISTS (SELECT 1 FROM public.messages m WHERE (m.sender_id = auth.uid() AND m.recipient_id = _profile) OR (m.recipient_id = auth.uid() AND m.sender_id = _profile))
    OR EXISTS (SELECT 1 FROM public.notifications n WHERE n.user_id = auth.uid() AND n.actor_id = _profile);
$$;
REVOKE ALL ON FUNCTION public.can_read_clip_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_clip_profile(uuid) TO anon, authenticated, service_role;
ALTER POLICY profiles_read ON public.profiles USING (public.can_read_clip_profile(id));
ALTER POLICY clip_avatars_read ON storage.objects USING (
  bucket_id = 'clip-avatars' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_path = objects.name AND public.can_read_clip_profile(p.id))
  )
);
ALTER POLICY follows_read ON public.follows TO authenticated USING (follower_id = auth.uid() OR followed_id = auth.uid());
ALTER POLICY likes_read ON public.likes USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.videos v WHERE v.id = likes.video_id)
);
ALTER POLICY comments_read ON public.comments USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.videos v WHERE v.id = comments.video_id)
);
COMMENT ON FUNCTION public.can_read_clip_profile(uuid) IS 'Limits profile discovery to the caller, current public video participants, message counterparts and notification actors. Never grants visibility from client-supplied identity.';