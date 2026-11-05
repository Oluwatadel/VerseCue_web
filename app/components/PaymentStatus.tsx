export const paymentStatuses:Record<string,{label:string;detail:string;style:string}>={
 test:{label:'Test payment verified',detail:'Sandbox payment only. No real money was charged and no live AI access was activated.',style:'text-violet-200 bg-violet-400/10'},
 paid:{label:'Payment verified',detail:'Payment was confirmed. AI access follows your current licence or organisation settings.',style:'text-emerald-200 bg-emerald-400/10'},
 review:{label:'Support review needed',detail:'Payment was received, but a computer-count change needs review before access can be updated.',style:'text-amber-200 bg-amber-400/10'},
 refunded:{label:'Refund processed',detail:'This payment no longer provides AI access. Your free tools remain available.',style:'text-slate-200 bg-white/10'},
 disputed:{label:'Payment disputed',detail:'Access associated with this payment is suspended. Contact support if you need help.',style:'text-red-200 bg-red-400/10'},
 pending:{label:'Awaiting confirmation',detail:'AI activates only after payment is verified. A pending checkout does not confirm that you have paid.',style:'text-amber-200 bg-amber-400/10'},
 expired:{label:'Checkout expired',detail:'If you already paid, check payment status. Otherwise choose a plan to start again.',style:'text-slate-200 bg-white/10'}
};
export function PaymentStatus({status}:{status:string}){const value=paymentStatuses[status]||{label:status,style:'text-slate-200 bg-white/10'};return <span className={'inline-flex rounded-full px-3 py-1 text-xs font-semibold '+value.style}>{value.label}</span>;}
