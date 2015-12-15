import CssSelectorGenerator from 'css-selector-generator'
import $ from 'jquery'
import SuperSelector from './SuperSelector'

let Cookie = {
    get: function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return "";
    },

    set: function(cname, cvalue) {
        document.cookie = cname + "=" + cvalue + "; path=/";
    }
}

let Recording = {
    NAMESPACE: 'wymezy.recording',
    actions: [],
    start: function() {
        this.reset();
        this.resume();
    },

    resume: function() {
        this.loadActions();
        var url = document.location.href;

        this.actions.push({
            action: 'navigate',
            value: url
        });
        var cssSelectorGenerator = new CssSelectorGenerator({selectors: ['tag', 'class', 'nthchild']});
        $('body').on("blur focus load resize scroll unload click " +
            "change select submit keypress", e => {
            var action = {
                action: e.type,
                selector: cssSelectorGenerator.getSelector(e.target).replace(/\\3A /g, ':'),
                value: e.target.value
            };
            console.log(action);
            this.actions.push(action)
        });

        window.onbeforeunload = this.saveActions.bind(this);
    },

    reset: function() {
        this.actions = [];
        this.saveActions();
    },

    saveActions: function() {
        Cookie.set(this.NAMESPACE, JSON.stringify(this.actions));
    },

    loadActions: function() {
        var actionsJSON = Cookie.get(this.NAMESPACE);
        if (actionsJSON) {
            this.actions = JSON.parse(actionsJSON);
        }
    },

    print: function() {
        console.log(this.actions);
    }
};

var Serializer = {
    initialURL: null,
    output: [],
    toCasper: function(actions) {
        var tree = this.buildActionTree(actions);
        var casperCode = this.generateCasperCode(tree);
        var $txtArea = $('<textarea>');
        $txtArea.html(casperCode);
        $(document.body).append($txtArea);
        console.log(casperCode);
    },
    buildActionTree: function(actions) {
        actions = actions.slice();
        if (actions[0].action !== "navigate") {
            throw Error("Initial action must be a navigation action");
        }

        var initialAction = actions.shift();
        var root = {
            open: 'casper.start("' + initialAction.value + '", function() {',
            content: [],
            close: '});'
        };
        var node = root;
        for(var i = 0; i < actions.length; i++) {
            var action = actions[i];
            switch(action.action) {
                case 'navigate':
                    var navigation = {
                        open: "casper.then(function() {" ,
                        content: [{
                            content: "test.assertUrlMatch('" + action.value.replace(/'/g, "\\'") + "', 'Expected url found');"
                        }],
                        close: "});"
                    };
                    root.content.push(navigation);
                    node = navigation;
                    break;
                case 'click':
                    node.content.push({
                        open: "casper.waitForSelector('" + action.selector + "', function () {",
                        content: [
                            {content: "this.click('" + action.selector + "');"}
                        ],
                        close: "});"
                    });
                    break;
                case 'change':
                    node.content.push({
                        open: "casper.evaluate(function() {",
                        content: [
                            {content: "document.querySelector('" + action.selector + "').value = '" + action.value + "';"}
                        ],
                        close: "});"
                    });
                    break;
            }
        }
        return root;
    },

    generateCasperCode: function(root) {
        return this._generateCasperCodeForLevel([root], 0).join("\n");
    },

    _generateCasperCodeForLevel: function(nodes, level) {
        var outputLines = [];
        for(var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.open) {
                outputLines.push(this._indentLevel(level) + node.open);
            }
            if (node.content) {
                if (Array.isArray(node.content) && node.content.length > 0) {
                    outputLines.push(...this._generateCasperCodeForLevel(node.content, level+1));
                } else {
                    outputLines.push(this._indentLevel(level) + node.content);
                }
            }
            if (node.close) {
                outputLines.push(this._indentLevel(level) + node.close);
            }
        }
        return outputLines;
    },

    _indentLevel: function(level) {
        var tab = "    ";
        var tabs = "";
        for (var j = 0; j < level; j++) {
            tabs += tab;
        }
        return tabs;
    }
};

window.Recording = Recording;
window.Serializer = Serializer;
window.SuperSelector = SuperSelector;
