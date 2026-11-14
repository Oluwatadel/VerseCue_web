import {api} from '../../../../lib/licensing-api';
import {LicenseError} from '../../../../lib/licensing-security';
export async function POST(){return api(async()=>{throw new LicenseError(410,'Activation codes are no longer used. Open the signed-in desktop app and choose Check activation now.');});}
