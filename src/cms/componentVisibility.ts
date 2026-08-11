import type { CmsComponentContract } from './cmsContract';

export function componentIsVisible(component: CmsComponentContract) {
  return component.active !== false;
}
