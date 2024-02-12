import pandas as pd
import plotly.graph_objects as go

# Load the CSV file into a DataFrame
data = pd.read_csv('BST_M418_full.csv')

# Filter out rows where both cell count and area are zero or missing
data_filtered = data[(data['cell count'] > 0) | (data['area (mm^3)'] > 0)]
weight_column = 'cell count' if data_filtered['cell count'].sum() > 0 else 'area (mm^3)'

# Create a list of unique structures (both parent and child)
structures = list(set(data_filtered['id']).union(set(data_filtered['parent_structure_id'])))

# Mapping of structure id to index for Sankey diagram
structure_to_index = {structure: i for i, structure in enumerate(structures)}

# Prepare source, target, and value lists for Sankey diagram
source = [structure_to_index[parent_id] for parent_id in data_filtered['parent_structure_id']]
target = [structure_to_index[child_id] for child_id in data_filtered['id']]
value = data_filtered[weight_column].tolist()

# Constructing labels using acronyms
labels = []
for structure in structures:
    matching_row = data[data['id'] == structure]
    if not matching_row.empty:
        labels.append(matching_row['acronym'].iloc[0])
    else:
        labels.append(f"Unknown-{structure}")

# Create a Sankey diagram
fig = go.Figure(go.Sankey(
    node=dict(
        pad=15,
        thickness=20,
        line=dict(color="black", width=0.5),
        label=labels
    ),
    link=dict(
        source=source,
        target=target,
        value=value
    )
))

# Set title and layout options
fig.update_layout(title_text="Relationship between Structures and their Parent Structures -BST_M418_full.csv", font_size=10)
fig.show()
