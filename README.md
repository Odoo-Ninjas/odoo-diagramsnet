#1 diagrams_net

Integrates diagrams.net

## 1.1 Use the widget as following

```xml

<field name="content" widget="diagrams_net"/>

```

# Styling Samples

## Organigram

```csv
label: %name%<br><i style="color:gray;">%position%</i><br><a href="mailto:%email%">Email</a>
style: label;image=%image%;whiteSpace=wrap;html=1;rounded=1;fillColor=%fill%;strokeColor=%stroke%;
parentstyle: swimlane;whiteSpace=wrap;html=1;childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=1;resizeLast=0;collapsible=1;
unknownStyle: -
stylename: -
styles: -
vars: -
labelname: -
labels: -
identity: -
parent: -
namespace: csvimport-
connect: {"from": "manager", "to": "name", "invert": true, "label": "manages", "style": "curved=1;endArrow=blockThin;endFill=1;fontSize=11;"}
connect: {"from": "refs", "to": "id", "style": "curved=1;fontSize=11;"}
left:
top:
width: auto
height: auto
padding: -12
ignore: id,image,fill,stroke,refs,manager
link: url
nodespacing: 40
levelspacing: 100
edgespacing: 40
layout: auto
```

#2 Contributors

* Marc Wimmer <marc@itewimmer.de>

