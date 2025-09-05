import { supabase } from "@/utils/supabase/supabase";

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();

  if (data.session !== null) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user !== null) {
      const { data: currentUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id);
      // console.log(user);
      // console.log(currentUser);

      if (currentUser) {
        const userData = {
          id: currentUser[0].id,
          name: currentUser[0].name,
          email: currentUser[0].email,
          employee: currentUser[0].employee,
        }

        return userData;
      }
    }
  }
}
