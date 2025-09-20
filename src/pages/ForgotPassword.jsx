import React, { useState } from 'react'
import { supabase } from '@/lib/customSupabaseClient'
import { useToast } from '@/components/ui/use-toast'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

const redirectUrl = import.meta.env.PROD 
  ? 'https://hkpred.vercel.app/auth/reset'
  : `${window.location.origin}/auth/reset`

const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: redirectUrl,
})

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Kļūda',
        description: error.message,
      })
    } else {
      setSubmitted(true)
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white p-4">
      <Card className="glass-card w-full max-w-md text-white border-none">
        {!submitted ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Aizmirsi paroli?</CardTitle>
              <CardDescription className="text-white/70">
                Ievadi savu e-pastu, un mēs nosūtīsim saiti paroles
                atjaunošanai.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-pasts</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    className="bg-white/20 border-white/30 placeholder:text-white/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-bold"
                  disabled={loading}
                >
                  {loading ? 'Sūta...' : 'Sūtīt saiti'}
                </Button>
              </CardFooter>
            </form>
          </>
        ) : (
          <CardHeader>
            <CardTitle className="text-2xl">Pārbaudi savu e-pastu</CardTitle>
            <CardDescription className="text-white/70">
              Mēs nosūtījām saiti paroles atjaunošanai. Noklikšķini uz tās, lai
              iestatītu jaunu paroli.
            </CardDescription>
          </CardHeader>
        )}
      </Card>
    </div>
  )
}

export default ForgotPassword
