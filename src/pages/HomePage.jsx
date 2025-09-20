import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gamepad2, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';
import Flag from "@/components/Flag";

const HomePage = () => {
  const { toast } = useToast();
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // 🔹 Atjaunina "tagad" ik sekundi, lai countdown kustas
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUpcomingGames = async () => {
      setLoading(true);

      // Paņem tuvāko spēli
      const { data: firstGame, error: firstError } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'scheduled')
        .order('game_time', { ascending: true })
        .limit(1)
        .single();

      if (firstError) {
        toast({
          variant: "destructive",
          title: "Error fetching first game",
          description: firstError.message,
        });
        setLoading(false);
        return;
      }

      const nearestDate = new Date(firstGame.game_time).toISOString().split("T")[0]; // YYYY-MM-DD

      // Paņem visas spēles tajā pašā dienā
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'scheduled')
        .gte('game_time', nearestDate + "T00:00:00")
        .lt('game_time', nearestDate + "T23:59:59")
        .order('game_time', { ascending: true });

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

  // 🔹 Countdown helper
  const getCountdown = (gameTime) => {
    const diffMs = new Date(gameTime) - now;
    if (diffMs <= 0) return "Jau sākusies!";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${diffHours.toString().padStart(2, "0")}:${diffMinutes
      .toString()
      .padStart(2, "0")}:${diffSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <Helmet>
        <title>Sākums</title>
        <meta
          name="description"
          content="View upcoming games and prepare for predictions."
        />
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Tuvākās spēles
        </h1>
        {loading ? (
          <Card className="glass-card text-white">
            <CardContent>
              <p className="text-center p-8">Loading games...</p>
            </CardContent>
          </Card>
        ) : upcomingGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.map((game) => (
              <Card key={game.id} className="glass-card text-white">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-xl w-full">
                    {/* Kreisā komanda */}
                    <div className="flex items-center gap-2">
                      <Flag country={game.team_a} />
                      <span>{game.team_a}</span>
                    </div>

                    <span className="mx-2">vs</span>

                    {/* Labā komanda */}
                    <div className="flex items-center gap-2">
                      <span>{game.team_b}</span>
                      <Flag country={game.team_b} />
                    </div>
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    {game.league || "Friendly Match"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="flex items-center gap-2 text-white/80">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(game.game_time).toLocaleDateString("lv-LV")}</span>
                  </p>
                  <p className="flex items-center gap-2 text-white/80">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(game.game_time).toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                    <span className="ml-2 text-cyan-300 font-mono">
                      {getCountdown(game.game_time)}
                    </span>
                  </p>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-between mt-4 text-white hover:bg-white/20"
                  >
                    <Link to="/predict">
                      <span>Prognozēt</span>
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
                <span>Pagaidām nav spēļu</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Pagaidām nav spēļu, gaidi, kad tās tiks pievienotas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default HomePage;
