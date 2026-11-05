"use client";
import {usePathname} from 'next/navigation';
import {isAccountWorkspace} from '../../lib/account-routes';
export default function SiteChrome({children,navigation,footer}:{children:React.ReactNode;navigation:React.ReactNode;footer:React.ReactNode}){const dashboard=isAccountWorkspace(usePathname());return <><a href={dashboard?'#account-content':'#main-content'} className="skip-link">Skip to content</a>{!dashboard&&navigation}<main id="main-content">{children}</main>{!dashboard&&footer}</>;}
