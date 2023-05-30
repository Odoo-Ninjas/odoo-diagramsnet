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
            this._fitNetwork();
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
                title: node[1],
                shape: node[2],
                color: node[3],
            }
        });

        const edges = [];
        _.each(this.props.value.edges || [], function (edge) {
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
                randomSeed: undefined, improvedLayout: false, clusterThreshold: 150,
                hierarchical: {
                    enabled: true,
                    direction: "LR",
                    edgeMinimization: true,
                    parentCentralization: true,

                    levelSeparation: 150,
                    blockShifting: true,

                    nodeSpacing: 100,
                },
            },
            clickToUse: false,
            autoResize: false,
            physics: false,
            height: '1000px',
            width: '1000px',
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
                keyboard: false,
                hover: true,
                zoomView: false,
                dragView: false,
                selectable: true,
                dragNodes: false,
            },
        };
        console.log(data);
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
        //this.network.moveTo({scale: 1.5})
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
            this.network.fit({
                nodes: this.network.body.nodeIndices,
                minZoomLevel: 1.0,
                maxZoomLevel: 1.3
            });
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
