import type {Metadata} from 'next';
import AccountShell from '../../components/AccountShell';
export const metadata:Metadata={robots:{index:false,follow:false},manifest:'/pwa/support.webmanifest',appleWebApp:{capable:true,title:'verseVIO Support',statusBarStyle:'default'},icons:{apple:'/pwa/icon-180.png'}};
export default function AccountLayout({children}:{children:React.ReactNode}){return <AccountShell>{children}</AccountShell>;}
