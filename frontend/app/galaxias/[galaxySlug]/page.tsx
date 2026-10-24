import { galaxyParams } from "@/lib/staticParams";
import GalaxyPage from "./GalaxyPage";

export function generateStaticParams() {
  return galaxyParams();
}

export default function Page() {
  return <GalaxyPage />;
}
