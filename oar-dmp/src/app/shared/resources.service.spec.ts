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
    
    service.setSoftwareMessage("A Message");
    expect(service.softwareMessage).toBe("A Message");

    service.setDatabaseMessage("A Message");
    expect(service.databaseMessage).toBe("A Message");

    service.setWebsiteMessage("A Message");
    expect(service.websiteMessage).toBe("A Message");

    service.setDataCategories(true);
    expect(service.dataCategoriesIsSet).toBe(true);

    
  });
});
