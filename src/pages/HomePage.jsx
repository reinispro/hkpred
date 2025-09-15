import React, { useState, useEffect } from 'react';
    import { Helmet } from 'react-helmet';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Gamepad2, Calendar, Clock, ChevronRight } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Link } from 'react-router-dom';

    const HomePage = () => {
      const { toast } = useToast();
      const [upcomingGames, setUpcomingGames] = useState([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const fetchUpcomingGames = async () => {
          setLoading(true);
          const { data, error } = await supabase
            .from('games')
            .select('*')
            .eq('status', 'scheduled')
            .order('game_time', { ascending: true })
            .limit(6);

          if (error) {
            toast({
              variant: "destructive",
              title: "Error fetching games",
              description: error.message,
            });
          } else {
            setUpcomingGames(data);
          }
          setLoading(false);
        };

        fetchUpcomingGames();
      }, [toast]);

      return (
        <>
          <Helmet>
            <title>Home - Prediction Game</title>
            <meta name="description" content="View upcoming games and prepare for predictions." />
          </Helmet>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white tracking-tight">Upcoming Games</h1>
            {loading ? (
               <Card className="glass-card text-white"><CardContent><p className="text-center p-8">Loading games...</p></CardContent></Card>
            ) : upcomingGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingGames.map(game => (
                  <Card key={game.id} className="glass-card text-white">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-xl">
                        <span>{game.team_a} vs {game.team_b}</span>
                        <Gamepad2 className="h-6 w-6 text-cyan-300" />
                      </CardTitle>
                      <CardDescription className="text-white/70">{game.league || 'Friendly Match'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="flex items-center gap-2 text-white/80">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(game.game_time).toLocaleDateString()}</span>
                      </p>
                      <p className="flex items-center gap-2 text-white/80">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(game.game_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                      <Button asChild variant="ghost" className="w-full justify-between mt-4 text-white hover:bg-white/20">
                        <Link to="/predict">
                          <span>Make Prediction</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 />
                    <span>No Games Yet</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">No upcoming games scheduled. The admin needs to add new games.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      );
    };

    export default HomePage;