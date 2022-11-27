import { Contributor } from "./contributor.type";
import { Person } from "./person.type";
export interface Personel {
  primary_NIST_contact: Person;
  nistReviewer: Person;
  contributors: Array<Contributor>;
}

