import { assertEquals, assertThrows } from "https://deno.land/std@0.220.0/assert/mod.ts"

// まだEntityが実装されていないので、仮の実装でテストファースト
class Holding {
  constructor(
    public readonly symbol: string,
    public readonly name: string,
    public readonly quantity: number,
    public readonly averageCost: number,
    public readonly currentPrice: number
  ) {
    if (quantity <= 0) {
      throw new Error('保有数量は正の数である必要があります')
    }
  }

  get currentValue(): number {
    return this.quantity * this.currentPrice
  }

  get profitLoss(): number {
    return this.currentValue - (this.quantity * this.averageCost)
  }

  get profitLossRate(): number {
    const totalCost = this.quantity * this.averageCost
    if (totalCost === 0) return 0
    return (this.profitLoss / totalCost) * 100
  }
}

Deno.test("Holding - 正常な初期化", () => {
  const holding = new Holding("7203", "トヨタ自動車", 100, 2000, 2500)

  assertEquals(holding.symbol, "7203")
  assertEquals(holding.name, "トヨタ自動車")
  assertEquals(holding.quantity, 100)
  assertEquals(holding.averageCost, 2000)
  assertEquals(holding.currentPrice, 2500)
})

Deno.test("Holding - 評価額の計算", () => {
  const holding = new Holding("7203", "トヨタ自動車", 100, 2000, 2500)

  assertEquals(holding.currentValue, 250000)
})

Deno.test("Holding - 損益の計算", () => {
  const holding = new Holding("7203", "トヨタ自動車", 100, 2000, 2500)

  assertEquals(holding.profitLoss, 50000)
  assertEquals(holding.profitLossRate, 25)
})

Deno.test("Holding - 損失の場合", () => {
  const holding = new Holding("7203", "トヨタ自動車", 100, 2500, 2000)

  assertEquals(holding.profitLoss, -50000)
  assertEquals(holding.profitLossRate, -20)
})

Deno.test("Holding - 不正な数量でエラー", () => {
  assertThrows(
    () => new Holding("7203", "トヨタ自動車", 0, 2000, 2500),
    Error,
    "保有数量は正の数である必要があります"
  )

  assertThrows(
    () => new Holding("7203", "トヨタ自動車", -100, 2000, 2500),
    Error,
    "保有数量は正の数である必要があります"
  )
})