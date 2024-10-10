import { TestBed } from '@angular/core/testing';

import { DropDownSelectService } from './drop-down-select.service';
import { ROLES } from '../types/contributor-roles'

describe('DropDownSelectService', () => {
  let service: DropDownSelectService;
  let mockRoles = ROLES;
  let dataUnits =[    
    {
      id: "1",
      size: 'MB'
    },
    {
      id: "2",
      size: 'GB'
    },
    {
      id: "3",
      size: 'TB'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DropDownSelectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });  

  it('get drop down selection', () => {
    let el = service.getDropDownSelection("2", mockRoles)
    expect(el).toStrictEqual([{id:2, role:"DataCollector", value:"Data Collector"}]);
  });

  it('get drop down text', () => {
    let el = service.getDropDownText("1", dataUnits)
    expect(el).toStrictEqual([{id:"1", size: "MB"}]);
  });
});
