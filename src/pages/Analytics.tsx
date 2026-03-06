import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from "recharts";
import { ArrowLeft, Filter, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchData {
  equipe: string;
  partida: string;
  autoDisparos: number;
  autoAcertos: number;
  teleDisparos: number;
  teleAcertos: number;
  artefatosColetados: number;
  artefatosErros: number;
  possuiAutonomo: boolean;
  baseMenor: boolean;
  baseMaior: boolean;
  possuiOdometria: boolean;
  possuiLimelight: boolean;
  observacoes: string;
  pctAutoAcertos: number;
  pctTeleAcertos: number;
  pctTotalAcertos: number;
  pctArtefatos: number;
}

const STORAGE_KEY = "robotics-scouting-data";

const loadHistory = (): MatchData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

interface TeamStats {
  equipe: string;
  partidas: number;
  avgAuto: number;
  avgTele: number;
  avgTotal: number;
  avgArtefatos: number;
  totalDisparos: number;
  totalAcertos: number;
  possuiAutonomo: boolean;
  possuiOdometria: boolean;
  possuiLimelight: boolean;
}

const Analytics = () => {
  const navigate = useNavigate();
  const history = loadHistory();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [view, setView] = useState<"overview" | "compare">("overview");

  const teams = useMemo(() => {
    const map = new Map<string, MatchData[]>();
    history.forEach(m => {
      const key = m.equipe.trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [history]);

  const teamStats: TeamStats[] = useMemo(() => {
    return Array.from(teams.entries()).map(([, matches]) => {
      const n = matches.length;
      const avgAuto = Math.round(matches.reduce((s, m) => s + m.pctAutoAcertos, 0) / n);
      const avgTele = Math.round(matches.reduce((s, m) => s + m.pctTeleAcertos, 0) / n);
      const avgTotal = Math.round(matches.reduce((s, m) => s + m.pctTotalAcertos, 0) / n);
      const avgArtefatos = Math.round(matches.reduce((s, m) => s + m.pctArtefatos, 0) / n);
      const totalDisparos = matches.reduce((s, m) => s + m.autoDisparos + m.teleDisparos, 0);
      const totalAcertos = matches.reduce((s, m) => s + m.autoAcertos + m.teleAcertos, 0);
      return {
        equipe: matches[0].equipe,
        partidas: n,
        avgAuto,
        avgTele,
        avgTotal,
        avgArtefatos,
        totalDisparos,
        totalAcertos,
        possuiAutonomo: matches.some(m => m.possuiAutonomo),
        possuiOdometria: matches.some(m => m.possuiOdometria),
        possuiLimelight: matches.some(m => m.possuiLimelight),
      };
    }).sort((a, b) => b.avgTotal - a.avgTotal);
  }, [teams]);

  const filteredStats = selectedTeams.length > 0
    ? teamStats.filter(t => selectedTeams.includes(t.equipe))
    : teamStats;

  const toggleTeam = (equipe: string) => {
    setSelectedTeams(prev =>
      prev.includes(equipe)
        ? prev.filter(t => t !== equipe)
        : [...prev, equipe]
    );
  };

  const barData = filteredStats.map(t => ({
    name: t.equipe,
    "Auto %": t.avgAuto,
    "Tele %": t.avgTele,
    "Artefatos %": t.avgArtefatos,
  }));

  const radarData = [
    { metric: "Auto %", ...Object.fromEntries(filteredStats.map(t => [t.equipe, t.avgAuto])) },
    { metric: "Tele %", ...Object.fromEntries(filteredStats.map(t => [t.equipe, t.avgTele])) },
    { metric: "Total %", ...Object.fromEntries(filteredStats.map(t => [t.equipe, t.avgTotal])) },
    { metric: "Artefatos", ...Object.fromEntries(filteredStats.map(t => [t.equipe, t.avgArtefatos])) },
    { metric: "Partidas", ...Object.fromEntries(filteredStats.map(t => [t.equipe, Math.min(t.partidas * 10, 100)])) },
  ];

  const COLORS = [
    "hsl(180, 100%, 50%)",
    "hsl(140, 70%, 45%)",
    "hsl(45, 100%, 55%)",
    "hsl(280, 70%, 55%)",
    "hsl(0, 70%, 55%)",
    "hsl(200, 80%, 55%)",
  ];

  // Line chart: per-match evolution for selected team
  const selectedForLine = selectedTeams.length === 1 ? selectedTeams[0] : null;
  const lineData = selectedForLine
    ? (teams.get(selectedForLine.trim().toLowerCase()) || []).map((m, i) => ({
        partida: m.partida || `#${i + 1}`,
        "Auto %": m.pctAutoAcertos,
        "Tele %": m.pctTeleAcertos,
        "Total %": m.pctTotalAcertos,
      }))
    : [];

  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground font-body text-center">Nenhum dado registrado ainda. Volte e salve algumas partidas!</p>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground">
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <button onClick={() => navigate("/")} className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-display uppercase tracking-wider text-muted-foreground">Desempenho</span>
          <div className="w-9" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView("overview")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-display text-xs uppercase tracking-wider transition-all ${view === "overview" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}
          >
            <TrendingUp size={16} /> Visão Geral
          </button>
          <button
            onClick={() => setView("compare")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-display text-xs uppercase tracking-wider transition-all ${view === "compare" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}
          >
            <Users size={16} /> Comparativo
          </button>
        </div>

        {/* Team Filter */}
        <section className="space-y-2">
          <h3 className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Filter size={14} /> Filtrar Equipes
          </h3>
          <div className="flex flex-wrap gap-2">
            {teamStats.map(t => (
              <button
                key={t.equipe}
                onClick={() => toggleTeam(t.equipe)}
                className={`rounded-lg px-3 py-1.5 text-xs font-body font-semibold transition-all ${
                  selectedTeams.includes(t.equipe)
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {t.equipe} ({t.partidas})
              </button>
            ))}
            {selectedTeams.length > 0 && (
              <button
                onClick={() => setSelectedTeams([])}
                className="rounded-lg px-3 py-1.5 text-xs font-body text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all"
              >
                Limpar
              </button>
            )}
          </div>
        </section>

        {view === "overview" ? (
          <>
            {/* Ranking Table */}
            <section className="space-y-3">
              <h2 className="text-sm font-display uppercase tracking-widest text-primary flex items-center gap-2">
                <span className="h-px flex-1 bg-primary/20" />
                Ranking por Média
                <span className="h-px flex-1 bg-primary/20" />
              </h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-border bg-card text-left">
                      <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">#</th>
                      <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Equipe</th>
                      <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Partidas</th>
                      <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Auto</th>
                      <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Tele</th>
                      <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Total</th>
                      <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Artef.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStats.map((t, i) => (
                      <tr key={t.equipe} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-3 font-mono-tech text-muted-foreground">{i + 1}</td>
                        <td className="p-3 font-semibold text-foreground">{t.equipe}</td>
                        <td className="p-3 font-mono-tech text-muted-foreground">{t.partidas}</td>
                        <td className="p-3 font-mono-tech text-primary">{t.avgAuto}%</td>
                        <td className="p-3 font-mono-tech text-primary">{t.avgTele}%</td>
                        <td className="p-3 font-mono-tech font-bold text-accent">{t.avgTotal}%</td>
                        <td className="p-3 font-mono-tech text-warning">{t.avgArtefatos}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bar Chart */}
            <section className="space-y-3">
              <h2 className="text-sm font-display uppercase tracking-widest text-primary flex items-center gap-2">
                <span className="h-px flex-1 bg-primary/20" />
                Médias por Equipe
                <span className="h-px flex-1 bg-primary/20" />
              </h2>
              <div className="rounded-xl border border-border bg-card p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(220, 18%, 11%)", border: "1px solid hsl(180, 30%, 20%)", borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: "hsl(180, 100%, 95%)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Auto %" fill="hsl(180, 100%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Tele %" fill="hsl(140, 70%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Artefatos %" fill="hsl(45, 100%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Line Chart for single team */}
            {selectedForLine && lineData.length > 1 && (
              <section className="space-y-3">
                <h2 className="text-sm font-display uppercase tracking-widest text-accent flex items-center gap-2">
                  <span className="h-px flex-1 bg-accent/20" />
                  Evolução — {selectedForLine}
                  <span className="h-px flex-1 bg-accent/20" />
                </h2>
                <div className="rounded-xl border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={lineData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                      <XAxis dataKey="partida" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(220, 18%, 11%)", border: "1px solid hsl(180, 30%, 20%)", borderRadius: 12, fontSize: 12 }}
                        labelStyle={{ color: "hsl(180, 100%, 95%)" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="Auto %" stroke="hsl(180, 100%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Tele %" stroke="hsl(140, 70%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Total %" stroke="hsl(45, 100%, 55%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            {/* Radar Chart Compare */}
            <section className="space-y-3">
              <h2 className="text-sm font-display uppercase tracking-widest text-primary flex items-center gap-2">
                <span className="h-px flex-1 bg-primary/20" />
                Comparativo Radar
                <span className="h-px flex-1 bg-primary/20" />
              </h2>
              {filteredStats.length < 2 ? (
                <p className="text-center text-muted-foreground font-body text-sm py-8">Selecione pelo menos 2 equipes para comparar</p>
              ) : (
                <div className="rounded-xl border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(220, 15%, 18%)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 9 }} />
                      {filteredStats.map((t, i) => (
                        <Radar
                          key={t.equipe}
                          name={t.equipe}
                          dataKey={t.equipe}
                          stroke={COLORS[i % COLORS.length]}
                          fill={COLORS[i % COLORS.length]}
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(220, 18%, 11%)", border: "1px solid hsl(180, 30%, 20%)", borderRadius: 12, fontSize: 12 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Side by side stats */}
            {filteredStats.length >= 2 && (
              <section className="space-y-3">
                <h2 className="text-sm font-display uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="h-px flex-1 bg-primary/20" />
                  Lado a Lado
                  <span className="h-px flex-1 bg-primary/20" />
                </h2>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(filteredStats.length, 3)}, 1fr)` }}>
                  {filteredStats.slice(0, 3).map((t, i) => (
                    <div key={t.equipe} className="rounded-xl border border-border bg-card p-4 space-y-3" style={{ borderColor: COLORS[i % COLORS.length] + "60" }}>
                      <h3 className="font-display text-sm text-foreground text-center truncate">{t.equipe}</h3>
                      <div className="space-y-2 text-xs font-body">
                        <div className="flex justify-between"><span className="text-muted-foreground">Partidas</span><span className="font-mono-tech text-foreground">{t.partidas}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Auto %</span><span className="font-mono-tech text-primary">{t.avgAuto}%</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Tele %</span><span className="font-mono-tech text-primary">{t.avgTele}%</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total %</span><span className="font-mono-tech font-bold text-accent">{t.avgTotal}%</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Artefatos %</span><span className="font-mono-tech text-warning">{t.avgArtefatos}%</span></div>
                        <div className="pt-2 border-t border-border/50 space-y-1">
                          <div className="flex justify-between"><span className="text-muted-foreground">Autônomo</span><span>{t.possuiAutonomo ? "✅" : "❌"}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Odometria</span><span>{t.possuiOdometria ? "✅" : "❌"}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Limelight</span><span>{t.possuiLimelight ? "✅" : "❌"}</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm z-20">
        <div className="container mx-auto flex max-w-4xl">
          <button onClick={() => navigate("/")} className="flex-1 flex flex-col items-center gap-1 py-3 text-muted-foreground hover:text-foreground transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="text-[10px] font-display uppercase tracking-wider">Scouting</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-1 py-3 text-primary transition-all">
            <TrendingUp size={20} />
            <span className="text-[10px] font-display uppercase tracking-wider">Gráficos</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Analytics;
