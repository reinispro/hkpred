
    import React from 'react';
    import { Helmet } from 'react-helmet';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { ScrollText } from 'lucide-react';

    const RulesPage = () => {
      return (
        <>
          <Helmet>
            <title>Rules - Prediction Game</title>
          </Helmet>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white tracking-tight">Game Rules</h1>
            <Card className="glass-card text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText />
                  <span>Point System</span>
                </CardTitle>
                <CardDescription className="text-white/70">How points are awarded for predictions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-white/90">
                <div className="flex items-start gap-4">
                    <div className="font-bold text-lg text-cyan-300 w-8 text-center">12</div>
                    <p>Points for guessing the exact result of a game that ends in a draw.</p>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="font-bold text-lg text-cyan-300 w-8 text-center">10</div>
                    <p>Points for guessing the exact result of a game (non-draw).</p>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="font-bold text-lg text-cyan-300 w-8 text-center">6</div>
                    <p>Points for a correctly guessed goal difference (but not the exact score) or an inaccurate draw (e.g., predicted 1-1, result was 2-2).</p>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="font-bold text-lg text-cyan-300 w-8 text-center">4</div>
                    <p>Points for guessing the winning team but with an incorrect score.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      );
    };

    export default RulesPage;
  