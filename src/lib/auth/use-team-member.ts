"use client";

/**
 * Returns the current user's team_members row (client-side).
 * - `teamMember`: the team_members row (or null if not a team member)
 * - `loading`: true until the first fetch completes
 *
 * Fetches from the team_members table via RLS (the user can read
 * their own row + team members can read all).
 */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "./types";

export function useTeamMember() {
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchTeamMember() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTeamMember(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        setTeamMember(null);
      } else {
        setTeamMember((data as TeamMember) ?? null);
      }
      setLoading(false);
    }

    fetchTeamMember();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchTeamMember();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { teamMember, loading };
}
