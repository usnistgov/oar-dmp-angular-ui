import { TestBed } from '@angular/core/testing';

import { ChipsSplitterService } from './chips-splitter.service';

describe('ChipsSplitterService', () => {
  let service: ChipsSplitterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChipsSplitterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('splitChips', () => {
    it('splits on commas', () => {
      expect(service.splitChips('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('splits on semicolons', () => {
      expect(service.splitChips('a;b;c')).toEqual(['a', 'b', 'c']);
    });

    it('splits on a mix of commas and semicolons', () => {
      expect(service.splitChips('a,b;c')).toEqual(['a', 'b', 'c']);
    });

    it('does NOT trim surrounding whitespace (caller is responsible)', () => {
      // The service only splits; components trim/filter the results.
      expect(service.splitChips('a, b ; c')).toEqual(['a', ' b ', ' c']);
    });

    it('returns a single-element array when there is no separator', () => {
      expect(service.splitChips('solo')).toEqual(['solo']);
    });

    it('returns an array with one empty string for an empty input', () => {
      expect(service.splitChips('')).toEqual(['']);
    });

    it('produces empty-string elements for consecutive separators', () => {
      expect(service.splitChips('a,,b')).toEqual(['a', '', 'b']);
    });

    it('produces empty-string elements for adjacent mixed separators', () => {
      expect(service.splitChips('a,;b')).toEqual(['a', '', 'b']);
    });

    it('produces a leading empty string when input starts with a separator', () => {
      expect(service.splitChips(',a')).toEqual(['', 'a']);
    });

    it('produces a trailing empty string when input ends with a separator', () => {
      expect(service.splitChips('a,')).toEqual(['a', '']);
    });

    it('does not split on any character other than comma or semicolon', () => {
      expect(service.splitChips('a|b:c d')).toEqual(['a|b:c d']);
    });

    it('accepts a String object as well as a primitive string', () => {
      // The signature types the parameter as `String`; confirm boxed input works.
      // eslint-disable-next-line no-new-wrappers
      expect(service.splitChips(new String('a,b') as string)).toEqual(['a', 'b']);
    });
  });
});