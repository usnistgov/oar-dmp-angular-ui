import { Person } from "./person.type";

export interface Contributor extends Person{
  primary_contact:string;
  institution:string;
  role: string;
}
