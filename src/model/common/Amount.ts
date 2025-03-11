export class Amount {
  private constructor(public isInfinite: boolean = false, public amount: number = 0) { }

  static infinite(): Amount {
    return new Amount(true, 0);
  }

  static finite(amount: number): Amount {
    return new Amount(false, amount);
  }

  static from(param: number | string): Amount {
    if (typeof param === 'string') {
      if (this.verify(param)) {
        if ('∞' === param) {
          return this.infinite();
        } else {
          return this.finite(parseInt(param, 10));
        }
      } else {
        console.error(`param ${param} not valid amount`);
        return this.infinite();
      }
    } else {
      return this.finite(param);
    }
  }

  static verify(param: string): boolean {
    return '∞' === param || /^[0-9]+$/.test(param);
  }

  toString(): string {
    return this.isInfinite ? '∞' : this.amount.toString();
  }
}
