odoo.define("diagrams_net.fields", function (require) {
    "use strict";

    /**
     * This module contains field widgets for the job queue.
     */

    var AbstractField = require("web.AbstractField");
    var core = require("web.core");
    var field_registry = require("web.field_registry");

    var JobDirectedGraph = AbstractField.extend({
        /* global vis */
        className: "o_field_job_directed_graph",
        cssLibs: ["/diagrams_net/static/lib/vis/vis-network.min.css"],
        jsLibs: ["/diagrams_net/static/lib/vis/vis-network.min.js"],
        init: function () {
            this._super.apply(this, arguments);
            this.network = null;
            this.tabListenerInstalled = false;
        },
        start: function () {
            var def = this._super();

            core.bus.on(
                "DOM_updated",
                this,
                function () {
                    this._installTabListener();
                }.bind(this)
            );

            return def;
        },
        _fitNetwork: function () {
            if (this.network) {
                this.network.fit(this.network.body.nodeIndices);
            }
        },
        /*
         * Add a listener on tabs if any: when the widget is render inside a tab,
         * it does not view the view. Install a listener that will fit the network
         * graph to show all the nodes when we switch tab.
         */
        _installTabListener: function () {
            if (this.tabListenerInstalled) {
                return;
            }
            this.tabListenerInstalled = true;

            var tab = this.$el.closest("div.tab-pane");
            if (!tab.length) {
                return;
            }
            $('a[href="#' + tab[0].id + '"]').on(
                "shown.bs.tab",
                function () {
                    this._fitNetwork();
                }.bind(this)
            );
        },
        htmlTitle: function (html) {
            const container = document.createElement("div");
            container.innerHTML = html;
            return container;
        },
        _render: function () {
            debugger;
            var self = this;
            this.$el.empty();

            var fielddata = JSON.parse(this.value);
            if (!fielddata || !fielddata.nodes.length) {
                return;
            }
            var nodes = fielddata.nodes || [];

            if (!nodes.length) {
                return;
            }
            nodes = _.map(nodes, function (node) {
                node.title = self.htmlTitle(node.title || "");
                return node;
            });

            var edges = [];
            _.each(this.value.edges || [], function (edge) {
                var edgeFrom = edge[0];
                var edgeTo = edge[1];
                edges.push({
                    from: edgeFrom,
                    to: edgeTo,
                    arrows: "to",
                });
            });

            var data = {
                nodes: new vis.DataSet(nodes),
                edges: new vis.DataSet(edges),
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
                physics: false,
                height: '400px',
                width: '1000px',
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
                    zoomView: false,
                    dragView: false,
                    selectable: true,
                    dragNodes: false,
                },
            };
            var network = new vis.Network(this.$el[0], data, options);
            network.selectNodes([this.res_id]);

            // network.on("dragging", function () {
            //     // By default, dragging changes the selected node
            //     // to the dragged one, we want to keep the current
            //     // job selected
            //     network.selectNodes([self.res_id]);
            // });

            let click_handlers = {
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
        },
        openItem(item_id, clickhandler) {
            var self = this;
            let res = this._rpc({
                model: clickhandler.model,
                method: clickhandler.method,
                args: [[clickhandler.res_id]],
                kwargs:
                {
                    context: this.context,
                }
            }
            )
                .then(function (action) {
                    self.trigger_up("do_action", { action: action }, {
                        onClose: () => {
                            self.doAction({ type: 'ir.actions.client', tag: 'reload' });
                        }
                    });
                });
        },
        openDependencyJob: function (res_id) {
            var self = this;
            this._rpc({
                model: this.model,
                method: "get_formview_action",
                args: [[res_id]],
                context: this.record.getContext(this.recordParams),
            }).then(function (action) {
                self.trigger_up("do_action", { action: action });
            });
        },
    });

    field_registry.add("diagrams_net", JobDirectedGraph);

    return {
        JobDirectedGraph: JobDirectedGraph,
    };
});
