import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Waitlist from "./components/Waitlist";
import Support from "./components/Support";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Waitlist />
        <Support />
      </main>
      <Footer />
    </>
  );
}
