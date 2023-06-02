/** @odoo-module **/
/* global vis */

import { loadCSS, loadJS } from "@web/core/assets";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";
import { xml, onMounted, onWillUpdateProps, useState } from "@odoo/owl";
import { TextField } from '@web/views/fields/text/text_field';

const { Component, onWillStart, useEffect, useRef } = owl;

export class Diagram extends owl.Component {
    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.rootRef = useRef("root_vis");
        this.network = null;
        onWillStart(async () => {
            await loadJS("/diagrams_net/static/lib/vis/vis-network.min.js");
            loadCSS("/diagrams_net/static/lib/vis/vis-network.min.css");
        });
        useEffect(() => {
            this.renderNetwork();
            return () => {
                if (this.network) {
                    this.$el.empty();
                }
                return this.rootRef.el;
            };
        });
    }

    get $el() {
        return $(this.rootRef.el);
    }

    get resId() {
        return this.props.record.data.id;
    }

    get context() {
        return this.props.record.getFieldContext(this.props.name);
    }

    get model() {
        return this.props.record.resModel;
    }

    htmlTitle(html) {
        const container = document.createElement("div");
        container.innerHTML = html;
        return container;
    }

    async renderNetwork() {
        if (this.network) {
            this.$el.empty();
        }
        var fielddata = JSON.parse(this.props.value);
        if (!fielddata || !fielddata.nodes.length) {
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
            physics: false,
            height: '1000px',
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
                network.selectNodes(fielddata.selected_ids);
            }
        }
    }

    async openItem(item_id, clickhandler) {
        var self = this;
        const action = await this.orm.call(
            clickhandler.model,
            clickhandler.method,
            [[clickhandler.res_id]],
            {
                context: this.context,
            }
        );
        await this.action.doAction(action, {
            onClose: () => {
                self.action.doAction({type: 'ir.actions.client', tag: 'reload'});
            }
        });
    }

    _fitNetwork() {
        if (!this.network) {
            return;
        }
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



Diagram.template = "diagrams_net.diagrams_net_widget";
Diagram.supportedTypes = ["text", "html"];
Diagram.displayName = "Diagram";
Diagram.defaultProps = {
};
Diagram.props = {
    ...standardFieldProps,
};

registry.category("fields").add("diagrams_net", Diagram);
