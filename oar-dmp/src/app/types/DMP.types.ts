import { BasicInfo } from "./basic-info.type";
import { Keywords } from "./keywords.type";
import { EthicalIssues } from "./ethical-issues.type";
import { DataDescription } from "./data-description.type";
export interface DMP_Meta extends BasicInfo, Keywords, EthicalIssues, DataDescription{
  
}