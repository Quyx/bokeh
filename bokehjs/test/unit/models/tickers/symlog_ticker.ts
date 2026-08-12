import {expect} from "#framework/assertions"

import {SymLogTicker} from "@bokehjs/models/tickers/symlog_ticker"

describe("SymLogTicker Model", () => {

  describe("SymLogTicker get_ticks_no_defaults method", () => {

    // not finite range

    it("should return empty ticks when start/end is not finite", () => {
      const ticker = new SymLogTicker()
      const ticks = ticker.get_ticks_no_defaults(NaN, NaN, NaN, 3)
      expect(ticks.major).to.be.equal([])
      expect(ticks.minor).to.be.equal([])
    })

    // short range -> linear (symlog difference < 2*log(base))

    it("should have three major ticks and zero minor ticks for short range", () => {
      const ticker = new SymLogTicker({desired_num_ticks: 3, num_minor_ticks: 0, mantissas: [1, 2]})
      const ticks = ticker.get_ticks_no_defaults(-3, 3, NaN, 3)
      expect(ticks.major).to.be.equal([-2, 0, 2])
      expect(ticks.minor).to.be.equal([])
    })

    it("should have two major ticks with one minor tick for short range", () => {
      const ticker = new SymLogTicker({desired_num_ticks: 2, num_minor_ticks: 1, mantissas: [4]})
      const ticks = ticker.get_ticks_no_defaults(0, 5, NaN, 2)
      expect(ticks.major).to.be.equal([0, 4])
      expect(ticks.minor).to.be.equal([0, 4])
    })

    it("should have four major ticks with two minor ticks for short range", () => {
      const ticker = new SymLogTicker({desired_num_ticks: 4, num_minor_ticks: 2})
      const ticks = ticker.get_ticks_no_defaults(0, 15, NaN, 4)
      expect(ticks.major).to.be.equal([0, 5, 10, 15])
      expect(ticks.minor).to.be.equal([0, 2.5, 5, 7.5, 10, 12.5, 15])
    })

    // long range (>=2 base orders)

    it("should have four major ticks and zero minor ticks for long range", () => {
      const ticker = new SymLogTicker({num_minor_ticks: 0})
      const ticks = ticker.get_ticks_no_defaults(-100, 1000, NaN, 8)
      expect(ticks.major).to.be.equal([-100, -10, -1, 0, 1, 10, 100])
      expect(ticks.minor).to.be.equal([])
    })

    it("should have four major ticks and no minor ticks for long range", () => {
      const ticker = new SymLogTicker({num_minor_ticks: 1})
      const ticks = ticker.get_ticks_no_defaults(1, 1001, NaN, 4)
      expect(ticks.major).to.be.equal([1e0, 1e1, 1e2, 1e3])
      expect(ticks.minor).to.be.equal([])
    })

    it("should have four major ticks and seven minor ticks for long range", () => {
      const ticker = new SymLogTicker({num_minor_ticks: 2})
      const ticks = ticker.get_ticks_no_defaults(1, 1001, NaN, 4)
      expect(ticks.major).to.be.equal([1, 10, 100, 1000])
      expect(ticks.minor).to.be.equal([5, 50, 500])
    })

    it("should have correct default ticks for (1, 1000) range", () => {
      const ticker = new SymLogTicker()
      const ticks = ticker.get_ticks_no_defaults(1, 1000, NaN, 4)
      expect(ticks.major).to.be.equal([1, 10, 100])
      expect(ticks.minor).to.be.equal([2, 4, 6, 8, 20, 40, 60, 80, 200, 400, 600, 800])
    })

    // range below 1

    it("should have correct default ticks for (-10, 10) range", () => {
      const ticker = new SymLogTicker()
      const ticks = ticker.get_ticks_no_defaults(0, 1001, NaN, 3)
      expect(ticks.major).to.be.equal([0, 10, 1000])
      expect(ticks.minor).to.be.equal([0, 0, 2, 4, 6, 8, 200, 400, 600, 800])
    })

    it("should have correct default ticks for (0, 1001) range", () => {
      const ticker = new SymLogTicker()
      const ticks = ticker.get_ticks_no_defaults(0, 1001, NaN, 5)
      expect(ticks.major).to.be.equal([0, 1, 10, 100, 1000])
    })
  })
})
