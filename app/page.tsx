import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Waitlist from "./components/Waitlist";
import Support from "./components/Support";
import Footer from "./components/Footer";
import VideoShowcase from "./components/VideoShowcase";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <VideoShowcase />
        <Features />
        <HowItWorks />
        <Waitlist />
        <Support />
      </main>
      <Footer />
    </>
  );
}
