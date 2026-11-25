import { lazy, Suspense } from "react";
import { getChampionById, getSkinByNum } from "../../data/champions";
import { getGameChampion } from "../data/champions";

const CardViewer3D = lazy(() =>
  import("../../components/CardViewer3D").then((module) => ({ default: module.CardViewer3D })),
);

export function CastOverlay({
  championId,
  onClose,
}: {
  championId: string;
  onClose: () => void;
}) {
  const champion = getChampionById(championId);
  const skill = getGameChampion(championId);
  const skin = champion ? getSkinByNum(champion, 0) : undefined;
  return (
    <div className="rift-cast" role="dialog" aria-label="卡牌聚焦">
      <button type="button" className="rift-cast__close" onClick={onClose}>
        关闭
      </button>
      {champion && skin ? (
        <Suspense fallback={<p>正在装裱卡片…</p>}>
          <CardViewer3D champion={champion} skin={skin} variant="cast" className="w-full" />
        </Suspense>
      ) : null}
      {skill && <p className="rift-role-card"><strong>{skill.skillName}</strong> · {skill.skillText}</p>}
    </div>
  );
}
