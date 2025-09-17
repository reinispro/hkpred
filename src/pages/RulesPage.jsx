
    import React from 'react';
    import { Helmet } from 'react-helmet';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { ScrollText } from 'lucide-react';

    const RulesPage = () => {
      return (
        <>
          <Helmet>
            <title>Noteikumi</title>
          </Helmet>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white tracking-tight">Prognožu Spēles Noteikumi</h1>
            <Card className="glass-card text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText />
                  <span>Punktu Sistēma</span>
                </CardTitle>
                <CardDescription className="text-white/70">Kā tiek piešķirti punkti par prognozēm.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-white/90">
                <div className="flex items-start gap-4">
                    <div className="font-bold text-lg text-cyan-300 w-8 text-center">12</div>
                    <p>Par precīzi uzminētu neizšķirtu rezultātu (piemēram, prognoze – 1:1,  iznākums – 1:1).</p>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="font-bold text-lg text-cyan-300 w-8 text-center">10</div>
                    <p>Par precīzi uzminētu rezultātu (piemēram, prognoze – 2:3, iznākums – 2:3).</p>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="font-bold text-lg text-cyan-300 w-8 text-center">6</div>
                    <p>Par  pareizi uzminētu vārtu starpību, tajā skaitā neprecīzu neizšķirtu (piemēram, prognoze – 2:3, iznākums – 3:4 vai prognoze – 3:3, iznākums – 2:2).</p>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="font-bold text-lg text-cyan-300 w-8 text-center">4</div>
                    <p>Par pareizi uzminētu uzvarētāju (piemēram, prognoze – 2:3, iznākums – 1:6).</p>
                </div>
                  <div className="flex items-start gap-4">
                    <div className="font-bold text-lg text-cyan-300 w-8 text-center">0</div>
                    <p>Par nepareizu prognozi (piemēram, prognoze – 2:3, iznākums – 4:1).</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      );
    };

    export default RulesPage;
  