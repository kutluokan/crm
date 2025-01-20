-- Create the trigger on auth.users table
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert existing users into employees table if they don't exist
INSERT INTO public.employees (id, email, full_name, avatar_url)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
LEFT JOIN public.employees e ON e.id = au.id
WHERE e.id IS NULL; 