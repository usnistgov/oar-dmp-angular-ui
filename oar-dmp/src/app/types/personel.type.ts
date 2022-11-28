import { Contributor } from "./contributor.type";
import { Person } from "./person.type";
export interface Personel {
  primary_NIST_contact: Person;
  NIST_DMP_Reviewer: Person;
  contributors: Array<Contributor>;
}

