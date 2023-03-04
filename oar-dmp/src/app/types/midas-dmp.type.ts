import { DMP_Meta } from "./DMP.types";
export interface MIDASDMP {
  status:{
    state:string,
    since:string,
    modified:string,
    action:string,
    message:string
  }
  data: DMP_Meta
}

