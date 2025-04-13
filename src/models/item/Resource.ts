import { Item } from ".";

export class Resource extends Item {
  type = "resource" as const
  constructor(id: string, sort: number) {
    super(id, sort);
  }
}
