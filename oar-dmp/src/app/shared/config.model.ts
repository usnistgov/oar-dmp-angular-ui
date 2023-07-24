/*
 * See 
 * https://github.com/usnistgov/oar-lib-angular/blob/feature/common-config/libs/oarng/src/lib/config/README.md
 * for documentation explaining the role of this file.
 */
import { Configuration } from 'oarng';

export interface DMPConfiguration extends Configuration {

  /**
   * PDRDMP is link for the DBIO interface on deployment server
   */
  PDRDMP: string;

  /**
   * other parameters are allowed (as per the parent interface)
   */
}
