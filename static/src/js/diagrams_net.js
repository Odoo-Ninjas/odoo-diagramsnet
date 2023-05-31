odoo.define("diagrams.net.widget", function(require) {

    var AbstractField = require('web.AbstractField');
    var core = require('web.core');
    var QWeb = require('web.QWeb');
    var field_registry = require('web.field_registry');

    //override existing
    var Diagram = AbstractField.extend({
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
            var fielddata = JSON.parse(this.recordData[this.name]);
            if (!fielddata.nodes.length) {
                return;
            }
            const data = {
                nodes: new vis.DataSet(fielddata.nodes),
                edges: new vis.DataSet(fielddata.edges),
            };
            const options = {
                // Fix the seed to have always the same result for the same graph
                layout: {
                    randomSeed: 1,
                    improvedLayout: false,
                    clusterThreshold: 120,
                    hierarchical: {
                        enabled: false,
                        direction: "LR",
                        edgeMinimization: false,
                        parentCentralization: false,

                        levelSeparation: 150,
                        nodeSpacing: 200,
                    },
                },
                clickToUse: false,
                autoResize: false,
                physics: true,
                height: '500px',
                width: '100%',
                nodes: {
                    size: 30,
                    shadow: true,
                    margin: 5,
                    widthConstraint: {
                        minimum: 150,
                        maximum: 250,
                    },
                },
                interaction: {
                    navigationButtons: false,
                    keyboard: false,
                    hover: true,
                    zoomView: true,
                    dragView: true,
                    selectable: true,
                    dragNodes: true,
                },
            };
            const network = await new vis.Network(this.$el[0], data, options);
            click_handlers = {
                nodes: {},
                edges: {},
            };
            _.each(fielddata.nodes, (node) => {
                click_handlers.nodes[node.id] = node.onclick;
            });
            _.each(fielddata.edges, (edge) => {
                click_handlers.edges[edge.id] = edge.onclick;
            });

            var self = this;
            network.on("click", function (params) {
                if (params.nodes.length > 0) {
                    var nodeid = params.nodes[0];
                    self.openItem(self, click_handlers.nodes[nodeid]);
                }
                else if (params.edges.length > 0) {
                    var edgeid = params.edges[0];
                    self.openItem(self, click_handlers.edges[edgeid]);
                }
            });
            this.network = network;
            if (fielddata.selected_ids) {
                if (fielddata.selected_ids.length) {
                    let selids = _.map(fielddata.selected_ids, (x) => {
                        return x;
                    });
                    network.selectNodes(selids);
                }
            }
            this._fitNetwork();
        },
        async openItem(self, clickhandler) {
            debugger;
            const action = await self._rpc({
                model: clickhandler.model,
                method: clickhandler.method,
                args: [[clickhandler.res_id]],
                kwargs: {
                    context: self.context,
                }}
            );
            await this.do_action(action, {
                on_close: () => {
                    self.do_action({type: 'ir.actions.client', tag: 'reload'});
                }
            });
        },
        _fitNetwork() {
            if (this.network) {
                var self = this;
                this.network.fit();
                setTimeout(function() {
                    self.network.fit();
                    setTimeout(function() {
                        self.network.fit();
                    }, 500);
                }, 100);
            }
        }
    });
    field_registry.add('diagrams_net', Diagram); // as form widget
    return Diagram;

});