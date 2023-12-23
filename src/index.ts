import { v4 as uuidv4 } from "uuid";
import { bool, Canister, ic, nat64, Opt, Principal, query, Record, Result, StableBTreeMap, text, update, Vec } from 'azle';

const license = Record({
    id: text,
    name: text,
    serialNumber: text,
    expired: Opt(nat64),
    isUsed: bool,
    createdAt: nat64,
});

const software = Record({
    id: text,
    name: text,
    principal: Principal,
    licenses: Vec(license),
    createdAt: nat64,
});

const licensePayload = Record({
    softwareId: text,
    name: text,
    serialNumber: text,
    expired: Opt(nat64),
});

const redeemSoftwareLicensePayload = Record({
    softwareId: text,
    serialNumber: text,
});

const checkLicensePayload = Record({
    softwareId: text,
    serialNumber: text,
});

type Software = typeof software.tsType;
type License = typeof license.tsType;

let softwareStore = StableBTreeMap<text, Software>(2);

export default Canister({
    getSoftwares: query([], Result(Vec(software), text), () => {
        const softwares = softwareStore.values();
        if(softwares.length == 0) {
            return Result.Err("Software is empty");
        }

        return Result.Ok(softwares);
    }),

    getLicenseBySoftware: query([text], Result(Vec(license), text), (softwareId) => {
        const softwareOpt = softwareStore.get(softwareId);

        if ('None' in softwareOpt) {
            return Result.Err("Software not found.");
        }

        const software = softwareOpt.Some;

        if(software.licenses.length == 0) {
            return Result.Err("License is empty.");
        }

        return Result.Ok(software.licenses);
    }),

    createSoftware: update([text], Result(software, text), (name) => {
        try {
            const softwareId = uuidv4();
            const newSoftware: Software = {
                id: softwareId,
                name: name,
                principal: ic.caller(),
                licenses: [],
                createdAt: ic.time(),
            };

              softwareStore.insert(softwareId, newSoftware);
              return Result.Ok(newSoftware);
        } catch(err) {
            return Result.Err("Error While registering license [" + err +"]");
        }
    }),

    createLicense: update([licensePayload], Result(license, text), (payload) => {
        try {
            // Check if software is exist
            const softwareOpt = softwareStore.get(payload.softwareId);

            if ('None' in softwareOpt) {
                return Result.Err("Software not found.");
            }

            const software = softwareOpt.Some;

            // Check if caller is principal of software
            if(ic.caller().toString() !== software.principal.toString()) {
                return Result.Err("You dont have permission to this software license");
            }
            
            // Check if license is duplicate
            const duplicatedLicense = software.licenses.find((license) => license.serialNumber === payload.serialNumber);
            if(duplicatedLicense) {
                return Result.Err("Your license serial number already created before");
            }

            const newLicense: License = {
                id: uuidv4(),
                name: payload.name,
                serialNumber: payload.serialNumber,
                expired: payload.expired,
                isUsed: false,
                createdAt: ic.time(),
            };

            const newSoftware: Software = {
                ...software,
                licenses: [...software.licenses, newLicense],
            }
            
            softwareStore.insert(newSoftware.id, newSoftware);
            return Result.Ok(newLicense);
        } catch(err) {
            return Result.Err("Error While registering license [" + err +"]");
        }
    }),

    redeemSoftwareLicense: update([redeemSoftwareLicensePayload], Result(license, text), (payload) => {
        // Check if software is exist
        const softwareOpt = softwareStore.get(payload.softwareId);

        if ('None' in softwareOpt) {
            return Result.Err("Software not found.");
        }

        const software = softwareOpt.Some;

        // Check if license is valid
        const license = software.licenses.find((license) => license.serialNumber === payload.serialNumber);
        if(license && !license.isUsed) {

            const newLicense: License = {
                ...license,
                isUsed: true,
            }

            const newSoftware: Software = {
                ...software,
                licenses: [...software.licenses, newLicense],
            }

            softwareStore.insert(newSoftware.id, newSoftware);
            return Result.Ok(newLicense);
        }

        return Result.Err(`Serial number is invalid on ${software.name}`);
    }),

    checkLicense: query([checkLicensePayload], Result(bool, text), (payload) => {
        // Check if software is exist
        const softwareOpt = softwareStore.get(payload.softwareId);

        if ('None' in softwareOpt) {
            return Result.Err("Software not found.");
        }

        const software = softwareOpt.Some;

        // Check if license is exists
        const license = software.licenses.find((license) => license.serialNumber === payload.serialNumber);
        if(!license) {
            return Result.Ok(false);
        }

        // Check if license is already expired or valid
        if('None' in license.expired) {
            return Result.Ok(true);
        } else {
            return Result.Ok(false);
        }
    }),

});

