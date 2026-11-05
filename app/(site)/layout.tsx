import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SiteChrome from '../components/SiteChrome';
export default function SiteLayout({children}:{children:React.ReactNode}){return <SiteChrome navigation={<Navbar/>} footer={<Footer/>}>{children}</SiteChrome>;}
