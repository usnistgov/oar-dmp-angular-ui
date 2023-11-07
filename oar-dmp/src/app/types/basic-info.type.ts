import { Funding } from "./funding.type";
import { NistOrganization } from "./nist-organization";
export interface BasicInfo {
  title: string;
  startDate: string;
  endDate: string;
  dmpSearchable: string;
  funding: Funding;
  projectDescription: string;
  organizations: Array<NistOrganization>;
}
