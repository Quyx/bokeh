import {expect} from "#framework/assertions"

import {SymLogScale} from "@bokehjs/models/scales/symlog_scale"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("SymLogScale module", () => {

  function mkscale(): SymLogScale {
    return new SymLogScale({
      source_range: new Range1d({start: 0, end: 1000}),
      target_range: new Range1d({start: -100, end: 100}),
    })
  }

  describe("linear_compute method", () => {

    it("should correctly compute the linear scale", () => {
      expect(SymLogScale.linear_compute(0, 10, -100, 100)).to.be.equal([20, -100])
    })
  })

  describe("compute method", () => {
    it("should map values > start correctly", () => {
      const scale = mkscale()
      expect(scale.compute(0)).to.be.equal(-100)
      expect(scale.compute(10)).to.be.similar(-30.5, 0.1)
      expect(scale.compute(100)).to.be.similar(33.6, 0.1)
      expect(scale.compute(1000)).to.be.equal(100)
    })
  })

  describe("v_compute method", () => {

    it("should vector map values correctly", () => {
      const scale = mkscale()
      expect(scale.v_compute([0, 10, 100, 1000])).to.be.similar(new Float32Array([-100, -30.5, 33.6, 100]), 0.1)
    })

    it("should map to a Float32Array", () => {
      const scale = mkscale()
      expect(scale.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(Float32Array)
    })
  })

  describe("invert method", () => {

    it("should inverse map values correctly", () => {
      const scale = mkscale()
      const values = [-10, 0, 10, 42].map((v) => scale.invert(v))
      expect(values).to.be.similar([21.397, 30.638, 43.692, 133.992], 0.1)
    })
  })

  describe("v_invert method", () => {

    it("should vector map inverse map values correctly", () => {
      const scale = mkscale()
      const values = scale.v_invert([-10, 0, 10, 42])
      expect(values).to.be.similar(new Float64Array([21.397, 30.638, 43.692, 133.992]), 0.1)
    })
  })
})
