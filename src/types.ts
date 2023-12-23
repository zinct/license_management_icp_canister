import { nat64, Opt, Principal, Record, text } from 'azle';

// Define License ID and License Record
export const LicenseId = text;

export const License = Record({
    id: LicenseId,
    name: text,
    type: text,
    principal: Principal,
    expired: Opt(nat64),
    createdAt: nat64,
});

export const LicensePayload = Record({
    name: text,
    type: text,
    principal: Principal,
    expired: Opt(nat64),
});

export type License = typeof License.tsType;
export type LicenseId = typeof LicenseId.tsType;