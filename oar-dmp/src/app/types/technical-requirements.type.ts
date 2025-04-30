
import { SoftwareDevelopment } from "./software-development.type";
import { Instrument } from "./instrument.type";
export interface TechnicalRequirements {
    dataSize: any;
    sizeUnit: string;
    dataSizeDescription: string;
    softwareDevelopment: SoftwareDevelopment;
    technicalResources: Array<string>;
    instruments:Array<Instrument>;
}
