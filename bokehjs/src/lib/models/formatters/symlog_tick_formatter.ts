import {TickFormatter} from "./tick_formatter"
import {BasicTickFormatter, unicode_replace} from "./basic_tick_formatter"
import type {SymLogTicker} from "../tickers/symlog_ticker"
import {to_fixed} from "core/util/string"
// import type {GraphicsBox} from "core/graphics"
// import {BaseExpo, TextBox} from "core/graphics"
import type * as p from "core/properties"

// TODO: currently copy of log_tick_formatter

const {abs, round, log10} = Math

export namespace SymLogTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    ticker: p.Property<SymLogTicker | null>
    min_exponent: p.Property<number>
  }
}

export interface SymLogTickFormatter extends SymLogTickFormatter.Attrs {}

export class SymLogTickFormatter extends TickFormatter {
  declare properties: SymLogTickFormatter.Props

  constructor(attrs?: Partial<SymLogTickFormatter.Attrs>) {
    super(attrs)
  }

  protected readonly basic_formatter: BasicTickFormatter = new BasicTickFormatter()

  // override format_graphics(ticks: number[], opts: {loc: number}): GraphicsBox[] {
  //   if (ticks.length == 0) {
  //     return []
  //   }

  //   const base = this.ticker?.base ?? 10
  //   const expos = this._exponents(ticks, base)

  //   if (expos == null) {
  //     return this.basic_formatter.format_graphics(ticks, opts)
  //   } else {
  //     return expos.map((expo) => {
  //       if (abs(expo) < this.min_exponent) {
  //         const b = new TextBox({text: unicode_replace(`${base**expo}`)})
  //         const e = new TextBox({text: ""})
  //         return new BaseExpo(b, e)
  //       } else {
  //         const b = new TextBox({text: unicode_replace(`${base}`)})
  //         const e = new TextBox({text: unicode_replace(`${expo}`)})
  //         return new BaseExpo(b, e)
  //       }
  //     })
  //   }
  // }

  protected _format_tick(tick: number): string {
    if (tick == 0) {
      return "0"
    }
    const abs_tick = abs(tick)
    if (abs_tick <= 1) {
      return unicode_replace(to_fixed(tick))
    }
    const exponent = round(log10(abs_tick))
    const sign = tick < 0 ? "-" : "+"
    const value = 10 ** exponent
    if (abs(abs_tick - value) / value < 1e-10) { // relatively close
      return `${sign}10^${exponent}`
    }
    return `${sign}${abs_tick.toPrecision(3)}`
  }

  doFormat(ticks: number[], _opts: {loc: number}): string[] {
    if (ticks.length == 0) {
      return []
    }

    return ticks.map((tick) => {
      return this._format_tick(tick)
    })
  }
}
