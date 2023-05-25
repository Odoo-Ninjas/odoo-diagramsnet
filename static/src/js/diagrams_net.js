odoo.define("diagrams.net.widget", function(require) {

    var AbstractField = require('web.AbstractField');
    var core = require('web.core');
    var QWeb = require('web.QWeb');
    var field_registry = require('web.field_registry');

    //override existing
    var SourceCodeViewer = AbstractField.extend({
        template: 'diagrams_net_widget',
        init: function() {
            this._super.apply(this, arguments);
        },
        destroy: function() {
            this._super.apply(this, arguments);
        },
        start: function() {
            res = this._super.apply(this, arguments);
            var self = this;
        },
        destroy: function() {
            debugger;
            this._super.apply(this, arguments);
            if (this.handler) {
                document.body.removeEventListener(
                    'message', this.message_received);
            };

        },
        _render: function() {

            var self = this;

            self._super.apply(this, arguments);
            window.addEventListener(
                'message', self.message_received.bind(self), false);

            if (!self.iframe1) {
                self.iframe1 = self._makeiframe();
            }
            if (!self.iframe2) {
                self.iframe2 = self._makeiframe();
            }
            self.img = self.$el.find("#img1");
            self.xml_content = "";

            self.iframe1.prop('src', self.iframe_url());

        },
        _makeiframe: function() {
            var $res = $("<iframe/>").appendTo($("body"));
            $res.hide();
            return $res;
        },
        iframe_url: function() {
            return "https://embed.diagrams.net/?proto=json&client=0&ready=message&embed=1";
        },
        message_received: function(evt) {
            console.log(evt.data);
            var self = this;

            if (!evt.data) {
                return;
            }
            var data = JSON.parse(evt.data);
            if (data.event == 'init') {
                if (!self.xml_content) {
                    self.iframe1[0].contentWindow.postMessage(JSON.stringify({
                        action: "load",
                        descriptor: {
                            format: "csv",
                            data: self.value,
                        }
                    }), '*');
                }
                else {
                    if (self.iframe2 && self.iframe2[0].contentWindow) {
                        self.iframe2[0].contentWindow.postMessage(JSON.stringify({
                            action: "load",
                            descriptor: {
                                format: "xml",
                                data: this.xml_content,
                            }
                        }), '*');
                    }
                }
            }
            else if (data.event == 'load') {
                if (!this.xml_content) {
                    this.xml_content = data.xml;
                    this.iframe1.css("height", "1800px");
                    this.iframe1.remove();
                    this.iframe2.prop("src", this.iframe_url());
                }
                else {
                    if (this.iframe2 && this.iframe2[0].contentWindow) {
                        this.iframe2[0].contentWindow.postMessage(JSON.stringify({
                            action: "export",
                            format: "url",
                        }), '*');
                    }
                }
            }
            else if (data.event == 'export') {
                this.iframe2.remove()
                this.img.prop("src", data.data);
            }
        }
    });
    field_registry.add('diagrams_net', SourceCodeViewer); // as form widget
    return SourceCodeViewer;

});