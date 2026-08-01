import { SoftwareDevelopment } from "./software-development.type";
import { Instrument } from "./instrument.type";
export interface TechnicalRequirements {
    // Carried as a numeric-looking string from the form's text input (validated
    // by Validators.pattern), or null for a blank/new record. Never stored as a
    // number — see selDataSize/setDataSize which trim() and parseFloat() it.
    dataSize: string | null;
    sizeUnit: string;
    dataSizeDescription: string;
    softwareDevelopment: SoftwareDevelopment;
    technicalResources: Array<string>;
    instruments:Array<Instrument>;
}