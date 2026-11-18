import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {installationReport,installationReportError} from '../lib/installation-report';
import {LicenseError} from '../lib/licensing-security';
import {recordInstallation} from '../lib/installation-analytics';
import type {LicensingDb,Statement} from '../lib/licensing-db';
async function main(){const pg=new PGlite();try{for(const file of (await readdir('db')).filter(f=>/^\d+.*\.sql$/.test(f)).sort())await pg.exec(await readFile('db/'+file,'utf8'));const db:LicensingDb={query:async(text,values=[]) => (await pg.query(text,values)).rows as any[],transaction:async(statements:Statement[])=>pg.transaction(async tx=>{const rows=[];for(const s of statements)rows.push((await tx.query(s.text,s.values||[])).rows as any[]);return rows;})};
 const now=Math.floor(Date.now()/1000),event={id:'i1-'+'a'.repeat(32),platform:'windows',version:'1.0.0',tier:'free',minute:now-now%60,seconds:50};await recordInstallation(db,event);await recordInstallation(db,{...event,seconds:10});assert.equal((await db.query('SELECT * FROM vc_installations')).length,1);assert.equal((await db.query('SELECT sum(running_seconds) AS seconds FROM vc_installation_usage'))[0].seconds,50);
 await recordInstallation(db,{...event,tier:'paid',seconds:60});assert.equal((await db.query('SELECT reported_tier FROM vc_installations'))[0].reported_tier,'paid');assert.equal((await db.query('SELECT running_seconds FROM vc_installation_usage'))[0].running_seconds,60);
 for(const change of [{id:'email@example.com'},{platform:'unknown'},{seconds:61},{minute:1},{tier:'unlimited'},{version:'invalid'}])await assert.rejects(()=>recordInstallation(db,{...event,...change}));
 const report=await installationReport(db,{platform:'windows'});assert.equal(report.items.length,1);assert.doesNotThrow(()=>JSON.stringify(report));assert.equal(report.downloads.length,0);assert.equal((await installationReport(db,{platform:'android'})).items.length,0);
 await assert.rejects(()=>installationReport(db,{from:'2026-02-30'}),e=>e instanceof LicenseError&&e.status===400);await assert.rejects(()=>installationReport(db,{from:'2026-11-20',to:'2026-11-01'}),e=>e instanceof LicenseError&&e.status===400);await assert.rejects(()=>installationReport(db,{platform:'invalid'}),e=>e instanceof LicenseError&&e.status===400);
 assert.match(installationReportError({code:'42P01'}).message,/migration 017/);assert.match(installationReportError({cause:{code:'42703'}}).message,/migration 017/);assert.match(installationReportError({code:'42501'}).message,/permissions/);assert.ok(!installationReportError({message:'secret database URL'}).message.includes('secret'));
 await pg.exec('DROP TABLE vc_installation_usage');await assert.rejects(()=>installationReport(db,{}),e=>e instanceof LicenseError&&e.message.includes('migration 017'));console.log('PASS installation report: real SQL, platform/date validation and safe missing-schema/permissions diagnostics.');
 console.log('PASS installation counters: anonymous startup, per-minute idempotency, tier updates and invalid payload rejection. No content is collected.');}finally{await pg.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
