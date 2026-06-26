import type {TickSpec} from "./ticker"
import {AdaptiveTicker} from "./adaptive_ticker"
import {range} from "core/util/array"
import type * as p from "core/properties"
import {SymLogScale} from "models/scales/symlog_scale"
const {ceil, abs, floor, log, round, sign, min, max} = Math

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

  static {
    this.override<SymLogTicker.Props>({
      mantissas: [1, 5],
      num_minor_ticks: 10,
    })
  }

  private get_linear_ticks(data_low: number, data_high: number, desired_n_ticks: number): TickSpec<number> {
    const minor_ticks: number[] = []
    const num_minor_ticks = this.num_minor_ticks
    const interval = this.get_interval(data_low, data_high, desired_n_ticks)
    const start_factor = floor(data_low / interval)
    const end_factor = ceil(data_high / interval)

    const ticks = range(start_factor, end_factor + 1)
      .map((factor) => factor * interval)
      .filter((tick) => data_low <= tick && tick <= data_high)

    if (num_minor_ticks <= 0 || ticks.length == 0) {
      return {
        major: ticks.filter((t) => isFinite(t)).filter((t) => data_low <= t && t <= data_high),
        minor: [],
      }
    }

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

    return {
      major: ticks
        .filter((t) => isFinite(t))
        .filter((t) => data_low <= t && t <= data_high),

      minor: minor_ticks
        .filter((t) => isFinite(t))
        .filter((t) => data_low <= t && t <= data_high),
    }
  }

  override get_ticks_no_defaults(data_low: number, data_high: number, _cross_loc: number, desired_n_ticks: number): TickSpec<number> {
    const num_minor_ticks = this.num_minor_ticks
    let minor_ticks: number[] = []
    let ticks: number[] = []

    if (!isFinite(data_low) || !isFinite(data_high) || data_low === data_high) {
      return {major: [], minor: []}
    }
    const base = this.base

    const symlog_low = SymLogScale.symlog(data_low)
    const symlog_high = SymLogScale.symlog(data_high)
    const symlog_span = symlog_high - symlog_low

    if (symlog_span < 2 * log(base)) { // minimum span to have at least 2 ticks of base^n in span
      return this.get_linear_ticks(data_low, data_high, desired_n_ticks)
    }

    // ticks at base^n and -base^n and zero if in range
    const start_exp = data_low == 0 ? 0 : sign(data_low) * max(0, floor(log(abs(data_low)) / log(base)))
    const end_exp = data_high == 0 ? 0 : sign(data_high) * max(0, floor(log(abs(data_high)) / log(base)))

    const negative_ticks = range(start_exp, 1).map((exp) => -(base ** abs(exp))).filter(tick => data_low <= tick)
    const positive_ticks = range(0, end_exp + 1).map((exp) => base ** abs(exp)).filter(tick => tick <= data_high)
    ticks = [...negative_ticks, 0, ...positive_ticks]
    const interval = max(1, round(ticks.length / desired_n_ticks))
    const shift = ticks.indexOf(0) % interval
    ticks = ticks.filter((_, i) => i % interval === shift)
    ticks = ticks.filter((tick) => data_low <= tick && tick <= data_high)

    // minor ticks
    if (num_minor_ticks <= 0 || ticks.length == 0) {
      return {
        major: ticks.filter((t) => isFinite(t)).filter((t) => data_low <= t && t <= data_high),
        minor: [],
      }
    }

    let low_tick_extra: number // tick below smallest tick
    if (ticks[0] == 0) {
      low_tick_extra = -(base ** (interval - 1))
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
      const sgn = extended_major_ticks[i] == 0 ? sign(extended_major_ticks[i + 1]) : sign(extended_major_ticks[i])
      const low_abs = min(abs(extended_major_ticks[i]), abs(extended_major_ticks[i + 1]))
      const high_abs = max(abs(extended_major_ticks[i]), abs(extended_major_ticks[i + 1])) // > 0
      const step = high_abs / num_minor_ticks / (1 + floor(low_abs / high_abs))
      for (let j = ceil(low_abs / step); j < floor(high_abs / step); j++) {
        const v = sgn * j * step
        minor_ticks.push(v)
      }
    }
    minor_ticks = minor_ticks.filter((tick) => data_low <= tick && tick <= data_high).sort((a, b) => a - b)
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
