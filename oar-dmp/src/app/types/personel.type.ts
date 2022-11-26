import { Contributor } from "./contributor.type";
import { Person } from "./person.type";
export interface Personel {
  nistContact: Person;
  nistReviewer: Person;
  contributors: Array<Contributor>;
}

