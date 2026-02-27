import { redirect } from "next/navigation";
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { count } = await supabase.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    if (count && count > 0) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  } else {
    redirect("/login");
  }
}
