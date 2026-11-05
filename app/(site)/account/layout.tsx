import type {Metadata} from 'next';
import AccountShell from '../../components/AccountShell';
export const metadata:Metadata={robots:{index:false,follow:false}};
export default function AccountLayout({children}:{children:React.ReactNode}){return <AccountShell>{children}</AccountShell>;}
