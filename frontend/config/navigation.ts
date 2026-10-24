import { SPRITES } from "./assets";
import { ROUTES, ROUTE_PREFIXES } from "./routes";

export type NavItem = {
  label: string;
  href: string;
  sprite: string;
  match?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Mapa",
    href: ROUTES.galaxies,
    sprite: SPRITES.ui.map,
    match: [ROUTES.ageRanges, ROUTES.galaxies, ROUTE_PREFIXES.system, ROUTE_PREFIXES.lesson, ROUTE_PREFIXES.lab],
  },
  { label: "Conquistas", href: ROUTES.achievements, sprite: SPRITES.ui.achievements },
  { label: "Ranking", href: ROUTES.ranking, sprite: SPRITES.ui.ranking },
  { label: "Ajustes", href: ROUTES.settings, sprite: SPRITES.ui.settings },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
