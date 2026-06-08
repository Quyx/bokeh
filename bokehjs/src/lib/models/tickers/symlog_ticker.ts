import type {TickSpec} from "./ticker"
import {AdaptiveTicker} from "./adaptive_ticker"
import {range} from "core/util/array"
import type * as p from "core/properties"
import {SymLogScale} from "models/scales/symlog_scale"
const {ceil, abs, floor, log, round, sign} = Math

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
    let minor_ticks: number[] = []
    let ticks: number[] = []

    if (!isFinite(data_low) || !isFinite(data_high) || data_low === data_high) {
      return {major: [], minor: []}
    }
    const base = 10

    const symlog_low = SymLogScale.symlog(data_low)
    const symlog_high = SymLogScale.symlog(data_high)
    const symlog_span = symlog_high - symlog_low

    if (symlog_span < 2 * log(base)) { // minimum span to have at least 2 ticks of base^n in span
      // linear ticks
      const interval = this.get_interval(data_low, data_high, desired_n_ticks)
      const start_factor = floor(data_low / interval)
      const end_factor = ceil(data_high / interval)

      ticks = range(start_factor, end_factor + 1)
        .map((factor) => factor * interval)
        .filter((tick) => data_low <= tick && tick <= data_high)

      if (num_minor_ticks > 0 && ticks.length > 0) {
        const minor_interval = interval / num_minor_ticks
        const minor_offsets = range(0, num_minor_ticks).map((i) => i * minor_interval)
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
      const start_exp = data_low == 0 ? 0 : floor(sign(data_low) * log(abs(data_low)) / log(base))
      const end_exp = data_high == 0 ? 0 : floor(sign(data_high) * log(abs(data_high)) / log(base))

      const negative_ticks = range(start_exp, 1).map(
        (exp) => -(base ** abs(exp))
      )
      const positive_ticks = range(0, end_exp + 1).map(
        (exp) => (base ** abs(exp))
      )
      ticks = [...negative_ticks, 0, ...positive_ticks]
      ticks = ticks.filter((tick) => data_low <= tick && tick <= data_high)
      const interval = ceil(ticks.length / desired_n_ticks)
      let shift = 0
      if (ticks.includes(0)) {
        shift = ticks.indexOf(0) % interval
      }
      ticks = ticks.filter((_, i) => i % interval === shift)

      // minor ticks
      if (num_minor_ticks > 0 && ticks.length > 0) {

        let low_tick_extra: number // tick below smallest tick
        if (ticks[0] == 0) {
          low_tick_extra = - (base ** (interval - 1))
        } else {
          const low_tick_extra_exponent = round(log(abs(ticks[0])) / log(base) - sign(ticks[0]) * interval)
          if (low_tick_extra_exponent < 0) {
            // implies ticks[0] > 0 and
            // no lower positive tick allowed
            // we always want 0 before first negative tick
            low_tick_extra = 0
          } else {
            low_tick_extra = sign(ticks[0]) * (base ** low_tick_extra_exponent)
          }
        }

        let high_tick_extra: number // ticks above highest tick
        if (ticks[ticks.length - 1] == 0) {
          high_tick_extra = (base ** interval)
        } else {
          const high_tick_extra_exponent = round(log(abs(ticks[ticks.length - 1])) / log(base) + sign(ticks[ticks.length - 1]) * interval)
          if (high_tick_extra_exponent < 0) {
            // implies ticks[0] < 0 and
            // no higher negative tick allowed
            // we always want 0 before first positive tick
            high_tick_extra = 0
          } else {
            high_tick_extra = sign(ticks[ticks.length - 1]) * (base ** high_tick_extra_exponent)
          }
        }

        const extended_major_ticks = [low_tick_extra, ...ticks, high_tick_extra]
        for (let i = 0; i < extended_major_ticks.length - 1; i++) {
          const step = (extended_major_ticks[i + 1] - extended_major_ticks[i]) / num_minor_ticks

          for (let j = 0; j < num_minor_ticks; j++) {
            const v = extended_major_ticks[i] + j * step
            minor_ticks.push(v)
          }
        }

        minor_ticks = minor_ticks.filter((tick) => data_low <= tick && tick <= data_high)
      }
    }

    // if (symlog_span < 2 * log(2)) { // symlog_span from -1 to 1 is 2*log(2)
    //   // linear ticks
    //   const interval = this.get_interval(data_low, data_high, desired_n_ticks)
    //   const start = floor(data_low / interval)
    //   const end = ceil(data_high / interval)
    //   ticks = range(start, end + 1).map((i) => i * interval)
    // } else if (data_low > 1 || data_high < -1) {
    //   // log ticks
    //   const log_low = log(abs(data_low)) / log(base)
    //   const log_high = log(abs(data_high)) / log(base)
    //   const base_tick_options = range(ceil(log_low) - 1, floor(log_high) + 1, 1).map((i) => sign(data_low) * (base ** i))
    //   const tick_options = base_tick_options.filter((tick) => data_low <= tick && tick <= data_high)
    //   const filter_interval = Math.max(1, round(tick_options.length / desired_n_ticks))
    //   ticks = tick_options.filter((_, i) => i % filter_interval === 0)
    // } else if (data_low < -1 && data_high > 1) {
    //   // log ticks from low to -1 and from 1 to high, linear ticks from -1 to 1
    //   const log_low = log(-data_low) / log(base)
    //   const log_high = log(data_high) / log(base)
    //   const negative_ticks = range(ceil(log_low), 0).map((i) => -(base ** i))
    //   const positive_ticks = range(0, floor(log_high) + 1).map((i) => base ** i)
    //   const linear_ticks_interval = this.get_interval(-1, 1, round(desired_n_ticks * 2 * log(2) / symlog_span))
    //   const linear_ticks = range(ceil(-1 / linear_ticks_interval), floor(1 / linear_ticks_interval) + 1).map((i) => i * linear_ticks_interval)

    //   ticks = [...negative_ticks, ...linear_ticks, ...positive_ticks].filter((tick) => data_low <= tick && tick <= data_high)
    //   const filter_interval = Math.max(1, round(ticks.length / desired_n_ticks))
    //   ticks = ticks.filter((_, i) => i % filter_interval === 0)
    // } else {
    //   const step = symlog_span / Math.max(1, desired_n_ticks)
    //   const t_start = floor(symlog_low / step) * step
    //   const t_end = ceil(symlog_high / step) * step

    //   const t_ticks = range(0, ceil((t_end - t_start) / step) + 1).map((i) => t_start + i * step)
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
