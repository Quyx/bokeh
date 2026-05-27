import {ContinuousScale} from "./continuous_scale"
import type * as p from "core/properties"

export namespace SymLogScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousScale.Props
}

export interface SymLogScale extends SymLogScale.Attrs {}

export class SymLogScale extends ContinuousScale {
  declare properties: SymLogScale.Props

  constructor(attrs?: Partial<SymLogScale.Attrs>) {
    super(attrs)
  }

  get s_compute(): (x: number) => number {
    const {source_range: source, target_range: target} = this
    const s0 = SymLogScale.symlog(source.start)
    const s1 = SymLogScale.symlog(source.end)
    const [factor, offset] = SymLogScale.linear_compute(s0, s1, target.start, target.end)
    return (x: number) => {
      return factor * SymLogScale.symlog(x) + offset
    }
  }

  get s_invert(): (x: number) => number {
    const {source_range: source, target_range: target} = this
    const s0 = SymLogScale.symlog(source.start)
    const s1 = SymLogScale.symlog(source.end)
    const [factor, offset] = SymLogScale.linear_compute(s0, s1, target.start, target.end)
    return (sx: number) => {
      return SymLogScale.inverse_symlog((sx - offset) / factor)
    }
  }

  static symlog(x: number): number {
    return Math.sign(x) * Math.log(1 + Math.abs(x))
  }

  static inverse_symlog(y: number): number {
    return Math.sign(y) * (Math.exp(Math.abs(y)) - 1)
  }

  static linear_compute(source_start: number, source_end: number, target_start: number, target_end: number): [number, number] {
    //
    //  (t1 - t0)       (t1 - t0)
    //  --------- * x - --------- * s0 + t0
    //  (s1 - s0)       (s1 - s0)
    //
    // [  factor  ]     [    offset    ]
    //
    const factor = (target_end - target_start)/(source_end - source_start)
    const offset = -(factor * source_start) + target_start
    return [factor, offset]
  }
}
