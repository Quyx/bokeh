import numpy as np

from bokeh.models import ColumnDataSource, SymLogTickFormatter
from bokeh.plotting import figure, show
from bokeh.transform import symlog_cmap

x = np.linspace(-10.5, 10.5, 12)
y = np.linspace(-10.5, 10.5, 12)

source = ColumnDataSource(dict(x=x, y=y))

p = figure(width=300, height=300, title="SymLog color map based on Y")

# use the field name of the column source
cmap = symlog_cmap(
    field_name="y", palette="Spectral6", low=-10, high=10, low_color="gray", high_color="black",
)

r = p.scatter(x="x", y="y", color=cmap, size=15, source=source)

# create a color bar from the scatter glyph renderer
color_bar = r.construct_color_bar(width=10)

p.add_layout(color_bar, "right")
p.right[0].formatter = SymLogTickFormatter(min_exponent=2)

show(p)
