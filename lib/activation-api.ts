import {licensingDb} from './licensing-db';
import {LicensingService,issuerConfig} from './licensing-service';
import {ActivationDelivery} from './activation-delivery';
export function activationDelivery(){const db=licensingDb();return new ActivationDelivery(db,new LicensingService(db,issuerConfig()));}
