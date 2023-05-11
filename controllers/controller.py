from urllib import response
import werkzeug
import base64
import zlib
from odoo import http
from odoo.http import request
import requests
import json
from urllib.parse import quote, unquote

import inspect
import os
from pathlib import Path
current_dir = Path(os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe()))))

styling = """
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
"""


class DiagramController(http.Controller):

    def _get_csv_content(self):
        data = "\n".join(map(lambda x: "#" + x, styling.strip().split("\n")))
        data += (
            "\n"
            "name,position,id,location,manager,email,fill,stroke,refs,url,image\n"
            "Evan Miller,CFO,emi,Office 1,,me@example.com,#dae8fc,#6c8ebf,,https://app.diagrams.net,https://cdn3.iconfinder.com/data/icons/user-avatars-1/512/users-9-2-128.png\n"
            "Edward Morrison,Brand Manager,emo,Office 2,Evan Miller,me@example.com,#d5e8d4,#82b366,,https://app.diagrams.net,https://cdn3.iconfinder.com/data/icons/user-avatars-1/512/users-10-3-128.png\n"
            "Ron Donovan,System Admin,rdo,Office 3,Evan Miller,me@example.com,#d5e8d4,#82b366,'emo,tva',https://app.diagrams.net,https://cdn3.iconfinder.com/data/icons/user-avatars-1/512/users-2-128.png\n"
            "Tessa Valet,HR Director,tva,Office 4,Evan Miller,me@example.com,#d5e8d4,#82b366,,https://app.diagrams.net,https://cdn3.iconfinder.com/data/icons/user-avatars-1/512/users-3-128.png\n"
        )
        return {
            'format': 'csv',
            'data': data
        }

    @http.route('/of/embed', auth='user', type="http")
    def embed(self, **post):
        csv_plain = self._get_csv_content()
        content = (current_dir / 'embedded.html').read_text()
        title = 'simple1'
        url = (
            "https://embed.diagrams.net/?"
            "&client=0&proto=json"
            "&ready=message&embed=1"
            f"&title={title}"
        )
        content = content.replace("__URL__", url)
        content = content.replace("__CSV_PLAIN__", csv_plain['data'])
        return content