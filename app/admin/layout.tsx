import type {Metadata} from 'next';
import WorkspacePwa from '../components/WorkspacePwa';
export const metadata:Metadata={title:'verseVIO Admin',manifest:'/pwa/admin.webmanifest',robots:{index:false,follow:false},appleWebApp:{capable:true,title:'verseVIO Admin',statusBarStyle:'default'},icons:{apple:'/pwa/icon-180.png'}};
import AdminShell from "./components/AdminShell";
export default function AdminLayout({children}:{children:React.ReactNode}){return <AdminShell><WorkspacePwa kind="admin"/>{children}</AdminShell>;}
