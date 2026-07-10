import { FilterPipe } from './filter.pipe';

describe('FilterPipe', () => {
  let pipe: FilterPipe;

  beforeEach(() => {
    pipe = new FilterPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('null/undefined guards', () => {
    it('should return false when item is null', () => {
      expect(pipe.transform(null, { storageSelection: 'GB' })).toBe(false);
    });

    it('should return false when item is undefined', () => {
      expect(pipe.transform(undefined, { storageSelection: 'GB' })).toBe(false);
    });

    it('should return false when message is null', () => {
      expect(pipe.transform({ storageSelection: ['GB', 'TB'] }, null)).toBe(false);
    });

    it('should return false when message is undefined', () => {
      expect(pipe.transform({ storageSelection: ['GB', 'TB'] }, undefined)).toBe(false);
    });

    it('should return false when both item and message are null', () => {
      expect(pipe.transform(null, null)).toBe(false);
    });
  });

  describe('item shape validation', () => {
    it('should return false when item has zero keys', () => {
      expect(pipe.transform({}, { storageSelection: 'GB' })).toBe(false);
    });

    it('should return false when item has more than one key', () => {
      expect(
        pipe.transform(
          { storageSelection: ['GB', 'TB'], softwareSelection: ['internal'] },
          { storageSelection: 'GB' }
        )
      ).toBe(false);
    });
  });

  describe('selection matching', () => {
    it('should return false when there is no current selection for the dimension (key absent)', () => {
      expect(pipe.transform({ storageSelection: ['GB', 'TB'] }, { softwareSelection: 'internal' })).toBe(false);
    });

    it('should return false when the current selection is an empty string', () => {
      expect(pipe.transform({ storageSelection: ['GB', 'TB'] }, { storageSelection: '' })).toBe(false);
    });

    it('should return true when the selection exactly matches one of the options (case-sensitive input)', () => {
      expect(pipe.transform({ storageSelection: ['GB', 'TB'] }, { storageSelection: 'GB' })).toBe(true);
    });

    it('should return true when the selection matches case-insensitively', () => {
      expect(pipe.transform({ storageSelection: ['GB', 'TB'] }, { storageSelection: 'gb' })).toBe(true);
    });

    it('should return true when the option is uppercase but the selection is lowercase', () => {
      expect(pipe.transform({ softwareSelection: ['Internal', 'External'] }, { softwareSelection: 'internal' })).toBe(true);
    });

    it('should return true when the selection is a substring of an option', () => {
      expect(pipe.transform({ softwareSelection: ['InternalTool'] }, { softwareSelection: 'tool' })).toBe(true);
    });

    it('should return false when the selection does not match any option', () => {
      expect(pipe.transform({ storageSelection: ['GB', 'TB'] }, { storageSelection: 'PB' })).toBe(false);
    });

    it('should return false when options array is empty', () => {
      expect(pipe.transform({ storageSelection: [] }, { storageSelection: 'GB' })).toBe(false);
    });

    it('should treat item[k] as an empty array when it is null or undefined', () => {
      expect(pipe.transform({ storageSelection: null as unknown as string[] }, { storageSelection: 'GB' })).toBe(false);
    });

    it('should ignore unrelated keys in message and only check the dimension named in item', () => {
      expect(
        pipe.transform(
          { storageSelection: ['GB', 'TB'] },
          { storageSelection: 'GB', softwareSelection: 'internal' }
        )
      ).toBe(true);
    });

    it('should return true on partial match anywhere within the option string', () => {
      expect(pipe.transform({ storageSelection: ['Multi-TB'] }, { storageSelection: 'tb' })).toBe(true);
    });
  });
});