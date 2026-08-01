import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// ---------------------------------------------------------------------------
// jsdom (the DOM implementation Jest runs in) does not implement
// ResizeObserver. PageResizeService.elementResize() constructs one in its
// components' ngOnInit (PageErrorComponent, PageNotFoundComponent), so any
// spec that renders those pages via fixture.detectChanges() would otherwise
// throw "ResizeObserver is not defined".
//
// This no-op stub lets those components construct and render. The observer
// callback never fires (nothing triggers a resize in jsdom), which is fine
// for unit tests — layout behavior is not what these specs verify.
// ---------------------------------------------------------------------------
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

(globalThis as any).ResizeObserver = ResizeObserverStub;