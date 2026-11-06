export function emailRejection(status:number,body:unknown){
 const error=body as {name?:unknown;message?:unknown}|null,name=typeof error?.name==='string'?error.name.toLowerCase():'',message=typeof error?.message==='string'?error.message.toLowerCase():'';
 const prefix='Resend HTTP '+status+': ';
 if(message.includes('only send testing emails'))return prefix+'Resend test-sender restriction. Verify your own domain and set EMAIL_FROM to an address on that domain to email other recipients.';
 if(message.includes('domain')&&(message.includes('not verified')||message.includes('verify your domain')))return prefix+'The EMAIL_FROM domain is not verified in Resend. Verify it in the same Resend account as your API key.';
 if(status===401||name==='missing_api_key')return prefix+'RESEND_API_KEY is missing, invalid or inactive. Check the key on the deployed website.';
 if(name==='suspended_api_key')return prefix+'This Resend API key is suspended. Check your Resend account.';
 if(name==='restricted_api_key'||name==='invalid_permission')return prefix+'The API key is inactive or lacks sending permission for this sender domain. Check its scope and domain restriction.';
 if(name==='daily_quota_exceeded'||message.includes('daily')&&message.includes('quota'))return prefix+'Daily sending quota exceeded. Wait for the quota to reset, then retry.';
 if(name==='monthly_quota_exceeded'||message.includes('monthly')&&message.includes('quota'))return prefix+'Monthly sending quota exceeded. Review your Resend usage limit.';
 if(status===429)return prefix+'Resend rate limit or sending quota reached. Retry later and review usage in Resend.';
 if(status===409)return prefix+'A matching delivery is already processing or this idempotency key has a different payload. Inspect Resend logs before retrying.';
 if(status===403)return prefix+'Resend refused this sender or recipient. Check domain verification, API-key restrictions and test-sender rules.';
 if(status===400||status===422)return prefix+'Resend rejected the email format. Check EMAIL_FROM, recipient and reply-to settings.';
 if(status>=500)return prefix+'Resend is temporarily unavailable. The message remains queued for retry.';
 return prefix+'Email request rejected. Check the corresponding request in Resend logs.';
}
