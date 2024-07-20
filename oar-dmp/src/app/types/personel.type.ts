import { Contributor } from "./contributor.type";
import { Person } from "./person.type";
import { ResponsibleOrganizations } from "./responsible-organizations.type";
export interface Personel {
  primary_NIST_contact: Person;
  // NIST_DMP_Reviewer: Person;
  contributors: Array<Contributor>;
  organizations: Array<ResponsibleOrganizations>;
}

