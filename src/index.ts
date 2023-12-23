import { v4 as uuidv4 } from "uuid";
import { Canister, Err, ic, nat, nat64, Ok, Opt, Principal, query, Record, Result, StableBTreeMap, text, update, Vec, Void } from 'azle';
import { License, LicenseId, LicensePayload } from './types';

let licenses = StableBTreeMap<LicenseId, License>(0);

export default Canister({

    // Get All License
    getLicenses: query([], Vec(License), () => {
        return licenses.values();
    }),

    // Get License by ID
    getLicense: query([LicenseId], Opt(License), (id) => {
        return licenses.get(id);
    }),

    // Create License
    createLicense: update([Principal, LicensePayload], License, (principal, payload) => {
        const newLicense: License = {
            id: uuidv4(),
            name: payload.name,
            type: payload.type,
            expired: payload.expired,
            principal: principal,
            createdAt: ic.time(),
          };

          licenses.insert(newLicense.id, newLicense);
          return newLicense;
    }),
});

