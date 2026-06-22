import {expect} from "#framework/assertions"

import {convert_to_uint32_palette} from "@bokehjs/models/mappers/color_mapper"
import {SymLogColorMapper} from "@bokehjs/models/mappers/symlog_color_mapper"

describe("SymLogColorMapper module", () => {

    describe("SymLogColorMapper.rgba_mapper.v_compute() method", () => {

        it("Should correctly map values along symlog scale", () => {
            const palette = ["#000F", "#777777FF", "#FFFF"]
            const color_mapper = new SymLogColorMapper({low: 0, high: 25, palette})

            const buf8_0 = color_mapper.rgba_mapper.v_compute([0])
            expect([buf8_0[0], buf8_0[1], buf8_0[2], buf8_0[3]]).to.be.equal([0, 0, 0, 255])

            const buf8_1 = color_mapper.rgba_mapper.v_compute([7])
            expect([buf8_1[0], buf8_1[1], buf8_1[2], buf8_1[3]]).to.be.equal([119, 119, 119, 255])
        })
    })

    describe("SymLogColorMapper.v_compute method", () => {

        it("Should map data below low value to low", () => {
            const palette = ["red", "green", "blue"]
            const color_mapper = new SymLogColorMapper({low: 1, high: 100, palette})

            const vals = color_mapper.v_compute([0, 1, 13.2126])
            expect(vals).to.be.equal(convert_to_uint32_palette(["red", "red", "green"]))
        })

        it("Should map data above high value to high", () => {
            const palette = ["red", "green", "blue"]
            const color_mapper = new SymLogColorMapper({low: 1, high: 100, palette})

            const vals = color_mapper.v_compute([13.2126, 100, 101])
            expect(vals).to.be.equal(convert_to_uint32_palette(["green", "blue", "blue"]))
        })

        it("Should map data NaN to nan_color value", () => {
            const palette = ["red", "green", "blue"]
            const color_mapper = new SymLogColorMapper({low: 1, high: 100, palette, nan_color: "gray"})

            const vals = color_mapper.v_compute([1, NaN, 100])
            expect(vals).to.be.equal(convert_to_uint32_palette(["red", "gray", "blue"]))
        })

        it("Should map data NaN to nan_color value when high/low not set", () => {
            const palette = ["red", "green", "blue"]
            const color_mapper = new SymLogColorMapper({palette, nan_color: "gray"})

            const vals = color_mapper.v_compute([1, NaN, 100])
            expect(vals).to.be.equal(convert_to_uint32_palette(["red", "gray", "blue"]))
        })

        it("Should map high/low values to high_color/low_color, if provided", () => {
            const palette = ["red", "green", "blue"]
            const color_mapper = new SymLogColorMapper({low: 1, high: 100, low_color: "pink", high_color: "orange", palette})

            const vals = color_mapper.v_compute([0.5, 1, 13.2126, 100, 101])
            expect(vals).to.be.equal(convert_to_uint32_palette(["pink", "red", "green", "blue", "orange"]))
        })

        it("Should map colors if high value is grather than low value", () => {
            const palette = ["red", "green", "blue"]
            const color_mapper = new SymLogColorMapper({low: 1, high: 100, palette})

            const vals = color_mapper.v_compute([0.5, 1, 13.2126, 100, 100.5])
            expect(vals).to.be.equal(convert_to_uint32_palette(["red", "red", "green", "blue", "blue"]))
        })

        it("Should map inverted colors if low value is grather than high value", () => {
            const palette = ["red", "green", "blue"]
            const color_mapper = new SymLogColorMapper({low: 100, high: 1, palette})

            const vals = color_mapper.v_compute([0.5, 1, 13.2126, 100, 100.5])
            expect(vals).to.be.equal(convert_to_uint32_palette(["blue", "blue", "green", "red", "red"]))
        })
    })
})
