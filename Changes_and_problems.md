# Symlog and Symexp
- $\mathrm{symlog}(x) = \mathrm{sign}(x) \ln (1+\vert x \vert)$
- $\mathrm{symexp}(x) = \mathrm{sign}(x) (e^{\vert x \vert} - 1)$
- $\mathrm{symlog}^{-1}(x) = \mathrm{symexp}(x)$
- $\mathrm{symlog} : \mathbb{R} \rightarrow \mathbb{R}$

# Verschwinden von Plot und Ticks bei Log-Axis (+ Symlog)
- log geht bei weitem raus zoomen kaputt, symlog ebenfalls
    - alle Ticks verschwinden bzw. sind auf einem Punkt
    - Gitter in Figure verschwindet
    - kein "reparieren" durch wieder reinzoomen

# Implementation of SymLog (parallel to Log)

## Register SymLog in python (`src/bokeh`)
- `./models`
    - register `SymLogScale`
        - `scales.py` and `.pyi`
        - `plot.py` -> two if statements in `Plot._check_compatible_scale_and_ranges`
    - register `SymLogTickFormatter` in `formatters.py` and `.pyi`
    - register `SymLogColorMapper` in `mappers.py` and `.pyi`
    - register `SymLogAxis` in `axes.py` and `.pyi`
    - register `SymLogTicker` in `tickers.py` and `.pyi`
- `./plotting`: implement `AxisType` of `"symlog"`
    - register in `_figure.py` and `.pyi`
    - `_plot.py`
        - add `"symlog"` to `AxisType`
        - add elif to `get_scale`
        - add case to `_get_axis_class`
        - add to if in `_get_num_minor_ticks`
- add `symlog_cmap()` too `transform.py`

## Implementation in TypeScript (`bokehjs/src/lib/models`)

### New
- `SymLogScale` in `scales/symlog_scale.ts`
- `SymLogTicker` in `tickers/symlog_ticker.ts`
- `SymLogTickFormatter` in `formatters/symlog_tick_formatter.ts`
- `SymLogColorMapper`in `mappers/symlog_color_mapper.ts`
- `SymLogAxis` in `axes/symlog_axis.ts`

### Changed
- `ColorBarView` in `annotation/color_bar.ts`
    - add else if with `SymLogAxis` in `_create_axis`
    - add else if with `SymLogTickFormatter` in
- `DataRange1d` in `ranges/data_range1d.ts`
    - add `"symlog"` to `scale_hint` of `Internal` type of `namespace DataRange1d`
    - add `"symlog"` to `scale_hint` of `this.internal` in `class DataRange1d`
- `CartesianFrameView` in `canvas/cartesian_frame.ts`
    - add else if with `SymLogScale` that sets `scale_hint = "symlog"` to `_get_scales`

# LogTicker Problems

This is current code for creating logarithmic ticks with explained problems and proposed changes.

```typescript
const d = 0.000001
const low_pad = 1.0 - Math.sign(log_low)*d
const high_pad = 1.0 + Math.sign(log_high)*d
const startlog = Math.ceil(log_low * low_pad)
const endlog = Math.floor(log_high * high_pad)
const interval = Math.ceil((endlog - startlog) / 9.0)
```
> We later take every `interval`-th element of ticks to not overshoot `desired_n_ticks`.
> This code is quite obscure and the reasoning not understandable.
> Plotting this reveals, that interval is always just `Math.ceil((log_high - log_low) / 9)` except when log-low gets as large as 10^(10^6) (which cannot be displayed by bokeh).
> This hard-coded value of 9 is probably here because of the assumed base 10, but this base should be changeable (and is used in this very function earlier).
> This interval should be just calculated after we know ticks.length, then take every n-th element such that we fit `desired_n_ticks`.

```typescript
const base_tick_options = range(startlog-1, endlog+1, 1).map((i) => base**i)
const tick_options = base_tick_options.filter((tick) => data_low <= tick && tick <= data_high)
ticks = tick_options.filter((_, i) => i % interval === 0)
```
Here the last line used the interval discussed above. The better solution would be as follows:
```typescript
const base_tick_options = range(Math.ceil(log_low) - 1, Math.floor(log_high) + 1, 1).map((i) => base ** i)
const tick_options = base_tick_options.filter((tick) => data_low <= tick && tick <= data_high)
const interval = Math.ceil(tick_options.length / desired_n_ticks) // <-- Caculate Interval HERE
ticks = tick_options.filter((_, i) => i % interval === 0)
```
The
```typescript
if (num_minor_ticks > 0 && ticks.length > 0) {
    const minor_interval = base**interval / num_minor_ticks
    const minor_offsets = range(1, num_minor_ticks+1).map((i) => i*minor_interval)
    const max_offset = Math.max(...minor_offsets)
    for (const x of minor_offsets) {
        minor_ticks.push(ticks[0] * (x/max_offset))
    }
    for (const tick of ticks) {
        for (const x of minor_offsets) {
        minor_ticks.push(tick * x)
        }
    }
}
```
> This has multiple problems. First, the number of created minor ticks is not `num_minor_ticks`.
> This is because, again, for `minor_interval` we should divide by (`num_minor_ticks + 1`).
> Also when ``i == 1`` the offset is `base**interval / num_minor_ticks` which is potentially smaller than one.
> The first minor tick would land below the major tick, whereas the last minor tick is above the major tick. This seems unwanted.
> The offsets should be added to a base factor of 1! Correct would be:
```typescript
const minor_interval = base ** interval / (num_minor_ticks + 1)
const minor_offsets = range(1, num_minor_ticks + 1).map((i) => 1 + i * minor_interval)
```
> **But this is also false!**
> The last offset is $1 + n * \frac{b^i}{n+1} \geq b^i$ if $n+1 \geq b^i$. So for too many ticks in total, the last few ticks are above the next major tick.
> This problem comes from the added +1 in the map. The solution is to take one from `base ** interval`:
```typescript
const minor_interval = (base ** interval - 1) / (num_minor_ticks + 1)
const minor_offsets = range(1, num_minor_ticks + 1).map((i) => 1 + i * minor_interval)
```
> This now works as intended for bases bigger than one. (Were other bases supported and should they be??, you can input bases `0<b<1` without warnings.)

