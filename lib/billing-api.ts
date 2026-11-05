import {licensingDb} from "./licensing-db";
import {LicensingService,issuerConfig} from "./licensing-service";
import {BillingService} from "./billing-service";
export function billing(){const db=licensingDb();return new BillingService(db,new LicensingService(db,issuerConfig()));}
