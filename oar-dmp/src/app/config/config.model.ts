export interface Configuration {
  /**
   * PDRDMP is link for the DBIO interface on deployment server
   */
  PDRDMP: string;

  /**
   * other parameters are allowed
   */
  [paramName: string]: any;
}