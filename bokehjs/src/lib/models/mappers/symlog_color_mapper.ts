import {ContinuousColorMapper} from "./continuous_color_mapper"
import {SymLogScale} from "../scales/symlog_scale"
import type {Arrayable} from "core/types"
import {min, max} from "core/util/arrayable"
import {clamp} from "core/util/math"
import type * as p from "core/properties"

export type SymLogScanData = {
  min: number
  max: number
  scale: number
  is_reversed: boolean
}

export namespace SymLogColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousColorMapper.Props
}

export interface SymLogColorMapper extends SymLogColorMapper.Attrs { }

export class SymLogColorMapper extends ContinuousColorMapper {
  declare properties: SymLogColorMapper.Props

  constructor(attrs?: Partial<SymLogColorMapper.Attrs>) {
    super(attrs)
  }

  protected scan(data: Arrayable<number>, n: number): SymLogScanData {
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)
    const scale = n / (SymLogScale.symlog(high) - SymLogScale.symlog(low))  // subtract the low offset
    const is_reversed = high < low
    return {max: high, min: low, scale, is_reversed}
  }

  override index_to_value(index: number): number {
    const scan_data = this._scan_data as SymLogScanData
    return SymLogScale.inverse_symlog(index / scan_data.scale + SymLogScale.symlog(scan_data.min))
  }

  override value_to_index(value: number, palette_length: number): number {
    const scan_data = this._scan_data as SymLogScanData

    // This handles the edge case where value == high, since the code below maps
    // values exactly equal to high to palette.length when it should be one less.
    if (value == scan_data.max) {
      return palette_length - 1
    }

    // outside of range
    if (scan_data.is_reversed) {
      if (value > scan_data.min) {
        return -1
      } else if (value < scan_data.max) {
        return palette_length
      }
    } else {
      if (value > scan_data.max) {
        return palette_length
      } else if (value < scan_data.min) {
        return -1
      }
    }

    const float_index = (SymLogScale.symlog(value) - SymLogScale.symlog(scan_data.min)) * scan_data.scale
    const index = Math.floor(float_index)
    return clamp(index, -1, palette_length)
  }
}
