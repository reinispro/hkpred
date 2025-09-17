
    import React, { useState } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
    import { Button } from "@/components/ui/button"
    import {
      Card,
      CardContent,
      CardDescription,
      CardFooter,
      CardHeader,
      CardTitle,
    } from "@/components/ui/card"
    import { Input } from "@/components/ui/input"
    import { Label } from "@/components/ui/label"
    import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
    import { useToast } from '@/components/ui/use-toast';

    const AuthPage = () => {
      const { signInWithPassword, signUp } = useSupabaseAuth();
      const { toast } = useToast();
      
      const [loginEmail, setLoginEmail] = useState('');
      const [loginPassword, setLoginPassword] = useState('');
      const [isLoggingIn, setIsLoggingIn] = useState(false);

      const [registerName, setRegisterName] = useState('');
      const [registerUsername, setRegisterUsername] = useState('');
      const [registerEmail, setRegisterEmail] = useState('');
      const [registerPassword, setRegisterPassword] = useState('');
      const [isRegistering, setIsRegistering] = useState(false);


      const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        const { error } = await signInWithPassword({ email: loginEmail, password: loginPassword });
        if (error) {
          toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
        }
        setIsLoggingIn(false);
      };

      const handleRegister = async (e) => {
        e.preventDefault();
        setIsRegistering(true);
        const { error } = await signUp({ 
            email: registerEmail, 
            password: registerPassword, 
            username: registerUsername,
            fullName: registerName,
        });
        if (error) {
          toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
        } else {
          toast({ title: 'Registration Successful!', description: "Please wait for an admin to approve your account." });
        }
        setIsRegistering(false);
      };
      
      return (
        <>
          <Helmet>
            <title>Autrizācija</title>
            <meta name="description" content="Login or register to join the game." />
          </Helmet>
          <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              <Tabs defaultValue="login" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2 bg-white/20">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-white/80">Login</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-white/80">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <Card className="glass-card text-white border-none">
                    <CardHeader>
                      <CardTitle className="text-2xl">Sveicināts!</CardTitle>
                      <CardDescription className="text-white/70">
                        Ievadi savus piekļuves datur, lai piekļūtu lapai.
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email-login">E-Pasts</Label>
                          <Input id="email-login" type="email" placeholder="m@example.com" className="bg-white/20 border-white/30 placeholder:text-white/50" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password-login">Parole</Label>
                          <Input id="password-login" type="password" className="bg-white/20 border-white/30 placeholder:text-white/50" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button type="submit" className="w-full bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-bold" disabled={isLoggingIn}>
                          {isLoggingIn ? 'Signing In...' : 'Autorizēties'}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>
                <TabsContent value="register">
                  <Card className="glass-card text-white border-none">
                    <CardHeader>
                      <CardTitle className="text-2xl">Izveidot Lietotāju</CardTitle>
                      <CardDescription className="text-white/70">
                        Ievadi savu informāciju, lai reģistrētos. Tev būs nepieciešams administratora apstiprinājums, lai autorizētos.
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleRegister}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name-register">Vārds</Label>
                          <Input id="name-register" placeholder="Your Full Name" className="bg-white/20 border-white/30 placeholder:text-white/50" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required />
                        </div>
                         <div className="space-y-2">
                          <Label htmlFor="username-register">Lietotājvārds</Label>
                          <Input id="username-register" placeholder="Your Username" className="bg-white/20 border-white/30 placeholder:text-white/50" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email-register">E-Pasts</Label>
                          <Input id="email-register" type="email" placeholder="m@example.com" className="bg-white/20 border-white/30 placeholder:text-white/50" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password-register">Parole</Label>
                          <Input id="password-register" type="password" className="bg-white/20 border-white/30 placeholder:text-white/50" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button type="submit" className="w-full bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-bold" disabled={isRegistering}>
                          {isRegistering ? 'Registering...' : 'Reģistrēties'}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </>
      );
    };

    export default AuthPage;
  