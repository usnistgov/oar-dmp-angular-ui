import { Funding } from "./funding.type";
export interface BasicInfo {
  title: string;
  startDate: string;
  dmpSearchable: string;
  funding: Funding;
  projectDescription: string;
}
