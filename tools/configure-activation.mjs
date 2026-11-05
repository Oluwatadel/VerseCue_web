import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createPrivateKey,createPublicKey} from "node:crypto";
const root=fileURLToPath(new URL("../",import.meta.url));
try {
 const directory=resolve(root,process.argv[2]||"../VerseCue/.security/production");
 const privatePem=readFileSync(resolve(directory,"activation-private.pem"),"utf8");
 const publicPem=readFileSync(resolve(directory,"activation-public.pem"),"utf8");
 const model=JSON.parse(readFileSync(resolve(directory,"model-key.json"),"utf8"));
 const key=createPrivateKey(privatePem);
 if(key.asymmetricKeyType!=="rsa"||key.asymmetricKeyDetails.modulusLength<2048)throw new Error();
 const publicDer=createPublicKey(key).export({type:"spki",format:"der"});
 if(!publicDer.equals(createPublicKey(publicPem).export({type:"spki",format:"der"})))throw new Error();
 if(Buffer.from(model.key||"","base64").length!==32||!/^[a-zA-Z0-9._-]{1,100}$/.test(model.keyId||""))throw new Error();
 const file=resolve(root,".env.local");
 if(existsSync(file))process.loadEnvFile(file);
 let existingKey=null;try{existingKey=createPrivateKey((process.env.ACTIVATION_PRIVATE_KEY_PEM||"").replace(/\\n/g,"\n"));}catch{}
 if(existingKey&&!publicDer.equals(createPublicKey(existingKey).export({type:"spki",format:"der"})))throw new Error("Existing signing key differs from these production files. No configuration was changed.");
 if(Buffer.from(process.env.MODEL_CONTENT_KEY_BASE64||"","base64").length===32&&process.env.MODEL_CONTENT_KEY_BASE64!==model.key)throw new Error("Existing model key differs from these production files. No configuration was changed.");
 let text=existsSync(file)?readFileSync(file,"utf8"):"";
 const values={ACTIVATION_PRIVATE_KEY_PEM:privatePem,MODEL_CONTENT_KEY_BASE64:model.key,MODEL_KEY_ID:model.keyId};
 for(const [name,value] of Object.entries(values)) {
  const pattern=new RegExp("^"+name+"=(?:\"(?:[^\"\\\\]|\\\\.)*\"|'[^']*'|[^\r\n]*)","gm");
  const line=name+"="+JSON.stringify(value);
  if(pattern.test(text)){pattern.lastIndex=0;text=text.replace(pattern,()=>line);}else text+=(text.endsWith("\n")?"":"\n")+line+"\n";
 }
 writeFileSync(file,text,{mode:0o600});
 console.log("Configured local AI signing using the existing production key files. No keys were generated or printed. Restart the website to load the settings.");
}catch(error){console.error(error.message?.startsWith("Existing ")?error.message:"Could not configure activation. Check that the production directory contains a matching RSA key pair and a valid model-key.json. No key values are printed.");process.exitCode=1;}
