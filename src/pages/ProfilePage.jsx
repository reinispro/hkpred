// /src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

export default function ProfilePage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // ielādējam esošo username
      supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) setUsername(data.username || "");
        });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating username",
        description: error.message,
      });
    } else {
      toast({ title: "Success", description: "Username updated!" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Profils</title>
      </Helmet>
      <Card className="glass-card text-white max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Mans Profils</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Lietotājvārds</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/20 border-white/30"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Saglabā..." : "Saglabāt"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
