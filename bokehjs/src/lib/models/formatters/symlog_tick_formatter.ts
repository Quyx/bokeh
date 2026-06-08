import {TickFormatter} from "./tick_formatter"
import {BasicTickFormatter, unicode_replace} from "./basic_tick_formatter"
import {SymLogTicker} from "../tickers/symlog_ticker"
import type {GraphicsBox} from "core/graphics"
import {BaseExpo, TextBox} from "core/graphics"
import type * as p from "core/properties"

// TODO: currently copy of log_tick_formatter

const {abs, floor, log10} = Math

export namespace SymLogTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    ticker: p.Property<SymLogTicker | null>
    min_exponent: p.Property<number>
  }
}

export interface SymLogTickFormatter extends SymLogTickFormatter.Attrs { }

export class SymLogTickFormatter extends TickFormatter {
  declare properties: SymLogTickFormatter.Props

  constructor(attrs?: Partial<SymLogTickFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<SymLogTickFormatter.Props>(({Int, Ref, Nullable}) => ({
      ticker: [Nullable(Ref(SymLogTicker)), null],
      min_exponent: [Int, 1],
    }))
  }

  protected readonly basic_formatter: BasicTickFormatter = new BasicTickFormatter()

  override format_graphics(ticks: number[], opts: {loc: number}): GraphicsBox[] {
    if (ticks.length == 0) {
      return []
    }

    const base = this.ticker?.base ?? 10
    const expos = this._exponents(ticks, base)

    if (expos == null) {
      return this.basic_formatter.format_graphics(ticks, opts)
    } else {
      return ticks.map((tick) => {
        const i = ticks.indexOf(tick)
        const sign = tick < 0 ? "-" : ""
        const expo = expos[i]
        if (expo == -1) {
          return new TextBox({text: "0"})
        } else if (abs(expo) < this.min_exponent) {
          const b = new TextBox({text: unicode_replace(`${sign}${base ** expo}`)})
          const e = new TextBox({text: ""})
          return new BaseExpo(b, e)
        } else {
          const b = new TextBox({text: unicode_replace(`${sign}${base}`)})
          const e = new TextBox({text: unicode_replace(`${expo}`)})
          return new BaseExpo(b, e)
        }
      })
    }
  }

  protected _exponents(ticks: number[], base: number): number[] | null {
    let last_exponent = null
    const exponents = []
    for (const tick of ticks) {
      let exponent: number
      if (tick == 0) {
        exponent = -1
      } else {
        exponent = round(log(abs(tick)) / log(base))
      }
      if (last_exponent == exponent) {
        return null
      } else if (exponent != -1 && abs((base ** abs(exponent) - abs(tick))) > 1e-10) {
        return null
      } else {
        last_exponent = exponent
        exponents.push(exponent)
      }
    }
    return exponents
  }

  doFormat(ticks: number[], opts: {loc: number}): string[] {
    if (ticks.length == 0) {
      return []
    }
    const base = this.ticker?.base ?? 10
    const expos = this._exponents(ticks, base)
    if (expos == null) {
      return this.basic_formatter.doFormat(ticks, opts)
    } else {
      return expos.map((expo) => {
        const i = expos.indexOf(expo)
        const sign = ticks[i] < 0 ? "-" : ""
        if (expo == -1) {
          return "0"
        } else if (abs(expo) < this.min_exponent) {
          return unicode_replace(`${sign}${base ** expo}`)
        } else {
          return unicode_replace(`${sign}${base}^${expo}`)
        }
      })
    }
  }
}
