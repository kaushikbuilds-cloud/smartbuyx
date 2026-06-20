import { createClient } from "@/lib/supabase/server";

export type ProListing = {
  user_id: string;
  display_name: string;
  bio: string | null;
  rating_avg: number;
  rating_count: number;
  experience: number | null;
  rate_label: string | null;
  meta: string[];                // tags/specialties to display
};

type Kind = "architect" | "contractor" | "interior_designer" | "engineer";

export async function listPros(kind: Kind): Promise<ProListing[]> {
  const supabase = await createClient();

  if (kind === "architect") {
    const { data } = await supabase
      .from("architect_profiles")
      .select("user_id, firm_name, bio, years_experience, specialties, hourly_rate, rating_avg, rating_count")
      .order("rating_avg", { ascending: false })
      .limit(50);
    return (data ?? []).map((r) => ({
      user_id: r.user_id,
      display_name: r.firm_name ?? "Architect",
      bio: r.bio,
      rating_avg: Number(r.rating_avg ?? 0),
      rating_count: r.rating_count ?? 0,
      experience: r.years_experience,
      rate_label: r.hourly_rate ? `₹${r.hourly_rate}/hr` : null,
      meta: (r.specialties ?? []) as string[],
    }));
  }

  if (kind === "contractor") {
    const { data } = await supabase
      .from("contractor_profiles")
      .select("user_id, company_name, bio, crew_size, specialties, service_pincodes, rating_avg, rating_count")
      .order("rating_avg", { ascending: false })
      .limit(50);
    return (data ?? []).map((r) => ({
      user_id: r.user_id,
      display_name: r.company_name ?? "Contractor",
      bio: r.bio,
      rating_avg: Number(r.rating_avg ?? 0),
      rating_count: r.rating_count ?? 0,
      experience: null,
      rate_label: r.crew_size ? `${r.crew_size} crew` : null,
      meta: (r.specialties ?? []) as string[],
    }));
  }

  if (kind === "interior_designer") {
    const { data } = await supabase
      .from("interior_designer_profiles")
      .select("user_id, studio_name, bio, years_experience, styles, package_starts_at, rating_avg, rating_count")
      .order("rating_avg", { ascending: false })
      .limit(50);
    return (data ?? []).map((r) => ({
      user_id: r.user_id,
      display_name: r.studio_name ?? "Interior Designer",
      bio: r.bio,
      rating_avg: Number(r.rating_avg ?? 0),
      rating_count: r.rating_count ?? 0,
      experience: r.years_experience,
      rate_label: r.package_starts_at ? `From ₹${r.package_starts_at}` : null,
      meta: (r.styles ?? []) as string[],
    }));
  }

  // engineer
  const { data } = await supabase
    .from("engineer_profiles")
    .select("user_id, firm_name, bio, years_experience, specialties, hourly_rate, rating_avg, rating_count")
    .order("rating_avg", { ascending: false })
    .limit(50);
  return (data ?? []).map((r) => ({
    user_id: r.user_id,
    display_name: r.firm_name ?? "Engineer",
    bio: r.bio,
    rating_avg: Number(r.rating_avg ?? 0),
    rating_count: r.rating_count ?? 0,
    experience: r.years_experience,
    rate_label: r.hourly_rate ? `₹${r.hourly_rate}/hr` : null,
    meta: (r.specialties ?? []) as string[],
  }));
}
