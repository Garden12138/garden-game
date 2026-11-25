import { useCallback, useEffect, useState } from "react";
import { createFight } from "./engine/createFight";
import type { AiDifficulty, FighterId, FightState, VersusKind } from "./engine/types";
import { MatchScreen } from "./ui/MatchScreen";
import { ResultScreen } from "./ui/ResultScreen";
import { SelectScreen } from "./ui/SelectScreen";
import { VersusScreen } from "./ui/VersusScreen";

type Screen = "select" | "versus" | "match" | "result";

export function FightApp() {
  const [screen, setScreen] = useState<Screen>("select");
  const [p1, setP1] = useState<FighterId>("Ahri");
  const [p2, setP2] = useState<FighterId>("Garen");
  const [versus, setVersus] = useState<VersusKind>("local");
  const [difficulty, setDifficulty] = useState<AiDifficulty>("normal");
  const [match, setMatch] = useState<FightState | null>(null);

  const begin = (first: FighterId, second: FighterId) => {
    setP1(first);
    setP2(second);
    setMatch(createFight({ p1: first, p2: second, versus, aiDifficulty: difficulty }));
    setScreen("versus");
  };

  useEffect(() => {
    if (screen !== "versus") return;
    const timer = window.setTimeout(() => setScreen("match"), 1600);
    return () => window.clearTimeout(timer);
  }, [screen]);
  const onDone = useCallback((state: FightState) => {
    setMatch(state);
    setScreen("result");
  }, []);

  return (
    <div className="fight-shell">
      {screen === "select" && (
        <SelectScreen
          p1={p1}
          p2={p2}
          versus={versus}
          difficulty={difficulty}
          onP1={setP1}
          onP2={setP2}
          onVersus={setVersus}
          onDifficulty={setDifficulty}
          onStart={() => begin(p1, p2)}
        />
      )}
      {screen === "versus" && match && <VersusScreen p1={match.fighters[0].id} p2={match.fighters[1].id} versus={versus} />}
      {screen === "match" && match && (
        <MatchScreen key={`${match.fighters[0].id}-${match.fighters[1].id}-${match.versus}`} initial={match} onDone={onDone} onSelect={() => setScreen("select")} />
      )}
      {screen === "result" && match && (
        <ResultScreen
          state={match}
          onRematch={() => begin(p1, p2)}
          onSwap={() => begin(p2, p1)}
          onSelect={() => setScreen("select")}
        />
      )}
    </div>
  );
}
