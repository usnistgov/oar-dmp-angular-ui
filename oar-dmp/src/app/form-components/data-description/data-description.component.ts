import { Component, Input, Output, OnInit } from '@angular/core';
//resources service to talk between two components
import { ResourcesService } from '../../shared/resources.service';
import { UntypedFormBuilder } from '@angular/forms';
import { defer, map, of, startWith } from 'rxjs';
import { DMP_Meta } from '../../types/DMP.types';
import { DataCategories } from '../../types/data-categories.type';

@Component({
  selector: 'app-data-description',
  templateUrl: './data-description.component.html',
  styleUrls: ['../form-layout.scss', './data-description.component.scss']
})
export class DataDescriptionComponent implements OnInit {

  pyramid: string = 'assets/images/pyramid.png'
  alttext: string = "Pyramid View of Data Categories"

  // WARNING: the template (data-description.component.html) binds each checkbox
  // by fixed array position — availableCategories[0]..[3] — not by `id`. The
  // order and length of this array are therefore load-bearing: reordering,
  // inserting, or removing an entry will silently rebind checkboxes to the
  // wrong category without any compile-time or runtime error. If you change
  // this array, update the positional [n] references in the HTML to match.
  // (`id` is not used in logic or templates; matching is done by `name`.)
  availableCategories: DataCategories[] = [
    { id: 0, name: 'Published Results and SRD' },
    { id: 2, name: 'Publishable' },
    { id: 3, name: 'Working' },
    { id: 4, name: 'Derived' },
  ]

  initialCategories: string[] = [];

  dataDescriptionForm = this.fb.group({
    dataDescription: [''],
    dataCategories: [[] as string[]]
  });

  @Input()
  set initialDMP_Meta(data_description: DMP_Meta) {
    // Parent always supplies a fully-shaped object (getBlankDmp() overlaid with
    // loaded data), and the children aren't instantiated until initialDMP is set
    // (*ngIf="initialDMP" on the parent form).
    this.initialCategories = data_description.dataCategories ?? [];

    this.dataDescriptionForm.patchValue(
      {
        dataDescription: data_description.dataDescription,
        dataCategories: data_description.dataCategories ?? []
      }
    );
  }

  @Output()
  valueChange = defer(() =>
    this.dataDescriptionForm.valueChanges.pipe(
      startWith(this.dataDescriptionForm.value),
      map(
        (formValue): Partial<DMP_Meta> => ({
          dataDescription: formValue.dataDescription,
          dataCategories: formValue.dataCategories ?? [],
        })
      )
    )
  );

  @Output()
  formReady = of(this.dataDescriptionForm);

  constructor(
    //resources service to talk between two components
    // (DataDescriptionComponent and ResourceOptionsComponent)
    private sharedService: ResourcesService,
    private fb: UntypedFormBuilder
  ) {
    // console.log("Data Description Component");
  }

  resetCheckboxes() {
    // Uncheck everything: clears the control and notifies the Storage panel.
    for (const category of this.availableCategories) {
      this.setStorageTier(category.name, false);
    }
  }

  ngOnInit(): void {
    for (const category of this.initialCategories) {
      // Fire off events to check selected checkboxes in Data Description part of the form
      // and send message to highlight correct options in the Storage panel
      this.setStorageTier(category, true);
    }
  }

  /**
   * Adds/removes a category on the form control (the single source of truth),
   * then recomputes the storage tier from the resulting selection and fires
   * the appropriate messages to the resource-options component.
   * @param category
   * @param checked
   */
  setStorageTier(category: string, checked: boolean): void {
    // Update the form control array (single source of truth)
    const current = this.dataDescriptionForm.value['dataCategories'] as string[] ?? [];
    const next = checked
      ? (current.includes(category) ? current : [...current, category])
      : current.filter(v => v !== category);
    this.dataDescriptionForm.patchValue({ dataCategories: next });

    // Compute storage tier from the current selection
    const storageTier = this.computeStorageTier(next);

    this.sharedService.setStorageMessage(storageTier);
    this.sharedService.storageSubject$.next(storageTier);

    // Data-category selections take precedence over the estimated-data-size
    // option in technical requirements. Tell that module whether any category
    // is set so it knows whether to drive the storage highlight itself.
    const anySelected = storageTier !== "";
    this.sharedService.setDataCategories(anySelected);
    this.sharedService.dataCategories$.next(anySelected);
  }

  /**
   * Determines the storage tier for a set of selected categories.
   * Highest tier present wins (top > mid > low).
   */
  private computeStorageTier(categories: string[]): string {
    const top = ['Published Results and SRD'];
    const mid = ['Publishable'];
    const low = ['Working', 'Derived'];

    if (categories.some(c => top.includes(c))) return 'top';
    if (categories.some(c => mid.includes(c))) return 'mid';
    if (categories.some(c => low.includes(c))) return 'low';
    return '';
  }

  /** Checkbox display state, derived from the form control. */
  isCategorySelected(category: string): boolean {
    return (this.dataDescriptionForm.value['dataCategories'] as string[] ?? []).includes(category);
  }

  dataCategoryChange(e: any) {
    // setStorageTier now owns both the form update and the resource messaging.
    this.setStorageTier(e.target.defaultValue, e.target.checked);
  }

}