import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSiteSetting } from "@/lib/console/actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value")
    .order("key");

  const knownKeys = [
    { key: "brand_name", label: "Brand Name", placeholder: "SnapZila" },
    { key: "brand_tagline_en", label: "Tagline (English)", placeholder: "Live updates for career & education" },
    { key: "brand_tagline_hi", label: "Tagline (Hindi)", placeholder: "करियर और शिक्षा की लाइव अपडेट" },
    { key: "default_locale", label: "Default Locale", placeholder: "en-IN" },
    { key: "footer_columns", label: "Footer Columns (JSON)", placeholder: "[{\"title\":\"...\",\"links\":[...]}]" },
  ];

  const settingsMap = new Map<string, string>();
  for (const s of settings ?? []) {
    const val = typeof s.value === "string" ? s.value : JSON.stringify(s.value, null, 2);
    settingsMap.set(s.key, val);
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-ink">Site Settings</h1>
      <p className="mt-1 text-sm text-muted">Brand, default locale, and feature flags.</p>

      <div className="mt-6 space-y-4">
        {knownKeys.map(({ key, label, placeholder }) => (
          <Card key={key}>
            <CardContent className="p-4">
              <form action={saveSiteSetting.bind(null, key)} className="space-y-2">
                <Label htmlFor={key} className="text-xs font-medium uppercase tracking-wider text-muted">
                  {label} <span className="font-mono normal-case text-muted-soft">({key})</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={key}
                    name="value"
                    defaultValue={settingsMap.get(key) ?? ""}
                    placeholder={placeholder}
                    className="font-mono text-sm"
                  />
                  <Button type="submit" size="sm">Save</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Raw view of all settings */}
      {settings && settings.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">All Settings (raw)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-ink p-3 font-mono text-xs text-white">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
