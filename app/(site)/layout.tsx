import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <><a href="#main-content" className="skip-link">Skip to content</a><Navbar /><main id="main-content">{children}</main><Footer /></>;
}
