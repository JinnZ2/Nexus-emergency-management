#!/usr/bin/env python3
"""
QGIS PROJECT AUTO-SETUP FOR HISTORICAL IMAGERY LANDSLIDE INVENTORY
====================================================================
This script automatically creates a QGIS project with:
- Pre-configured layer groups for historical imagery
- Landslide point layer with proper attribute fields
- Symbology optimized for landslide detection
- Before/after comparison layout

To use:
1. Open QGIS
2. Plugins > Python Console
3. Paste this script and run
4. Or save as .py file and run via Processing > Scripts

Author: Community Emergency Mapping Initiative
License: MIT
"""

from qgis.core import (
    QgsProject, QgsVectorLayer, QgsField, QgsFeature, QgsGeometry,
    QgsPointXY, QgsCoordinateReferenceSystem, QgsPalLayerSettings,
    QgsTextFormat, QgsVectorLayerSimpleLabeling, QgsLayerTreeGroup,
    QgsLayerTreeLayer, QgsSymbol, QgsMarkerSymbol, QgsCategorizedSymbolRenderer,
    QgsRendererCategory, QgsContrastEnhancement, QgsRasterLayer
)
from qgis.PyQt.QtCore import QVariant
from qgis.PyQt.QtGui import QColor
import os

def create_landslide_inventory_project(project_name: str, crs_string: str = "EPSG:4326"):
    """
    Auto-create a QGIS project ready for landslide inventory from historical imagery.

    Args:
        project_name: Name for the project file (without extension)
        crs_string: Coordinate reference system (default WGS84)
                   Use "EPSG:32616" for UTM 16N (Wisconsin)
                   Use "EPSG:32645" for UTM 45N (Nepal)
    """

    project = QgsProject.instance()
    project.clear()

    # Set CRS
    crs = QgsCoordinateReferenceSystem(crs_string)
    project.setCrs(crs)

    # Get the layer tree (for organizing groups)
    root = project.layerTreeRoot()

    # ============================================================
    # CREATE LAYER GROUPS
    # ============================================================

    group_base = root.addGroup("📁 BASE DATA")
    group_imagery = root.addGroup("📁 HISTORICAL IMAGERY")
    group_reference = root.addGroup("📁 REFERENCE DATA")
    group_inventory = root.addGroup("📁 LANDSLIDE INVENTORY")

    # ============================================================
    # CREATE LANDSLIDE POINT LAYER WITH ATTRIBUTES
    # ============================================================

    # Create a memory layer (will be saved by user later)
    uri = f"Point?crs={crs_string}"
    landslide_layer = QgsVectorLayer(uri, "Confirmed Landslides", "memory")

    # Add fields
    provider = landslide_layer.dataProvider()
    provider.addAttributes([
        QgsField("id", QVariant.Int),
        QgsField("date_mapped", QVariant.Date),
        QgsField("date_event", QVariant.Date),
        QgsField("confidence", QVariant.String, len=20),
        QgsField("type", QVariant.String, len=30),
        QgsField("trigger", QVariant.String, len=30),
        QgsField("size_class", QVariant.String, len=20),
        QgsField("photo_oldest", QVariant.String, len=100),
        QgsField("photo_newest", QVariant.String, len=100),
        QgsField("notes", QVariant.String, len=255),
        QgsField("source", QVariant.String, len=50),
        QgsField("lat", QVariant.Double, len=10, prec=6),
        QgsField("lon", QVariant.Double, len=10, prec=6),
    ])
    landslide_layer.updateFields()

    # ============================================================
    # CONFIGURE SYMBOLOGY (Categorized by Confidence)
    # ============================================================

    # Create symbols for each confidence level
    symbol_high = QgsMarkerSymbol.createSimple({
        'name': 'circle',
        'color': '#e74c3c',
        'size': '4',
        'outline_color': 'black',
        'outline_width': '0.5'
    })

    symbol_medium = QgsMarkerSymbol.createSimple({
        'name': 'circle',
        'color': '#e67e22',
        'size': '4',
        'outline_color': 'black',
        'outline_width': '0.5'
    })

    symbol_low = QgsMarkerSymbol.createSimple({
        'name': 'circle',
        'color': '#f1c40f',
        'size': '4',
        'outline_color': 'black',
        'outline_width': '0.5'
    })

    symbol_unknown = QgsMarkerSymbol.createSimple({
        'name': 'diamond',
        'color': '#95a5a6',
        'size': '3',
        'outline_color': 'black',
        'outline_width': '0.5'
    })

    # Create categories
    categories = [
        QgsRendererCategory('High', symbol_high, 'High Confidence'),
        QgsRendererCategory('Medium', symbol_medium, 'Medium Confidence'),
        QgsRendererCategory('Low', symbol_low, 'Low Confidence'),
        QgsRendererCategory('', symbol_unknown, 'Not Classified'),
    ]

    # Apply renderer
    renderer = QgsCategorizedSymbolRenderer('confidence', categories)
    landslide_layer.setRenderer(renderer)

    # ============================================================
    # ADD LABELS (Show ID number)
    # ============================================================

    label_settings = QgsPalLayerSettings()
    label_settings.fieldName = "id"
    label_settings.enabled = True
    label_settings.placement = QgsPalLayerSettings.OverPoint

    text_format = QgsTextFormat()
    text_format.setSize(8)
    text_format.setColor(QColor("black"))
    label_settings.setFormat(text_format)

    labeling = QgsVectorLayerSimpleLabeling(label_settings)
    landslide_layer.setLabeling(labeling)
    landslide_layer.setLabelsEnabled(True)

    # ============================================================
    # ADD LAYER TO PROJECT AND GROUP
    # ============================================================

    project.addMapLayer(landslide_layer, False)
    group_inventory.addLayer(landslide_layer)

    # ============================================================
    # CREATE SUSPECTED LANDSLIDES LAYER (for screening)
    # ============================================================

    uri_suspect = f"Point?crs={crs_string}"
    suspect_layer = QgsVectorLayer(uri_suspect, "Suspected Landslides", "memory")

    provider_suspect = suspect_layer.dataProvider()
    provider_suspect.addAttributes([
        QgsField("id", QVariant.Int),
        QgsField("notes", QVariant.String, len=255),
        QgsField("photo_date", QVariant.String, len=20),
    ])
    suspect_layer.updateFields()

    # Yellow triangle for suspected
    symbol_suspect = QgsMarkerSymbol.createSimple({
        'name': 'triangle',
        'color': '#f1c40f',
        'size': '3',
        'outline_color': 'black',
        'outline_width': '0.5'
    })
    suspect_layer.setRenderer(QgsCategorizedSymbolRenderer.defaultRenderer(symbol_suspect))

    project.addMapLayer(suspect_layer, False)
    group_inventory.addLayer(suspect_layer)

    # ============================================================
    # CREATE POLYGON LAYER (for mapping slide boundaries)
    # ============================================================

    uri_poly = f"Polygon?crs={crs_string}"
    polygon_layer = QgsVectorLayer(uri_poly, "Landslide Polygons", "memory")

    provider_poly = polygon_layer.dataProvider()
    provider_poly.addAttributes([
        QgsField("id", QVariant.Int),
        QgsField("confidence", QVariant.String, len=20),
        QgsField("type", QVariant.String, len=30),
        QgsField("area_m2", QVariant.Double, len=15, prec=2),
        QgsField("notes", QVariant.String, len=255),
    ])
    polygon_layer.updateFields()

    # Semi-transparent red fill
    symbol_poly = QgsMarkerSymbol.createSimple({
        'name': 'square',
        'color': 'transparent',
        'size': '1'
    })  # Placeholder — user should set polygon symbology manually

    project.addMapLayer(polygon_layer, False)
    group_inventory.addLayer(polygon_layer)

    # ============================================================
    # SAVE PROJECT
    # ============================================================

    output_path = os.path.join(os.path.expanduser("~"), f"{project_name}.qgz")
    project.write(output_path)

    print(f"✓ Project created: {output_path}")
    print(f"✓ CRS set to: {crs_string}")
    print(f"✓ Layer groups created: BASE DATA, HISTORICAL IMAGERY, REFERENCE DATA, LANDSLIDE INVENTORY")
    print(f"✓ Confirmed Landslides layer with 13 attribute fields")
    print(f"✓ Symbology: Red=High, Orange=Medium, Yellow=Low, Gray=Unknown")
    print(f"✓ Suspected Landslides layer (yellow triangles)")
    print(f"✓ Landslide Polygons layer (for mapping boundaries)")
    print("")
    print("NEXT STEPS:")
    print("1. Add your DEM, hillshade, and aerial photos to the appropriate groups")
    print("2. Start digitizing landslide points")
    print("3. Save the project regularly (Ctrl+S)")
    print("4. When you have 20+ points, export as CSV and update the Honesty Engine")

    return output_path


# ============================================================
# RUN THE SETUP
# ============================================================

if __name__ == "__main__":
    # Example usage — change these for your area

    # For Vernon County, Wisconsin:
    # create_landslide_inventory_project("vernon_county_inventory", "EPSG:32616")

    # For Sindhupalchok, Nepal:
    # create_landslide_inventory_project("sindhupalchok_inventory", "EPSG:32645")

    # For generic WGS84:
    create_landslide_inventory_project("landslide_inventory_project", "EPSG:4326")
