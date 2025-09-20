import React, { useEffect, useState } from "react"
import { Helmet } from "react-helmet"
import { supabase } from "@/lib/customSupabaseClient"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import ReactMarkdown from "react-markdown"

const RulesPage = () => {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("pages_content")
        .select("title, content")
        .eq("slug", "rules")
        .single()

      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message })
      } else {
        setContent(data?.content || "")
      }
      setLoading(false)
    }

    fetchContent()
  }, [toast])

  return (
    <>
      <Helmet>
        <title>Noteikumi</title>
      </Helmet>
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white p-4 flex justify-center">
        <Card className="glass-card max-w-3xl w-full text-white border-white/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Spēles noteikumi</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            {loading ? (
              <p>Ielādē noteikumus...</p>
            ) : (
              <ReactMarkdown>{content}</ReactMarkdown>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default RulesPage
