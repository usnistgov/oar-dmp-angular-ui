import { Person } from "./person.type";

export interface Contributor extends Person{
  institution:string;
  role: string;
}
