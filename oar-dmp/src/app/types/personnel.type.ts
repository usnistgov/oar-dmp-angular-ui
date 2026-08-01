import { Contributor } from "./contributor.type";
import { ResponsibleOrganizations } from "./responsible-organizations.type";
export interface Personel {
  contributors: Array<Contributor>;
  organizations: Array<ResponsibleOrganizations>;
}

