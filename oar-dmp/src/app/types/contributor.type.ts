import { Person } from "./person.type";

export interface Contributor {
  contributor: Person;
  instituion:string;
  e_mail:string;
  role: string;
}
