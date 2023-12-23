// index.ts
import { v4 as uuidv4 } from 'uuid';
import { Canister, ic, Opt, Principal, query, Record, StableBTreeMap, text, update, Vec } from 'azle';
import { License, LicenseId, LicensePayload } from './types';

let licenses = StableBTreeMap<LicenseId, License>(0);

export default Canister({
    // Get All Licenses
    getLicenses: query([], Vec(License), () => {
        return licenses.values();
    }),

    // Get License by ID
    getLicense: query([LicenseId], Opt(License), (id) => {
        return licenses.get(id);
    }),

    // Create License
    createLicense: update([Principal, LicensePayload], Opt(License), (principal, payload) => {
        const newLicense: License = {
            licenseId: uuidv4(), // Renamed to licenseId for consistency
            name: payload.name,
            type: payload.type,
            expired: payload.expired,
            principal: principal,
            createdAt: ic.time(),
        };

        licenses.insert(newLicense.licenseId, newLicense);
        return newLicense;
    }),
});
