INSERT INTO public.profiles (id, full_name, email, email_verified)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', ''), COALESCE(email, ''), false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;