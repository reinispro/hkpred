import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/customSupabaseClient'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useNavigate } from 'react-router-dom'

const AuthReset = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [accessToken, setAccessToken] = useState(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const initializeSession = async () => {
      // Extract tokens from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const urlAccess = hashParams.get('access_token')
      const urlRefresh = hashParams.get('refresh_token')
      const urlType = hashParams.get('type')

      console.log('AuthReset: Hash params found:', { 
        hasAccess: !!urlAccess, 
        hasRefresh: !!urlRefresh, 
        type: urlType 
      })

      if (urlAccess && urlRefresh && urlType === 'recovery') {
        console.log('AuthReset: Setting session from URL tokens')
        try {
          // Set the session
          const { data, error } = await supabase.auth.setSession({
            access_token: urlAccess,
            refresh_token: urlRefresh,
          })
          
          if (error) {
            console.error('AuthReset: Session set error:', error)
            toast({
              variant: 'destructive',
              title: 'Sesijas kļūda',
              description: 'Neizdevās iestatīt sesiju.',
            })
            navigate('/')
            return
          }
          
          console.log('AuthReset: Session set successfully')
          setAccessToken(urlAccess)
          setSessionReady(true)
          
          // Clear the URL hash to clean up
          window.history.replaceState(null, null, window.location.pathname)
          
        } catch (err) {
          console.error('AuthReset: Session setup failed:', err)
          toast({
            variant: 'destructive',
            title: 'Sesijas kļūda',
            description: 'Neizdevās iestatīt sesiju.',
          })
          navigate('/')
        }
      } else {
        // Check if we already have a valid session
        const { data: sessionData } = await supabase.auth.getSession()
        
        if (sessionData.session) {
          console.log('AuthReset: Using existing session')
          setAccessToken(sessionData.session.access_token)
          setSessionReady(true)
        } else {
          console.log('AuthReset: No session found, redirecting to login')
          toast({
            variant: 'destructive',
            title: 'Sesija beigusies',
            description: 'Atver saņemto e-pastu vēlreiz.',
          })
          navigate('/')
        }
      }
    }

    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(initializeSession, 100)
    
    return () => clearTimeout(timer)
  }, [toast, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!sessionReady || !accessToken) {
      toast({
        variant: 'destructive',
        title: 'Kļūda',
        description: 'Sesija nav gatava.',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Kļūda',
        description: 'Paroles nesakrīt',
      })
      return
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Kļūda',
        description: 'Parolei jābūt vismaz 6 simboli garai',
      })
      return
    }

    setLoading(true)

    try {
      // Use fetch with AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        
        let errorMessage = 'Nezināma kļūda'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      setIsSuccess(true)
      
    } catch (error) {
      if (error.name === 'AbortError') {
        toast({
          variant: 'destructive',
          title: 'Taimauts',
          description: 'Pieprasījums ilgst pārāk ilgi. Mēģini vēlreiz.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Neizdevās nomainīt paroli',
          description: error.message,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleContinueToLogin = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      // Ignore signout errors
    }
    
    toast({
      title: 'Parole nomainīta',
      description: 'Tagad vari ielogoties ar jauno paroli.',
    })
    
    navigate('/')
  }

  const handleManualTest = async () => {
    try {
      const { data: user, error } = await supabase.auth.getUser()
      const { data: session } = await supabase.auth.getSession()
    } catch (err) {
      // Ignore test errors
    }
  }

  // Loading state while setting up session
  if (!sessionReady) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-600">
        <Card className="glass-card w-full max-w-md text-white border-none">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Ielādē...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-white/90">Gatavo paroles atjaunošanu...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white p-4">
        <Card className="glass-card w-full max-w-md text-white border-none">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Parole nomainīta!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-white/90">
              Tava parole ir nomainīta. Tagad vari ielogoties ar jauno paroli.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleContinueToLogin}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold"
            >
              Turpināt uz ielogošanos
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Reset form
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white p-4">
      <Card className="glass-card w-full max-w-md text-white border-none">
        <CardHeader>
          <CardTitle className="text-2xl">Atjaunot paroli</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Jaunā parole</label>
              <Input
                type="password"
                className="bg-white/20 border-white/30 placeholder:text-white/50"
                placeholder="Vismaz 6 simboli"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Apstiprini paroli</label>
              <Input
                type="password"
                className="bg-white/20 border-white/30 placeholder:text-white/50"
                placeholder="Atkārto paroli"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            

          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold"
              disabled={loading}
            >
              {loading ? 'Saglabā...' : 'Saglabāt jauno paroli'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default AuthReset