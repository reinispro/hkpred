import React, { useState, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
    import { Gamepad2, Clock, Check } from 'lucide-react';
    import { cn } from '@/lib/utils';

    const PredictPage = () => {
      const { user, appSettings } = useSupabaseAuth();
      const { toast } = useToast();
      const [games, setGames] = useState([]);
      const [predictions, setPredictions] = useState({});
      const [loading, setLoading] = useState(true);
      const [topPlayers, setTopPlayers] = useState([]);
      const [userRank, setUserRank] = useState(null);

      const fetchGamesAndPredictions = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .eq('status', 'scheduled')
          .order('game_time', { ascending: true });

        if (gamesError) {
          toast({ variant: 'destructive', title: 'Error fetching games', description: gamesError.message });
        } else {
          setGames(gamesData);
        }

        const { data: predictionsData, error: predictionsError } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id);

        if (predictionsError) {
          toast({ variant: 'destructive', title: 'Error fetching predictions', description: predictionsError.message });
        } else {
          const preds = predictionsData.reduce((acc, p) => {
            acc[p.game_id] = { prediction_a: p.prediction_a, prediction_b: p.prediction_b, saved: true };
            return acc;
          }, {});
          setPredictions(preds);
        }

        setLoading(false);
      }, [user, toast]);

      const fetchTopPlayers = useCallback(async () => {
        if (!appSettings?.special_lock_time?.is_enabled) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('id, points')
          .order('points', { ascending: false });

        if (error) {
          console.error("Error fetching top players:", error);
        } else {
          const rankedPlayers = data.map((p, index) => ({ ...p, rank: index + 1 }));
          setTopPlayers(rankedPlayers.slice(0, 3));
          const currentUser = rankedPlayers.find(p => p.id === user.id);
          if (currentUser) {
            setUserRank(currentUser.rank);
          }
        }
      }, [appSettings, user]);

      useEffect(() => {
        if (user && appSettings) {
          fetchGamesAndPredictions();
          fetchTopPlayers();
        }
      }, [user, appSettings, fetchGamesAndPredictions, fetchTopPlayers]);

      const handlePredictionChange = (gameId, team, value) => {
        const val = value === '' ? null : parseInt(value, 10);
        setPredictions(prev => ({
          ...prev,
          [gameId]: {
            ...prev[gameId],
            saved: false,
            [team]: isNaN(val) ? '' : val,
          },
        }));
      };

      const getLockTime = (gameTime) => {
        const defaultLockMinutes = 15;
        if (!appSettings?.special_lock_time?.is_enabled || !userRank || userRank > 3) {
          return new Date(gameTime.getTime() - defaultLockMinutes * 60 * 1000);
        }

        let lockMinutes;
        if (userRank === 1) lockMinutes = 60;
        else if (userRank === 2) lockMinutes = 45;
        else if (userRank === 3) lockMinutes = 30;
        else lockMinutes = defaultLockMinutes;

        return new Date(gameTime.getTime() - lockMinutes * 60 * 1000);
      };

      const handleSubmitPrediction = async (gameId) => {
        const prediction = predictions[gameId];
        if (prediction.prediction_a === null || prediction.prediction_b === null || prediction.prediction_a === '' || prediction.prediction_b === '') {
          toast({ variant: 'destructive', title: 'Invalid Prediction', description: 'Please enter a score for both teams.' });
          return;
        }

        const { error } = await supabase
          .from('predictions')
          .upsert({
            user_id: user.id,
            game_id: gameId,
            prediction_a: prediction.prediction_a,
            prediction_b: prediction.prediction_b,
          }, { onConflict: 'user_id,game_id' });

        if (error) {
          toast({ variant: 'destructive', title: 'Error saving prediction', description: error.message });
        } else {
          toast({ title: 'Success!', description: 'Your prediction has been saved.' });
          setPredictions(prev => ({
            ...prev,
            [gameId]: { ...prev[gameId], saved: true }
          }));
        }
      };

      return (
        <>
          <Helmet>
            <title>Make Predictions - Prediction Game</title>
            <meta name="description" content="Submit your predictions for upcoming games." />
          </Helmet>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white tracking-tight">Make Your Predictions</h1>
            {loading ? (
              <Card className="glass-card text-white"><CardContent><p className="text-center p-8">Loading upcoming games...</p></CardContent></Card>
            ) : games.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map(game => {
                  const gameTime = new Date(game.game_time);
                  const lockTime = getLockTime(gameTime);
                  const isLocked = new Date() >= lockTime;
                  const prediction = predictions[game.id] || { prediction_a: '', prediction_b: '', saved: false };

                  return (
                    <Card key={game.id} className={`glass-card text-white ${isLocked ? 'opacity-60' : ''}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gamepad2 />
                          <span>{game.team_a} vs {game.team_b}</span>
                        </CardTitle>
                        <CardDescription className="text-white/70 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{gameTime.toLocaleString()}</span>
                        </CardDescription>
                        <CardDescription className="text-amber-300/80 text-xs">
                          Predictions lock at {lockTime.toLocaleTimeString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                          <Input
                            type="number"
                            min="0"
                            value={prediction.prediction_a}
                            onChange={(e) => handlePredictionChange(game.id, 'prediction_a', e.target.value)}
                            className="w-24 text-center text-2xl font-bold bg-white/20 border-white/30"
                            disabled={isLocked}
                          />
                          <span className="text-2xl font-bold">-</span>
                          <Input
                            type="number"
                            min="0"
                            value={prediction.prediction_b}
                            onChange={(e) => handlePredictionChange(game.id, 'prediction_b', e.target.value)}
                            className="w-24 text-center text-2xl font-bold bg-white/20 border-white/30"
                            disabled={isLocked}
                          />
                        </div>
                        <Button
                          variant="glass"
                          className={cn('w-full', {
                            'border-green-400/50 text-green-300': prediction.saved
                          })}
                          onClick={() => handleSubmitPrediction(game.id)}
                          disabled={isLocked || (prediction.saved)}
                        >
                          {isLocked ? 'Locked' : (
                            prediction.saved ? (
                              <>
                                <Check className="mr-2 h-4 w-4 text-green-400/80" />
                                Prediction Saved
                              </>
                            ) : 'Save Prediction'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle>No Upcoming Games</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">There are no games scheduled for predictions right now. Check back later!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      );
    };

    export default PredictPage;