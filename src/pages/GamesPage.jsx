import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListOrdered, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const OtherPredictionsDialog = ({ gameId, gameName }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPredictions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('predictions')
      .select('prediction_a, prediction_b, profiles(username)')
      .eq('game_id', gameId);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setPredictions(data);
    }
    setLoading(false);
  };

  return (
    <Dialog onOpenChange={(open) => open && fetchPredictions()}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-cyan-300 hover:text-cyan-400 hover:bg-white/10">
          <Users className="mr-2 h-4 w-4" /> Apskatīt
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card text-white border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle>Prognozes spēlei {gameName}</DialogTitle>
          <DialogDescription className="text-white/70">
            Šeit tu redzi citu spēlētāju prognozes par šo spēli.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? <p>Ielādē...</p> : predictions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/20 hover:bg-white/10">
                  <TableHead className="text-white/80">Player</TableHead>
                  <TableHead className="text-white/80 text-right">Prediction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.map((p, i) => (
                  <TableRow key={i} className="border-white/20">
                    <TableCell className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border border-white/30 text-xs">
                        <AvatarFallback className="bg-blue-500/50 text-white">
                          {p.profiles.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {p.profiles.username}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {p.prediction_a} - {p.prediction_b}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-white/70 text-center py-4">Uz šo spēli netika veiktas prognozes.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const GamesPage = () => {
  const { user, appSettings } = useSupabaseAuth();
  const { toast } = useToast();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    if (!user || !appSettings) return;
    setLoading(true);

    const now = new Date().toISOString();
    const alwaysShow = appSettings?.always_show_predictions?.is_enabled;

    let query = supabase
      .from('games')
      .select(`
        id,
        team_a,
        team_b,
        result_a,
        result_b,
        game_time,
        status,
        predictions (
          prediction_a,
          prediction_b,
          points_awarded
        )
      `);
    
    if (!alwaysShow) {
      query = query.or(`status.eq.finished,and(status.eq.scheduled,game_time.lte.${now})`);
    }

    query = query.eq('predictions.user_id', user.id).order('game_time', { ascending: false });

    const { data, error } = await query;

    if (error) {
      toast({ variant: "destructive", title: "Error fetching games", description: error.message });
    } else {
      setGames(data);
    }
    setLoading(false);
  }, [user, toast, appSettings]);

  useEffect(() => {
    fetchGames();

    // 👇 Realtime uz games
    const gamesChannel = supabase
      .channel('games-live-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        (payload) => {
          console.log("Games updated:", payload);
          fetchGames();
        }
      )
      .subscribe();

    // 👇 Realtime uz predictions (lai uzreiz var redzēt citu prognozes / punktus)
    const predictionsChannel = supabase
      .channel('predictions-live-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        (payload) => {
          console.log("Predictions updated:", payload);
          fetchGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamesChannel).catch(console.error);
      supabase.removeChannel(predictionsChannel).catch(console.error);
    };
  }, [fetchGames]);

  const getPointsBadgeVariant = (points) => {
    if (points === null || points === undefined) return "gray";
    if (points >= 10) return "green";
    if (points >= 6) return "yellow";
    if (points >= 4) return "blue";
    return "gray";
  };

  const Badge = ({ variant, children }) => {
    let className =
      "px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    if (variant === "green") className += " bg-green-500 text-green-50";
    if (variant === "yellow") className += " bg-yellow-500 text-yellow-50";
    if (variant === "blue") className += " bg-blue-500 text-blue-50";
    if (variant === "gray") className += " bg-gray-500 text-gray-50";
    return <span className={className}>{children}</span>;
  };

  return (
    <>
      <Helmet>
        <title>Spēles</title>
        <meta
          name="description"
          content="View past game results and prediction outcomes."
        />
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-white tracking-tight">Spēļu Vēsture</h1>
        {loading ? (
          <Card className="glass-card text-white">
            <CardContent>
              <p className="text-center p-8">Ielādē spēļu vēsturi...</p>
            </CardContent>
          </Card>
        ) : games.length > 0 ? (
          <Card className="glass-card text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered />
                <span>Spēles, kas ir beigušās un tās, kas notiek šobrīd</span>
              </CardTitle>
              <CardDescription className="text-white/70">
                Rezultāti un tavi punkti par spēlēm, kas ir beigušās, vai notiek šobrīd.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/10">
                    <TableHead className="text-white/80">Spēle</TableHead>
                    <TableHead className="text-white/80">Tava Prognoze</TableHead>
                    <TableHead className="text-white/80">Rezultāts</TableHead>
                    <TableHead className="text-white/80">Punkti</TableHead>
                    <TableHead className="text-white/80">Datums</TableHead>
                    <TableHead className="text-white/80">Citu Prognozes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => {
                    const prediction = game.predictions[0];
                    const gameStarted = new Date(game.game_time) <= new Date();
                    const isFinished = game.status === "finished";
                    const canViewOthers =
                      gameStarted || appSettings?.always_show_predictions?.is_enabled;

                    return (
                      <TableRow key={game.id} className="border-white/20">
                        <TableCell className="font-medium text-white">
                          {game.team_a} vs {game.team_b}
                        </TableCell>
                        <TableCell className="text-white">
                          {prediction
                            ? `${prediction.prediction_a} - ${prediction.prediction_b}`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-white font-bold">
                          {isFinished
                            ? `${game.result_a} - ${game.result_b}`
                            : gameStarted
                            ? "Live"
                            : "Upcoming"}
                        </TableCell>
                        <TableCell>
                          {isFinished ? (
                            <Badge variant={getPointsBadgeVariant(prediction?.points_awarded)}>
                              {prediction?.points_awarded ?? 0} pts
                            </Badge>
                          ) : (
                            <span className="text-white/70">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-white/80">
                          {new Date(game.game_time).toLocaleDateString("lv-LV")}{" "}
                          {new Date(game.game_time).toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </TableCell>
                        <TableCell>
                          {canViewOthers ? (
                            <OtherPredictionsDialog
                              gameId={game.id}
                              gameName={`${game.team_a} vs ${game.team_b}`}
                            />
                          ) : (
                            <span className="text-white/70 text-xs">Tiek gaidīts spēles sākums</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered />
                <span>Neviena spēle nav atrasta</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Nav spēļu, kas būtu noslēgušās vai notiktu šobrīd.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default GamesPage;
