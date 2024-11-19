import { Tags } from './sdk';

export function mergeTags(tags1?: Tags, tags2?: Tags) {
  return {
    ...tags1,
    ...tags2,
    ext: {
      ...tags1?.ext,
      ...tags2?.ext
    }
  };
}
