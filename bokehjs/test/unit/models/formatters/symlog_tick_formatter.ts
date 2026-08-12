import {expect} from "#framework/assertions"

import {SymLogTickFormatter} from "@bokehjs/models/formatters/symlog_tick_formatter"
import {SymLogTicker} from "@bokehjs/models/tickers/symlog_ticker"

describe("SymLogTickFormatter", () => {
  describe("doFormat method", () => {
    it("should format numerical ticks appropriately with min_exponent equals 1 by default", () => {
      const formatter = new SymLogTickFormatter()
      expect(formatter.min_exponent).to.be.equal(1)
      const labels = formatter.doFormat([-100, -10, -1, 0, 1, 10, 100], {loc: 0})
      expect(labels).to.be.equal(["−10^2", "−10^1", "−1", "0", "1", "10^1", "10^2"])
    })

    it("should format numerical ticks appropriately with min_exponent equals 0", () => {
      const formatter = new SymLogTickFormatter({min_exponent: 0})
      expect(formatter.min_exponent).to.be.equal(0)
      const labels = formatter.doFormat([-100, -10, -1, 0, 1, 10, 100], {loc: 0})
      expect(labels).to.be.equal(["−10^2", "−10^1", "−10^0", "0", "10^0", "10^1", "10^2"])
    })

    it("should format numerical ticks appropriately with min_exponent equals 2", () => {
      const formatter = new SymLogTickFormatter({min_exponent: 2})
      expect(formatter.min_exponent).to.be.equal(2)
      const labels = formatter.doFormat([-100, -10, -1, 0, 1, 10, 100], {loc: 0})
      expect(labels).to.be.equal(["−10^2", "−10", "−1", "0", "1", "10", "10^2"])
    })

    it("should format numerical ticks appropriately with min_exponent equals 3 and base 2", () => {
      const ticker = new SymLogTicker({base: 2})
      const formatter = new SymLogTickFormatter({ticker, min_exponent: 3})
      const labels = formatter.doFormat([-128, -32, -8, -2, -1, 0, 1, 4, 16, 64, 256], {loc: 0})
      expect(labels).to.be.equal(["−2^7", "−2^5", "−2^3", "−2", "−1", "0", "1", "4", "2^4", "2^6", "2^8"])
    })
  })
})
