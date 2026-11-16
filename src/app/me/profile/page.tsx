import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/components/public/public-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveProfile } from "@/lib/user/actions";

const CONTENT_TYPES = [
  { value: "govt-jobs", label: "Govt Jobs" },
  { value: "admissions", label: "Admissions" },
  { value: "scholarships", label: "Scholarships" },
  { value: "govt-schemes", label: "Govt Schemes" },
  { value: "news", label: "News" },
  { value: "articles", label: "Articles" },
];

const TARGET_GROUPS = [
  { value: "student", label: "Student" },
  { value: "job-seeker", label: "Job Seeker" },
  { value: "learner", label: "Learner" },
  { value: "other", label: "Other" },
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Chandigarh", "Puducherry",
];

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me/profile");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <PublicShell>
      <div className="container-app py-8">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-xl">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveProfile} className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} />
              </div>

              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_GROUPS.map((g) => (
                    <label
                      key={g.value}
                      className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${
                        profile?.target_group === g.value
                          ? "border-brand bg-brand-subtle text-brand"
                          : "border-line text-muted hover:bg-bg-subtle"
                      }`}
                    >
                      <input type="radio" name="target_group" value={g.value} defaultChecked={profile?.target_group === g.value} className="sr-only" />
                      {g.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <select id="state" name="state" defaultValue={profile?.state ?? ""} className="flex h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
                  <option value="">— Select —</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_interests">Exam Interests (comma-separated)</Label>
                <Input id="exam_interests" name="exam_interests" defaultValue={(profile?.exam_interests ?? []).join(", ")} />
              </div>

              <div className="space-y-2">
                <Label>Content Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map((c) => {
                    const checked = profile?.content_interests?.includes(c.value);
                    return (
                      <label key={c.value} className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${checked ? "border-brand bg-brand-subtle text-brand" : "border-line text-muted hover:bg-bg-subtle"}`}>
                        <input type="checkbox" name="content_interests" value={c.value} defaultChecked={checked} className="mr-1.5" />
                        {c.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full">Save Changes</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
