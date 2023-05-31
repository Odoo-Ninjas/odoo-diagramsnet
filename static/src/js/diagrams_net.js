odoo.define("diagrams.net.widget", function(require) {

    var AbstractField = require('web.AbstractField');
    var core = require('web.core');
    var QWeb = require('web.QWeb');
    var field_registry = require('web.field_registry');

    //override existing
    var SourceCodeViewer = AbstractField.extend({
        template: 'diagrams_net_widget',
        _render: function() {

            var self = this;
            self._super.apply(this, arguments);
            this.renderNetwork()


        },
        async renderNetwork() {
            if (this.network) {
                this.$el.empty();
            }
            var fielddata = this.recordData[this.name];
            let nodes = fielddata.nodes || [];
            if (!nodes.length) {
                return;
            }
            nodes = nodes.map((node) => {
                return {
                    id: node[0],
                    label: node[1],
                    title: node[1],
                    shape: node[2],
                    color: node[3],
                    title: node[4],
                }
            });

            const edges = [];
            _.each(fielddata.edges || [], function (edge) {
                edges.push({
                    id: edge[0],
                    from: edge[1],
                    to: edge[2],
                    label: edge[3],
                    arrows: "to",
                });
            });

            const data = {
                nodes: new vis.DataSet(nodes),
                edges: new vis.DataSet(edges),
            };
            const options = {
                // Fix the seed to have always the same result for the same graph
                layout: {
                    randomSeed: 100,
                    improvedLayout: true,
                    clusterThreshold: 120,
                    hierarchical: {
                        enabled: false,
                        direction: "LR",
                        edgeMinimization: true,
                        parentCentralization: true,

                        levelSeparation: 150,
                        nodeSpacing: 100,
                    },
                },
                clickToUse: false,
                autoResize: false,
                physics: true,
                height: '500px',
                width: '100%',
                nodes: {
                    size: 20,
                    shadow: true,
                    margin: 5,
                    widthConstraint: {
                        minimum: 150,
                        maximum: 250,
                    },
                },
                interaction: {
                    navigationButtons: false,
                    keyboard: true,
                    hover: true,
                    zoomView: true,
                    dragView: true,
                    selectable: true,
                    dragNodes: false,
                },
            };
            const network = await new vis.Network(this.$el[0], data, options);

            var self = this;
            network.on("click", function (params) {
                if (params.nodes.length > 0) {
                    var resId = params.nodes[0];
                    self.openItem(self, resId);
                }
                else if (params.edges.length > 0) {
                    var resId = params.edges[0];
                    self.openItem(self, resId, 'of.connection');
                }
            });
            this.network = network;
            if (fielddata.selected_ids) {
                if (fielddata.selected_ids.length) {
                    network.selectNodes(this.props.value.selected_ids);
                }
            }
            this._fitNetwork();
        },
        async openItem(self, item_id, force_model) {
            debugger;
            const action = await self._rpc({
                model: self.model,
                method: "open_diagram_item",
                args: [[self.recordData.id], item_id, force_model || 'of.base.item'],
                kwargs: {
                    context: self.context,
                }}
            );
            await this.do_action(action, {
                onClose: () => {
                    self.action.doAction({type: 'ir.actions.client', tag: 'reload'});
                }
            });
        },
        _fitNetwork() {
            if (this.network) {
                var self = this;
                this.network.fit();
                setTimeout(function() {
                    self.network.fit();
                }, 100);
            }
        }
    });
    field_registry.add('diagrams_net', SourceCodeViewer); // as form widget
    return SourceCodeViewer;

});