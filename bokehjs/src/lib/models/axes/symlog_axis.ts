import {ContinuousAxis, ContinuousAxisView} from "./continuous_axis"
import {SymLogTickFormatter} from "../formatters/symlog_tick_formatter"
import {SymLogTicker} from "../tickers/symlog_ticker"
import {SymLogScale} from "../scales/symlog_scale"
import type * as p from "core/properties"

export class SymLogAxisView extends ContinuousAxisView {
  declare model: SymLogAxis

  protected override _hit_value(sx: number, sy: number): number | null {
    const [range] = this.ranges
    const {start, end} = range

    switch (this.dimension) {
      case 0: {
        const {x0, width} = this.bbox
        const s0 = SymLogScale.symlog(start)
        const s1 = SymLogScale.symlog(end)
        const symlog_value = s0 + (sx - x0) / width * (s1 - s0)
        return SymLogScale.inverse_symlog(symlog_value)
      }

      case 1: {
        const {y0, height} = this.bbox
        const s0 = SymLogScale.symlog(start)
        const s1 = SymLogScale.symlog(end)
        const t = 1 - (sy - y0) / height

        const symlog_value = s0 + t * (s1 - s0)

        return SymLogScale.inverse_symlog(symlog_value)
      }
    }

    return null
  }
}

export namespace SymLogAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousAxis.Props & {
    //ticker: p.Property<SymLogTicker>
    //formatter: p.Property<SymLogTickFormatter>
  }
}

export interface SymLogAxis extends SymLogAxis.Attrs {}

export class SymLogAxis extends ContinuousAxis {
  declare properties: SymLogAxis.Props
  declare __view_type__: SymLogAxisView

  declare ticker: SymLogTicker
  declare formatter: SymLogTickFormatter

  constructor(attrs?: Partial<SymLogAxis.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SymLogAxisView

    this.override<SymLogAxis.Props>({
      ticker:    () => new SymLogTicker(),
      formatter: () => new SymLogTickFormatter(),
    })
  }
}
