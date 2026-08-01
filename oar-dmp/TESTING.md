# Running Unit Tests (Jest)

This project uses [Jest](https://jestjs.io/) with [`jest-preset-angular`](https://github.com/thymikee/jest-preset-angular) for unit testing the Angular application.

---

## ⚠️ Most Important Rule: Run From the Repository Root

**Always run tests from the repository root** (the directory that contains the top-level `package.json` with the `workspaces` field), using the `npm test` script.

**Do this:**

```bash
# from the repository root
npm test
```

**Do NOT do this:**

```bash
cd oar-dmp
npx jest          # ❌ fails with NG0202 for any service that injects a dependency
```

### Why this matters

This repository is an **npm workspaces monorepo**:

```json
{
  "workspaces": ["lib", "oar-dmp"]
}
```

Dependencies are hoisted, so `@angular/compiler-cli` exists in **both** `node_modules/` (root) and `oar-dmp/node_modules/`. The Angular compiler (`ngtsc`) used by `jest-preset-angular` generates dependency-injection factories from `@Injectable()` / `@Component()` decorators at compile time. That process must be anchored to a **consistent module-resolution root**.

- When you run from the **repository root** via `npm test`, resolution is anchored correctly and DI factories are generated.
- When you `cd oar-dmp` and run `npx jest` directly, resolution anchors to the wrong location, the decorator transform silently no-ops, and **every service that injects a class dependency fails** with:

  ```
  NG0202: This constructor is not compatible with Angular Dependency Injection
  because its dependency at index 0 of the parameter list is invalid.
  ```

  Services with **no** constructor dependencies still pass, which makes the failure look intermittent and confusing. It isn't — it's purely a matter of the working directory.

**If you ever see `NG0202` in a test, the first thing to check is: am I running from the repository root?**

---

## The `test` Scripts

Defined in the root `package.json`:

| Script | Command | What it does |
| --- | --- | --- |
| `npm test` | `jest --config ./oar-dmp/jest.config.js` | Runs the full test suite |
| `npm run test:silent` | `jest --config ./oar-dmp/jest.config.js --silent` | Same, but suppresses `console.log` output from the code under test |

Both point Jest at the config in `oar-dmp/jest.config.js` while keeping the working directory at the repo root — which is exactly what the resolution behavior above requires.

---

## Passing Arguments to Jest

Because you invoke Jest through an npm script, you must separate npm's own arguments from Jest's using `--`. Everything **after** `--` is forwarded to Jest.

```bash
npm test -- <jest arguments here>
```

Forgetting the `--` will cause npm to try to interpret the arguments itself.

---

## Common Commands

All commands are run **from the repository root**.

### Run the entire suite

```bash
npm test
```

### Run a single folder

The path argument is treated as a regular expression matched against test file paths.

```bash
npm test -- src/app/shared
npm test -- src/app/form-components
```

### Run a single test file

```bash
npm test -- src/app/shared/dmp.service.spec.ts
```

### Run tests by name

Matches against the text in `describe(...)` / `it(...)` blocks, regardless of file location. Use `-t` (short for `--testNamePattern`).

```bash
npm test -- -t "DmpService"
npm test -- -t "should be created"
```

### Watch mode (re-runs on file changes)

```bash
npm test -- --watch
npm test -- --watch src/app/shared     # watch only a subset
```

> **Note:** `--watch` relies on git to detect changed files. If it complains, use `--watchAll` instead, which re-runs everything on any change.

### Verbose output (show every individual test name)

```bash
npm test -- --verbose
npm test -- --verbose src/app/shared
```

### Silence `console.log` from the code under test

```bash
npm run test:silent
# or, ad hoc:
npm test -- --silent
```

---

## Code Coverage

Generate a coverage report:

```bash
npm test -- --coverage
```

This prints a summary table to the terminal and writes a full HTML report to `oar-dmp/coverage/` (open `coverage/lcov-report/index.html` in a browser).

Scope coverage to part of the codebase:

```bash
npm test -- --coverage src/app/shared
```

---

## Troubleshooting

### `NG0202: ... dependency at index 0 of the parameter list is invalid`

You are almost certainly running Jest from `oar-dmp/` instead of the repository root. Stop, `cd` back to the root, and use `npm test`. See **[Most Important Rule](#️-most-important-rule-run-from-the-repository-root)** above.

### Stale results after changing config or dependencies

`jest-preset-angular` caches compiled output. After editing `jest.config.js`, any `tsconfig`, or installing/updating packages, clear the cache:

```bash
npx jest --clearCache
```

(Clearing the cache is safe to run from anywhere; it only deletes Jest's cache directory.)

### `Cannot find module '...'` for a sibling file

Check the import path. Files in the same directory must be imported with a leading `./`, not `../`. For example, a spec in `src/app/shared/` importing its service uses:

```ts
import { SubmitDmpService } from './submit-dmp.service';   // ✅
import { SubmitDmpService } from '../submit-dmp.service';  // ❌ points one level too high
```

### A component spec fails with `NG0302: The pipe '...' could not be found`

`NO_ERRORS_SCHEMA` suppresses unknown **elements and attributes**, but **not pipes**. If the component's template uses a pipe, that pipe must be declared in the `TestBed` module (or replaced with a stub pipe). Example:

```ts
TestBed.configureTestingModule({
  declarations: [MyComponent, FilterPipe],   // declare the real pipe
  schemas: [NO_ERRORS_SCHEMA],
});
```

---

## Test File Conventions

- Test files live **next to the code they test** and end in `.spec.ts`
  (e.g. `dmp.service.ts` → `dmp.service.spec.ts`).
- Jest discovers them via the `testMatch` glob in `jest.config.js`:
  `<rootDir>/src/**/*.spec.ts`.
- The `src/` alias is available in imports (mapped in `jest.config.js`), so both of
  these resolve:

  ```ts
  import { ChipsSplitterService } from 'src/app/shared/chips-splitter.service';
  import { ChipsSplitterService } from './chips-splitter.service';
  ```

---

## Writing a New Test

Test files sit next to the code they test and end in `.spec.ts`. Below are the
patterns this project already uses — copy the one that matches what you're testing.

### 1. A service with no dependencies

The simplest case. Inject it from `TestBed` and assert directly.

```ts
import { TestBed } from '@angular/core/testing';
import { ChipsSplitterService } from './chips-splitter.service';

describe('ChipsSplitterService', () => {
  let service: ChipsSplitterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChipsSplitterService);
  });

  it('splits on commas and semicolons', () => {
    expect(service.splitChips('a,b;c')).toEqual(['a', 'b', 'c']);
  });
});
```

### 2. A service that injects other services

Provide a **mock** for each dependency via `useValue` (a plain object with only the
methods/fields the code under test actually touches). This keeps the test isolated
and fast — no real HTTP, no real collaborators.

```ts
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ResourceOptionsComponent } from './resource-options.component';
import { ResourcesService } from '../shared/resources.service';
import { LoadResourcesService } from '../shared/load-resources.service';

describe('ResourceOptionsComponent', () => {
  let service: ResourceOptionsComponent;

  const resourcesMock = {
    storageSubject$: new Subject<string>(),
    softwareSubject$: new Subject<string>(),
  };
  const loadResourcesMock = {
    getAllResources: jest.fn().mockReturnValue([]),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ResourcesService, useValue: resourcesMock },
        { provide: LoadResourcesService, useValue: loadResourcesMock },
      ],
    });
    service = TestBed.inject(ResourceOptionsComponent);
  });

  // ...
});
```

### 3. A service that makes HTTP calls

Use `HttpClientTestingModule` and drive requests with `HttpTestingController`.
Always call `httpController.verify()` in `afterEach` to catch stray requests.

```ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MyApiService } from './my-api.service';

describe('MyApiService', () => {
  let service: MyApiService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MyApiService],
    });
    service = TestBed.inject(MyApiService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify(); // fails if any request went unhandled
  });

  it('GETs the record', async () => {
    const promise = service.getRecord('42').toPromise();

    const req = httpController.expectOne('/api/records/42');
    expect(req.request.method).toBe('GET');
    req.flush({ id: '42' });          // supply the fake response

    expect((await promise).id).toBe('42');
  });
});
```

### 4. A component

Create it through `TestBed.createComponent`, which gives you a **fixture**. Call
`fixture.detectChanges()` to run `ngOnInit` and render the template.

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { SecurityAndPrivacyComponent } from './security-and-privacy.component';

describe('SecurityAndPrivacyComponent', () => {
  let component: SecurityAndPrivacyComponent;
  let fixture: ComponentFixture<SecurityAndPrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SecurityAndPrivacyComponent],
      imports: [ReactiveFormsModule],
      providers: [FormBuilder],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityAndPrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // runs ngOnInit + first render
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

**Handling templates you don't want to fully render:**

- `schemas: [NO_ERRORS_SCHEMA]` ignores unknown **elements/attributes** (e.g. child
  components, Angular Material tags) so you can test component logic without importing
  every dependency. It does **not** cover pipes — see the `NG0302` note in Troubleshooting.
- Declare any **pipe** the template uses (or a stub) in `declarations`.
- Provide **mocks** for injected services, exactly as in pattern 2.

### 5. Testing `@Output()` observables

Several components expose outputs as RxJS observables (`formReady`, `valueChange`)
rather than `EventEmitter`s. Read a single emission with `firstValueFrom`:

```ts
import { firstValueFrom } from 'rxjs';

it('emits the form instance on formReady', async () => {
  const form = await firstValueFrom(component.formReady);
  expect(form).toBe(component.myForm);
});
```

To capture a **sequence** of emissions, use `take(n)` + `toArray()`:

```ts
import { firstValueFrom, take, toArray } from 'rxjs';

it('emits initial then updated value', async () => {
  const emissions$ = component.valueChange.pipe(take(2), toArray());
  const promise = firstValueFrom(emissions$);

  component.myForm.patchValue({ title: 'New' });

  const [first, second] = await promise;
  expect(second.title).toBe('New');
});
```

### General guidance

- **Mock at the boundary.** Replace injected services with the smallest fake that
  satisfies the code path. Don't pull real collaborators into a unit test.
- **Silence expected noise.** If the code under test calls `alert`, `console.error`,
  etc., stub it: `jest.spyOn(window, 'alert').mockImplementation(() => {});` and
  restore with `jest.restoreAllMocks()` in `afterEach`.
- **Make time deterministic.** Code that generates ids from `Date.now()` can collide
  in fast loops; stub it with an incrementing counter when it matters.
- **Assert behavior, not implementation.** Prefer checking observable outputs and
  public state over reaching into private fields.

---

## Configuration Reference

Key files (paths relative to the repository root):

| File | Purpose |
| --- | --- |
| `oar-dmp/jest.config.js` | Jest configuration: preset, roots, `testMatch`, module name mapping, transform |
| `oar-dmp/setup-jest.ts` | Test environment setup (`setupZoneTestEnv()` from `jest-preset-angular`) |
| `oar-dmp/tsconfig.spec.json` | TypeScript config used to compile the tests |
| `package.json` (root) | Defines the `test` scripts and the workspaces layout |

You normally shouldn't need to edit any of these to write or run tests.
