import type {TickSpec} from "./ticker"
import {AdaptiveTicker} from "./adaptive_ticker"
import {range} from "core/util/array"
import type * as p from "core/properties"
import {SymLogScale} from "models/scales/symlog_scale"

// TODO: better ticks

export namespace SymLogTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AdaptiveTicker.Props
}

export interface SymLogTicker extends SymLogTicker.Attrs {}

export class SymLogTicker extends AdaptiveTicker {
  declare properties: SymLogTicker.Props

  constructor(attrs?: Partial<SymLogTicker.Attrs>) {
    super(attrs)
  }

  override get_ticks_no_defaults(data_low: number, data_high: number, _cross_loc: number, desired_n_ticks: number): TickSpec<number> {
    const num_minor_ticks = this.num_minor_ticks
    const minor_ticks: number[] = []
    let ticks: number[] = []

    if (!isFinite(data_low) || !isFinite(data_high) || data_low === data_high) {
      return {major: [], minor: []}
    }

    const low_t = SymLogScale.symlog(data_low)
    const high_t = SymLogScale.symlog(data_high)
    const t0 = Math.min(low_t, high_t)
    const t1 = Math.max(low_t, high_t)
    const span = t1 - t0

    if (span < 2) { // linear
      const interval = this.get_interval(data_low, data_high, desired_n_ticks)
      const start = Math.floor(data_low / interval)
      const end = Math.ceil(data_high / interval)
      ticks = range(start, end + 1).map((i) => i * interval).filter((x) => x !== 0)

    } else {
      const step = span / Math.max(1, desired_n_ticks)
      const t_start = Math.floor(t0 / step) * step
      const t_end = Math.ceil(t1 / step) * step

      const t_ticks = range(0, Math.ceil((t_end - t_start) / step) + 1).map((i) => t_start + i * step)
      ticks = t_ticks.map((t) => SymLogScale.inverse_symlog(t))
      if (data_low <= 0 && data_high >= 0) {
        ticks.push(0)
      }
    }

    // minor ticks
    if (num_minor_ticks > 0 && ticks.length > 0) {
      const sorted = ticks.sort((a, b) => a - b)
      for (let i = 0; i < sorted.length - 1; i++) {
        const step = (sorted[i + 1] - sorted[i]) / (num_minor_ticks + 1)

        for (let j = 1; j <= num_minor_ticks; j++) {
          const v = sorted[i] + j * step
          minor_ticks.push(v)
        }
      }
    }

    return {
      major: ticks
        .filter((t) => isFinite(t))
        .filter((t) => data_low <= t && t <= data_high),

      minor: minor_ticks
        .filter((t) => isFinite(t))
        .filter((t) => data_low <= t && t <= data_high),
    }
  }
}
