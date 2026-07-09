"""A symlog plot using spirals with different growth rates. This example
demonstrates using a symlog axis on a Bokeh plot.

A `spiral`_ is a curve that emanates from a point and moves further away as it revolves
around the point.

The coordinates x and y depend on the radius :math:`r(\\varphi)` and are calculated
with :math:`x = r(\\varphi)\\cos \\varphi` and :math:`y = r(\\varphi)\\sin \\varphi`
for a cartesian coordinate system.

For the radius the following implementations are available:

- "archimedean": :math:`r = a \\varphi` with :math:`\\varphi \\gt 0`
- "fermat": :math:`r = \\pm a \\sqrt{\\varphi}` with :math:`\\varphi \\gt 0`
- "hyperbolic": :math:`r = \\frac{a}{\\varphi}` with :math:`\\varphi \\gt 0`
- "lituus": :math:`r = \\frac{a}{\\sqrt{\\varphi}}` with :math:`\\varphi \\gt 0`
- "golden", also known as fibonacci, which is an adaptation of the "logarithmic" case:
  :math:`r = a e^{b \\varphi}` with :math:`b = \\log \\frac{\\pi}{2}`
- "logarithmic": :math:`r = a e^{k \\varphi}` with :math:`k \\neq 0`

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line
    :refs: :ref:`ug_basic_axes_symlog`
    :keywords: lines, symlog scale

.. _spiral: https://en.wikipedia.org/wiki/spiral
"""

import numpy as np

from bokeh.plotting import figure, show


def spiral(phi: np.ndarray, case: str = "archimedean", a: float = 1, k: float = 1):
    cases = ["archimedean", "fermat", "golden", "hyperbolic", "lituus", "logarithmic"]

    if case == "archimedean":
        phi = phi[phi > 0]
        r = a * phi
    elif case == "hyperbolic":
        phi = phi[phi > 0]
        r = a / phi
    elif case == "fermat":
        phi = phi[phi > 0]
        r = np.concatenate([-a * np.sqrt(phi)[::-1], a * np.sqrt(phi)])
        phi = np.concatenate([phi[::-1], phi])
    elif case == "lituus":
        phi = phi[phi > 0]
        r = a / np.sqrt(phi)
    elif case == "golden" or case == "logarithmic":
        # the golden spiral is a special case of the logarithmic case with a fixed growth factor b
        if case == "golden":
            k = np.log(np.pi / 2)
        r = a * np.exp(k * phi)
    else:
        raise ValueError(
            f"Unsupported {case=!r} detected. Please use one of the following cases: "
            f"{', '.join(cases)}.",
        )
    x = r * np.cos(phi)
    y = r * np.sin(phi)
    return np.round(x, 7), np.round(y, 7)


phi_pm_zero = np.linspace(-3 * np.pi, 2.5 * np.pi, 10000)
phi_gt_zero = np.linspace(2e-4, 4 * np.pi, 10000)

cases = ["archimedean", "fermat", "hyperbolic", "lituus", "golden", "logarithmic"]
colors = ["blue", "green", "brown", "magenta", "gold", "black"]

p = figure(title="Sprials on symlog axes", x_axis_type="symlog", y_axis_type="symlog")
for case, color in zip(cases, colors):
    phi = phi_pm_zero if case in ["golden", "logarithmic"] else phi_gt_zero
    c = case if case != "fermat" else "fermat's"
    x, y = spiral(phi, case=case)
    p.line(x, y, line_width=2, color=color, legend_label=f"{case.capitalize()} spiral")
p.legend.location = "top_left"
p.legend.click_policy = "hide"

show(p)
