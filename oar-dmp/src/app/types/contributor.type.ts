import { Person } from "./person.type";

export interface Contributor {
  contributor: Person;
  institution:string;
  e_mail:string;
  role: string;
}
