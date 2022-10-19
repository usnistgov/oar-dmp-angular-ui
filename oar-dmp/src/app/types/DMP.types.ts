import { BasicInfo } from "./basic-info.type";
import { EthicalIssues } from "./ethical-issues.type";
import { DataDescription } from "./data-description.type";
export interface DMP_Meta extends BasicInfo, EthicalIssues, DataDescription{
  keyWords: Array<string>;
  
}