// Used to send messages between personnel component and dmp-form comonent
// the interface carries omessage that indicates whether a NIST contributor's metadata
// has been changed since the last view/update of a DMP record
export interface UpdateIndicator {
  numUpdates: number;
  isUpdated: boolean;
}
