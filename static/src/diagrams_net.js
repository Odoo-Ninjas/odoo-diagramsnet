/** @odoo-module **/
// test comment in 18

import { loadCSS, loadJS } from "@web/core/assets";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";
import { onWillStart, useEffect, useRef } from "@odoo/owl";
import { Field } from "@web/views/fields/field";

export class Diagram extends Field {
    static template = "diagrams_net.diagrams_net_widget";
    static supportedTypes = ["text", "html"];
    static displayName = "Diagram";
    static defaultProps = {
    };
    static props = {
        ...standardFieldProps,
    };
    
    setup() {
        super.setup();  
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
                    if (this.$el) {
                        this.$el.innerHTML = "";
                    }
                    this.network = null;
                }
                return this.$el;
            };
        });
    }

    get $el() {
        return this.rootRef.el;
    }

    get resId() {
        return this.props.record.data.id;
    }

    get context() {
        return this.props.record.field
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
            this.$el.innerHTML = "";
        }
        if (!this.props?.record?.data?.diagram_content) {
            console.error("Failed to render network. this.props.record.data.diagram_content undefined")
            return
        }
        var fielddata = JSON.parse(this.props.record.data.diagram_content);
        if (!fielddata || !fielddata.nodes.length) {
            return;
        }
        const data = {
            nodes: new vis.DataSet(fielddata.nodes),
            edges: new vis.DataSet(fielddata.edges),
        };
        const options = {
            // Fix the seed to always have the same result for the same graph
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
        const network = await new vis.Network(this.$el, data, options);
        let click_handlers = {
            nodes: {},
            edges: {},
        };
        fielddata.nodes.forEach((node) => {
            click_handlers.nodes[node.id] = node.onclick;
        });
        fielddata.edges.forEach((edge) => {
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

export const diagram = {
    component: Diagram,
}

registry.category("fields").add("diagrams_net", diagram);
