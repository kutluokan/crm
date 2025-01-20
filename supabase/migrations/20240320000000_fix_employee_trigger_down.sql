-- Drop the trigger
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Remove the employee records that were automatically created
DELETE FROM public.employees 
WHERE id IN (
    SELECT e.id 
    FROM public.employees e
    LEFT JOIN auth.users au ON au.id = e.id
    WHERE au.raw_user_meta_data->>'full_name' = e.full_name
    AND au.email = e.email
); 