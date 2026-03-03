import { useState } from "react";
import * as XLSX from "xlsx";
import Counter from "@/components/Counter";
import ToggleOption from "@/components/ToggleOption";
import PercentageBadge from "@/components/PercentageBadge";
import { Download, RotateCcw, Save, Trophy, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface MatchData {
  equipe: string;
  partida: string;
  // Autônomo
  autoDisparos: number;
  autoAcertos: number;
  // Teleoperado
  teleDisparos: number;
  teleAcertos: number;
  // Artefatos
  artefatosColetados: number;
  artefatosErros: number;
  // Opções
  possuiAutonomo: boolean;
  baseMenor: boolean;
  baseMaior: boolean;
  possuiOdometria: boolean;
  possuiLimelight: boolean;
  observacoes: string;
  // Calculados
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

const saveHistory = (data: MatchData[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const Index = () => {
  const [equipe, setEquipe] = useState("");
  const [partida, setPartida] = useState("");

  // Autônomo
  const [autoDisparos, setAutoDisparos] = useState(0);
  const [autoAcertos, setAutoAcertos] = useState(0);

  // Teleoperado
  const [teleDisparos, setTeleDisparos] = useState(0);
  const [teleAcertos, setTeleAcertos] = useState(0);

  // Artefatos
  const [artefatosColetados, setArtefatosColetados] = useState(0);
  const [artefatosErros, setArtefatosErros] = useState(0);

  // Opções
  const [possuiAutonomo, setPossuiAutonomo] = useState(false);
  const [baseMenor, setBaseMenor] = useState(false);
  const [baseMaior, setBaseMaior] = useState(false);
  const [possuiOdometria, setPossuiOdometria] = useState(false);
  const [possuiLimelight, setPossuiLimelight] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  const [history, setHistory] = useState<MatchData[]>(loadHistory);

  const calcPct = (hits: number, total: number) => total > 0 ? Math.round((hits / total) * 100) : 0;

  const totalDisparos = autoDisparos + teleDisparos;
  const totalAcertos = autoAcertos + teleAcertos;
  const totalArtefatos = artefatosColetados + artefatosErros;

  const resetForm = () => {
    setAutoDisparos(0); setAutoAcertos(0);
    setTeleDisparos(0); setTeleAcertos(0);
    setArtefatosColetados(0); setArtefatosErros(0);
    setPossuiAutonomo(false); setBaseMenor(false); setBaseMaior(false);
    setPossuiOdometria(false); setPossuiLimelight(false);
    setEquipe(""); setPartida(""); setObservacoes("");
  };

  const saveMatch = () => {
    if (!equipe.trim()) { toast.error("Informe o nome da equipe!"); return; }

    const entry: MatchData = {
      equipe, partida,
      autoDisparos, autoAcertos,
      teleDisparos, teleAcertos,
      artefatosColetados, artefatosErros,
      possuiAutonomo, baseMenor, baseMaior, possuiOdometria, possuiLimelight, observacoes,
      pctAutoAcertos: calcPct(autoAcertos, autoDisparos),
      pctTeleAcertos: calcPct(teleAcertos, teleDisparos),
      pctTotalAcertos: calcPct(totalAcertos, totalDisparos),
      pctArtefatos: calcPct(artefatosColetados, totalArtefatos),
    };

    const updated = [...history, entry];
    setHistory(updated);
    saveHistory(updated);
    toast.success("Partida salva com sucesso!");
    resetForm();
  };

  const exportToExcel = () => {
    if (history.length === 0) { toast.error("Nenhum dado para exportar!"); return; }

    const wsData = history.map((m, i) => ({
      "#": i + 1,
      "Equipe": m.equipe,
      "Partida": m.partida,
      "Auto Disparos": m.autoDisparos,
      "Auto Acertos": m.autoAcertos,
      "Auto %": m.pctAutoAcertos + "%",
      "Tele Disparos": m.teleDisparos,
      "Tele Acertos": m.teleAcertos,
      "Tele %": m.pctTeleAcertos + "%",
      "Total Disparos": m.autoDisparos + m.teleDisparos,
      "Total Acertos": m.autoAcertos + m.teleAcertos,
      "Total %": m.pctTotalAcertos + "%",
      "Artefatos Coletados": m.artefatosColetados,
      "Artefatos Erros": m.artefatosErros,
      "Artefatos %": m.pctArtefatos + "%",
      "Possui Autônomo": m.possuiAutonomo ? "Sim" : "Não",
      "Base Menor": m.baseMenor ? "Sim" : "Não",
      "Base Maior": m.baseMaior ? "Sim" : "Não",
      "Odometria": m.possuiOdometria ? "Sim" : "Não",
      "Limelight": m.possuiLimelight ? "Sim" : "Não",
      "Observações": m.observacoes || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(wsData);
    ws["!cols"] = Object.keys(wsData[0]).map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "Scouting");
    XLSX.writeFile(wb, "scouting_robotica.xlsx");
    toast.success("Excel exportado!");
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Sheet>
            <SheetTrigger asChild>
              <button className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-all">
                <StickyNote size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-card border-border">
              <SheetHeader>
                <SheetTitle className="font-display text-primary">Observações</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Anotações sobre a partida..."
                  className="w-full h-[calc(100vh-160px)] rounded-xl border border-border bg-background p-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                />
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-display uppercase tracking-wider text-muted-foreground">Scouting</span>
          <div className="w-9" /> {/* spacer */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Equipe + Partida */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">Equipe</label>
            <input
              value={equipe} onChange={e => setEquipe(e.target.value)}
              placeholder="Nome da equipe"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">Partida</label>
            <input
              value={partida} onChange={e => setPartida(e.target.value)}
              placeholder="Ex: Q1, SF2..."
              className="w-full rounded-xl border border-border bg-card px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Autônomo */}
        <section className="space-y-3">
          <h2 className="text-sm font-display uppercase tracking-widest text-primary flex items-center gap-2">
            <span className="h-px flex-1 bg-primary/20" />
            Autônomo
            <span className="h-px flex-1 bg-primary/20" />
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Counter label="Disparos" value={autoDisparos} onChange={setAutoDisparos} color="primary" />
            <Counter label="Acertos" value={autoAcertos} onChange={v => setAutoAcertos(Math.min(v, autoDisparos))} color="accent" />
          </div>
          <PercentageBadge hits={autoAcertos} total={autoDisparos} label="% Acertos Autônomo" />
        </section>

        {/* Teleoperado */}
        <section className="space-y-3">
          <h2 className="text-sm font-display uppercase tracking-widest text-primary flex items-center gap-2">
            <span className="h-px flex-1 bg-primary/20" />
            Teleoperado
            <span className="h-px flex-1 bg-primary/20" />
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Counter label="Disparos" value={teleDisparos} onChange={setTeleDisparos} color="primary" />
            <Counter label="Acertos" value={teleAcertos} onChange={v => setTeleAcertos(Math.min(v, teleDisparos))} color="accent" />
          </div>
          <PercentageBadge hits={teleAcertos} total={teleDisparos} label="% Acertos Teleoperado" />
        </section>

        {/* Artefatos */}
        <section className="space-y-3">
          <h2 className="text-sm font-display uppercase tracking-widest text-warning flex items-center gap-2">
            <span className="h-px flex-1 bg-warning/20" />
            Artefatos
            <span className="h-px flex-1 bg-warning/20" />
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Counter label="Coletados" value={artefatosColetados} onChange={setArtefatosColetados} color="accent" />
            <Counter label="Erros" value={artefatosErros} onChange={setArtefatosErros} color="destructive" />
          </div>
          <PercentageBadge hits={artefatosColetados} total={totalArtefatos} label="% Coleta" />
        </section>

        {/* Totais */}
        <section className="space-y-3">
          <h2 className="text-sm font-display uppercase tracking-widest text-foreground flex items-center gap-2">
            <span className="h-px flex-1 bg-border" />
            Resumo Geral
            <span className="h-px flex-1 bg-border" />
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <PercentageBadge hits={autoAcertos} total={autoDisparos} label="Auto" />
            <PercentageBadge hits={teleAcertos} total={teleDisparos} label="Tele" />
            <PercentageBadge hits={totalAcertos} total={totalDisparos} label="Total" />
          </div>
        </section>

        {/* Opções */}
        <section className="space-y-3">
          <h2 className="text-sm font-display uppercase tracking-widest text-foreground flex items-center gap-2">
            <span className="h-px flex-1 bg-border" />
            Características
            <span className="h-px flex-1 bg-border" />
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ToggleOption label="Autônomo" description="Possui modo autônomo" checked={possuiAutonomo} onChange={setPossuiAutonomo} />
            <ToggleOption label="Base Menor" description="Atira na base menor" checked={baseMenor} onChange={setBaseMenor} />
            <ToggleOption label="Base Maior" description="Atira na base maior" checked={baseMaior} onChange={setBaseMaior} />
            <ToggleOption label="Odometria" description="Possui odometria" checked={possuiOdometria} onChange={setPossuiOdometria} />
            <ToggleOption label="Limelight" description="Possui Limelight" checked={possuiLimelight} onChange={setPossuiLimelight} />
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-2 pb-8">
          <button onClick={saveMatch} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-sm font-bold tracking-wider text-primary-foreground hover:opacity-90 transition-all glow-primary">
            <Save size={18} /> SALVAR PARTIDA
          </button>
          <button onClick={resetForm} className="flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-display text-sm font-bold tracking-wider text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-all">
            <RotateCcw size={18} /> LIMPAR
          </button>
        </div>

        {/* Histórico */}
        {history.length > 0 && (
          <section className="space-y-3 pb-8">
            <div className="flex items-center gap-2">
              <span className="h-px flex-1 bg-border" />
              <h2 className="text-sm font-display uppercase tracking-widest text-foreground">
                Histórico ({history.length})
              </h2>
              <button onClick={exportToExcel} className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-all" title="Exportar Excel">
                <Download size={16} />
              </button>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-border bg-card text-left">
                    <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Equipe</th>
                    <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Partida</th>
                    <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Auto %</th>
                    <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Tele %</th>
                    <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Total %</th>
                    <th className="p-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Artefatos</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((m, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-semibold text-foreground">{m.equipe}</td>
                      <td className="p-3 text-muted-foreground">{m.partida || "—"}</td>
                      <td className="p-3 font-mono-tech text-primary">{m.pctAutoAcertos}%</td>
                      <td className="p-3 font-mono-tech text-primary">{m.pctTeleAcertos}%</td>
                      <td className="p-3 font-mono-tech font-bold text-accent">{m.pctTotalAcertos}%</td>
                      <td className="p-3 font-mono-tech text-warning">{m.artefatosColetados}/{m.artefatosColetados + m.artefatosErros}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
