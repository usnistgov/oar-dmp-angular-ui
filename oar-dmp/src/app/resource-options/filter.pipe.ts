import { Pipe, PipeTransform } from '@angular/core';

/**
 * Decides whether a resource-grid cell should be highlighted for the current
 * selection.
 *
 * @param item    A single-key object from nist-resources.json describing which
 *                selection values light up this cell, e.g.
 *                { storageSelection: ['GB', 'TB'] }. The key names a selection
 *                dimension; the value lists the matching options.
 * @param message The component's current selections keyed by the same names,
 *                e.g. { storageSelection: 'GB', softwareSelection: 'internal' }.
 *
 * Returns true when the current selection for `item`'s key is a case-insensitive
 * substring of any option in `item`'s value array.
 */
@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(
    item: Record<string, string[]> | null | undefined,
    message: Record<string, string> | null | undefined
  ): boolean {
    if (!item) {
      return false;
    }
    if (!message) {
      return false;
    }
    // The item object must always describe exactly one selection dimension.
    if (Object.keys(item).length !== 1) {
      return false;
    }

    for (const k of Object.keys(item)) {
      const selection = message[k];
      // No current selection for this dimension (empty or key absent): no match.
      if (!selection) {
        return false;
      }

      const needle = selection.toLocaleLowerCase();
      const options = item[k] ?? [];

      const matched = options.some(
        (option) => option.toLocaleLowerCase().includes(needle)
      );

      if (matched) {
        return true;
      }
    }

    return false;
  }

}