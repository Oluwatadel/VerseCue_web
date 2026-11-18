export function supportNotificationEmail(){
 const email=process.env.SUPPORT_NOTIFICATION_EMAIL?.trim()||'';
 return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)&&email.length<=254?email:null;
}