When the difference of logarithms of the ends of the displayed axis sector is less than two,
the LogTicker creates linear spaced ticks. These are however also incorrectly calculated it seems. Here is the code


```typescript
const interval = this.get_interval(data_low, data_high, desired_n_ticks)
const start_factor = Math.floor(data_low / interval)
const end_factor   = Math.ceil(data_high / interval)

ticks = range(start_factor, end_factor + 1)
    .filter((factor) => factor != 0)
    .map((factor) => factor*interval)
    .filter((tick) => data_low <= tick && tick <= data_high)

if (num_minor_ticks > 0 && ticks.length > 0) {
    const minor_interval = interval / num_minor_ticks
    const minor_offsets = range(0, num_minor_ticks).map((i) => i*minor_interval)
    for (const x of minor_offsets.slice(1)) {
        minor_ticks.push(ticks[0] - x)
    }
    for (const tick of ticks) {
        for (const x of minor_offsets) {
            minor_ticks.push(tick + x)
        }
    }
    }
```
> For `minor_interval` we should again divide by `num_minor_ticks + 1`. And then the for `minor_offsets` we should use `range(1, num_minor_ticks + 1)`.
> The old implementation always produces `num_minor_ticks - 1` minor ticks because the first minor tick sits directly on the major tick.



The proposed code for `log_ticker.ts` is:


```
import type {TickSpec} from "./ticker"
import {AdaptiveTicker} from "./adaptive_ticker"
import {range} from "core/util/array"
import type * as p from "core/properties"

export namespace LogTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AdaptiveTicker.Props
}

export interface LogTicker extends LogTicker.Attrs { }

export class LogTicker extends AdaptiveTicker {
  declare properties: LogTicker.Props

  constructor(attrs?: Partial<LogTicker.Attrs>) {
    super(attrs)
  }

  static {
    this.override<LogTicker.Props>({
      mantissas: [1, 5],
    })
  }

  override get_ticks_no_defaults(data_low: number, data_high: number, _cross_loc: number, desired_n_ticks: number): TickSpec<number> {
    const num_minor_ticks = this.num_minor_ticks
    const minor_ticks = []

    const base = this.base

    const log_low = Math.log(data_low) / Math.log(base)
    const log_high = Math.log(data_high) / Math.log(base)
    const log_interval = log_high - log_low

    let ticks: number[]

    if (!isFinite(log_interval) || log_interval == 0) {
      ticks = []
    } else if (log_interval < 2) { // treat as linear ticker
      const interval = this.get_interval(data_low, data_high, desired_n_ticks)
      const start_factor = Math.floor(data_low / interval)
      const end_factor = Math.ceil(data_high / interval)

      ticks = range(start_factor, end_factor + 1)
        .filter((factor) => factor != 0)
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
      const base_tick_options = range(Math.ceil(log_low) - 1, Math.floor(log_high) + 1, 1).map((i) => base ** i)
      const tick_options = base_tick_options.filter((tick) => data_low <= tick && tick <= data_high)
      const interval = Math.ceil(tick_options.length / desired_n_ticks)
      ticks = tick_options.filter((_, i) => i % interval === 0)

      if (num_minor_ticks > 0 && ticks.length > 0) {
        const minor_interval = (base ** interval - 1) / (num_minor_ticks + 1)
        const minor_offsets = range(1, num_minor_ticks + 1).map((i) => 1 + i * minor_interval)
        const max_offset = Math.max(...minor_offsets)
        for (const x of minor_offsets) {
          minor_ticks.push(ticks[0] * (x / max_offset))
        }
        for (const tick of ticks) {
          for (const x of minor_offsets) {
            minor_ticks.push(tick * x)
          }
        }
      }
    }

    return {
      major: ticks.filter((tick) => data_low <= tick && tick <= data_high),
      minor: minor_ticks.filter((tick) => data_low <= tick && tick <= data_high),
    }
  }
}
```