import { TestBed } from '@angular/core/testing';
import { DropDownSelectService } from './drop-down-select.service';

describe('DropDownSelectService', () => {
  let service: DropDownSelectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DropDownSelectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDropDownText', () => {
    const items = [
      { id: 'GB', label: 'Gigabyte' },
      { id: 'TB', label: 'Terabyte' },
      { id: 'PB', label: 'Petabyte' }
    ];

    it('should return items whose id is a substring of the given id string', () => {
      const result = service.getDropDownText('GB', items);
      expect(result).toEqual([{ id: 'GB', label: 'Gigabyte' }]);
    });

    it('should return multiple items when their ids are all substrings of the given id string', () => {
      const result = service.getDropDownText('GBTB', items);
      expect(result).toEqual([
        { id: 'GB', label: 'Gigabyte' },
        { id: 'TB', label: 'Terabyte' }
      ]);
    });

    it('should return an empty array when no item id is a substring of the given id string', () => {
      const result = service.getDropDownText('XYZ', items);
      expect(result).toEqual([]);
    });

    it('should return an empty array when the object array is empty', () => {
      const result = service.getDropDownText('GB', []);
      expect(result).toEqual([]);
    });

    it('should return an empty array when the id argument is an empty string', () => {
      const result = service.getDropDownText('', items);
      expect(result).toEqual([]);
    });

    it('should treat matching as case-sensitive substring inclusion', () => {
      const result = service.getDropDownText('gb', items);
      expect(result).toEqual([]);
    });

    it('should match every item when each has an empty string id', () => {
      const emptyIdItems = [{ id: '', label: 'Unknown' }];
      const result = service.getDropDownText('anything', emptyIdItems);
      expect(result).toEqual([{ id: '', label: 'Unknown' }]);
    });
  });

  describe('getDropDownSelection', () => {
    const items = [
      { id: 1, label: 'One' },
      { id: 2, label: 'Two' },
      { id: 3, label: 'Three' }
    ];

    it('should return the item whose numeric id matches the numeric coercion of selID', () => {
      const result = service.getDropDownSelection('2', items);
      expect(result).toEqual([{ id: 2, label: 'Two' }]);
    });

    it('should return an empty array when selID does not match any item id', () => {
      const result = service.getDropDownSelection('99', items);
      expect(result).toEqual([]);
    });

    it('should return an empty array when selID is non-numeric', () => {
      const result = service.getDropDownSelection('abc', items);
      expect(result).toEqual([]);
    });

    it('should return an empty array when selID is an empty string', () => {
      const result = service.getDropDownSelection('', items);
      expect(result).toEqual([]);
    });

    it('should return an empty array when the object array is empty', () => {
      const result = service.getDropDownSelection('1', []);
      expect(result).toEqual([]);
    });

    it('should coerce numeric-looking strings with whitespace correctly', () => {
      const result = service.getDropDownSelection(' 3 ', items);
      expect(result).toEqual([{ id: 3, label: 'Three' }]);
    });

    it('should match zero correctly since Number("0") is falsy but numeric', () => {
      const zeroItems = [{ id: 0, label: 'Zero' }, { id: 1, label: 'One' }];
      const result = service.getDropDownSelection('0', zeroItems);
      expect(result).toEqual([{ id: 0, label: 'Zero' }]);
    });

    it('should return an empty array for selID values like "NaN" or "Infinity" that are not real matches', () => {
      expect(service.getDropDownSelection('NaN', items)).toEqual([]);
    });
  });
});