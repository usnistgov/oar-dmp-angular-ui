import { TestBed } from '@angular/core/testing';

import { ResourcesService } from './resources.service';

describe('ResourcesService', () => {
  let service: ResourcesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResourcesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('set Messages', () => {

    service.setStorageMessage("A Message");
    expect(service.storageMessage).toBe("A Message");

    service.setDataCategories(true);
    expect(service.dataCategoriesIsSet).toBe(true);

  });
});