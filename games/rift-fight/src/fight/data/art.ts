import type { FighterId } from "../engine/types";

const cdn = import.meta.env.DEV ? "/ddragon/cdn" : "https://ddragon.leagueoflegends.com/cdn";

export function fighterArt(id: FighterId) {
  return {
    icon: `${cdn}/16.13.1/img/champion/${id}.png`,
    splash: `${cdn}/img/champion/splash/${id}_0.jpg`,
  };
}
