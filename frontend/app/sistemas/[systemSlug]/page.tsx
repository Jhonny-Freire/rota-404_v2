import { systemParams } from "@/lib/staticParams";
import SystemPage from "./SystemPage";

export function generateStaticParams() {
  return systemParams();
}

export default function Page() {
  return <SystemPage />;
}
