
    import React, { useState, useEffect } from 'react';
    import { Helmet } from 'react-helmet';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Trophy, Crown, ChevronsRight, Star, Target, CheckCircle2 } from 'lucide-react';
    import { Avatar, AvatarFallback } from '@/components/ui/avatar';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';

    const TopPage = () => {
      const { toast } = useToast();
      const [leaderboard, setLeaderboard] = useState([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const fetchLeaderboard = async () => {
          setLoading(true);
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username, points, full_name, precise_draw_bonus, precise_score_bonus, goal_difference_bonus, correct_winner_bonus')
            .order('points', { ascending: false })
            .order('precise_draw_bonus', { ascending: false })
            .order('precise_score_bonus', { ascending: false })
            .order('goal_difference_bonus', { ascending: false })
            .order('correct_winner_bonus', { ascending: false })
            .limit(20);

          if (error) {
            toast({
              variant: "destructive",
              title: "Error fetching leaderboard",
              description: error.message,
            });
          } else {
            setLeaderboard(data);
          }
          setLoading(false);
        };

        fetchLeaderboard();
      }, [toast]);
      
      const getRankIcon = (index) => {
        if (index === 0) return <Crown className="inline-block h-5 w-5 text-yellow-400 mr-2" />;
        if (index === 1) return <Trophy className="inline-block h-5 w-5 text-slate-300 mr-2" />;
        if (index === 2) return <Trophy className="inline-block h-5 w-5 text-amber-600 mr-2" />;
        return null;
      };

      return (
        <>
          <Helmet>
            <title>Leaderboard - Prediction Game</title>
            <meta name="description" content="See who the top prediction players are." />
          </Helmet>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white tracking-tight">Leaderboard</h1>
            {loading ? (
              <Card className="glass-card text-white"><CardContent><p className="text-center p-8">Loading leaderboard...</p></CardContent></Card>
            ) : leaderboard.length > 0 ? (
              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy />
                    <span>Top Players</span>
                  </CardTitle>
                  <CardDescription className="text-white/70">Who stands at the top of the prediction game?</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white/80">Rank</TableHead>
                        <TableHead className="text-white/80">Player</TableHead>
                        <TableHead className="text-white/80">Tie-Breakers</TableHead>
                        <TableHead className="text-white/80 text-right">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((player, index) => (
                        <TableRow key={player.id} className="border-white/20">
                          <TableCell className="font-bold text-white text-lg">
                            {getRankIcon(index)}
                            {index + 1}
                          </TableCell>
                          <TableCell className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-white/30">
                              <AvatarFallback className="bg-blue-500/50 text-white">{player.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-white font-medium">{player.username}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 text-xs text-white/70">
                               <div className="flex items-center gap-1" title="Precise Draw (12pts)">
                                <Star className="h-3 w-3 text-cyan-400"/>
                                <span>{player.precise_draw_bonus}</span>
                               </div>
                               <div className="flex items-center gap-1" title="Precise Score (10pts)">
                                <Target className="h-3 w-3 text-green-400"/>
                                <span>{player.precise_score_bonus}</span>
                               </div>
                               <div className="flex items-center gap-1" title="Goal Diff. / Draw (6pts)">
                                 <ChevronsRight className="h-3 w-3 text-yellow-400"/>
                                <span>{player.goal_difference_bonus}</span>
                               </div>
                               <div className="flex items-center gap-1" title="Correct Winner (4pts)">
                                 <CheckCircle2 className="h-3 w-3 text-fuchsia-400"/>
                                <span>{player.correct_winner_bonus}</span>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white text-xl font-semibold text-right">{player.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy />
                    <span>No Top Players Yet</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">The leaderboard will be shown here after the first games are completed.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      );
    };

    export default TopPage;
  