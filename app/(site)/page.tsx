import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import Support from "../components/Support";
import DesktopWorkspace from "../components/DesktopWorkspace";

export default function Home() {
  return <><Hero /><DesktopWorkspace /><Features compact /><HowItWorks /><Support /></>;
}
