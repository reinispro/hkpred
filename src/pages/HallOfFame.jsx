import React from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Flag from "@/components/Flag"; 
import countryCodes from "@/lib/countryCodes"; 

// Čempionu dati + valstis
const champions = [
  { year: 2016, player: "Ja kāds atceras padod ziņu", event: "Pasaules čempionāts hokejā (Krievija)", countries: ["Krievija"], points: "?" },
  { year: 2017, player: "McSims", event: "Pasaules čempionāts hokejā (Vācija – Francija)", countries: ["Vācija", "Francija"], points: "?" },
  { year: 2018, player: "LaimesLuteklis", event: "Pasaules čempionāts hokejā (Dānija)", countries: ["Dānija"], points: "?" },
  { year: 2018, player: "Vartis", event: "FIFA Pasaules kauss (Krievija)", countries: ["Krievija"], points: "?" },
  { year: 2019, player: "Ankis", event: "Pasaules čempionāts hokejā (Slovākija)", countries: ["Slovākija"], points: "?" },
  { year: 2021, player: "RingoLoto", event: "Pasaules čempionāts hokejā (Latvija)", countries: ["Latvija"], points: "?" },
  { year: 2022, player: "Goldmens", event: "Ziemas Olimpiāde (Ķīna)", countries: ["Ķīna"], points: "?" },
  { year: 2022, player: "Kalervo Kummola", event: "Pasaules čempionāts hokejā (Somija)", countries: ["Somija"], points: "234" },
];

const HallOfFame = () => {
  return (
    <>
      <Helmet>
        <title>Slavas zāle</title>
        <meta name="description" content="Slavas zāle – iepriekšējo gadu čempioni" />
      </Helmet>

      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-center text-yellow-400 tracking-tight drop-shadow-lg">
          🏆 Slavas zāle 🏆
        </h1>
        <p className="text-center text-white/70 max-w-2xl mx-auto">
          Šeit apkopoti visi mūsu čempioni – gadu gaitā pierādījuši sevi kā īsti prognožu meistari.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {champions.map((champ, index) => (
            <Card
              key={index}
              className="relative glass-card text-white border border-yellow-400/60 shadow-lg hover:shadow-yellow-400/40 transition"
            >
              {/* Zelta “aura” ap kartiņu */}
              <div className="absolute inset-0 rounded-2xl border-2 border-yellow-500/80 pointer-events-none"></div>

              <CardHeader>
                <CardTitle className="text-2xl font-bold text-yellow-300 drop-shadow">
                  {champ.year}
                </CardTitle>
                <CardDescription className="text-white/80 flex items-center gap-2 flex-wrap">
                  {/* Visi karogi */}
                  {champ.countries.map((country, i) =>
                    countryCodes[country] ? (
                      <Flag key={i} country={country} size={24} />
                    ) : null
                  )}
                  <span>{champ.event}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xl font-semibold text-white">{champ.player}</p>
                <p className="text-sm text-yellow-200/80">Punkti: {champ.points}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default HallOfFame;
