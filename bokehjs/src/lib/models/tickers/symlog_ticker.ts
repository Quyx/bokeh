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

export interface SymLogTicker extends SymLogTicker.Attrs { }

export class SymLogTicker extends AdaptiveTicker {
  declare properties: SymLogTicker.Props

  constructor(attrs?: Partial<SymLogTicker.Attrs>) {
    super(attrs)
  }

  override get_ticks_no_defaults(data_low: number, data_high: number, _cross_loc: number, desired_n_ticks: number): TickSpec<number> {
    const num_minor_ticks = this.num_minor_ticks
    const minor_ticks: number[] = []
    let ticks: number[] = []
    console.log(num_minor_ticks, data_low, data_high)

    if (!isFinite(data_low) || !isFinite(data_high) || data_low === data_high) {
      return {major: [], minor: []}
    }
    const base = 10

    const symlog_low = SymLogScale.symlog(data_low)
    const symlog_high = SymLogScale.symlog(data_high)
    const symlog_span = symlog_high - symlog_low

    if (symlog_span < 2 * Math.log(base)) { // minimum span to have at least 2 ticks of base^n in span
      // linear ticks
      const interval = this.get_interval(data_low, data_high, desired_n_ticks)
      const start_factor = Math.floor(data_low / interval)
      const end_factor = Math.ceil(data_high / interval)

      ticks = range(start_factor, end_factor + 1)
        .map((factor) => factor * interval)
        .filter((tick) => data_low <= tick && tick <= data_high)

      if (num_minor_ticks > 0 && ticks.length > 0) {
        const minor_interval = interval / (num_minor_ticks + 1)
        const minor_offsets = range(1, num_minor_ticks + 1).map((i) => i * minor_interval)
        for (const x of minor_offsets.slice(1)) {
          minor_ticks.push(ticks[0] - x)
        }
        for (const tick of ticks) {
          for (const x of minor_offsets) {
            minor_ticks.push(tick + x)
          }
        }
      }
    } else {
      // ticks at 10^n and -10^n and zero if in range
      const start_exp = data_low == 0 ? 0 : Math.ceil(Math.sign(data_low) * Math.log(Math.abs(data_low)) / Math.log(base))
      const end_exp = data_high == 0 ? 0 : Math.floor(Math.sign(data_high) * Math.log(Math.abs(data_high)) / Math.log(base))

      const negative_ticks = range(start_exp, 0).map(
        (exp) => Math.sign(exp) * (base ** Math.abs(exp))
      )
      const positive_ticks = range(0, end_exp + 1).map(
        (exp) => Math.sign(exp) * (base ** Math.abs(exp))
      )
      ticks = [...negative_ticks, -1, 1, ...positive_ticks]
      ticks = ticks.filter((tick) => data_low <= tick && tick <= data_high)
      const interval = Math.ceil(ticks.length / desired_n_ticks)
      ticks = ticks.filter((_, i) => i % interval === 0)
      ticks.push(0)

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
    }

    // if (symlog_span < 2 * Math.log(2)) { // symlog_span from -1 to 1 is 2*log(2)
    //   // linear ticks
    //   console.log("sym log ticker: treating as linear")
    //   const interval = this.get_interval(data_low, data_high, desired_n_ticks)
    //   const start = Math.floor(data_low / interval)
    //   const end = Math.ceil(data_high / interval)
    //   ticks = range(start, end + 1).map((i) => i * interval)
    // } else if (data_low > 1 || data_high < -1) {
    //   console.log("low > 1 or high < -1")
    //   // log ticks
    //   const log_low = Math.log(Math.abs(data_low)) / Math.log(base)
    //   const log_high = Math.log(Math.abs(data_high)) / Math.log(base)
    //   const base_tick_options = range(Math.ceil(log_low) - 1, Math.floor(log_high) + 1, 1).map((i) => Math.sign(data_low) * (base ** i))
    //   const tick_options = base_tick_options.filter((tick) => data_low <= tick && tick <= data_high)
    //   const filter_interval = Math.max(1, Math.round(tick_options.length / desired_n_ticks))
    //   ticks = tick_options.filter((_, i) => i % filter_interval === 0)
    // } else if (data_low < -1 && data_high > 1) {
    //   console.log("low < -1 and high > 1")
    //   // log ticks from low to -1 and from 1 to high, linear ticks from -1 to 1
    //   const log_low = Math.log(-data_low) / Math.log(base)
    //   const log_high = Math.log(data_high) / Math.log(base)
    //   const negative_ticks = range(Math.ceil(log_low), 0).map((i) => -(base ** i))
    //   const positive_ticks = range(0, Math.floor(log_high) + 1).map((i) => base ** i)
    //   const linear_ticks_interval = this.get_interval(-1, 1, Math.round(desired_n_ticks * 2 * Math.log(2) / symlog_span))
    //   const linear_ticks = range(Math.ceil(-1 / linear_ticks_interval), Math.floor(1 / linear_ticks_interval) + 1).map((i) => i * linear_ticks_interval)

    //   ticks = [...negative_ticks, ...linear_ticks, ...positive_ticks].filter((tick) => data_low <= tick && tick <= data_high)
    //   const filter_interval = Math.max(1, Math.round(ticks.length / desired_n_ticks))
    //   ticks = ticks.filter((_, i) => i % filter_interval === 0)
    // } else {
    //   const step = symlog_span / Math.max(1, desired_n_ticks)
    //   const t_start = Math.floor(symlog_low / step) * step
    //   const t_end = Math.ceil(symlog_high / step) * step

    //   const t_ticks = range(0, Math.ceil((t_end - t_start) / step) + 1).map((i) => t_start + i * step)
    //   ticks = t_ticks.map((t) => SymLogScale.inverse_symlog(t))
    //   if (data_low <= 0 && data_high >= 0) {
    //     ticks.push(0)
    //   }
    // }



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
