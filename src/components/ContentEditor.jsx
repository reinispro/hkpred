import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";

export default function ContentEditor({ slug }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // ielādējam saturu pēc sluga (piemēram: "rules")
  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from("pages_content")
        .select("content")
        .eq("slug", slug)
        .single();

      if (error && error.code !== "PGRST116") {
        toast({ variant: "destructive", title: "Kļūda", description: error.message });
      } else if (data) {
        setContent(data.content);
      }
    };

    fetchContent();
  }, [slug, toast]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("pages_content")
      .upsert({ slug, content });

    if (error) {
      toast({ variant: "destructive", title: "Kļūda", description: error.message });
    } else {
      toast({ title: "Saglabāts", description: "Saturs veiksmīgi atjaunināts" });
    }
    setLoading(false);
  };

  return (
    <Card className="glass-card text-white">
      <CardHeader>
        <CardTitle>Edit content for: {slug}</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          className="min-h-[300px] bg-white/20 border-white/30"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saglabā..." : "Saglabāt"}
        </Button>
      </CardFooter>
    </Card>
  );
}
