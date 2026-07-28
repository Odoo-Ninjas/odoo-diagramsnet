{
    'application': False,
    'assets': {   'web.assets_backend': [
                                            'diagrams_net/static/lib/vis/vis-network.min.css',
                                            'diagrams_net/static/src/diagrams_net.scss',
                                            'diagrams_net/static/lib/vis/vis-network.min.js',
                                            'diagrams_net/static/src/diagrams_net.js',
                                            'diagrams_net/static/src/diagrams_net.xml'  
                                        ]
              },
    'author': 'Marc Wimmer (marc@itewimmer.de)',
    'data': [],
    'demo': [],
    'depends': ['web'],
    'external_dependencies': {'bin': [], 'python': []},
    'license': 'LGPL-3',
    # explicit reStructuredText, otherwise Odoo renders README.md as RST and
    # docutils writes warnings into the install log
    'description': """
diagrams_net
============

Integrates ``vis-network`` as an Odoo field widget::

    <field name="content" widget="diagrams_net"/>
""",
    'name': 'diagrams_net',
    'test': [],
    'version': '1.0',
    'web': True}
