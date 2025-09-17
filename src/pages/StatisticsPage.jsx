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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('points, precise_draw_bonus, precise_score_bonus, goal_difference_bonus, correct_winner_bonus')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;

        const { count: totalPredictions } = await supabase
          .from('predictions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { count: correctPredictions } = await supabase
          .from('predictions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gt('points_awarded', 0);

        const { count: noScore } = await supabase
          .from('predictions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('points_awarded', 0);

        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { data: rankData } = await supabase
          .from('profiles')
          .select('id')
          .gt('points', profile.points);

        const rank = (rankData?.length || 0) + 1;

        const winRate =
          totalPredictions > 0
            ? parseFloat(((correctPredictions / totalPredictions) * 100).toFixed(1))
            : 0;

        setStats({
          totalPoints: profile.points,
          totalPredictions,
          correctPredictions,
          winRate,
          rank,
          totalUsers,
          tiebreakers: {
            preciseDraws: profile.precise_draw_bonus,
            preciseScores: profile.precise_score_bonus,
            goalDifference: profile.goal_difference_bonus,
            correctWinner: profile.correct_winner_bonus,
            noScore,
          },
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching stats',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const profilesChannel = supabase
      .channel('profiles-stats-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.new?.id === user?.id) {
            fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel).catch(console.error);
    };
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
    return <div className="text-white text-center p-8">Ielādē statistiku...</div>;
  }

  if (!stats) {
    return <div className="text-white text-center p-8">Pagaidām statistika nav pieejama. Ievadi kādas prognozes!</div>;
  }

  const performanceData = [
    { subject: 'Precīzs neizšķirts', count: stats.tiebreakers.preciseDraws || 0 },
    { subject: 'Precīzs rezultāts', count: stats.tiebreakers.preciseScores || 0 },
    { subject: 'Vārtu starpība', count: stats.tiebreakers.goalDifference || 0 },
    { subject: 'Pareizs uzvarētājs', count: stats.tiebreakers.correctWinner || 0 },
    { subject: 'Bez rezultāta', count: stats.tiebreakers.noScore || 0 },
  ];

  return (
    <>
      <Helmet>
        <title>Statistika</title>
        <meta name="description" content="View your personal prediction statistics and performance." />
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-white tracking-tight">Tava Statistika</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="glass-card text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-300" />
                <span>Kopējie Punkti</span>
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
                <span>Uzvaras %</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-center text-blue-300">{stats.winRate}%</div>
              <Progress
                value={stats.winRate}
                className="w-full h-2 bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-cyan-400 [&>div]:to-blue-500"
              />
              <p className="text-sm text-white/80">
                {stats.correctPredictions} no {stats.totalPredictions} prognozēm ir pareizas.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-green-300" />
                <span>Vieta Topā</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-center">
              <p className="text-5xl font-black text-green-300">{stats.rank}</p>
              <p className="text-white/80">no {stats.totalUsers} dalībniekiem</p>
            </CardContent>
          </Card>

          <Card className="glass-card text-white lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-fuchsia-300" />
                <span>Punktu Sadalījums</span>
              </CardTitle>
              <CardDescription className="text-white/70">
                Punktu sadalījums starp punktu veidiem.
              </CardDescription>
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
