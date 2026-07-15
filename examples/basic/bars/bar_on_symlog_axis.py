''' A bar chart with exponential growing values on the y-axis, where the bars start at y equals to
zero. To overcome the definition gap of the logarithm at zero but achieve a logarithmic scaling on
on the y-axis the y-axis-type is set to "symlog".

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.vbar_stack
    :refs: :ref:`ug_basic_axes_symlog`
    :keywords: bars, symlog axis

'''

from bokeh.plotting import figure, show

p = figure(
    title="Bars on quasi logarithmic y-axis starting at 0",
    width=400,
    height=400,
    y_axis_type="symlog",
    y_range=(0, 2 * 10**5),
)
p.vbar(x=list(range(6)), top=[10**x for x in range(6)], width=0.8)

show(p)
