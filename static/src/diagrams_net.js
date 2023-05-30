/** @odoo-module **/
/* @odoo-module */
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
            //this._fitNetwork();
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

    renderNetwork() {
        if (this.network) {
            this.$el.empty();
        }
        let nodes = this.props.value.nodes || [];
        if (!nodes.length) {
            return;
        }
        nodes = nodes.map((node) => {
            return {
                id: node[0],
                label: node[1],
            }
        });

        const edges = [];
        _.each(this.props.value.edges || [], function (edge) {
            edges.push({
                id: edge[0],
                from: edge[1],
                to: edge[2],
                arrows: "to",
            });
        });

        const data = {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges),
        };
        const options = {
            // Fix the seed to have always the same result for the same graph
            layout: { randomSeed: 1 },
            clickToUse: false,
            autoResize: true,
            interaction: {
                hover: true,
                zoomView: false,
                dragView: false,
                selectable: true,
                dragNodes: false,
            },
        };
        const network = new vis.Network(this.$el[0], data, options);

        var self = this;
        network.on("click", function (params) {
            if (params.nodes.length > 0) {
                var resId = params.nodes[0];
                self.openItem(resId);
            }
        });
        this.network = network;
        if (this.props.value.selected_ids) {
            if (this.props.value.selected_ids.length) {
                network.selectNodes(this.props.value.selected_ids);
            }
        }
    }

    async openItem(item_id) {
        debugger;
        const action = await this.orm.call(
            this.model,
            "open_diagram_item",
            [[this.props.value.res_id], item_id],
            {
                context: this.context,
            }
        );
        await this.action.doAction(action);
    }

    _fitNetwork() {
        if (this.network) {
            this.network.fit(this.network.body.nodeIndices);
        }
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
