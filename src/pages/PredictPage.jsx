import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Gamepad2, Clock } from 'lucide-react';
import { debounce } from 'lodash';

const LEAGUE_ORDER = [
  "Pamata turnīrs",
  "Izslēgšanas spēles",
  "Ceturtdaļfināls",
  "Pusfināls",
  "Fināls"
];

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
        acc[p.game_id] = {
          prediction_a: p.prediction_a,
          prediction_b: p.prediction_b,
          status: 'saved'
        };
        return acc;
      }, {});
      setPredictions(preds);
    }

    setLoading(false);
  }, [user, toast]);

  const fetchTopPlayers = useCallback(async () => {
    if (!appSettings?.special_lock_times?.is_enabled) return;

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
    if (!user) return;

    fetchGamesAndPredictions();
    fetchTopPlayers();

    const gamesChannel = supabase
      .channel('predictpage-games-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        () => {
          fetchGamesAndPredictions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamesChannel).catch(console.error);
    };
  }, [user, appSettings, fetchGamesAndPredictions, fetchTopPlayers]);

  const getLockTime = (gameTime) => {
    const defaultLockMinutes = 15;
    if (!appSettings?.special_lock_times?.is_enabled || !userRank || userRank > 3) {
      return new Date(gameTime.getTime() - defaultLockMinutes * 60 * 1000);
    }

    let lockMinutes;
    if (userRank === 1) lockMinutes = 60;
    else if (userRank === 2) lockMinutes = 45;
    else if (userRank === 3) lockMinutes = 30;
    else lockMinutes = defaultLockMinutes;

    return new Date(gameTime.getTime() - lockMinutes * 60 * 1000);
  };

  const savePrediction = async (gameId, prediction) => {
    const { prediction_a, prediction_b } = prediction;
    if (prediction_a === null || prediction_b === null || prediction_a === '' || prediction_b === '') {
      return;
    }

    setPredictions(prev => ({
      ...prev,
      [gameId]: { ...prev[gameId], status: 'saving' }
    }));

    const { data, error } = await supabase.functions.invoke('save-prediction', {
      body: { user_id: user.id, game_id: gameId, prediction_a, prediction_b },
    });

    if (error || data?.error) {
      setPredictions(prev => ({
        ...prev,
        [gameId]: { ...prev[gameId], status: 'error' }
      }));
    } else {
      setPredictions(prev => ({
        ...prev,
        [gameId]: { ...prev[gameId], status: 'saved' }
      }));
    }
  };

  const debouncedSave = useCallback(debounce((gameId, prediction) => {
    savePrediction(gameId, prediction);
  }, 600), []);

  const handlePredictionChange = (gameId, team, value) => {
    const val = value === '' ? null : parseInt(value, 10);
    setPredictions(prev => {
      const updated = {
        ...prev,
        [gameId]: {
          ...prev[gameId],
          [team]: isNaN(val) ? '' : val,
          status: 'editing'
        },
      };
      debouncedSave(gameId, updated[gameId]);
      return updated;
    });
  };

  // Grupē spēles pēc league
  const groupedGames = games.reduce((acc, game) => {
    const league = game.league || "Citi";
    if (!acc[league]) acc[league] = [];
    acc[league].push(game);
    return acc;
  }, {});

  return (
    <>
      <Helmet>
        <title>Prognozes</title>
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-white tracking-tight">Ievadi Savas Prognozes</h1>

        {loading ? (
          <Card className="glass-card text-white">
            <CardContent>
              <p className="text-center p-8">Ielādē tuvākās spēles...</p>
            </CardContent>
          </Card>
        ) : games.length > 0 ? (
          <div className="space-y-10">
            {LEAGUE_ORDER.map((league) =>
              groupedGames[league] ? (
                <div key={league}>
                  <h2 className="text-2xl font-bold text-white mb-4">{league}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedGames[league].map(game => {
                      const gameTime = new Date(game.game_time);
                      const lockTime = getLockTime(gameTime);
                      const isLocked = new Date() >= lockTime;
                      const prediction = predictions[game.id] || { prediction_a: '', prediction_b: '', status: 'idle' };

                      return (
                        <Card key={game.id} className={`glass-card text-white ${isLocked ? 'opacity-60' : ''}`}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Gamepad2 />
                              <span>{game.team_a} vs {game.team_b}</span>
                            </CardTitle>
                            <CardDescription className="text-white/70 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {gameTime.toLocaleDateString("lv-LV")}{" "}
                                {gameTime.toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit", hour12: false })}
                              </span>
                            </CardDescription>
                            <CardDescription className="text-amber-300/80 text-xs">
                              Prognozes slēdzas {lockTime.toLocaleDateString("lv-LV")}{" "}
                              {lockTime.toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit", hour12: false })}
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
                            <div className="text-center font-semibold h-6">
                              {isLocked ? (
                                <span className="text-red-300">Locked</span>
                              ) : prediction.status === 'saving' ? (
                                <span className="text-yellow-200">Saving…</span>
                              ) : prediction.status === 'saved' ? (
                                <span className="text-green-300">✓ Saved</span>
                              ) : prediction.status === 'error' ? (
                                <span className="text-red-300">✗ Error</span>
                              ) : (
                                <span className="text-white/70">Ievadi savu prognozi</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
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
