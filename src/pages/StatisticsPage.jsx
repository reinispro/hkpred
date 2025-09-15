import React, { useState, useEffect } from 'react';
    import { Helmet } from 'react-helmet';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { BarChart, Trophy, Users } from 'lucide-react';
    import { Progress } from '@/components/ui/progress';
    import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
    import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';

    const StatisticsPage = () => {
      const { user, loading: userLoading } = useSupabaseAuth();
      const { toast } = useToast();
      const [stats, setStats] = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const fetchStats = async () => {
          if (!user) {
            if (!userLoading) setLoading(false);
            return;
          }
          setLoading(true);

          try {
            const { count: totalPredictions, error: predError } = await supabase
              .from('predictions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);

            if (predError) throw predError;
            
            const { count: correctPredictions, error: correctPredError } = await supabase
              .from('predictions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .gt('points_awarded', 0);

            if (correctPredError) throw correctPredError;

            const { count: totalUsers, error: usersError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true });

            if (usersError) throw usersError;
            
            const { data: rankData, error: rankError } = await supabase
              .from('profiles')
              .select('id')
              .gt('points', user.points);
            
            if (rankError) throw rankError;
            
            const rank = (rankData?.length || 0) + 1;
            
            const winRate = totalPredictions > 0 ? parseFloat(((correctPredictions / totalPredictions) * 100).toFixed(1)) : 0;
            
            const noScore = predictions.filter(
              (p) => (p.points_awarded ?? 0) === 0
            ).length;

            setStats({
              totalPoints: user.points,
              totalPredictions,
              correctPredictions,
              winRate,
              rank,
              totalUsers,
              tiebreakers: {
                preciseDraws: user.precise_draw_bonus,
                preciseScores: user.precise_score_bonus,
                goalDifference: user.goal_difference_bonus,
                correctWinner: user.correct_winner_bonus,
                noScore,
              },
            });

          } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching stats', description: error.message });
          } finally {
            setLoading(false);
          }
        };

        fetchStats();
      }, [user, toast, userLoading]);

      const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
            <div className="p-2 bg-black/50 backdrop-blur-sm rounded-md border border-white/20 text-white">
              <p className="font-bold">{data.subject}</p>
              <p className="text-cyan-400">{`Count: ${payload[0].value}`}</p>
            </div>
          );
        }
        return null;
      };

      if (loading || userLoading) {
        return <div className="text-white text-center p-8">Loading statistics...</div>;
      }
      
      if (!stats) {
         return <div className="text-white text-center p-8">No statistics available yet. Make some predictions!</div>;
      }

      const performanceData = [
        { subject: 'Precīzs neizšķirts', count: stats.tiebreakers.preciseDraws || 0 },
        { subject: 'Precīzs rezultāts', count: stats.tiebreakers.preciseScores || 0 },
        { subject: 'Vārtu starpība.', count: stats.tiebreakers.goalDifference || 0 },
        { subject: 'Pareizs uzvarētājs', count: stats.tiebreakers.correctWinner || 0 },
        { subject: 'Bez rezultāta', count: stats.tiebreakers.noScore || 0 },
      ];

      return (
        <>
          <Helmet>
            <title>Statistics - Prediction Game</title>
            <meta name="description" content="View your personal prediction statistics and performance." />
          </Helmet>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white tracking-tight">Your Statistics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-300" />
                    <span>Total Points</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-4xl font-bold text-center text-cyan-300">
                  {stats.totalPoints}
                </CardContent>
              </Card>

              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-6 w-6 text-blue-300" />
                    <span>Win Rate</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold text-center text-blue-300">
                    {stats.winRate}%
                  </div>
                  <Progress value={stats.winRate} className="w-full h-2 bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-cyan-400 [&>div]:to-blue-500" />
                  <p className="text-sm text-white/80">
                    {stats.correctPredictions} out of {stats.totalPredictions} predictions correct.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-green-300" />
                    <span>Current Rank</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-center">
                  <p className="text-5xl font-black text-green-300">{stats.rank}</p>
                  <p className="text-white/80">out of {stats.totalUsers} players</p>
                </CardContent>
              </Card>

              <Card className="glass-card text-white lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-fuchsia-300" />
                    <span>Your Performance Profile</span>
                  </CardTitle>
                  <CardDescription className="text-white/70">A breakdown of your prediction accuracy by type.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                     <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                      <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                      <PolarAngleAxis dataKey="subject" stroke="#FFFFFF" tick={{ fill: 'white', fontSize: 14 }} />
                      <PolarRadiusAxis angle={30} stroke="rgba(255, 255, 255, 0)" tick={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Radar name="Count" dataKey="count" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      );
    };

    export default StatisticsPage;