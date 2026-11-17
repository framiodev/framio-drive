var FramioForumPort = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/mithril/render/vnode.js
  var require_vnode = __commonJS({
    "node_modules/mithril/render/vnode.js"(exports, module) {
      "use strict";
      init_globals();
      function Vnode(tag, key, attrs, children, text, dom) {
        return { tag, key, attrs, children, text, dom, is: void 0, domSize: void 0, state: void 0, events: void 0, instance: void 0 };
      }
      Vnode.normalize = function(node) {
        if (Array.isArray(node)) return Vnode("[", void 0, void 0, Vnode.normalizeChildren(node), void 0, void 0);
        if (node == null || typeof node === "boolean") return null;
        if (typeof node === "object") return node;
        return Vnode("#", void 0, void 0, String(node), void 0, void 0);
      };
      Vnode.normalizeChildren = function(input) {
        var children = new Array(input.length);
        var numKeyed = 0;
        for (var i = 0; i < input.length; i++) {
          children[i] = Vnode.normalize(input[i]);
          if (children[i] !== null && children[i].key != null) numKeyed++;
        }
        if (numKeyed !== 0 && numKeyed !== input.length) {
          throw new TypeError(
            children.includes(null) ? "In fragments, vnodes must either all have keys or none have keys. You may wish to consider using an explicit keyed empty fragment, m.fragment({key: ...}), instead of a hole." : "In fragments, vnodes must either all have keys or none have keys."
          );
        }
        return children;
      };
      module.exports = Vnode;
    }
  });

  // node_modules/mithril/render/hyperscriptVnode.js
  var require_hyperscriptVnode = __commonJS({
    "node_modules/mithril/render/hyperscriptVnode.js"(exports, module) {
      "use strict";
      init_globals();
      var Vnode = require_vnode();
      module.exports = function(attrs, children) {
        if (attrs == null || typeof attrs === "object" && attrs.tag == null && !Array.isArray(attrs)) {
          if (children.length === 1 && Array.isArray(children[0])) children = children[0];
        } else {
          children = children.length === 0 && Array.isArray(attrs) ? attrs : [attrs, ...children];
          attrs = void 0;
        }
        return Vnode("", attrs && attrs.key, attrs, children);
      };
    }
  });

  // node_modules/mithril/util/hasOwn.js
  var require_hasOwn = __commonJS({
    "node_modules/mithril/util/hasOwn.js"(exports, module) {
      "use strict";
      init_globals();
      module.exports = {}.hasOwnProperty;
    }
  });

  // node_modules/mithril/render/emptyAttrs.js
  var require_emptyAttrs = __commonJS({
    "node_modules/mithril/render/emptyAttrs.js"(exports, module) {
      "use strict";
      init_globals();
      module.exports = {};
    }
  });

  // node_modules/mithril/render/cachedAttrsIsStaticMap.js
  var require_cachedAttrsIsStaticMap = __commonJS({
    "node_modules/mithril/render/cachedAttrsIsStaticMap.js"(exports, module) {
      "use strict";
      init_globals();
      var emptyAttrs = require_emptyAttrs();
      module.exports = /* @__PURE__ */ new Map([[emptyAttrs, true]]);
    }
  });

  // node_modules/mithril/render/hyperscript.js
  var require_hyperscript = __commonJS({
    "node_modules/mithril/render/hyperscript.js"(exports, module) {
      "use strict";
      init_globals();
      var Vnode = require_vnode();
      var hyperscriptVnode = require_hyperscriptVnode();
      var hasOwn = require_hasOwn();
      var emptyAttrs = require_emptyAttrs();
      var cachedAttrsIsStaticMap = require_cachedAttrsIsStaticMap();
      var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g;
      var selectorCache = /* @__PURE__ */ Object.create(null);
      function isEmpty(object) {
        for (var key in object) if (hasOwn.call(object, key)) return false;
        return true;
      }
      function isFormAttributeKey(key) {
        return key === "value" || key === "checked" || key === "selectedIndex" || key === "selected";
      }
      function compileSelector(selector) {
        var match, tag = "div", classes = [], attrs = {}, isStatic = true;
        while (match = selectorParser.exec(selector)) {
          var type = match[1], value = match[2];
          if (type === "" && value !== "") tag = value;
          else if (type === "#") attrs.id = value;
          else if (type === ".") classes.push(value);
          else if (match[3][0] === "[") {
            var attrValue = match[6];
            if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\");
            if (match[4] === "class") classes.push(attrValue);
            else {
              attrs[match[4]] = attrValue === "" ? attrValue : attrValue || true;
              if (isFormAttributeKey(match[4])) isStatic = false;
            }
          }
        }
        if (classes.length > 0) attrs.className = classes.join(" ");
        if (isEmpty(attrs)) attrs = emptyAttrs;
        else cachedAttrsIsStaticMap.set(attrs, isStatic);
        return selectorCache[selector] = { tag, attrs, is: attrs.is };
      }
      function execSelector(state, vnode) {
        vnode.tag = state.tag;
        var attrs = vnode.attrs;
        if (attrs == null) {
          vnode.attrs = state.attrs;
          vnode.is = state.is;
          return vnode;
        }
        if (hasOwn.call(attrs, "class")) {
          if (attrs.class != null) attrs.className = attrs.class;
          attrs.class = null;
        }
        if (state.attrs !== emptyAttrs) {
          var className = attrs.className;
          attrs = Object.assign({}, state.attrs, attrs);
          if (state.attrs.className != null) attrs.className = className != null ? String(state.attrs.className) + " " + String(className) : state.attrs.className;
        }
        if (state.tag === "input" && hasOwn.call(attrs, "type")) {
          attrs = Object.assign({ type: attrs.type }, attrs);
        }
        vnode.is = attrs.is;
        vnode.attrs = attrs;
        return vnode;
      }
      function hyperscript(selector, attrs, ...children) {
        if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
          throw Error("The selector must be either a string or a component.");
        }
        var vnode = hyperscriptVnode(attrs, children);
        if (typeof selector === "string") {
          vnode.children = Vnode.normalizeChildren(vnode.children);
          if (selector !== "[") return execSelector(selectorCache[selector] || compileSelector(selector), vnode);
        }
        if (vnode.attrs == null) vnode.attrs = {};
        vnode.tag = selector;
        return vnode;
      }
      module.exports = hyperscript;
    }
  });

  // node_modules/mithril/render/trust.js
  var require_trust = __commonJS({
    "node_modules/mithril/render/trust.js"(exports, module) {
      "use strict";
      init_globals();
      var Vnode = require_vnode();
      module.exports = function(html) {
        if (html == null) html = "";
        return Vnode("<", void 0, void 0, html, void 0, void 0);
      };
    }
  });

  // node_modules/mithril/render/fragment.js
  var require_fragment = __commonJS({
    "node_modules/mithril/render/fragment.js"(exports, module) {
      "use strict";
      init_globals();
      var Vnode = require_vnode();
      var hyperscriptVnode = require_hyperscriptVnode();
      module.exports = function(attrs, ...children) {
        var vnode = hyperscriptVnode(attrs, children);
        if (vnode.attrs == null) vnode.attrs = {};
        vnode.tag = "[";
        vnode.children = Vnode.normalizeChildren(vnode.children);
        return vnode;
      };
    }
  });

  // node_modules/mithril/hyperscript.js
  var require_hyperscript2 = __commonJS({
    "node_modules/mithril/hyperscript.js"(exports, module) {
      "use strict";
      init_globals();
      var hyperscript = require_hyperscript();
      hyperscript.trust = require_trust();
      hyperscript.fragment = require_fragment();
      module.exports = hyperscript;
    }
  });

  // node_modules/mithril/render/delayedRemoval.js
  var require_delayedRemoval = __commonJS({
    "node_modules/mithril/render/delayedRemoval.js"(exports, module) {
      "use strict";
      init_globals();
      module.exports = /* @__PURE__ */ new WeakMap();
    }
  });

  // node_modules/mithril/render/domFor.js
  var require_domFor = __commonJS({
    "node_modules/mithril/render/domFor.js"(exports, module) {
      "use strict";
      init_globals();
      var delayedRemoval = require_delayedRemoval();
      function* domFor(vnode) {
        var dom = vnode.dom;
        var domSize = vnode.domSize;
        var generation = delayedRemoval.get(dom);
        if (dom != null) do {
          var nextSibling = dom.nextSibling;
          if (delayedRemoval.get(dom) === generation) {
            yield dom;
            domSize--;
          }
          dom = nextSibling;
        } while (domSize);
      }
      module.exports = domFor;
    }
  });

  // node_modules/mithril/render/render.js
  var require_render = __commonJS({
    "node_modules/mithril/render/render.js"(exports, module) {
      "use strict";
      init_globals();
      var Vnode = require_vnode();
      var delayedRemoval = require_delayedRemoval();
      var domFor = require_domFor();
      var cachedAttrsIsStaticMap = require_cachedAttrsIsStaticMap();
      module.exports = function() {
        var nameSpace = {
          svg: "http://www.w3.org/2000/svg",
          math: "http://www.w3.org/1998/Math/MathML"
        };
        var currentRedraw;
        var currentRender;
        function getDocument(dom) {
          return dom.ownerDocument;
        }
        function getNameSpace(vnode) {
          return vnode.attrs && vnode.attrs.xmlns || nameSpace[vnode.tag];
        }
        function checkState(vnode, original) {
          if (vnode.state !== original) throw new Error("'vnode.state' must not be modified.");
        }
        function callHook(vnode) {
          var original = vnode.state;
          try {
            return this.apply(original, arguments);
          } finally {
            checkState(vnode, original);
          }
        }
        function activeElement(dom) {
          try {
            return getDocument(dom).activeElement;
          } catch (e) {
            return null;
          }
        }
        function createNodes(parent, vnodes, start, end, hooks2, nextSibling, ns) {
          for (var i = start; i < end; i++) {
            var vnode = vnodes[i];
            if (vnode != null) {
              createNode(parent, vnode, hooks2, ns, nextSibling);
            }
          }
        }
        function createNode(parent, vnode, hooks2, ns, nextSibling) {
          var tag = vnode.tag;
          if (typeof tag === "string") {
            vnode.state = {};
            if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks2);
            switch (tag) {
              case "#":
                createText(parent, vnode, nextSibling);
                break;
              case "<":
                createHTML(parent, vnode, ns, nextSibling);
                break;
              case "[":
                createFragment(parent, vnode, hooks2, ns, nextSibling);
                break;
              default:
                createElement(parent, vnode, hooks2, ns, nextSibling);
            }
          } else createComponent(parent, vnode, hooks2, ns, nextSibling);
        }
        function createText(parent, vnode, nextSibling) {
          vnode.dom = getDocument(parent).createTextNode(vnode.children);
          insertDOM(parent, vnode.dom, nextSibling);
        }
        var possibleParents = { caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup" };
        function createHTML(parent, vnode, ns, nextSibling) {
          var match = vnode.children.match(/^\s*?<(\w+)/im) || [];
          var temp = getDocument(parent).createElement(possibleParents[match[1]] || "div");
          if (ns === "http://www.w3.org/2000/svg") {
            temp.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + vnode.children + "</svg>";
            temp = temp.firstChild;
          } else {
            temp.innerHTML = vnode.children;
          }
          vnode.dom = temp.firstChild;
          vnode.domSize = temp.childNodes.length;
          var fragment = getDocument(parent).createDocumentFragment();
          var child;
          while (child = temp.firstChild) {
            fragment.appendChild(child);
          }
          insertDOM(parent, fragment, nextSibling);
        }
        function createFragment(parent, vnode, hooks2, ns, nextSibling) {
          var fragment = getDocument(parent).createDocumentFragment();
          if (vnode.children != null) {
            var children = vnode.children;
            createNodes(fragment, children, 0, children.length, hooks2, null, ns);
          }
          vnode.dom = fragment.firstChild;
          vnode.domSize = fragment.childNodes.length;
          insertDOM(parent, fragment, nextSibling);
        }
        function createElement(parent, vnode, hooks2, ns, nextSibling) {
          var tag = vnode.tag;
          var attrs = vnode.attrs;
          var is = vnode.is;
          ns = getNameSpace(vnode) || ns;
          var element = ns ? is ? getDocument(parent).createElementNS(ns, tag, { is }) : getDocument(parent).createElementNS(ns, tag) : is ? getDocument(parent).createElement(tag, { is }) : getDocument(parent).createElement(tag);
          vnode.dom = element;
          if (attrs != null) {
            setAttrs(vnode, attrs, ns);
          }
          insertDOM(parent, element, nextSibling);
          if (!maybeSetContentEditable(vnode)) {
            if (vnode.children != null) {
              var children = vnode.children;
              createNodes(element, children, 0, children.length, hooks2, null, ns);
              if (vnode.tag === "select" && attrs != null) setLateSelectAttrs(vnode, attrs);
            }
          }
        }
        function initComponent(vnode, hooks2) {
          var sentinel;
          if (typeof vnode.tag.view === "function") {
            vnode.state = Object.create(vnode.tag);
            sentinel = vnode.state.view;
            if (sentinel.$$reentrantLock$$ != null) return;
            sentinel.$$reentrantLock$$ = true;
          } else {
            vnode.state = void 0;
            sentinel = vnode.tag;
            if (sentinel.$$reentrantLock$$ != null) return;
            sentinel.$$reentrantLock$$ = true;
            vnode.state = vnode.tag.prototype != null && typeof vnode.tag.prototype.view === "function" ? new vnode.tag(vnode) : vnode.tag(vnode);
          }
          initLifecycle(vnode.state, vnode, hooks2);
          if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks2);
          vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode));
          if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument");
          sentinel.$$reentrantLock$$ = null;
        }
        function createComponent(parent, vnode, hooks2, ns, nextSibling) {
          initComponent(vnode, hooks2);
          if (vnode.instance != null) {
            createNode(parent, vnode.instance, hooks2, ns, nextSibling);
            vnode.dom = vnode.instance.dom;
            vnode.domSize = vnode.instance.domSize;
          } else {
            vnode.domSize = 0;
          }
        }
        function updateNodes(parent, old, vnodes, hooks2, nextSibling, ns) {
          if (old === vnodes || old == null && vnodes == null) return;
          else if (old == null || old.length === 0) createNodes(parent, vnodes, 0, vnodes.length, hooks2, nextSibling, ns);
          else if (vnodes == null || vnodes.length === 0) removeNodes(parent, old, 0, old.length);
          else {
            var isOldKeyed = old[0] != null && old[0].key != null;
            var isKeyed = vnodes[0] != null && vnodes[0].key != null;
            var start = 0, oldStart = 0;
            if (!isOldKeyed) while (oldStart < old.length && old[oldStart] == null) oldStart++;
            if (!isKeyed) while (start < vnodes.length && vnodes[start] == null) start++;
            if (isOldKeyed !== isKeyed) {
              removeNodes(parent, old, oldStart, old.length);
              createNodes(parent, vnodes, start, vnodes.length, hooks2, nextSibling, ns);
            } else if (!isKeyed) {
              var commonLength = old.length < vnodes.length ? old.length : vnodes.length;
              start = start < oldStart ? start : oldStart;
              for (; start < commonLength; start++) {
                o = old[start];
                v = vnodes[start];
                if (o === v || o == null && v == null) continue;
                else if (o == null) createNode(parent, v, hooks2, ns, getNextSibling(old, start + 1, nextSibling));
                else if (v == null) removeNode(parent, o);
                else updateNode(parent, o, v, hooks2, getNextSibling(old, start + 1, nextSibling), ns);
              }
              if (old.length > commonLength) removeNodes(parent, old, start, old.length);
              if (vnodes.length > commonLength) createNodes(parent, vnodes, start, vnodes.length, hooks2, nextSibling, ns);
            } else {
              var oldEnd = old.length - 1, end = vnodes.length - 1, map, o, v, oe, ve, topSibling;
              while (oldEnd >= oldStart && end >= start) {
                oe = old[oldEnd];
                ve = vnodes[end];
                if (oe.key !== ve.key) break;
                if (oe !== ve) updateNode(parent, oe, ve, hooks2, nextSibling, ns);
                if (ve.dom != null) nextSibling = ve.dom;
                oldEnd--, end--;
              }
              while (oldEnd >= oldStart && end >= start) {
                o = old[oldStart];
                v = vnodes[start];
                if (o.key !== v.key) break;
                oldStart++, start++;
                if (o !== v) updateNode(parent, o, v, hooks2, getNextSibling(old, oldStart, nextSibling), ns);
              }
              while (oldEnd >= oldStart && end >= start) {
                if (start === end) break;
                if (o.key !== ve.key || oe.key !== v.key) break;
                topSibling = getNextSibling(old, oldStart, nextSibling);
                moveDOM(parent, oe, topSibling);
                if (oe !== v) updateNode(parent, oe, v, hooks2, topSibling, ns);
                if (++start <= --end) moveDOM(parent, o, nextSibling);
                if (o !== ve) updateNode(parent, o, ve, hooks2, nextSibling, ns);
                if (ve.dom != null) nextSibling = ve.dom;
                oldStart++;
                oldEnd--;
                oe = old[oldEnd];
                ve = vnodes[end];
                o = old[oldStart];
                v = vnodes[start];
              }
              while (oldEnd >= oldStart && end >= start) {
                if (oe.key !== ve.key) break;
                if (oe !== ve) updateNode(parent, oe, ve, hooks2, nextSibling, ns);
                if (ve.dom != null) nextSibling = ve.dom;
                oldEnd--, end--;
                oe = old[oldEnd];
                ve = vnodes[end];
              }
              if (start > end) removeNodes(parent, old, oldStart, oldEnd + 1);
              else if (oldStart > oldEnd) createNodes(parent, vnodes, start, end + 1, hooks2, nextSibling, ns);
              else {
                var originalNextSibling = nextSibling, vnodesLength = end - start + 1, oldIndices = new Array(vnodesLength), li = 0, i = 0, pos = 2147483647, matched = 0, map, lisIndices;
                for (i = 0; i < vnodesLength; i++) oldIndices[i] = -1;
                for (i = end; i >= start; i--) {
                  if (map == null) map = getKeyMap(old, oldStart, oldEnd + 1);
                  ve = vnodes[i];
                  var oldIndex = map[ve.key];
                  if (oldIndex != null) {
                    pos = oldIndex < pos ? oldIndex : -1;
                    oldIndices[i - start] = oldIndex;
                    oe = old[oldIndex];
                    old[oldIndex] = null;
                    if (oe !== ve) updateNode(parent, oe, ve, hooks2, nextSibling, ns);
                    if (ve.dom != null) nextSibling = ve.dom;
                    matched++;
                  }
                }
                nextSibling = originalNextSibling;
                if (matched !== oldEnd - oldStart + 1) removeNodes(parent, old, oldStart, oldEnd + 1);
                if (matched === 0) createNodes(parent, vnodes, start, end + 1, hooks2, nextSibling, ns);
                else {
                  if (pos === -1) {
                    lisIndices = makeLisIndices(oldIndices);
                    li = lisIndices.length - 1;
                    for (i = end; i >= start; i--) {
                      v = vnodes[i];
                      if (oldIndices[i - start] === -1) createNode(parent, v, hooks2, ns, nextSibling);
                      else {
                        if (lisIndices[li] === i - start) li--;
                        else moveDOM(parent, v, nextSibling);
                      }
                      if (v.dom != null) nextSibling = vnodes[i].dom;
                    }
                  } else {
                    for (i = end; i >= start; i--) {
                      v = vnodes[i];
                      if (oldIndices[i - start] === -1) createNode(parent, v, hooks2, ns, nextSibling);
                      if (v.dom != null) nextSibling = vnodes[i].dom;
                    }
                  }
                }
              }
            }
          }
        }
        function updateNode(parent, old, vnode, hooks2, nextSibling, ns) {
          var oldTag = old.tag, tag = vnode.tag;
          if (oldTag === tag && old.is === vnode.is) {
            vnode.state = old.state;
            vnode.events = old.events;
            if (shouldNotUpdate(vnode, old)) return;
            if (typeof oldTag === "string") {
              if (vnode.attrs != null) {
                updateLifecycle(vnode.attrs, vnode, hooks2);
              }
              switch (oldTag) {
                case "#":
                  updateText(old, vnode);
                  break;
                case "<":
                  updateHTML(parent, old, vnode, ns, nextSibling);
                  break;
                case "[":
                  updateFragment(parent, old, vnode, hooks2, nextSibling, ns);
                  break;
                default:
                  updateElement(old, vnode, hooks2, ns);
              }
            } else updateComponent(parent, old, vnode, hooks2, nextSibling, ns);
          } else {
            removeNode(parent, old);
            createNode(parent, vnode, hooks2, ns, nextSibling);
          }
        }
        function updateText(old, vnode) {
          if (old.children.toString() !== vnode.children.toString()) {
            old.dom.nodeValue = vnode.children;
          }
          vnode.dom = old.dom;
        }
        function updateHTML(parent, old, vnode, ns, nextSibling) {
          if (old.children !== vnode.children) {
            removeDOM(parent, old);
            createHTML(parent, vnode, ns, nextSibling);
          } else {
            vnode.dom = old.dom;
            vnode.domSize = old.domSize;
          }
        }
        function updateFragment(parent, old, vnode, hooks2, nextSibling, ns) {
          updateNodes(parent, old.children, vnode.children, hooks2, nextSibling, ns);
          var domSize = 0, children = vnode.children;
          vnode.dom = null;
          if (children != null) {
            for (var i = 0; i < children.length; i++) {
              var child = children[i];
              if (child != null && child.dom != null) {
                if (vnode.dom == null) vnode.dom = child.dom;
                domSize += child.domSize || 1;
              }
            }
          }
          vnode.domSize = domSize;
        }
        function updateElement(old, vnode, hooks2, ns) {
          var element = vnode.dom = old.dom;
          ns = getNameSpace(vnode) || ns;
          if (old.attrs != vnode.attrs || vnode.attrs != null && !cachedAttrsIsStaticMap.get(vnode.attrs)) {
            updateAttrs(vnode, old.attrs, vnode.attrs, ns);
          }
          if (!maybeSetContentEditable(vnode)) {
            updateNodes(element, old.children, vnode.children, hooks2, null, ns);
          }
        }
        function updateComponent(parent, old, vnode, hooks2, nextSibling, ns) {
          vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode));
          if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument");
          updateLifecycle(vnode.state, vnode, hooks2);
          if (vnode.attrs != null) updateLifecycle(vnode.attrs, vnode, hooks2);
          if (vnode.instance != null) {
            if (old.instance == null) createNode(parent, vnode.instance, hooks2, ns, nextSibling);
            else updateNode(parent, old.instance, vnode.instance, hooks2, nextSibling, ns);
            vnode.dom = vnode.instance.dom;
            vnode.domSize = vnode.instance.domSize;
          } else {
            if (old.instance != null) removeNode(parent, old.instance);
            vnode.domSize = 0;
          }
        }
        function getKeyMap(vnodes, start, end) {
          var map = /* @__PURE__ */ Object.create(null);
          for (; start < end; start++) {
            var vnode = vnodes[start];
            if (vnode != null) {
              var key = vnode.key;
              if (key != null) map[key] = start;
            }
          }
          return map;
        }
        var lisTemp = [];
        function makeLisIndices(a) {
          var result = [0];
          var u = 0, v = 0, i = 0;
          var il = lisTemp.length = a.length;
          for (var i = 0; i < il; i++) lisTemp[i] = a[i];
          for (var i = 0; i < il; ++i) {
            if (a[i] === -1) continue;
            var j = result[result.length - 1];
            if (a[j] < a[i]) {
              lisTemp[i] = j;
              result.push(i);
              continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
              var c = (u >>> 1) + (v >>> 1) + (u & v & 1);
              if (a[result[c]] < a[i]) {
                u = c + 1;
              } else {
                v = c;
              }
            }
            if (a[i] < a[result[u]]) {
              if (u > 0) lisTemp[i] = result[u - 1];
              result[u] = i;
            }
          }
          u = result.length;
          v = result[u - 1];
          while (u-- > 0) {
            result[u] = v;
            v = lisTemp[v];
          }
          lisTemp.length = 0;
          return result;
        }
        function getNextSibling(vnodes, i, nextSibling) {
          for (; i < vnodes.length; i++) {
            if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom;
          }
          return nextSibling;
        }
        function moveDOM(parent, vnode, nextSibling) {
          if (vnode.dom != null) {
            var target;
            if (vnode.domSize == null || vnode.domSize === 1) {
              target = vnode.dom;
            } else {
              target = getDocument(parent).createDocumentFragment();
              for (var dom of domFor(vnode)) target.appendChild(dom);
            }
            insertDOM(parent, target, nextSibling);
          }
        }
        function insertDOM(parent, dom, nextSibling) {
          if (nextSibling != null) parent.insertBefore(dom, nextSibling);
          else parent.appendChild(dom);
        }
        function maybeSetContentEditable(vnode) {
          if (vnode.attrs == null || vnode.attrs.contenteditable == null && // attribute
          vnode.attrs.contentEditable == null) return false;
          var children = vnode.children;
          if (children != null && children.length === 1 && children[0].tag === "<") {
            var content = children[0].children;
            if (vnode.dom.innerHTML !== content) vnode.dom.innerHTML = content;
          } else if (children != null && children.length !== 0) throw new Error("Child node of a contenteditable must be trusted.");
          return true;
        }
        function removeNodes(parent, vnodes, start, end) {
          for (var i = start; i < end; i++) {
            var vnode = vnodes[i];
            if (vnode != null) removeNode(parent, vnode);
          }
        }
        function tryBlockRemove(parent, vnode, source, counter) {
          var original = vnode.state;
          var result = callHook.call(source.onbeforeremove, vnode);
          if (result == null) return;
          var generation = currentRender;
          for (var dom of domFor(vnode)) delayedRemoval.set(dom, generation);
          counter.v++;
          Promise.resolve(result).finally(function() {
            checkState(vnode, original);
            tryResumeRemove(parent, vnode, counter);
          });
        }
        function tryResumeRemove(parent, vnode, counter) {
          if (--counter.v === 0) {
            onremove(vnode);
            removeDOM(parent, vnode);
          }
        }
        function removeNode(parent, vnode) {
          var counter = { v: 1 };
          if (typeof vnode.tag !== "string" && typeof vnode.state.onbeforeremove === "function") tryBlockRemove(parent, vnode, vnode.state, counter);
          if (vnode.attrs && typeof vnode.attrs.onbeforeremove === "function") tryBlockRemove(parent, vnode, vnode.attrs, counter);
          tryResumeRemove(parent, vnode, counter);
        }
        function removeDOM(parent, vnode) {
          if (vnode.dom == null) return;
          if (vnode.domSize == null || vnode.domSize === 1) {
            parent.removeChild(vnode.dom);
          } else {
            for (var dom of domFor(vnode)) parent.removeChild(dom);
          }
        }
        function onremove(vnode) {
          if (typeof vnode.tag !== "string" && typeof vnode.state.onremove === "function") callHook.call(vnode.state.onremove, vnode);
          if (vnode.attrs && typeof vnode.attrs.onremove === "function") callHook.call(vnode.attrs.onremove, vnode);
          if (typeof vnode.tag !== "string") {
            if (vnode.instance != null) onremove(vnode.instance);
          } else {
            if (vnode.events != null) vnode.events._ = null;
            var children = vnode.children;
            if (Array.isArray(children)) {
              for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child != null) onremove(child);
              }
            }
          }
        }
        function setAttrs(vnode, attrs, ns) {
          for (var key in attrs) {
            setAttr(vnode, key, null, attrs[key], ns);
          }
        }
        function setAttr(vnode, key, old, value, ns) {
          if (key === "key" || value == null || isLifecycleMethod(key) || old === value && !isFormAttribute(vnode, key) && typeof value !== "object") return;
          if (key[0] === "o" && key[1] === "n") return updateEvent(vnode, key, value);
          if (key.slice(0, 6) === "xlink:") vnode.dom.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(6), value);
          else if (key === "style") updateStyle(vnode.dom, old, value);
          else if (hasPropertyKey(vnode, key, ns)) {
            if (key === "value") {
              if ((vnode.tag === "input" || vnode.tag === "textarea") && vnode.dom.value === "" + value) return;
              if (vnode.tag === "select" && old !== null && vnode.dom.value === "" + value) return;
              if (vnode.tag === "option" && old !== null && vnode.dom.value === "" + value) return;
              if (vnode.tag === "input" && vnode.attrs.type === "file" && "" + value !== "") {
                console.error("`value` is read-only on file inputs!");
                return;
              }
            }
            if (vnode.tag === "input" && key === "type") vnode.dom.setAttribute(key, value);
            else vnode.dom[key] = value;
          } else {
            if (typeof value === "boolean") {
              if (value) vnode.dom.setAttribute(key, "");
              else vnode.dom.removeAttribute(key);
            } else vnode.dom.setAttribute(key === "className" ? "class" : key, value);
          }
        }
        function removeAttr(vnode, key, old, ns) {
          if (key === "key" || old == null || isLifecycleMethod(key)) return;
          if (key[0] === "o" && key[1] === "n") updateEvent(vnode, key, void 0);
          else if (key === "style") updateStyle(vnode.dom, old, null);
          else if (hasPropertyKey(vnode, key, ns) && key !== "className" && key !== "title" && !(key === "value" && (vnode.tag === "option" || vnode.tag === "select" && vnode.dom.selectedIndex === -1 && vnode.dom === activeElement(vnode.dom))) && !(vnode.tag === "input" && key === "type")) {
            vnode.dom[key] = null;
          } else {
            var nsLastIndex = key.indexOf(":");
            if (nsLastIndex !== -1) key = key.slice(nsLastIndex + 1);
            if (old !== false) vnode.dom.removeAttribute(key === "className" ? "class" : key);
          }
        }
        function setLateSelectAttrs(vnode, attrs) {
          if ("value" in attrs) {
            if (attrs.value === null) {
              if (vnode.dom.selectedIndex !== -1) vnode.dom.value = null;
            } else {
              var normalized = "" + attrs.value;
              if (vnode.dom.value !== normalized || vnode.dom.selectedIndex === -1) {
                vnode.dom.value = normalized;
              }
            }
          }
          if ("selectedIndex" in attrs) setAttr(vnode, "selectedIndex", null, attrs.selectedIndex, void 0);
        }
        function updateAttrs(vnode, old, attrs, ns) {
          var val;
          if (old != null) {
            if (old === attrs && !cachedAttrsIsStaticMap.has(attrs)) {
              console.warn("Don't reuse attrs object, use new object for every redraw, this will throw in next major");
            }
            for (var key in old) {
              if ((val = old[key]) != null && (attrs == null || attrs[key] == null)) {
                removeAttr(vnode, key, val, ns);
              }
            }
          }
          if (attrs != null) {
            for (var key in attrs) {
              setAttr(vnode, key, old && old[key], attrs[key], ns);
            }
          }
        }
        function isFormAttribute(vnode, attr) {
          return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && (vnode.dom === activeElement(vnode.dom) || vnode.tag === "option" && vnode.dom.parentNode === activeElement(vnode.dom));
        }
        function isLifecycleMethod(attr) {
          return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate";
        }
        function hasPropertyKey(vnode, key, ns) {
          return ns === void 0 && // If it's a custom element, just keep it.
          (vnode.tag.indexOf("-") > -1 || vnode.is || // If it's a normal element, let's try to avoid a few browser bugs.
          key !== "href" && key !== "list" && key !== "form" && key !== "width" && key !== "height") && key in vnode.dom;
        }
        function updateStyle(element, old, style) {
          if (old === style) {
          } else if (style == null) {
            element.style = "";
          } else if (typeof style !== "object") {
            element.style = style;
          } else if (old == null || typeof old !== "object") {
            element.style = "";
            for (var key in style) {
              var value = style[key];
              if (value != null) {
                if (key.includes("-")) element.style.setProperty(key, String(value));
                else element.style[key] = String(value);
              }
            }
          } else {
            for (var key in old) {
              if (old[key] != null && style[key] == null) {
                if (key.includes("-")) element.style.removeProperty(key);
                else element.style[key] = "";
              }
            }
            for (var key in style) {
              var value = style[key];
              if (value != null && (value = String(value)) !== String(old[key])) {
                if (key.includes("-")) element.style.setProperty(key, value);
                else element.style[key] = value;
              }
            }
          }
        }
        function EventDict() {
          this._ = currentRedraw;
        }
        EventDict.prototype = /* @__PURE__ */ Object.create(null);
        EventDict.prototype.handleEvent = function(ev) {
          var handler = this["on" + ev.type];
          var result;
          if (typeof handler === "function") result = handler.call(ev.currentTarget, ev);
          else if (typeof handler.handleEvent === "function") handler.handleEvent(ev);
          var self = this;
          if (self._ != null) {
            if (ev.redraw !== false) (0, self._)();
            if (result != null && typeof result.then === "function") {
              Promise.resolve(result).then(function() {
                if (self._ != null && ev.redraw !== false) (0, self._)();
              });
            }
          }
          if (result === false) {
            ev.preventDefault();
            ev.stopPropagation();
          }
        };
        function updateEvent(vnode, key, value) {
          if (vnode.events != null) {
            vnode.events._ = currentRedraw;
            if (vnode.events[key] === value) return;
            if (value != null && (typeof value === "function" || typeof value === "object")) {
              if (vnode.events[key] == null) vnode.dom.addEventListener(key.slice(2), vnode.events, false);
              vnode.events[key] = value;
            } else {
              if (vnode.events[key] != null) vnode.dom.removeEventListener(key.slice(2), vnode.events, false);
              vnode.events[key] = void 0;
            }
          } else if (value != null && (typeof value === "function" || typeof value === "object")) {
            vnode.events = new EventDict();
            vnode.dom.addEventListener(key.slice(2), vnode.events, false);
            vnode.events[key] = value;
          }
        }
        function initLifecycle(source, vnode, hooks2) {
          if (typeof source.oninit === "function") callHook.call(source.oninit, vnode);
          if (typeof source.oncreate === "function") hooks2.push(callHook.bind(source.oncreate, vnode));
        }
        function updateLifecycle(source, vnode, hooks2) {
          if (typeof source.onupdate === "function") hooks2.push(callHook.bind(source.onupdate, vnode));
        }
        function shouldNotUpdate(vnode, old) {
          do {
            if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") {
              var force = callHook.call(vnode.attrs.onbeforeupdate, vnode, old);
              if (force !== void 0 && !force) break;
            }
            if (typeof vnode.tag !== "string" && typeof vnode.state.onbeforeupdate === "function") {
              var force = callHook.call(vnode.state.onbeforeupdate, vnode, old);
              if (force !== void 0 && !force) break;
            }
            return false;
          } while (false);
          vnode.dom = old.dom;
          vnode.domSize = old.domSize;
          vnode.instance = old.instance;
          vnode.attrs = old.attrs;
          vnode.children = old.children;
          vnode.text = old.text;
          return true;
        }
        var currentDOM;
        return function(dom, vnodes, redraw) {
          if (!dom) throw new TypeError("DOM element being rendered to does not exist.");
          if (currentDOM != null && dom.contains(currentDOM)) {
            throw new TypeError("Node is currently being rendered to and thus is locked.");
          }
          var prevRedraw = currentRedraw;
          var prevDOM = currentDOM;
          var hooks2 = [];
          var active = activeElement(dom);
          var namespace = dom.namespaceURI;
          currentDOM = dom;
          currentRedraw = typeof redraw === "function" ? redraw : void 0;
          currentRender = {};
          try {
            if (dom.vnodes == null) dom.textContent = "";
            vnodes = Vnode.normalizeChildren(Array.isArray(vnodes) ? vnodes : [vnodes]);
            updateNodes(dom, dom.vnodes, vnodes, hooks2, null, namespace === "http://www.w3.org/1999/xhtml" ? void 0 : namespace);
            dom.vnodes = vnodes;
            if (active != null && activeElement(dom) !== active && typeof active.focus === "function") active.focus();
            for (var i = 0; i < hooks2.length; i++) hooks2[i]();
          } finally {
            currentRedraw = prevRedraw;
            currentDOM = prevDOM;
          }
        };
      };
    }
  });

  // node_modules/mithril/render.js
  var require_render2 = __commonJS({
    "node_modules/mithril/render.js"(exports, module) {
      "use strict";
      init_globals();
      module.exports = require_render()();
    }
  });

  // node_modules/mithril/api/mount-redraw.js
  var require_mount_redraw = __commonJS({
    "node_modules/mithril/api/mount-redraw.js"(exports, module) {
      "use strict";
      init_globals();
      var Vnode = require_vnode();
      module.exports = function(render, schedule, console2) {
        var subscriptions = [];
        var pending = false;
        var offset = -1;
        function sync() {
          for (offset = 0; offset < subscriptions.length; offset += 2) {
            try {
              render(subscriptions[offset], Vnode(subscriptions[offset + 1]), redraw);
            } catch (e) {
              console2.error(e);
            }
          }
          offset = -1;
        }
        function redraw() {
          if (!pending) {
            pending = true;
            schedule(function() {
              pending = false;
              sync();
            });
          }
        }
        redraw.sync = sync;
        function mount(root2, component) {
          if (component != null && component.view == null && typeof component !== "function") {
            throw new TypeError("m.mount expects a component, not a vnode.");
          }
          var index = subscriptions.indexOf(root2);
          if (index >= 0) {
            subscriptions.splice(index, 2);
            if (index <= offset) offset -= 2;
            render(root2, []);
          }
          if (component != null) {
            subscriptions.push(root2, component);
            render(root2, Vnode(component), redraw);
          }
        }
        return { mount, redraw };
      };
    }
  });

  // node_modules/mithril/mount-redraw.js
  var require_mount_redraw2 = __commonJS({
    "node_modules/mithril/mount-redraw.js"(exports, module) {
      "use strict";
      init_globals();
      var render = require_render2();
      module.exports = require_mount_redraw()(render, typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null, typeof console !== "undefined" ? console : null);
    }
  });

  // node_modules/mithril/querystring/build.js
  var require_build = __commonJS({
    "node_modules/mithril/querystring/build.js"(exports, module) {
      "use strict";
      init_globals();
      module.exports = function(object) {
        if (Object.prototype.toString.call(object) !== "[object Object]") return "";
        var args = [];
        for (var key in object) {
          destructure(key, object[key]);
        }
        return args.join("&");
        function destructure(key2, value) {
          if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
              destructure(key2 + "[" + i + "]", value[i]);
            }
          } else if (Object.prototype.toString.call(value) === "[object Object]") {
            for (var i in value) {
              destructure(key2 + "[" + i + "]", value[i]);
            }
          } else args.push(encodeURIComponent(key2) + (value != null && value !== "" ? "=" + encodeURIComponent(value) : ""));
        }
      };
    }
  });

  // node_modules/mithril/pathname/build.js
  var require_build2 = __commonJS({
    "node_modules/mithril/pathname/build.js"(exports, module) {
      "use strict";
      init_globals();
      var buildQueryString = require_build();
      module.exports = function(template, params) {
        if (/:([^\/\.-]+)(\.{3})?:/.test(template)) {
          throw new SyntaxError("Template parameter names must be separated by either a '/', '-', or '.'.");
        }
        if (params == null) return template;
        var queryIndex = template.indexOf("?");
        var hashIndex = template.indexOf("#");
        var queryEnd = hashIndex < 0 ? template.length : hashIndex;
        var pathEnd = queryIndex < 0 ? queryEnd : queryIndex;
        var path = template.slice(0, pathEnd);
        var query = {};
        Object.assign(query, params);
        var resolved = path.replace(/:([^\/\.-]+)(\.{3})?/g, function(m2, key, variadic) {
          delete query[key];
          if (params[key] == null) return m2;
          return variadic ? params[key] : encodeURIComponent(String(params[key]));
        });
        var newQueryIndex = resolved.indexOf("?");
        var newHashIndex = resolved.indexOf("#");
        var newQueryEnd = newHashIndex < 0 ? resolved.length : newHashIndex;
        var newPathEnd = newQueryIndex < 0 ? newQueryEnd : newQueryIndex;
        var result = resolved.slice(0, newPathEnd);
        if (queryIndex >= 0) result += template.slice(queryIndex, queryEnd);
        if (newQueryIndex >= 0) result += (queryIndex < 0 ? "?" : "&") + resolved.slice(newQueryIndex, newQueryEnd);
        var querystring = buildQueryString(query);
        if (querystring) result += (queryIndex < 0 && newQueryIndex < 0 ? "?" : "&") + querystring;
        if (hashIndex >= 0) result += template.slice(hashIndex);
        if (newHashIndex >= 0) result += (hashIndex < 0 ? "" : "&") + resolved.slice(newHashIndex);
        return result;
      };
    }
  });

  // node_modules/mithril/request/request.js
  var require_request = __commonJS({
    "node_modules/mithril/request/request.js"(exports, module) {
      "use strict";
      init_globals();
      var buildPathname = require_build2();
      var hasOwn = require_hasOwn();
      module.exports = function($window, oncompletion) {
        function PromiseProxy(executor) {
          return new Promise(executor);
        }
        function makeRequest2(url, args) {
          return new Promise(function(resolve, reject) {
            url = buildPathname(url, args.params);
            var method = args.method != null ? args.method.toUpperCase() : "GET";
            var body = args.body;
            var assumeJSON = (args.serialize == null || args.serialize === JSON.serialize) && !(body instanceof $window.FormData || body instanceof $window.URLSearchParams);
            var responseType = args.responseType || (typeof args.extract === "function" ? "" : "json");
            var xhr = new $window.XMLHttpRequest(), aborted = false, isTimeout = false;
            var original = xhr, replacedAbort;
            var abort = xhr.abort;
            xhr.abort = function() {
              aborted = true;
              abort.call(this);
            };
            xhr.open(method, url, args.async !== false, typeof args.user === "string" ? args.user : void 0, typeof args.password === "string" ? args.password : void 0);
            if (assumeJSON && body != null && !hasHeader(args, "content-type")) {
              xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            }
            if (typeof args.deserialize !== "function" && !hasHeader(args, "accept")) {
              xhr.setRequestHeader("Accept", "application/json, text/*");
            }
            if (args.withCredentials) xhr.withCredentials = args.withCredentials;
            if (args.timeout) xhr.timeout = args.timeout;
            xhr.responseType = responseType;
            for (var key in args.headers) {
              if (hasOwn.call(args.headers, key)) {
                xhr.setRequestHeader(key, args.headers[key]);
              }
            }
            xhr.onreadystatechange = function(ev) {
              if (aborted) return;
              if (ev.target.readyState === 4) {
                try {
                  var success = ev.target.status >= 200 && ev.target.status < 300 || ev.target.status === 304 || /^file:\/\//i.test(url);
                  var response = ev.target.response, message;
                  if (responseType === "json") {
                    if (!ev.target.responseType && typeof args.extract !== "function") {
                      try {
                        response = JSON.parse(ev.target.responseText);
                      } catch (e) {
                        response = null;
                      }
                    }
                  } else if (!responseType || responseType === "text") {
                    if (response == null) response = ev.target.responseText;
                  }
                  if (typeof args.extract === "function") {
                    response = args.extract(ev.target, args);
                    success = true;
                  } else if (typeof args.deserialize === "function") {
                    response = args.deserialize(response);
                  }
                  if (success) {
                    if (typeof args.type === "function") {
                      if (Array.isArray(response)) {
                        for (var i = 0; i < response.length; i++) {
                          response[i] = new args.type(response[i]);
                        }
                      } else response = new args.type(response);
                    }
                    resolve(response);
                  } else {
                    var completeErrorResponse = function() {
                      try {
                        message = ev.target.responseText;
                      } catch (e) {
                        message = response;
                      }
                      var error = new Error(message);
                      error.code = ev.target.status;
                      error.response = response;
                      reject(error);
                    };
                    if (xhr.status === 0) {
                      setTimeout(function() {
                        if (isTimeout) return;
                        completeErrorResponse();
                      });
                    } else completeErrorResponse();
                  }
                } catch (e) {
                  reject(e);
                }
              }
            };
            xhr.ontimeout = function(ev) {
              isTimeout = true;
              var error = new Error("Request timed out");
              error.code = ev.target.status;
              reject(error);
            };
            if (typeof args.config === "function") {
              xhr = args.config(xhr, args, url) || xhr;
              if (xhr !== original) {
                replacedAbort = xhr.abort;
                xhr.abort = function() {
                  aborted = true;
                  replacedAbort.call(this);
                };
              }
            }
            if (body == null) xhr.send();
            else if (typeof args.serialize === "function") xhr.send(args.serialize(body));
            else if (body instanceof $window.FormData || body instanceof $window.URLSearchParams) xhr.send(body);
            else xhr.send(JSON.stringify(body));
          });
        }
        PromiseProxy.prototype = Promise.prototype;
        PromiseProxy.__proto__ = Promise;
        function hasHeader(args, name) {
          for (var key in args.headers) {
            if (hasOwn.call(args.headers, key) && key.toLowerCase() === name) return true;
          }
          return false;
        }
        return {
          request: function(url, args) {
            if (typeof url !== "string") {
              args = url;
              url = url.url;
            } else if (args == null) args = {};
            var promise = makeRequest2(url, args);
            if (args.background === true) return promise;
            var count = 0;
            function complete() {
              if (--count === 0 && typeof oncompletion === "function") oncompletion();
            }
            return wrap(promise);
            function wrap(promise2) {
              var then = promise2.then;
              promise2.constructor = PromiseProxy;
              promise2.then = function() {
                count++;
                var next = then.apply(promise2, arguments);
                next.then(complete, function(e) {
                  complete();
                  if (count === 0) throw e;
                });
                return wrap(next);
              };
              return promise2;
            }
          }
        };
      };
    }
  });

  // node_modules/mithril/request.js
  var require_request2 = __commonJS({
    "node_modules/mithril/request.js"(exports, module) {
      "use strict";
      init_globals();
      var mountRedraw = require_mount_redraw2();
      module.exports = require_request()(typeof window !== "undefined" ? window : null, mountRedraw.redraw);
    }
  });

  // node_modules/mithril/util/decodeURIComponentSafe.js
  var require_decodeURIComponentSafe = __commonJS({
    "node_modules/mithril/util/decodeURIComponentSafe.js"(exports, module) {
      "use strict";
      init_globals();
      var validUtf8Encodings = /%(?:[0-7]|(?!c[01]|e0%[89]|ed%[ab]|f0%8|f4%[9ab])(?:c|d|(?:e|f[0-4]%[89ab])[\da-f]%[89ab])[\da-f]%[89ab])[\da-f]/gi;
      module.exports = function(str) {
        return String(str).replace(validUtf8Encodings, decodeURIComponent);
      };
    }
  });

  // node_modules/mithril/querystring/parse.js
  var require_parse = __commonJS({
    "node_modules/mithril/querystring/parse.js"(exports, module) {
      "use strict";
      init_globals();
      var decodeURIComponentSafe = require_decodeURIComponentSafe();
      module.exports = function(string) {
        if (string === "" || string == null) return {};
        if (string.charAt(0) === "?") string = string.slice(1);
        var entries = string.split("&"), counters = {}, data = {};
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i].split("=");
          var key = decodeURIComponentSafe(entry[0]);
          var value = entry.length === 2 ? decodeURIComponentSafe(entry[1]) : "";
          if (value === "true") value = true;
          else if (value === "false") value = false;
          var levels = key.split(/\]\[?|\[/);
          var cursor = data;
          if (key.indexOf("[") > -1) levels.pop();
          for (var j = 0; j < levels.length; j++) {
            var level = levels[j], nextLevel = levels[j + 1];
            var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10));
            if (level === "") {
              var key = levels.slice(0, j).join();
              if (counters[key] == null) {
                counters[key] = Array.isArray(cursor) ? cursor.length : 0;
              }
              level = counters[key]++;
            } else if (level === "__proto__") break;
            if (j === levels.length - 1) cursor[level] = value;
            else {
              var desc = Object.getOwnPropertyDescriptor(cursor, level);
              if (desc != null) desc = desc.value;
              if (desc == null) cursor[level] = desc = isNumber ? [] : {};
              cursor = desc;
            }
          }
        }
        return data;
      };
    }
  });

  // node_modules/mithril/pathname/parse.js
  var require_parse2 = __commonJS({
    "node_modules/mithril/pathname/parse.js"(exports, module) {
      "use strict";
      init_globals();
      var parseQueryString = require_parse();
      module.exports = function(url) {
        var queryIndex = url.indexOf("?");
        var hashIndex = url.indexOf("#");
        var queryEnd = hashIndex < 0 ? url.length : hashIndex;
        var pathEnd = queryIndex < 0 ? queryEnd : queryIndex;
        var path = url.slice(0, pathEnd).replace(/\/{2,}/g, "/");
        if (!path) path = "/";
        else {
          if (path[0] !== "/") path = "/" + path;
        }
        return {
          path,
          params: queryIndex < 0 ? {} : parseQueryString(url.slice(queryIndex + 1, queryEnd))
        };
      };
    }
  });

  // node_modules/mithril/pathname/compileTemplate.js
  var require_compileTemplate = __commonJS({
    "node_modules/mithril/pathname/compileTemplate.js"(exports, module) {
      "use strict";
      init_globals();
      var parsePathname = require_parse2();
      module.exports = function(template) {
        var templateData = parsePathname(template);
        var templateKeys = Object.keys(templateData.params);
        var keys = [];
        var regexp = new RegExp("^" + templateData.path.replace(
          // I escape literal text so people can use things like `:file.:ext` or
          // `:lang-:locale` in routes. This is all merged into one pass so I
          // don't also accidentally escape `-` and make it harder to detect it to
          // ban it from template parameters.
          /:([^\/.-]+)(\.{3}|\.(?!\.)|-)?|[\\^$*+.()|\[\]{}]/g,
          function(m2, key, extra) {
            if (key == null) return "\\" + m2;
            keys.push({ k: key, r: extra === "..." });
            if (extra === "...") return "(.*)";
            if (extra === ".") return "([^/]+)\\.";
            return "([^/]+)" + (extra || "");
          }
        ) + "\\/?$");
        return function(data) {
          for (var i = 0; i < templateKeys.length; i++) {
            if (templateData.params[templateKeys[i]] !== data.params[templateKeys[i]]) return false;
          }
          if (!keys.length) return regexp.test(data.path);
          var values = regexp.exec(data.path);
          if (values == null) return false;
          for (var i = 0; i < keys.length; i++) {
            data.params[keys[i].k] = keys[i].r ? values[i + 1] : decodeURIComponent(values[i + 1]);
          }
          return true;
        };
      };
    }
  });

  // node_modules/mithril/util/censor.js
  var require_censor = __commonJS({
    "node_modules/mithril/util/censor.js"(exports, module) {
      "use strict";
      init_globals();
      var hasOwn = require_hasOwn();
      var magic = /^(?:key|oninit|oncreate|onbeforeupdate|onupdate|onbeforeremove|onremove)$/;
      module.exports = function(attrs, extras) {
        var result = {};
        if (extras != null) {
          for (var key in attrs) {
            if (hasOwn.call(attrs, key) && !magic.test(key) && extras.indexOf(key) < 0) {
              result[key] = attrs[key];
            }
          }
        } else {
          for (var key in attrs) {
            if (hasOwn.call(attrs, key) && !magic.test(key)) {
              result[key] = attrs[key];
            }
          }
        }
        return result;
      };
    }
  });

  // node_modules/mithril/api/router.js
  var require_router = __commonJS({
    "node_modules/mithril/api/router.js"(exports, module) {
      "use strict";
      init_globals();
      var Vnode = require_vnode();
      var hyperscript = require_hyperscript();
      var decodeURIComponentSafe = require_decodeURIComponentSafe();
      var buildPathname = require_build2();
      var parsePathname = require_parse2();
      var compileTemplate = require_compileTemplate();
      var censor = require_censor();
      module.exports = function($window, mountRedraw) {
        var p = Promise.resolve();
        var scheduled = false;
        var ready = false;
        var hasBeenResolved = false;
        var dom, compiled, fallbackRoute;
        var currentResolver, component, attrs, currentPath, lastUpdate;
        var RouterRoot = {
          onremove: function() {
            ready = hasBeenResolved = false;
            $window.removeEventListener("popstate", fireAsync, false);
          },
          view: function() {
            var vnode = Vnode(component, attrs.key, attrs);
            if (currentResolver) return currentResolver.render(vnode);
            return [vnode];
          }
        };
        var SKIP = route.SKIP = {};
        function resolveRoute() {
          scheduled = false;
          var prefix = $window.location.hash;
          if (route.prefix[0] !== "#") {
            prefix = $window.location.search + prefix;
            if (route.prefix[0] !== "?") {
              prefix = $window.location.pathname + prefix;
              if (prefix[0] !== "/") prefix = "/" + prefix;
            }
          }
          var path = decodeURIComponentSafe(prefix).slice(route.prefix.length);
          var data = parsePathname(path);
          Object.assign(data.params, $window.history.state);
          function reject(e) {
            console.error(e);
            route.set(fallbackRoute, null, { replace: true });
          }
          loop(0);
          function loop(i) {
            for (; i < compiled.length; i++) {
              if (compiled[i].check(data)) {
                var payload = compiled[i].component;
                var matchedRoute = compiled[i].route;
                var localComp = payload;
                var update = lastUpdate = function(comp) {
                  if (update !== lastUpdate) return;
                  if (comp === SKIP) return loop(i + 1);
                  component = comp != null && (typeof comp.view === "function" || typeof comp === "function") ? comp : "div";
                  attrs = data.params, currentPath = path, lastUpdate = null;
                  currentResolver = payload.render ? payload : null;
                  if (hasBeenResolved) mountRedraw.redraw();
                  else {
                    hasBeenResolved = true;
                    mountRedraw.mount(dom, RouterRoot);
                  }
                };
                if (payload.view || typeof payload === "function") {
                  payload = {};
                  update(localComp);
                } else if (payload.onmatch) {
                  p.then(function() {
                    return payload.onmatch(data.params, path, matchedRoute);
                  }).then(update, path === fallbackRoute ? null : reject);
                } else update(
                  /* "div" */
                );
                return;
              }
            }
            if (path === fallbackRoute) {
              throw new Error("Could not resolve default route " + fallbackRoute + ".");
            }
            route.set(fallbackRoute, null, { replace: true });
          }
        }
        function fireAsync() {
          if (!scheduled) {
            scheduled = true;
            setTimeout(resolveRoute);
          }
        }
        function route(root2, defaultRoute, routes) {
          if (!root2) throw new TypeError("DOM element being rendered to does not exist.");
          compiled = Object.keys(routes).map(function(route2) {
            if (route2[0] !== "/") throw new SyntaxError("Routes must start with a '/'.");
            if (/:([^\/\.-]+)(\.{3})?:/.test(route2)) {
              throw new SyntaxError("Route parameter names must be separated with either '/', '.', or '-'.");
            }
            return {
              route: route2,
              component: routes[route2],
              check: compileTemplate(route2)
            };
          });
          fallbackRoute = defaultRoute;
          if (defaultRoute != null) {
            var defaultData = parsePathname(defaultRoute);
            if (!compiled.some(function(i) {
              return i.check(defaultData);
            })) {
              throw new ReferenceError("Default route doesn't match any known routes.");
            }
          }
          dom = root2;
          $window.addEventListener("popstate", fireAsync, false);
          ready = true;
          resolveRoute();
        }
        route.set = function(path, data, options) {
          if (lastUpdate != null) {
            options = options || {};
            options.replace = true;
          }
          lastUpdate = null;
          path = buildPathname(path, data);
          if (ready) {
            fireAsync();
            var state = options ? options.state : null;
            var title = options ? options.title : null;
            if (options && options.replace) $window.history.replaceState(state, title, route.prefix + path);
            else $window.history.pushState(state, title, route.prefix + path);
          } else {
            $window.location.href = route.prefix + path;
          }
        };
        route.get = function() {
          return currentPath;
        };
        route.prefix = "#!";
        route.Link = {
          view: function(vnode) {
            var child = hyperscript(
              vnode.attrs.selector || "a",
              censor(vnode.attrs, ["options", "params", "selector", "onclick"]),
              vnode.children
            );
            var options, onclick, href;
            if (child.attrs.disabled = Boolean(child.attrs.disabled)) {
              child.attrs.href = null;
              child.attrs["aria-disabled"] = "true";
            } else {
              options = vnode.attrs.options;
              onclick = vnode.attrs.onclick;
              href = buildPathname(child.attrs.href, vnode.attrs.params);
              child.attrs.href = route.prefix + href;
              child.attrs.onclick = function(e) {
                var result;
                if (typeof onclick === "function") {
                  result = onclick.call(e.currentTarget, e);
                } else if (onclick == null || typeof onclick !== "object") {
                } else if (typeof onclick.handleEvent === "function") {
                  onclick.handleEvent(e);
                }
                if (
                  // Skip if `onclick` prevented default
                  result !== false && !e.defaultPrevented && // Ignore everything but left clicks
                  (e.button === 0 || e.which === 0 || e.which === 1) && // Let the browser handle `target=_blank`, etc.
                  (!e.currentTarget.target || e.currentTarget.target === "_self") && // No modifier keys
                  !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
                ) {
                  e.preventDefault();
                  e.redraw = false;
                  route.set(href, null, options);
                }
              };
            }
            return child;
          }
        };
        route.param = function(key) {
          return attrs && key != null ? attrs[key] : attrs;
        };
        return route;
      };
    }
  });

  // node_modules/mithril/route.js
  var require_route = __commonJS({
    "node_modules/mithril/route.js"(exports, module) {
      "use strict";
      init_globals();
      var mountRedraw = require_mount_redraw2();
      module.exports = require_router()(typeof window !== "undefined" ? window : null, mountRedraw);
    }
  });

  // node_modules/mithril/index.js
  var require_mithril = __commonJS({
    "node_modules/mithril/index.js"(exports, module) {
      "use strict";
      init_globals();
      var hyperscript = require_hyperscript2();
      var mountRedraw = require_mount_redraw2();
      var request2 = require_request2();
      var router = require_route();
      var m2 = function m3() {
        return hyperscript.apply(this, arguments);
      };
      m2.m = hyperscript;
      m2.trust = hyperscript.trust;
      m2.fragment = hyperscript.fragment;
      m2.Fragment = "[";
      m2.mount = mountRedraw.mount;
      m2.route = router;
      m2.render = require_render2();
      m2.redraw = mountRedraw.redraw;
      m2.request = request2.request;
      m2.parseQueryString = require_parse();
      m2.buildQueryString = require_build();
      m2.parsePathname = require_parse2();
      m2.buildPathname = require_build2();
      m2.vnode = require_vnode();
      m2.censor = require_censor();
      m2.domFor = require_domFor();
      module.exports = m2;
    }
  });

  // node_modules/jquery/dist/jquery.js
  var require_jquery = __commonJS({
    "node_modules/jquery/dist/jquery.js"(exports, module) {
      init_globals();
      (function(global, factory) {
        "use strict";
        if (typeof module === "object" && typeof module.exports === "object") {
          module.exports = global.document ? factory(global, true) : function(w) {
            if (!w.document) {
              throw new Error("jQuery requires a window with a document");
            }
            return factory(w);
          };
        } else {
          factory(global);
        }
      })(typeof window !== "undefined" ? window : exports, function(window2, noGlobal) {
        "use strict";
        var arr = [];
        var getProto = Object.getPrototypeOf;
        var slice = arr.slice;
        var flat = arr.flat ? function(array) {
          return arr.flat.call(array);
        } : function(array) {
          return arr.concat.apply([], array);
        };
        var push = arr.push;
        var indexOf = arr.indexOf;
        var class2type = {};
        var toString = class2type.toString;
        var hasOwn = class2type.hasOwnProperty;
        var fnToString = hasOwn.toString;
        var ObjectFunctionString = fnToString.call(Object);
        var support = {};
        var isFunction = function isFunction2(obj) {
          return typeof obj === "function" && typeof obj.nodeType !== "number" && typeof obj.item !== "function";
        };
        var isWindow = function isWindow2(obj) {
          return obj != null && obj === obj.window;
        };
        var document2 = window2.document;
        var preservedScriptAttributes = {
          type: true,
          src: true,
          nonce: true,
          noModule: true
        };
        function DOMEval(code, node, doc) {
          doc = doc || document2;
          var i, val, script = doc.createElement("script");
          script.text = code;
          if (node) {
            for (i in preservedScriptAttributes) {
              val = node[i] || node.getAttribute && node.getAttribute(i);
              if (val) {
                script.setAttribute(i, val);
              }
            }
          }
          if (doc.head.appendChild(script).parentNode) {
            script.parentNode.removeChild(script);
          }
        }
        function toType(obj) {
          if (obj == null) {
            return obj + "";
          }
          return typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj;
        }
        var version = "3.8.0", rhtmlSuffix = /HTML$/i, jQuery = function(selector, context) {
          return new jQuery.fn.init(selector, context);
        };
        jQuery.fn = jQuery.prototype = {
          // The current version of jQuery being used
          jquery: version,
          constructor: jQuery,
          // The default length of a jQuery object is 0
          length: 0,
          toArray: function() {
            return slice.call(this);
          },
          // Get the Nth element in the matched element set OR
          // Get the whole matched element set as a clean array
          get: function(num) {
            if (num == null) {
              return slice.call(this);
            }
            return num < 0 ? this[num + this.length] : this[num];
          },
          // Take an array of elements and push it onto the stack
          // (returning the new matched element set)
          pushStack: function(elems) {
            var ret = jQuery.merge(this.constructor(), elems);
            ret.prevObject = this;
            return ret;
          },
          // Execute a callback for every element in the matched set.
          each: function(callback) {
            return jQuery.each(this, callback);
          },
          map: function(callback) {
            return this.pushStack(jQuery.map(this, function(elem, i) {
              return callback.call(elem, i, elem);
            }));
          },
          slice: function() {
            return this.pushStack(slice.apply(this, arguments));
          },
          first: function() {
            return this.eq(0);
          },
          last: function() {
            return this.eq(-1);
          },
          even: function() {
            return this.pushStack(jQuery.grep(this, function(_elem, i) {
              return (i + 1) % 2;
            }));
          },
          odd: function() {
            return this.pushStack(jQuery.grep(this, function(_elem, i) {
              return i % 2;
            }));
          },
          eq: function(i) {
            var len = this.length, j = +i + (i < 0 ? len : 0);
            return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
          },
          end: function() {
            return this.prevObject || this.constructor();
          }
        };
        jQuery.extend = jQuery.fn.extend = function() {
          var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
          if (typeof target === "boolean") {
            deep = target;
            target = arguments[i] || {};
            i++;
          }
          if (typeof target !== "object" && !isFunction(target)) {
            target = {};
          }
          if (i === length) {
            target = this;
            i--;
          }
          for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
              for (name in options) {
                copy = options[name];
                if (name === "__proto__" || target === copy) {
                  continue;
                }
                if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                  src = target[name];
                  if (copyIsArray && !Array.isArray(src)) {
                    clone = [];
                  } else if (!copyIsArray && !jQuery.isPlainObject(src)) {
                    clone = {};
                  } else {
                    clone = src;
                  }
                  copyIsArray = false;
                  target[name] = jQuery.extend(deep, clone, copy);
                } else if (copy !== void 0) {
                  target[name] = copy;
                }
              }
            }
          }
          return target;
        };
        jQuery.extend({
          // Unique for each copy of jQuery on the page
          expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
          // Assume jQuery is ready without the ready module
          isReady: true,
          error: function(msg) {
            throw new Error(msg);
          },
          noop: function() {
          },
          isPlainObject: function(obj) {
            var proto, Ctor;
            if (!obj || toString.call(obj) !== "[object Object]") {
              return false;
            }
            proto = getProto(obj);
            if (!proto) {
              return true;
            }
            Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
            return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
          },
          isEmptyObject: function(obj) {
            var name;
            for (name in obj) {
              return false;
            }
            return true;
          },
          // Evaluates a script in a provided context; falls back to the global one
          // if not specified.
          globalEval: function(code, options, doc) {
            DOMEval(code, { nonce: options && options.nonce }, doc);
          },
          each: function(obj, callback) {
            var length, i = 0;
            if (isArrayLike(obj)) {
              length = obj.length;
              for (; i < length; i++) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                  break;
                }
              }
            } else {
              for (i in obj) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                  break;
                }
              }
            }
            return obj;
          },
          // Retrieve the text value of an array of DOM nodes
          text: function(elem) {
            var node, ret = "", i = 0, nodeType = elem.nodeType;
            if (!nodeType) {
              while (node = elem[i++]) {
                ret += jQuery.text(node);
              }
            }
            if (nodeType === 1 || nodeType === 11) {
              return elem.textContent;
            }
            if (nodeType === 9) {
              return elem.documentElement.textContent;
            }
            if (nodeType === 3 || nodeType === 4) {
              return elem.nodeValue;
            }
            return ret;
          },
          // results is for internal usage only
          makeArray: function(arr2, results) {
            var ret = results || [];
            if (arr2 != null) {
              if (isArrayLike(Object(arr2))) {
                jQuery.merge(
                  ret,
                  typeof arr2 === "string" ? [arr2] : arr2
                );
              } else {
                push.call(ret, arr2);
              }
            }
            return ret;
          },
          inArray: function(elem, arr2, i) {
            return arr2 == null ? -1 : indexOf.call(arr2, elem, i);
          },
          isXMLDoc: function(elem) {
            var namespace = elem && elem.namespaceURI, docElem = elem && (elem.ownerDocument || elem).documentElement;
            return !rhtmlSuffix.test(namespace || docElem && docElem.nodeName || "HTML");
          },
          // Support: Android <=4.0 only, PhantomJS 1 only
          // push.apply(_, arraylike) throws on ancient WebKit
          merge: function(first, second) {
            var len = +second.length, j = 0, i = first.length;
            for (; j < len; j++) {
              first[i++] = second[j];
            }
            first.length = i;
            return first;
          },
          grep: function(elems, callback, invert) {
            var callbackInverse, matches2 = [], i = 0, length = elems.length, callbackExpect = !invert;
            for (; i < length; i++) {
              callbackInverse = !callback(elems[i], i);
              if (callbackInverse !== callbackExpect) {
                matches2.push(elems[i]);
              }
            }
            return matches2;
          },
          // arg is for internal usage only
          map: function(elems, callback, arg) {
            var length, value, i = 0, ret = [];
            if (isArrayLike(elems)) {
              length = elems.length;
              for (; i < length; i++) {
                value = callback(elems[i], i, arg);
                if (value != null) {
                  ret.push(value);
                }
              }
            } else {
              for (i in elems) {
                value = callback(elems[i], i, arg);
                if (value != null) {
                  ret.push(value);
                }
              }
            }
            return flat(ret);
          },
          // A global GUID counter for objects
          guid: 1,
          // jQuery.support is not used in Core but other projects attach their
          // properties to it so it needs to exist.
          support
        });
        if (typeof Symbol === "function") {
          jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
        }
        jQuery.each(
          "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),
          function(_i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
          }
        );
        function isArrayLike(obj) {
          var length = !!obj && "length" in obj && obj.length, type = toType(obj);
          if (isFunction(obj) || isWindow(obj)) {
            return false;
          }
          return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
        }
        function nodeName(elem, name) {
          return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        }
        var pop = arr.pop;
        var sort = arr.sort;
        var splice = arr.splice;
        var whitespace = "[\\x20\\t\\r\\n\\f]";
        var rtrimCSS = new RegExp(
          "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$",
          "g"
        );
        jQuery.contains = function(a, b) {
          var bup = b && b.parentNode;
          return a === bup || !!(bup && bup.nodeType === 1 && // Support: IE 9 - 11+
          // IE doesn't have `contains` on SVG.
          (a.contains ? a.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
        };
        var rcssescape = /^-$|([\0-\x1f\x7f]|^-?\d)|[^\x80-\uFFFF\w-]/g;
        function fcssescape(ch, asCodePoint) {
          if (asCodePoint) {
            if (ch === "\0") {
              return "\uFFFD";
            }
            return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
          }
          return "\\" + ch;
        }
        jQuery.escapeSelector = function(sel) {
          return (sel + "").replace(rcssescape, fcssescape);
        };
        var preferredDoc = document2, pushNative = push;
        (function() {
          var i, Expr, outermostContext, sortInput, hasDuplicate, push2 = pushNative, document3, documentElement2, documentIsHTML, rbuggyQSA, matches2, expando = jQuery.expando, dirruns = 0, done = 0, classCache = createCache(), tokenCache = createCache(), compilerCache = createCache(), nonnativeSelectorCache = createCache(), sortOrder = function(a, b) {
            if (a === b) {
              hasDuplicate = true;
            }
            return 0;
          }, booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", escape = "\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\[^\\da-fA-F\\r\\n\\f]", identifier = "(?:" + escape + "|[\\w-]|[^\\0-\\x7f])+", attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace + // Operator (capture 2)
          "*([*^$|!~]?=)" + whitespace + // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
          `*(?:'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"|(` + identifier + "))|)" + whitespace + "*\\]", pseudos = ":(" + identifier + `)(?:\\((('((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)")|((?:\\\\.|[^\\\\()[\\]]|` + attributes + ")*)|.*)\\)|)", rwhitespace = new RegExp(whitespace + "+", "g"), rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"), rleadingCombinator = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"), rdescend = new RegExp(whitespace + "|>"), rpseudo = new RegExp(pseudos), ridentifier = new RegExp("^" + identifier + "$"), matchExpr = {
            ID: new RegExp("^#(" + identifier + ")"),
            CLASS: new RegExp("^\\.(" + identifier + ")"),
            TAG: new RegExp("^(" + identifier + "|[*])"),
            ATTR: new RegExp("^" + attributes),
            PSEUDO: new RegExp("^" + pseudos),
            CHILD: new RegExp(
              "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)",
              "i"
            ),
            bool: new RegExp("^(?:" + booleans + ")$", "i"),
            // For use in libraries implementing .is()
            // We use this for POS matching in `select`
            needsContext: new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
          }, rinputs = /^(?:input|select|textarea|button)$/i, rheader = /^h\d$/i, rquickExpr2 = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, rsibling = /[+~]/, runescape = new RegExp("\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\([^\\da-fA-F\\r\\n\\f])", "g"), funescape = function(escape2, nonHex) {
            var high = "0x" + escape2.slice(1) - 65536;
            if (nonHex) {
              return nonHex;
            }
            return high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
          }, unloadHandler = function() {
            setDocument();
          }, inDisabledFieldset = addCombinator(
            function(elem) {
              return elem.disabled === true && nodeName(elem, "fieldset");
            },
            { dir: "parentNode", next: "legend" }
          );
          function safeActiveElement() {
            try {
              return document3.activeElement;
            } catch (_) {
            }
          }
          try {
            push2.apply(
              arr = slice.call(preferredDoc.childNodes),
              preferredDoc.childNodes
            );
            arr[preferredDoc.childNodes.length].nodeType;
          } catch (_) {
            push2 = {
              apply: function(target, els) {
                pushNative.apply(target, slice.call(els));
              },
              call: function(target) {
                pushNative.apply(target, slice.call(arguments, 1));
              }
            };
          }
          function find(selector, context, results, seed) {
            var m2, i2, elem, nid, match, groups, newSelector, newContext = context && context.ownerDocument, nodeType = context ? context.nodeType : 9;
            results = results || [];
            if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
              return results;
            }
            if (!seed) {
              setDocument(context);
              context = context || document3;
              if (documentIsHTML) {
                if (nodeType !== 11 && (match = rquickExpr2.exec(selector))) {
                  if (m2 = match[1]) {
                    if (nodeType === 9) {
                      if (elem = context.getElementById(m2)) {
                        if (elem.id === m2) {
                          push2.call(results, elem);
                          return results;
                        }
                      } else {
                        return results;
                      }
                    } else {
                      if (newContext && (elem = newContext.getElementById(m2)) && find.contains(context, elem) && elem.id === m2) {
                        push2.call(results, elem);
                        return results;
                      }
                    }
                  } else if (match[2]) {
                    push2.apply(results, context.getElementsByTagName(selector));
                    return results;
                  } else if ((m2 = match[3]) && context.getElementsByClassName) {
                    push2.apply(results, context.getElementsByClassName(m2));
                    return results;
                  }
                }
                if (!nonnativeSelectorCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
                  newSelector = selector;
                  newContext = context;
                  if (nodeType === 1 && (rdescend.test(selector) || rleadingCombinator.test(selector))) {
                    newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
                    if (newContext != context || !support.scope) {
                      if (nid = context.getAttribute("id")) {
                        nid = jQuery.escapeSelector(nid);
                      } else {
                        context.setAttribute("id", nid = expando);
                      }
                    }
                    groups = tokenize(selector);
                    i2 = groups.length;
                    while (i2--) {
                      groups[i2] = (nid ? "#" + nid : ":scope") + " " + toSelector(groups[i2]);
                    }
                    newSelector = groups.join(",");
                  }
                  try {
                    push2.apply(
                      results,
                      newContext.querySelectorAll(newSelector)
                    );
                    return results;
                  } catch (_) {
                    nonnativeSelectorCache(selector, true);
                  } finally {
                    if (nid === expando) {
                      context.removeAttribute("id");
                    }
                  }
                }
              }
            }
            return select(selector.replace(rtrimCSS, "$1"), context, results, seed);
          }
          function createCache() {
            var keys = [];
            function cache(key, value) {
              if (keys.push(key + " ") > Expr.cacheLength) {
                delete cache[keys.shift()];
              }
              return cache[key + " "] = value;
            }
            return cache;
          }
          function markFunction(fn) {
            fn[expando] = true;
            return fn;
          }
          function assert(fn) {
            var el = document3.createElement("fieldset");
            try {
              return !!fn(el);
            } catch (_) {
              return false;
            } finally {
              if (el.parentNode) {
                el.parentNode.removeChild(el);
              }
              el = null;
            }
          }
          function createInputPseudo(type) {
            return function(elem) {
              return nodeName(elem, "input") && elem.type === type;
            };
          }
          function createButtonPseudo(type) {
            return function(elem) {
              return (nodeName(elem, "input") || nodeName(elem, "button")) && elem.type === type;
            };
          }
          function createDisabledPseudo(disabled) {
            return function(elem) {
              if ("form" in elem) {
                if (elem.parentNode && elem.disabled === false) {
                  if ("label" in elem) {
                    if ("label" in elem.parentNode) {
                      return elem.parentNode.disabled === disabled;
                    } else {
                      return elem.disabled === disabled;
                    }
                  }
                  return elem.isDisabled === disabled || // Where there is no isDisabled, check manually
                  elem.isDisabled !== !disabled && inDisabledFieldset(elem) === disabled;
                }
                return elem.disabled === disabled;
              } else if ("label" in elem) {
                return elem.disabled === disabled;
              }
              return false;
            };
          }
          function createPositionalPseudo(fn) {
            return markFunction(function(argument) {
              argument = +argument;
              return markFunction(function(seed, matches3) {
                var j, matchIndexes = fn([], seed.length, argument), i2 = matchIndexes.length;
                while (i2--) {
                  if (seed[j = matchIndexes[i2]]) {
                    seed[j] = !(matches3[j] = seed[j]);
                  }
                }
              });
            });
          }
          function testContext(context) {
            return context && typeof context.getElementsByTagName !== "undefined" && context;
          }
          function setDocument(node) {
            var subWindow, doc = node ? node.ownerDocument || node : preferredDoc;
            if (doc == document3 || doc.nodeType !== 9 || !doc.documentElement) {
              return document3;
            }
            document3 = doc;
            documentElement2 = document3.documentElement;
            documentIsHTML = !jQuery.isXMLDoc(document3);
            matches2 = documentElement2.matches || documentElement2.webkitMatchesSelector || documentElement2.msMatchesSelector;
            if (documentElement2.msMatchesSelector && // Support: IE 11+, Edge 17 - 18+
            // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
            // two documents; shallow comparisons work.
            // eslint-disable-next-line eqeqeq
            preferredDoc != document3 && (subWindow = document3.defaultView) && subWindow.top !== subWindow) {
              subWindow.addEventListener("unload", unloadHandler);
            }
            support.getById = assert(function(el) {
              documentElement2.appendChild(el).id = jQuery.expando;
              return !document3.getElementsByName || !document3.getElementsByName(jQuery.expando).length;
            });
            support.disconnectedMatch = assert(function(el) {
              return matches2.call(el, "*");
            });
            support.scope = assert(function() {
              return document3.querySelectorAll(":scope");
            });
            support.cssHas = assert(function() {
              try {
                document3.querySelector(":has(*,:jqfake)");
                return false;
              } catch (_) {
                return true;
              }
            });
            if (support.getById) {
              Expr.filter.ID = function(id) {
                var attrId = id.replace(runescape, funescape);
                return function(elem) {
                  return elem.getAttribute("id") === attrId;
                };
              };
              Expr.find.ID = function(id, context) {
                if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                  var elem = context.getElementById(id);
                  return elem ? [elem] : [];
                }
              };
            } else {
              Expr.filter.ID = function(id) {
                var attrId = id.replace(runescape, funescape);
                return function(elem) {
                  var node2 = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                  return node2 && node2.value === attrId;
                };
              };
              Expr.find.ID = function(id, context) {
                if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                  var node2, i2, elems, elem = context.getElementById(id);
                  if (elem) {
                    node2 = elem.getAttributeNode("id");
                    if (node2 && node2.value === id) {
                      return [elem];
                    }
                    elems = context.getElementsByName(id);
                    i2 = 0;
                    while (elem = elems[i2++]) {
                      node2 = elem.getAttributeNode("id");
                      if (node2 && node2.value === id) {
                        return [elem];
                      }
                    }
                  }
                  return [];
                }
              };
            }
            Expr.find.TAG = function(tag, context) {
              if (typeof context.getElementsByTagName !== "undefined") {
                return context.getElementsByTagName(tag);
              } else {
                return context.querySelectorAll(tag);
              }
            };
            Expr.find.CLASS = function(className, context) {
              if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
                return context.getElementsByClassName(className);
              }
            };
            rbuggyQSA = [];
            assert(function(el) {
              var input;
              documentElement2.appendChild(el).innerHTML = "<a id='" + expando + "' href='' disabled='disabled'></a><select id='" + expando + "-\r\\' disabled='disabled'><option selected=''></option></select>";
              if (!el.querySelectorAll("[selected]").length) {
                rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
              }
              if (!el.querySelectorAll("[id~=" + expando + "-]").length) {
                rbuggyQSA.push("~=");
              }
              if (!el.querySelectorAll("a#" + expando + "+*").length) {
                rbuggyQSA.push(".#.+[+~]");
              }
              if (!el.querySelectorAll(":checked").length) {
                rbuggyQSA.push(":checked");
              }
              input = document3.createElement("input");
              input.setAttribute("type", "hidden");
              el.appendChild(input).setAttribute("name", "D");
              documentElement2.appendChild(el).disabled = true;
              if (el.querySelectorAll(":disabled").length !== 2) {
                rbuggyQSA.push(":enabled", ":disabled");
              }
              input = document3.createElement("input");
              input.setAttribute("name", "");
              el.appendChild(input);
              if (!el.querySelectorAll("[name='']").length) {
                rbuggyQSA.push("\\[" + whitespace + "*name" + whitespace + "*=" + whitespace + `*(?:''|"")`);
              }
            });
            if (!support.cssHas) {
              rbuggyQSA.push(":has");
            }
            rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
            sortOrder = function(a, b) {
              if (a == b) {
                hasDuplicate = true;
                return 0;
              }
              var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
              if (compare) {
                return compare;
              }
              compare = (a.ownerDocument || a) == (b.ownerDocument || b) ? a.compareDocumentPosition(b) : (
                // Otherwise we know they are disconnected
                1
              );
              if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {
                if (a == document3 || a.ownerDocument == preferredDoc && find.contains(preferredDoc, a)) {
                  return -1;
                }
                if (b == document3 || b.ownerDocument == preferredDoc && find.contains(preferredDoc, b)) {
                  return 1;
                }
                return sortInput ? indexOf.call(sortInput, a) - indexOf.call(sortInput, b) : 0;
              }
              return compare & 4 ? -1 : 1;
            };
            return document3;
          }
          find.matches = function(expr, elements) {
            return find(expr, null, null, elements);
          };
          find.matchesSelector = function(elem, expr) {
            setDocument(elem);
            if (documentIsHTML && !nonnativeSelectorCache[expr + " "] && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
              try {
                var ret = matches2.call(elem, expr);
                if (ret || support.disconnectedMatch || // As well, disconnected nodes are said to be in a document
                // fragment in IE 9
                elem.document && elem.document.nodeType !== 11) {
                  return ret;
                }
              } catch (_) {
                nonnativeSelectorCache(expr, true);
              }
            }
            return find(expr, document3, null, [elem]).length > 0;
          };
          find.contains = function(context, elem) {
            if ((context.ownerDocument || context) != document3) {
              setDocument(context);
            }
            return jQuery.contains(context, elem);
          };
          find.attr = function(elem, name) {
            if ((elem.ownerDocument || elem) != document3) {
              setDocument(elem);
            }
            var fn = Expr.attrHandle[name.toLowerCase()], val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : void 0;
            if (val !== void 0) {
              return val;
            }
            return elem.getAttribute(name);
          };
          find.error = function(msg) {
            throw new Error("Syntax error, unrecognized expression: " + msg);
          };
          jQuery.uniqueSort = function(results) {
            var elem, duplicates = [], j = 0, i2 = 0;
            hasDuplicate = !support.sortStable;
            sortInput = !support.sortStable && slice.call(results, 0);
            sort.call(results, sortOrder);
            if (hasDuplicate) {
              while (elem = results[i2++]) {
                if (elem === results[i2]) {
                  j = duplicates.push(i2);
                }
              }
              while (j--) {
                splice.call(results, duplicates[j], 1);
              }
            }
            sortInput = null;
            return results;
          };
          jQuery.fn.uniqueSort = function() {
            return this.pushStack(jQuery.uniqueSort(slice.apply(this)));
          };
          Expr = jQuery.expr = {
            // Can be adjusted by the user
            cacheLength: 50,
            createPseudo: markFunction,
            match: matchExpr,
            attrHandle: {},
            find: {},
            relative: {
              ">": { dir: "parentNode", first: true },
              " ": { dir: "parentNode" },
              "+": { dir: "previousSibling", first: true },
              "~": { dir: "previousSibling" }
            },
            preFilter: {
              ATTR: function(match) {
                match[1] = match[1].replace(runescape, funescape);
                match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);
                if (match[2] === "~=") {
                  match[3] = " " + match[3] + " ";
                }
                return match.slice(0, 4);
              },
              CHILD: function(match) {
                match[1] = match[1].toLowerCase();
                if (match[1].slice(0, 3) === "nth") {
                  if (!match[3]) {
                    find.error(match[0]);
                  }
                  match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
                  match[5] = +(match[7] + match[8] || match[3] === "odd");
                } else if (match[3]) {
                  find.error(match[0]);
                }
                return match;
              },
              PSEUDO: function(match) {
                var excess, unquoted = !match[6] && match[2];
                if (matchExpr.CHILD.test(match[0])) {
                  return null;
                }
                if (match[3]) {
                  match[2] = match[4] || match[5] || "";
                } else if (unquoted && rpseudo.test(unquoted) && // Get excess from tokenize (recursively)
                (excess = tokenize(unquoted, true)) && // advance to the next closing parenthesis
                (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
                  match[0] = match[0].slice(0, excess);
                  match[2] = unquoted.slice(0, excess);
                }
                return match.slice(0, 3);
              }
            },
            filter: {
              TAG: function(nodeNameSelector) {
                var expectedNodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
                return nodeNameSelector === "*" ? function() {
                  return true;
                } : function(elem) {
                  return nodeName(elem, expectedNodeName);
                };
              },
              CLASS: function(className) {
                var pattern = classCache[className + " "];
                return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                  return pattern.test(
                    typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || ""
                  );
                });
              },
              ATTR: function(name, operator, check) {
                return function(elem) {
                  var result = find.attr(elem, name);
                  if (result == null) {
                    return operator === "!=";
                  }
                  if (!operator) {
                    return true;
                  }
                  result += "";
                  if (operator === "=") {
                    return result === check;
                  }
                  if (operator === "!=") {
                    return result !== check;
                  }
                  if (operator === "^=") {
                    return check && result.indexOf(check) === 0;
                  }
                  if (operator === "*=") {
                    return check && result.indexOf(check) > -1;
                  }
                  if (operator === "$=") {
                    return check && result.slice(-check.length) === check;
                  }
                  if (operator === "~=") {
                    return (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1;
                  }
                  if (operator === "|=") {
                    return result === check || result.slice(0, check.length + 1) === check + "-";
                  }
                  return false;
                };
              },
              CHILD: function(type, what, _argument, first, last) {
                var simple = type.slice(0, 3) !== "nth", forward = type.slice(-4) !== "last", ofType = what === "of-type";
                return first === 1 && last === 0 ? (
                  // Shortcut for :nth-*(n)
                  function(elem) {
                    return !!elem.parentNode;
                  }
                ) : function(elem, _context, xml) {
                  var cache, outerCache, node, nodeIndex, start, dir2 = simple !== forward ? "nextSibling" : "previousSibling", parent = elem.parentNode, name = ofType && elem.nodeName.toLowerCase(), useCache = !xml && !ofType, diff = false;
                  if (parent) {
                    if (simple) {
                      while (dir2) {
                        node = elem;
                        while (node = node[dir2]) {
                          if (ofType ? nodeName(node, name) : node.nodeType === 1) {
                            return false;
                          }
                        }
                        start = dir2 = type === "only" && !start && "nextSibling";
                      }
                      return true;
                    }
                    start = [forward ? parent.firstChild : parent.lastChild];
                    if (forward && useCache) {
                      outerCache = parent[expando] || (parent[expando] = {});
                      cache = outerCache[type] || [];
                      nodeIndex = cache[0] === dirruns && cache[1];
                      diff = nodeIndex && cache[2];
                      node = nodeIndex && parent.childNodes[nodeIndex];
                      while (node = ++nodeIndex && node && node[dir2] || // Fallback to seeking `elem` from the start
                      (diff = nodeIndex = 0) || start.pop()) {
                        if (node.nodeType === 1 && ++diff && node === elem) {
                          outerCache[type] = [dirruns, nodeIndex, diff];
                          break;
                        }
                      }
                    } else {
                      if (useCache) {
                        outerCache = elem[expando] || (elem[expando] = {});
                        cache = outerCache[type] || [];
                        nodeIndex = cache[0] === dirruns && cache[1];
                        diff = nodeIndex;
                      }
                      if (diff === false) {
                        while (node = ++nodeIndex && node && node[dir2] || (diff = nodeIndex = 0) || start.pop()) {
                          if ((ofType ? nodeName(node, name) : node.nodeType === 1) && ++diff) {
                            if (useCache) {
                              outerCache = node[expando] || (node[expando] = {});
                              outerCache[type] = [dirruns, diff];
                            }
                            if (node === elem) {
                              break;
                            }
                          }
                        }
                      }
                    }
                    diff -= last;
                    return diff === first || diff % first === 0 && diff / first >= 0;
                  }
                };
              },
              PSEUDO: function(pseudo, argument) {
                var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || find.error("unsupported pseudo: " + pseudo);
                if (fn[expando]) {
                  return fn(argument);
                }
                if (fn.length > 1) {
                  args = [pseudo, pseudo, "", argument];
                  return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches3) {
                    var idx, matched = fn(seed, argument), i2 = matched.length;
                    while (i2--) {
                      idx = indexOf.call(seed, matched[i2]);
                      seed[idx] = !(matches3[idx] = matched[i2]);
                    }
                  }) : function(elem) {
                    return fn(elem, 0, args);
                  };
                }
                return fn;
              }
            },
            pseudos: {
              // Potentially complex pseudos
              not: markFunction(function(selector) {
                var input = [], results = [], matcher = compile(selector.replace(rtrimCSS, "$1"));
                return matcher[expando] ? markFunction(function(seed, matches3, _context, xml) {
                  var elem, unmatched = matcher(seed, null, xml, []), i2 = seed.length;
                  while (i2--) {
                    if (elem = unmatched[i2]) {
                      seed[i2] = !(matches3[i2] = elem);
                    }
                  }
                }) : function(elem, _context, xml) {
                  input[0] = elem;
                  matcher(input, null, xml, results);
                  input[0] = null;
                  return !results.pop();
                };
              }),
              has: markFunction(function(selector) {
                return function(elem) {
                  return find(selector, elem).length > 0;
                };
              }),
              contains: markFunction(function(text) {
                text = text.replace(runescape, funescape);
                return function(elem) {
                  return (elem.textContent || jQuery.text(elem)).indexOf(text) > -1;
                };
              }),
              // "Whether an element is represented by a :lang() selector
              // is based solely on the element's language value
              // being equal to the identifier C,
              // or beginning with the identifier C immediately followed by "-".
              // The matching of C against the element's language value is performed case-insensitively.
              // The identifier C does not have to be a valid language name."
              // https://www.w3.org/TR/selectors/#lang-pseudo
              lang: markFunction(function(lang) {
                if (!ridentifier.test(lang || "")) {
                  find.error("unsupported lang: " + lang);
                }
                lang = lang.replace(runescape, funescape).toLowerCase();
                return function(elem) {
                  var elemLang;
                  do {
                    if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) {
                      elemLang = elemLang.toLowerCase();
                      return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
                    }
                  } while ((elem = elem.parentNode) && elem.nodeType === 1);
                  return false;
                };
              }),
              // Miscellaneous
              target: function(elem) {
                var hash = window2.location && window2.location.hash;
                return hash && hash.slice(1) === elem.id;
              },
              root: function(elem) {
                return elem === documentElement2;
              },
              focus: function(elem) {
                return elem === safeActiveElement() && document3.hasFocus() && !!(elem.type || elem.href || ~elem.tabIndex);
              },
              // Boolean properties
              enabled: createDisabledPseudo(false),
              disabled: createDisabledPseudo(true),
              checked: function(elem) {
                return nodeName(elem, "input") && !!elem.checked || nodeName(elem, "option") && !!elem.selected;
              },
              selected: function(elem) {
                if (elem.parentNode) {
                  elem.parentNode.selectedIndex;
                }
                return elem.selected === true;
              },
              // Contents
              empty: function(elem) {
                for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                  if (elem.nodeType < 6) {
                    return false;
                  }
                }
                return true;
              },
              parent: function(elem) {
                return !Expr.pseudos.empty(elem);
              },
              // Element/input types
              header: function(elem) {
                return rheader.test(elem.nodeName);
              },
              input: function(elem) {
                return rinputs.test(elem.nodeName);
              },
              button: function(elem) {
                return nodeName(elem, "input") && elem.type === "button" || nodeName(elem, "button");
              },
              text: function(elem) {
                var attr;
                return nodeName(elem, "input") && elem.type === "text" && // Support: IE <10 only
                // New HTML5 attribute values (e.g., "search") appear
                // with elem.type === "text"
                ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");
              },
              // Position-in-collection
              first: createPositionalPseudo(function() {
                return [0];
              }),
              last: createPositionalPseudo(function(_matchIndexes, length) {
                return [length - 1];
              }),
              eq: createPositionalPseudo(function(_matchIndexes, length, argument) {
                return [argument < 0 ? argument + length : argument];
              }),
              even: createPositionalPseudo(function(matchIndexes, length) {
                var i2 = 0;
                for (; i2 < length; i2 += 2) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              }),
              odd: createPositionalPseudo(function(matchIndexes, length) {
                var i2 = 1;
                for (; i2 < length; i2 += 2) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              }),
              lt: createPositionalPseudo(function(matchIndexes, length, argument) {
                var i2;
                if (argument < 0) {
                  i2 = argument + length;
                } else if (argument > length) {
                  i2 = length;
                } else {
                  i2 = argument;
                }
                for (; --i2 >= 0; ) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              }),
              gt: createPositionalPseudo(function(matchIndexes, length, argument) {
                var i2 = argument < 0 ? argument + length : argument;
                for (; ++i2 < length; ) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              })
            }
          };
          Expr.pseudos.nth = Expr.pseudos.eq;
          for (i in { radio: true, checkbox: true, file: true, password: true, image: true }) {
            Expr.pseudos[i] = createInputPseudo(i);
          }
          for (i in { submit: true, reset: true }) {
            Expr.pseudos[i] = createButtonPseudo(i);
          }
          function setFilters() {
          }
          setFilters.prototype = Expr.pseudos;
          Expr.setFilters = new setFilters();
          function tokenize(selector, parseOnly) {
            var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
            if (cached) {
              return parseOnly ? 0 : cached.slice(0);
            }
            soFar = selector;
            groups = [];
            preFilters = Expr.preFilter;
            while (soFar) {
              if (!matched || (match = rcomma.exec(soFar))) {
                if (match) {
                  soFar = soFar.slice(match[0].length) || soFar;
                }
                groups.push(tokens = []);
              }
              matched = false;
              if (match = rleadingCombinator.exec(soFar)) {
                matched = match.shift();
                tokens.push({
                  value: matched,
                  // Cast descendant combinators to space
                  type: match[0].replace(rtrimCSS, " ")
                });
                soFar = soFar.slice(matched.length);
              }
              for (type in Expr.filter) {
                if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
                  matched = match.shift();
                  tokens.push({
                    value: matched,
                    type,
                    matches: match
                  });
                  soFar = soFar.slice(matched.length);
                }
              }
              if (!matched) {
                break;
              }
            }
            if (parseOnly) {
              return soFar.length;
            }
            return soFar ? find.error(selector) : (
              // Cache the tokens
              tokenCache(selector, groups).slice(0)
            );
          }
          function toSelector(tokens) {
            var i2 = 0, len = tokens.length, selector = "";
            for (; i2 < len; i2++) {
              selector += tokens[i2].value;
            }
            return selector;
          }
          function addCombinator(matcher, combinator, base) {
            var dir2 = combinator.dir, skip = combinator.next, key = skip || dir2, checkNonElements = base && key === "parentNode", doneName = done++;
            return combinator.first ? (
              // Check against closest ancestor/preceding element
              function(elem, context, xml) {
                while (elem = elem[dir2]) {
                  if (elem.nodeType === 1 || checkNonElements) {
                    return matcher(elem, context, xml);
                  }
                }
                return false;
              }
            ) : (
              // Check against all ancestor/preceding elements
              function(elem, context, xml) {
                var oldCache, outerCache, newCache = [dirruns, doneName];
                if (xml) {
                  while (elem = elem[dir2]) {
                    if (elem.nodeType === 1 || checkNonElements) {
                      if (matcher(elem, context, xml)) {
                        return true;
                      }
                    }
                  }
                } else {
                  while (elem = elem[dir2]) {
                    if (elem.nodeType === 1 || checkNonElements) {
                      outerCache = elem[expando] || (elem[expando] = {});
                      if (skip && nodeName(elem, skip)) {
                        elem = elem[dir2] || elem;
                      } else if ((oldCache = outerCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                        return newCache[2] = oldCache[2];
                      } else {
                        outerCache[key] = newCache;
                        if (newCache[2] = matcher(elem, context, xml)) {
                          return true;
                        }
                      }
                    }
                  }
                }
                return false;
              }
            );
          }
          function elementMatcher(matchers) {
            return matchers.length > 1 ? function(elem, context, xml) {
              var i2 = matchers.length;
              while (i2--) {
                if (!matchers[i2](elem, context, xml)) {
                  return false;
                }
              }
              return true;
            } : matchers[0];
          }
          function multipleContexts(selector, contexts, results) {
            var i2 = 0, len = contexts.length;
            for (; i2 < len; i2++) {
              find(selector, contexts[i2], results);
            }
            return results;
          }
          function condense(unmatched, map, filter, context, xml) {
            var elem, newUnmatched = [], i2 = 0, len = unmatched.length, mapped = map != null;
            for (; i2 < len; i2++) {
              if (elem = unmatched[i2]) {
                if (!filter || filter(elem, context, xml)) {
                  newUnmatched.push(elem);
                  if (mapped) {
                    map.push(i2);
                  }
                }
              }
            }
            return newUnmatched;
          }
          function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
            if (postFilter && !postFilter[expando]) {
              postFilter = setMatcher(postFilter);
            }
            if (postFinder && !postFinder[expando]) {
              postFinder = setMatcher(postFinder, postSelector);
            }
            return markFunction(function(seed, results, context, xml) {
              var temp, i2, elem, matcherOut, preMap = [], postMap = [], preexisting = results.length, elems = seed || multipleContexts(
                selector || "*",
                context.nodeType ? [context] : context,
                []
              ), matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems;
              if (matcher) {
                matcherOut = postFinder || (seed ? preFilter : preexisting || postFilter) ? (
                  // ...intermediate processing is necessary
                  []
                ) : (
                  // ...otherwise use results directly
                  results
                );
                matcher(matcherIn, matcherOut, context, xml);
              } else {
                matcherOut = matcherIn;
              }
              if (postFilter) {
                temp = condense(matcherOut, postMap);
                postFilter(temp, [], context, xml);
                i2 = temp.length;
                while (i2--) {
                  if (elem = temp[i2]) {
                    matcherOut[postMap[i2]] = !(matcherIn[postMap[i2]] = elem);
                  }
                }
              }
              if (seed) {
                if (postFinder || preFilter) {
                  if (postFinder) {
                    temp = [];
                    i2 = matcherOut.length;
                    while (i2--) {
                      if (elem = matcherOut[i2]) {
                        temp.push(matcherIn[i2] = elem);
                      }
                    }
                    postFinder(null, matcherOut = [], temp, xml);
                  }
                  i2 = matcherOut.length;
                  while (i2--) {
                    if ((elem = matcherOut[i2]) && (temp = postFinder ? indexOf.call(seed, elem) : preMap[i2]) > -1) {
                      seed[temp] = !(results[temp] = elem);
                    }
                  }
                }
              } else {
                matcherOut = condense(
                  matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut
                );
                if (postFinder) {
                  postFinder(null, results, matcherOut, xml);
                } else {
                  push2.apply(results, matcherOut);
                }
              }
            });
          }
          function matcherFromTokens(tokens) {
            var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[" "], i2 = leadingRelative ? 1 : 0, matchContext = addCombinator(function(elem) {
              return elem === checkContext;
            }, implicitRelative, true), matchAnyContext = addCombinator(function(elem) {
              return indexOf.call(checkContext, elem) > -1;
            }, implicitRelative, true), matchers = [function(elem, context, xml) {
              var ret = !leadingRelative && (xml || context != outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
              checkContext = null;
              return ret;
            }];
            for (; i2 < len; i2++) {
              if (matcher = Expr.relative[tokens[i2].type]) {
                matchers = [addCombinator(elementMatcher(matchers), matcher)];
              } else {
                matcher = Expr.filter[tokens[i2].type].apply(null, tokens[i2].matches);
                if (matcher[expando]) {
                  j = ++i2;
                  for (; j < len; j++) {
                    if (Expr.relative[tokens[j].type]) {
                      break;
                    }
                  }
                  return setMatcher(
                    i2 > 1 && elementMatcher(matchers),
                    i2 > 1 && toSelector(
                      // If the preceding token was a descendant combinator, insert an implicit any-element `*`
                      tokens.slice(0, i2 - 1).concat({ value: tokens[i2 - 2].type === " " ? "*" : "" })
                    ).replace(rtrimCSS, "$1"),
                    matcher,
                    i2 < j && matcherFromTokens(tokens.slice(i2, j)),
                    j < len && matcherFromTokens(tokens = tokens.slice(j)),
                    j < len && toSelector(tokens)
                  );
                }
                matchers.push(matcher);
              }
            }
            return elementMatcher(matchers);
          }
          function matcherFromGroupMatchers(elementMatchers, setMatchers) {
            var bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function(seed, context, xml, results, outermost) {
              var elem, j, matcher, matchedCount = 0, i2 = "0", unmatched = seed && [], setMatched = [], contextBackup = outermostContext, elems = seed || byElement && Expr.find.TAG("*", outermost), dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || 0.1, len = elems.length;
              if (outermost) {
                outermostContext = context == document3 || context || outermost;
              }
              for (; i2 !== len && (elem = elems[i2]) != null; i2++) {
                if (byElement && elem) {
                  j = 0;
                  if (!context && elem.ownerDocument != document3) {
                    setDocument(elem);
                    xml = !documentIsHTML;
                  }
                  while (matcher = elementMatchers[j++]) {
                    if (matcher(elem, context || document3, xml)) {
                      push2.call(results, elem);
                      break;
                    }
                  }
                  if (outermost) {
                    dirruns = dirrunsUnique;
                  }
                }
                if (bySet) {
                  if (elem = !matcher && elem) {
                    matchedCount--;
                  }
                  if (seed) {
                    unmatched.push(elem);
                  }
                }
              }
              matchedCount += i2;
              if (bySet && i2 !== matchedCount) {
                j = 0;
                while (matcher = setMatchers[j++]) {
                  matcher(unmatched, setMatched, context, xml);
                }
                if (seed) {
                  if (matchedCount > 0) {
                    while (i2--) {
                      if (!(unmatched[i2] || setMatched[i2])) {
                        setMatched[i2] = pop.call(results);
                      }
                    }
                  }
                  setMatched = condense(setMatched);
                }
                push2.apply(results, setMatched);
                if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
                  jQuery.uniqueSort(results);
                }
              }
              if (outermost) {
                dirruns = dirrunsUnique;
                outermostContext = contextBackup;
              }
              return unmatched;
            };
            return bySet ? markFunction(superMatcher) : superMatcher;
          }
          function compile(selector, match) {
            var i2, setMatchers = [], elementMatchers = [], cached = compilerCache[selector + " "];
            if (!cached) {
              if (!match) {
                match = tokenize(selector);
              }
              i2 = match.length;
              while (i2--) {
                cached = matcherFromTokens(match[i2]);
                if (cached[expando]) {
                  setMatchers.push(cached);
                } else {
                  elementMatchers.push(cached);
                }
              }
              cached = compilerCache(
                selector,
                matcherFromGroupMatchers(elementMatchers, setMatchers)
              );
              cached.selector = selector;
            }
            return cached;
          }
          function select(selector, context, results, seed) {
            var i2, tokens, token, type, find2, compiled = typeof selector === "function" && selector, match = !seed && tokenize(selector = compiled.selector || selector);
            results = results || [];
            if (match.length === 1) {
              tokens = match[0] = match[0].slice(0);
              if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
                context = (Expr.find.ID(
                  token.matches[0].replace(runescape, funescape),
                  context
                ) || [])[0];
                if (!context) {
                  return results;
                } else if (compiled) {
                  context = context.parentNode;
                }
                selector = selector.slice(tokens.shift().value.length);
              }
              i2 = matchExpr.needsContext.test(selector) ? 0 : tokens.length;
              while (i2--) {
                token = tokens[i2];
                if (Expr.relative[type = token.type]) {
                  break;
                }
                if (find2 = Expr.find[type]) {
                  if (seed = find2(
                    token.matches[0].replace(runescape, funescape),
                    rsibling.test(tokens[0].type) && testContext(context.parentNode) || context
                  )) {
                    tokens.splice(i2, 1);
                    selector = seed.length && toSelector(tokens);
                    if (!selector) {
                      push2.apply(results, seed);
                      return results;
                    }
                    break;
                  }
                }
              }
            }
            (compiled || compile(selector, match))(
              seed,
              context,
              !documentIsHTML,
              results,
              !context || rsibling.test(selector) && testContext(context.parentNode) || context
            );
            return results;
          }
          support.sortStable = expando.split("").sort(sortOrder).join("") === expando;
          setDocument();
          support.sortDetached = assert(function(el) {
            return el.compareDocumentPosition(document3.createElement("fieldset")) & 1;
          });
          jQuery.find = find;
          find.compile = compile;
          find.select = select;
          find.setDocument = setDocument;
          find.tokenize = tokenize;
          find.escape = jQuery.escapeSelector;
          find.getText = jQuery.text;
          find.isXML = jQuery.isXMLDoc;
          find.selectors = jQuery.expr;
          find.support = jQuery.support;
          find.uniqueSort = jQuery.uniqueSort;
        })();
        var dir = function(elem, dir2, until) {
          var matched = [], truncate = until !== void 0;
          while ((elem = elem[dir2]) && elem.nodeType !== 9) {
            if (elem.nodeType === 1) {
              if (truncate && jQuery(elem).is(until)) {
                break;
              }
              matched.push(elem);
            }
          }
          return matched;
        };
        var siblings = function(n, elem) {
          var matched = [];
          for (; n; n = n.nextSibling) {
            if (n.nodeType === 1 && n !== elem) {
              matched.push(n);
            }
          }
          return matched;
        };
        var rneedsContext = jQuery.expr.match.needsContext;
        var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
        function winnow(elements, qualifier, not) {
          if (isFunction(qualifier)) {
            return jQuery.grep(elements, function(elem, i) {
              return !!qualifier.call(elem, i, elem) !== not;
            });
          }
          if (qualifier.nodeType) {
            return jQuery.grep(elements, function(elem) {
              return elem === qualifier !== not;
            });
          }
          if (typeof qualifier !== "string") {
            return jQuery.grep(elements, function(elem) {
              return indexOf.call(qualifier, elem) > -1 !== not;
            });
          }
          return jQuery.filter(qualifier, elements, not);
        }
        jQuery.filter = function(expr, elems, not) {
          var elem = elems[0];
          if (not) {
            expr = ":not(" + expr + ")";
          }
          if (elems.length === 1 && elem.nodeType === 1) {
            return jQuery.find.matchesSelector(elem, expr) ? [elem] : [];
          }
          return jQuery.find.matches(expr, jQuery.grep(elems, function(elem2) {
            return elem2.nodeType === 1;
          }));
        };
        jQuery.fn.extend({
          find: function(selector) {
            var i, ret, len = this.length, self = this;
            if (typeof selector !== "string") {
              return this.pushStack(jQuery(selector).filter(function() {
                for (i = 0; i < len; i++) {
                  if (jQuery.contains(self[i], this)) {
                    return true;
                  }
                }
              }));
            }
            ret = this.pushStack([]);
            for (i = 0; i < len; i++) {
              jQuery.find(selector, self[i], ret);
            }
            return len > 1 ? jQuery.uniqueSort(ret) : ret;
          },
          filter: function(selector) {
            return this.pushStack(winnow(this, selector || [], false));
          },
          not: function(selector) {
            return this.pushStack(winnow(this, selector || [], true));
          },
          is: function(selector) {
            return !!winnow(
              this,
              // If this is a positional/relative selector, check membership in the returned set
              // so $("p:first").is("p:last") won't return true for a doc with two "p".
              typeof selector === "string" && rneedsContext.test(selector) ? jQuery(selector) : selector || [],
              false
            ).length;
          }
        });
        var rootjQuery, rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/, init = jQuery.fn.init = function(selector, context, root2) {
          var match, elem;
          if (!selector) {
            return this;
          }
          root2 = root2 || rootjQuery;
          if (typeof selector === "string") {
            if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
              match = [null, selector, null];
            } else {
              match = rquickExpr.exec(selector);
            }
            if (match && (match[1] || !context)) {
              if (match[1]) {
                context = context instanceof jQuery ? context[0] : context;
                jQuery.merge(this, jQuery.parseHTML(
                  match[1],
                  context && context.nodeType ? context.ownerDocument || context : document2,
                  true
                ));
                if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
                  for (match in context) {
                    if (isFunction(this[match])) {
                      this[match](context[match]);
                    } else {
                      this.attr(match, context[match]);
                    }
                  }
                }
                return this;
              } else {
                elem = document2.getElementById(match[2]);
                if (elem) {
                  this[0] = elem;
                  this.length = 1;
                }
                return this;
              }
            } else if (!context || context.jquery) {
              return (context || root2).find(selector);
            } else {
              return this.constructor(context).find(selector);
            }
          } else if (selector.nodeType) {
            this[0] = selector;
            this.length = 1;
            return this;
          } else if (isFunction(selector)) {
            return root2.ready !== void 0 ? root2.ready(selector) : (
              // Execute immediately if ready is not present
              selector(jQuery)
            );
          }
          return jQuery.makeArray(selector, this);
        };
        init.prototype = jQuery.fn;
        rootjQuery = jQuery(document2);
        var rparentsprev = /^(?:parents|prev(?:Until|All))/, guaranteedUnique = {
          children: true,
          contents: true,
          next: true,
          prev: true
        };
        jQuery.fn.extend({
          has: function(target) {
            var targets = jQuery(target, this), l = targets.length;
            return this.filter(function() {
              var i = 0;
              for (; i < l; i++) {
                if (jQuery.contains(this, targets[i])) {
                  return true;
                }
              }
            });
          },
          closest: function(selectors, context) {
            var cur, i = 0, l = this.length, matched = [], targets = typeof selectors !== "string" && jQuery(selectors);
            if (!rneedsContext.test(selectors)) {
              for (; i < l; i++) {
                for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
                  if (cur.nodeType < 11 && (targets ? targets.index(cur) > -1 : (
                    // Don't pass non-elements to jQuery#find
                    cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors)
                  ))) {
                    matched.push(cur);
                    break;
                  }
                }
              }
            }
            return this.pushStack(matched.length > 1 ? jQuery.uniqueSort(matched) : matched);
          },
          // Determine the position of an element within the set
          index: function(elem) {
            if (!elem) {
              return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
            }
            if (typeof elem === "string") {
              return indexOf.call(jQuery(elem), this[0]);
            }
            return indexOf.call(
              this,
              // If it receives a jQuery object, the first element is used
              elem.jquery ? elem[0] : elem
            );
          },
          add: function(selector, context) {
            return this.pushStack(
              jQuery.uniqueSort(
                jQuery.merge(this.get(), jQuery(selector, context))
              )
            );
          },
          addBack: function(selector) {
            return this.add(
              selector == null ? this.prevObject : this.prevObject.filter(selector)
            );
          }
        });
        function sibling(cur, dir2) {
          while ((cur = cur[dir2]) && cur.nodeType !== 1) {
          }
          return cur;
        }
        jQuery.each({
          parent: function(elem) {
            var parent = elem.parentNode;
            return parent && parent.nodeType !== 11 ? parent : null;
          },
          parents: function(elem) {
            return dir(elem, "parentNode");
          },
          parentsUntil: function(elem, _i, until) {
            return dir(elem, "parentNode", until);
          },
          next: function(elem) {
            return sibling(elem, "nextSibling");
          },
          prev: function(elem) {
            return sibling(elem, "previousSibling");
          },
          nextAll: function(elem) {
            return dir(elem, "nextSibling");
          },
          prevAll: function(elem) {
            return dir(elem, "previousSibling");
          },
          nextUntil: function(elem, _i, until) {
            return dir(elem, "nextSibling", until);
          },
          prevUntil: function(elem, _i, until) {
            return dir(elem, "previousSibling", until);
          },
          siblings: function(elem) {
            return siblings((elem.parentNode || {}).firstChild, elem);
          },
          children: function(elem) {
            return siblings(elem.firstChild);
          },
          contents: function(elem) {
            if (elem.contentDocument != null && // Support: IE 11+
            // <object> elements with no `data` attribute has an object
            // `contentDocument` with a `null` prototype.
            getProto(elem.contentDocument)) {
              return elem.contentDocument;
            }
            if (nodeName(elem, "template")) {
              elem = elem.content || elem;
            }
            return jQuery.merge([], elem.childNodes);
          }
        }, function(name, fn) {
          jQuery.fn[name] = function(until, selector) {
            var matched = jQuery.map(this, fn, until);
            if (name.slice(-5) !== "Until") {
              selector = until;
            }
            if (selector && typeof selector === "string") {
              matched = jQuery.filter(selector, matched);
            }
            if (this.length > 1) {
              if (!guaranteedUnique[name]) {
                jQuery.uniqueSort(matched);
              }
              if (rparentsprev.test(name)) {
                matched.reverse();
              }
            }
            return this.pushStack(matched);
          };
        });
        var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;
        function createOptions(options) {
          var object = {};
          jQuery.each(options.match(rnothtmlwhite) || [], function(_, flag) {
            object[flag] = true;
          });
          return object;
        }
        jQuery.Callbacks = function(options) {
          options = typeof options === "string" ? createOptions(options) : jQuery.extend({}, options);
          var firing, memory, fired, locked, list = [], queue = [], firingIndex = -1, fire = function() {
            locked = locked || options.once;
            fired = firing = true;
            for (; queue.length; firingIndex = -1) {
              memory = queue.shift();
              while (++firingIndex < list.length) {
                if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
                  firingIndex = list.length;
                  memory = false;
                }
              }
            }
            if (!options.memory) {
              memory = false;
            }
            firing = false;
            if (locked) {
              if (memory) {
                list = [];
              } else {
                list = "";
              }
            }
          }, self = {
            // Add a callback or a collection of callbacks to the list
            add: function() {
              if (list) {
                if (memory && !firing) {
                  firingIndex = list.length - 1;
                  queue.push(memory);
                }
                (function add(args) {
                  jQuery.each(args, function(_, arg) {
                    if (isFunction(arg)) {
                      if (!options.unique || !self.has(arg)) {
                        list.push(arg);
                      }
                    } else if (arg && arg.length && toType(arg) !== "string") {
                      add(arg);
                    }
                  });
                })(arguments);
                if (memory && !firing) {
                  fire();
                }
              }
              return this;
            },
            // Remove a callback from the list
            remove: function() {
              jQuery.each(arguments, function(_, arg) {
                var index;
                while ((index = jQuery.inArray(arg, list, index)) > -1) {
                  list.splice(index, 1);
                  if (index <= firingIndex) {
                    firingIndex--;
                  }
                }
              });
              return this;
            },
            // Check if a given callback is in the list.
            // If no argument is given, return whether or not list has callbacks attached.
            has: function(fn) {
              return fn ? jQuery.inArray(fn, list) > -1 : list.length > 0;
            },
            // Remove all callbacks from the list
            empty: function() {
              if (list) {
                list = [];
              }
              return this;
            },
            // Disable .fire and .add
            // Abort any current/pending executions
            // Clear all callbacks and values
            disable: function() {
              locked = queue = [];
              list = memory = "";
              return this;
            },
            disabled: function() {
              return !list;
            },
            // Disable .fire
            // Also disable .add unless we have memory (since it would have no effect)
            // Abort any pending executions
            lock: function() {
              locked = queue = [];
              if (!memory && !firing) {
                list = memory = "";
              }
              return this;
            },
            locked: function() {
              return !!locked;
            },
            // Call all callbacks with the given context and arguments
            fireWith: function(context, args) {
              if (!locked) {
                args = args || [];
                args = [context, args.slice ? args.slice() : args];
                queue.push(args);
                if (!firing) {
                  fire();
                }
              }
              return this;
            },
            // Call all the callbacks with the given arguments
            fire: function() {
              self.fireWith(this, arguments);
              return this;
            },
            // To know if the callbacks have already been called at least once
            fired: function() {
              return !!fired;
            }
          };
          return self;
        };
        function Identity(v) {
          return v;
        }
        function Thrower(ex) {
          throw ex;
        }
        function adoptValue(value, resolve, reject, noValue) {
          var method;
          try {
            if (value && isFunction(method = value.promise)) {
              method.call(value).done(resolve).fail(reject);
            } else if (value && isFunction(method = value.then)) {
              method.call(value, resolve, reject);
            } else {
              resolve.apply(void 0, [value].slice(noValue));
            }
          } catch (value2) {
            reject.apply(void 0, [value2]);
          }
        }
        jQuery.extend({
          Deferred: function(func) {
            var tuples = [
              // action, add listener, callbacks,
              // ... .then handlers, argument index, [final state]
              [
                "notify",
                "progress",
                jQuery.Callbacks("memory"),
                jQuery.Callbacks("memory"),
                2
              ],
              [
                "resolve",
                "done",
                jQuery.Callbacks("once memory"),
                jQuery.Callbacks("once memory"),
                0,
                "resolved"
              ],
              [
                "reject",
                "fail",
                jQuery.Callbacks("once memory"),
                jQuery.Callbacks("once memory"),
                1,
                "rejected"
              ]
            ], state = "pending", promise = {
              state: function() {
                return state;
              },
              always: function() {
                deferred.done(arguments).fail(arguments);
                return this;
              },
              "catch": function(fn) {
                return promise.then(null, fn);
              },
              // Keep pipe for back-compat
              pipe: function() {
                var fns = arguments;
                return jQuery.Deferred(function(newDefer) {
                  jQuery.each(tuples, function(_i, tuple) {
                    var fn = isFunction(fns[tuple[4]]) && fns[tuple[4]];
                    deferred[tuple[1]](function() {
                      var returned = fn && fn.apply(this, arguments);
                      if (returned && isFunction(returned.promise)) {
                        returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
                      } else {
                        newDefer[tuple[0] + "With"](
                          this,
                          fn ? [returned] : arguments
                        );
                      }
                    });
                  });
                  fns = null;
                }).promise();
              },
              then: function(onFulfilled, onRejected, onProgress) {
                var maxDepth = 0;
                function resolve(depth, deferred2, handler, special) {
                  return function() {
                    var that = this, args = arguments, mightThrow = function() {
                      var returned, then;
                      if (depth < maxDepth) {
                        return;
                      }
                      returned = handler.apply(that, args);
                      if (returned === deferred2.promise()) {
                        throw new TypeError("Thenable self-resolution");
                      }
                      then = returned && // Support: Promises/A+ section 2.3.4
                      // https://promisesaplus.com/#point-64
                      // Only check objects and functions for thenability
                      (typeof returned === "object" || typeof returned === "function") && returned.then;
                      if (isFunction(then)) {
                        if (special) {
                          then.call(
                            returned,
                            resolve(maxDepth, deferred2, Identity, special),
                            resolve(maxDepth, deferred2, Thrower, special)
                          );
                        } else {
                          maxDepth++;
                          then.call(
                            returned,
                            resolve(maxDepth, deferred2, Identity, special),
                            resolve(maxDepth, deferred2, Thrower, special),
                            resolve(
                              maxDepth,
                              deferred2,
                              Identity,
                              deferred2.notifyWith
                            )
                          );
                        }
                      } else {
                        if (handler !== Identity) {
                          that = void 0;
                          args = [returned];
                        }
                        (special || deferred2.resolveWith)(that, args);
                      }
                    }, process = special ? mightThrow : function() {
                      try {
                        mightThrow();
                      } catch (e) {
                        if (jQuery.Deferred.exceptionHook) {
                          jQuery.Deferred.exceptionHook(
                            e,
                            process.error
                          );
                        }
                        if (depth + 1 >= maxDepth) {
                          if (handler !== Thrower) {
                            that = void 0;
                            args = [e];
                          }
                          deferred2.rejectWith(that, args);
                        }
                      }
                    };
                    if (depth) {
                      process();
                    } else {
                      if (jQuery.Deferred.getErrorHook) {
                        process.error = jQuery.Deferred.getErrorHook();
                      } else if (jQuery.Deferred.getStackHook) {
                        process.error = jQuery.Deferred.getStackHook();
                      }
                      window2.setTimeout(process);
                    }
                  };
                }
                return jQuery.Deferred(function(newDefer) {
                  tuples[0][3].add(
                    resolve(
                      0,
                      newDefer,
                      isFunction(onProgress) ? onProgress : Identity,
                      newDefer.notifyWith
                    )
                  );
                  tuples[1][3].add(
                    resolve(
                      0,
                      newDefer,
                      isFunction(onFulfilled) ? onFulfilled : Identity
                    )
                  );
                  tuples[2][3].add(
                    resolve(
                      0,
                      newDefer,
                      isFunction(onRejected) ? onRejected : Thrower
                    )
                  );
                }).promise();
              },
              // Get a promise for this deferred
              // If obj is provided, the promise aspect is added to the object
              promise: function(obj) {
                return obj != null ? jQuery.extend(obj, promise) : promise;
              }
            }, deferred = {};
            jQuery.each(tuples, function(i, tuple) {
              var list = tuple[2], stateString = tuple[5];
              promise[tuple[1]] = list.add;
              if (stateString) {
                list.add(
                  function() {
                    state = stateString;
                  },
                  // rejected_callbacks.disable
                  // fulfilled_callbacks.disable
                  tuples[3 - i][2].disable,
                  // rejected_handlers.disable
                  // fulfilled_handlers.disable
                  tuples[3 - i][3].disable,
                  // progress_callbacks.lock
                  tuples[0][2].lock,
                  // progress_handlers.lock
                  tuples[0][3].lock
                );
              }
              list.add(tuple[3].fire);
              deferred[tuple[0]] = function() {
                deferred[tuple[0] + "With"](this === deferred ? void 0 : this, arguments);
                return this;
              };
              deferred[tuple[0] + "With"] = list.fireWith;
            });
            promise.promise(deferred);
            if (func) {
              func.call(deferred, deferred);
            }
            return deferred;
          },
          // Deferred helper
          when: function(singleValue) {
            var remaining = arguments.length, i = remaining, resolveContexts = Array(i), resolveValues = slice.call(arguments), primary = jQuery.Deferred(), updateFunc = function(i2) {
              return function(value) {
                resolveContexts[i2] = this;
                resolveValues[i2] = arguments.length > 1 ? slice.call(arguments) : value;
                if (!--remaining) {
                  primary.resolveWith(resolveContexts, resolveValues);
                }
              };
            };
            if (remaining <= 1) {
              adoptValue(
                singleValue,
                primary.done(updateFunc(i)).resolve,
                primary.reject,
                !remaining
              );
              if (primary.state() === "pending" || isFunction(resolveValues[i] && resolveValues[i].then)) {
                return primary.then();
              }
            }
            while (i--) {
              adoptValue(resolveValues[i], updateFunc(i), primary.reject);
            }
            return primary.promise();
          }
        });
        var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
        jQuery.Deferred.exceptionHook = function(error, asyncError) {
          if (window2.console && window2.console.warn && error && rerrorNames.test(error.name)) {
            window2.console.warn(
              "jQuery.Deferred exception: " + error.message,
              error.stack,
              asyncError
            );
          }
        };
        jQuery.readyException = function(error) {
          window2.setTimeout(function() {
            throw error;
          });
        };
        var readyList = jQuery.Deferred();
        jQuery.fn.ready = function(fn) {
          readyList.then(fn).catch(function(error) {
            jQuery.readyException(error);
          });
          return this;
        };
        jQuery.extend({
          // Is the DOM ready to be used? Set to true once it occurs.
          isReady: false,
          // A counter to track how many items to wait for before
          // the ready event fires. See trac-6781
          readyWait: 1,
          // Handle when the DOM is ready
          ready: function(wait) {
            if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
              return;
            }
            jQuery.isReady = true;
            if (wait !== true && --jQuery.readyWait > 0) {
              return;
            }
            readyList.resolveWith(document2, [jQuery]);
          }
        });
        jQuery.ready.then = readyList.then;
        function completed() {
          document2.removeEventListener("DOMContentLoaded", completed);
          window2.removeEventListener("load", completed);
          jQuery.ready();
        }
        if (document2.readyState === "complete" || document2.readyState !== "loading" && !document2.documentElement.doScroll) {
          window2.setTimeout(jQuery.ready);
        } else {
          document2.addEventListener("DOMContentLoaded", completed);
          window2.addEventListener("load", completed);
        }
        var access = function(elems, fn, key, value, chainable, emptyGet, raw) {
          var i = 0, len = elems.length, bulk = key == null;
          if (toType(key) === "object") {
            chainable = true;
            for (i in key) {
              access(elems, fn, i, key[i], true, emptyGet, raw);
            }
          } else if (value !== void 0) {
            chainable = true;
            if (!isFunction(value)) {
              raw = true;
            }
            if (bulk) {
              if (raw) {
                fn.call(elems, value);
                fn = null;
              } else {
                bulk = fn;
                fn = function(elem, _key, value2) {
                  return bulk.call(jQuery(elem), value2);
                };
              }
            }
            if (fn) {
              for (; i < len; i++) {
                fn(
                  elems[i],
                  key,
                  raw ? value : value.call(elems[i], i, fn(elems[i], key))
                );
              }
            }
          }
          if (chainable) {
            return elems;
          }
          if (bulk) {
            return fn.call(elems);
          }
          return len ? fn(elems[0], key) : emptyGet;
        };
        var rmsPrefix = /^-ms-/, rdashAlpha = /-([a-z])/g;
        function fcamelCase(_all, letter) {
          return letter.toUpperCase();
        }
        function camelCase(string) {
          return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        }
        var acceptData = function(owner) {
          return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
        };
        function Data() {
          this.expando = jQuery.expando + Data.uid++;
        }
        Data.uid = 1;
        Data.prototype = {
          cache: function(owner) {
            var value = owner[this.expando];
            if (!value) {
              value = {};
              if (acceptData(owner)) {
                if (owner.nodeType) {
                  owner[this.expando] = value;
                } else {
                  Object.defineProperty(owner, this.expando, {
                    value,
                    configurable: true
                  });
                }
              }
            }
            return value;
          },
          set: function(owner, data, value) {
            var prop, cache = this.cache(owner);
            if (typeof data === "string") {
              cache[camelCase(data)] = value;
            } else {
              for (prop in data) {
                cache[camelCase(prop)] = data[prop];
              }
            }
            return cache;
          },
          get: function(owner, key) {
            return key === void 0 ? this.cache(owner) : (
              // Always use camelCase key (gh-2257)
              owner[this.expando] && owner[this.expando][camelCase(key)]
            );
          },
          access: function(owner, key, value) {
            if (key === void 0 || key && typeof key === "string" && value === void 0) {
              return this.get(owner, key);
            }
            this.set(owner, key, value);
            return value !== void 0 ? value : key;
          },
          remove: function(owner, key) {
            var i, cache = owner[this.expando];
            if (cache === void 0) {
              return;
            }
            if (key !== void 0) {
              if (Array.isArray(key)) {
                key = key.map(camelCase);
              } else {
                key = camelCase(key);
                key = key in cache ? [key] : key.match(rnothtmlwhite) || [];
              }
              i = key.length;
              while (i--) {
                delete cache[key[i]];
              }
            }
            if (key === void 0 || jQuery.isEmptyObject(cache)) {
              if (owner.nodeType) {
                owner[this.expando] = void 0;
              } else {
                delete owner[this.expando];
              }
            }
          },
          hasData: function(owner) {
            var cache = owner[this.expando];
            return cache !== void 0 && !jQuery.isEmptyObject(cache);
          }
        };
        var dataPriv = new Data();
        var dataUser = new Data();
        var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash = /[A-Z]/g;
        function getData(data) {
          if (data === "true") {
            return true;
          }
          if (data === "false") {
            return false;
          }
          if (data === "null") {
            return null;
          }
          if (data === +data + "") {
            return +data;
          }
          if (rbrace.test(data)) {
            return JSON.parse(data);
          }
          return data;
        }
        function dataAttr(elem, key, data) {
          var name;
          if (data === void 0 && elem.nodeType === 1) {
            name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
            data = elem.getAttribute(name);
            if (typeof data === "string") {
              try {
                data = getData(data);
              } catch (_) {
              }
              dataUser.set(elem, key, data);
            } else {
              data = void 0;
            }
          }
          return data;
        }
        jQuery.extend({
          hasData: function(elem) {
            return dataUser.hasData(elem) || dataPriv.hasData(elem);
          },
          data: function(elem, name, data) {
            return dataUser.access(elem, name, data);
          },
          removeData: function(elem, name) {
            dataUser.remove(elem, name);
          },
          // TODO: Now that all calls to _data and _removeData have been replaced
          // with direct calls to dataPriv methods, these can be deprecated.
          _data: function(elem, name, data) {
            return dataPriv.access(elem, name, data);
          },
          _removeData: function(elem, name) {
            dataPriv.remove(elem, name);
          }
        });
        jQuery.fn.extend({
          data: function(key, value) {
            var i, name, data, elem = this[0], attrs = elem && elem.attributes;
            if (key === void 0) {
              if (this.length) {
                data = dataUser.get(elem);
                if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
                  i = attrs.length;
                  while (i--) {
                    if (attrs[i]) {
                      name = attrs[i].name;
                      if (name.indexOf("data-") === 0) {
                        name = camelCase(name.slice(5));
                        dataAttr(elem, name, data[name]);
                      }
                    }
                  }
                  dataPriv.set(elem, "hasDataAttrs", true);
                }
              }
              return data;
            }
            if (typeof key === "object") {
              return this.each(function() {
                dataUser.set(this, key);
              });
            }
            return access(this, function(value2) {
              if (elem && value2 === void 0) {
                return dataAttr(elem, key, dataUser.get(elem, key));
              }
              this.each(function() {
                dataUser.set(this, key, value2);
              });
            }, null, value, arguments.length > 1, null, true);
          },
          removeData: function(key) {
            return this.each(function() {
              dataUser.remove(this, key);
            });
          }
        });
        jQuery.extend({
          queue: function(elem, type, data) {
            var queue;
            if (elem) {
              type = (type || "fx") + "queue";
              queue = dataPriv.get(elem, type);
              if (data) {
                if (!queue || Array.isArray(data)) {
                  queue = dataPriv.access(elem, type, jQuery.makeArray(data));
                } else {
                  queue.push(data);
                }
              }
              return queue || [];
            }
          },
          dequeue: function(elem, type) {
            type = type || "fx";
            var queue = jQuery.queue(elem, type), startLength = queue.length, fn = queue.shift(), hooks2 = jQuery._queueHooks(elem, type), next = function() {
              jQuery.dequeue(elem, type);
            };
            if (fn === "inprogress") {
              fn = queue.shift();
              startLength--;
            }
            if (fn) {
              if (type === "fx") {
                queue.unshift("inprogress");
              }
              delete hooks2.stop;
              fn.call(elem, next, hooks2);
            }
            if (!startLength && hooks2) {
              hooks2.empty.fire();
            }
          },
          // Not public - generate a queueHooks object, or return the current one
          _queueHooks: function(elem, type) {
            var key = type + "queueHooks";
            return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
              empty: jQuery.Callbacks("once memory").add(function() {
                dataPriv.remove(elem, [type + "queue", key]);
              })
            });
          }
        });
        jQuery.fn.extend({
          queue: function(type, data) {
            var setter = 2;
            if (typeof type !== "string") {
              data = type;
              type = "fx";
              setter--;
            }
            if (arguments.length < setter) {
              return jQuery.queue(this[0], type);
            }
            return data === void 0 ? this : this.each(function() {
              var queue = jQuery.queue(this, type, data);
              jQuery._queueHooks(this, type);
              if (type === "fx" && queue[0] !== "inprogress") {
                jQuery.dequeue(this, type);
              }
            });
          },
          dequeue: function(type) {
            return this.each(function() {
              jQuery.dequeue(this, type);
            });
          },
          clearQueue: function(type) {
            return this.queue(type || "fx", []);
          },
          // Get a promise resolved when queues of a certain type
          // are emptied (fx is the type by default)
          promise: function(type, obj) {
            var tmp, count = 1, defer = jQuery.Deferred(), elements = this, i = this.length, resolve = function() {
              if (!--count) {
                defer.resolveWith(elements, [elements]);
              }
            };
            if (typeof type !== "string") {
              obj = type;
              type = void 0;
            }
            type = type || "fx";
            while (i--) {
              tmp = dataPriv.get(elements[i], type + "queueHooks");
              if (tmp && tmp.empty) {
                count++;
                tmp.empty.add(resolve);
              }
            }
            resolve();
            return defer.promise(obj);
          }
        });
        var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
        var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");
        var cssExpand = ["Top", "Right", "Bottom", "Left"];
        var documentElement = document2.documentElement;
        var isAttached = function(elem) {
          return jQuery.contains(elem.ownerDocument, elem);
        }, composed = { composed: true };
        if (documentElement.getRootNode) {
          isAttached = function(elem) {
            return jQuery.contains(elem.ownerDocument, elem) || elem.getRootNode(composed) === elem.ownerDocument;
          };
        }
        var isHiddenWithinTree = function(elem, el) {
          elem = el || elem;
          return elem.style.display === "none" || elem.style.display === "" && // Otherwise, check computed style
          // Support: Firefox <=43 - 45
          // Disconnected elements can have computed display: none, so first confirm that elem is
          // in the document.
          isAttached(elem) && jQuery.css(elem, "display") === "none";
        };
        function adjustCSS(elem, prop, valueParts, tween) {
          var adjusted, scale, maxIterations = 20, currentValue = tween ? function() {
            return tween.cur();
          } : function() {
            return jQuery.css(elem, prop, "");
          }, initial = currentValue(), unit = valueParts && valueParts[3] || (jQuery.cssNumber[prop] ? "" : "px"), initialInUnit = elem.nodeType && (jQuery.cssNumber[prop] || unit !== "px" && +initial) && rcssNum.exec(jQuery.css(elem, prop));
          if (initialInUnit && initialInUnit[3] !== unit) {
            initial = initial / 2;
            unit = unit || initialInUnit[3];
            initialInUnit = +initial || 1;
            while (maxIterations--) {
              jQuery.style(elem, prop, initialInUnit + unit);
              if ((1 - scale) * (1 - (scale = currentValue() / initial || 0.5)) <= 0) {
                maxIterations = 0;
              }
              initialInUnit = initialInUnit / scale;
            }
            initialInUnit = initialInUnit * 2;
            jQuery.style(elem, prop, initialInUnit + unit);
            valueParts = valueParts || [];
          }
          if (valueParts) {
            initialInUnit = +initialInUnit || +initial || 0;
            adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
            if (tween) {
              tween.unit = unit;
              tween.start = initialInUnit;
              tween.end = adjusted;
            }
          }
          return adjusted;
        }
        var defaultDisplayMap = {};
        function getDefaultDisplay(elem) {
          var temp, doc = elem.ownerDocument, nodeName2 = elem.nodeName, display = defaultDisplayMap[nodeName2];
          if (display) {
            return display;
          }
          temp = doc.body.appendChild(doc.createElement(nodeName2));
          display = jQuery.css(temp, "display");
          temp.parentNode.removeChild(temp);
          if (display === "none") {
            display = "block";
          }
          defaultDisplayMap[nodeName2] = display;
          return display;
        }
        function showHide(elements, show) {
          var display, elem, values = [], index = 0, length = elements.length;
          for (; index < length; index++) {
            elem = elements[index];
            if (!elem.style) {
              continue;
            }
            display = elem.style.display;
            if (show) {
              if (display === "none") {
                values[index] = dataPriv.get(elem, "display") || null;
                if (!values[index]) {
                  elem.style.display = "";
                }
              }
              if (elem.style.display === "" && isHiddenWithinTree(elem)) {
                values[index] = getDefaultDisplay(elem);
              }
            } else {
              if (display !== "none") {
                values[index] = "none";
                dataPriv.set(elem, "display", display);
              }
            }
          }
          for (index = 0; index < length; index++) {
            if (values[index] != null) {
              elements[index].style.display = values[index];
            }
          }
          return elements;
        }
        jQuery.fn.extend({
          show: function() {
            return showHide(this, true);
          },
          hide: function() {
            return showHide(this);
          },
          toggle: function(state) {
            if (typeof state === "boolean") {
              return state ? this.show() : this.hide();
            }
            return this.each(function() {
              if (isHiddenWithinTree(this)) {
                jQuery(this).show();
              } else {
                jQuery(this).hide();
              }
            });
          }
        });
        var rcheckableType = /^(?:checkbox|radio)$/i;
        var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i;
        var rscriptType = /^$|^module$|\/(?:java|ecma)script/i;
        (function() {
          var fragment = document2.createDocumentFragment(), div = fragment.appendChild(document2.createElement("div")), input = document2.createElement("input");
          input.setAttribute("type", "radio");
          input.setAttribute("checked", "checked");
          input.setAttribute("name", "t");
          div.appendChild(input);
          support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
          div.innerHTML = "<textarea>x</textarea>";
          support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
          div.innerHTML = "<option></option>";
          support.option = !!div.lastChild;
        })();
        var wrapMap = {
          // XHTML parsers do not magically insert elements in the
          // same way that tag soup parsers do. So we cannot shorten
          // this by omitting <tbody> or other required elements.
          thead: [1, "<table>", "</table>"],
          col: [2, "<table><colgroup>", "</colgroup></table>"],
          tr: [2, "<table><tbody>", "</tbody></table>"],
          td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
          _default: [0, "", ""]
        };
        wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
        wrapMap.th = wrapMap.td;
        if (!support.option) {
          wrapMap.optgroup = wrapMap.option = [1, "<select multiple='multiple'>", "</select>"];
        }
        function getAll(context, tag) {
          var ret;
          if (typeof context.getElementsByTagName !== "undefined") {
            ret = arr.slice.call(context.getElementsByTagName(tag || "*"));
          } else if (typeof context.querySelectorAll !== "undefined") {
            ret = context.querySelectorAll(tag || "*");
          } else {
            ret = [];
          }
          if (tag === void 0 || tag && nodeName(context, tag)) {
            return jQuery.merge([context], ret);
          }
          return ret;
        }
        function setGlobalEval(elems, refElements) {
          var i = 0, l = elems.length;
          for (; i < l; i++) {
            dataPriv.set(
              elems[i],
              "globalEval",
              !refElements || dataPriv.get(refElements[i], "globalEval")
            );
          }
        }
        var rhtml = /<|&#?\w+;/;
        function buildFragment(elems, context, scripts, selection, ignored) {
          var elem, tmp, tag, wrap, attached, j, fragment = context.createDocumentFragment(), nodes = [], i = 0, l = elems.length;
          for (; i < l; i++) {
            elem = elems[i];
            if (elem || elem === 0) {
              if (toType(elem) === "object") {
                jQuery.merge(nodes, elem.nodeType ? [elem] : elem);
              } else if (!rhtml.test(elem)) {
                nodes.push(context.createTextNode(elem));
              } else {
                tmp = tmp || fragment.appendChild(context.createElement("div"));
                tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
                wrap = wrapMap[tag] || wrapMap._default;
                tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2];
                j = wrap[0];
                while (j--) {
                  tmp = tmp.lastChild;
                }
                jQuery.merge(nodes, tmp.childNodes);
                tmp = fragment.firstChild;
                tmp.textContent = "";
              }
            }
          }
          fragment.textContent = "";
          i = 0;
          while (elem = nodes[i++]) {
            if (selection && jQuery.inArray(elem, selection) > -1) {
              if (ignored) {
                ignored.push(elem);
              }
              continue;
            }
            attached = isAttached(elem);
            tmp = getAll(fragment.appendChild(elem), "script");
            if (attached) {
              setGlobalEval(tmp);
            }
            if (scripts) {
              j = 0;
              while (elem = tmp[j++]) {
                if (rscriptType.test(elem.type || "")) {
                  scripts.push(elem);
                }
              }
            }
          }
          return fragment;
        }
        var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
        function returnTrue() {
          return true;
        }
        function returnFalse() {
          return false;
        }
        function on(elem, types, selector, data, fn, one) {
          var origFn, type;
          if (typeof types === "object") {
            if (typeof selector !== "string") {
              data = data || selector;
              selector = void 0;
            }
            for (type in types) {
              on(elem, type, selector, data, types[type], one);
            }
            return elem;
          }
          if (data == null && fn == null) {
            fn = selector;
            data = selector = void 0;
          } else if (fn == null) {
            if (typeof selector === "string") {
              fn = data;
              data = void 0;
            } else {
              fn = data;
              data = selector;
              selector = void 0;
            }
          }
          if (fn === false) {
            fn = returnFalse;
          } else if (!fn) {
            return elem;
          }
          if (one === 1) {
            origFn = fn;
            fn = function(event) {
              jQuery().off(event);
              return origFn.apply(this, arguments);
            };
            fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
          }
          return elem.each(function() {
            jQuery.event.add(this, types, fn, data, selector);
          });
        }
        jQuery.event = {
          global: {},
          add: function(elem, types, handler, data, selector) {
            var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.get(elem);
            if (!acceptData(elem)) {
              return;
            }
            if (handler.handler) {
              handleObjIn = handler;
              handler = handleObjIn.handler;
              selector = handleObjIn.selector;
            }
            if (selector) {
              jQuery.find.matchesSelector(documentElement, selector);
            }
            if (!handler.guid) {
              handler.guid = jQuery.guid++;
            }
            if (!(events = elemData.events)) {
              events = elemData.events = /* @__PURE__ */ Object.create(null);
            }
            if (!(eventHandle = elemData.handle)) {
              eventHandle = elemData.handle = function(e) {
                return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ? jQuery.event.dispatch.apply(elem, arguments) : void 0;
              };
            }
            types = (types || "").match(rnothtmlwhite) || [""];
            t = types.length;
            while (t--) {
              tmp = rtypenamespace.exec(types[t]) || [];
              type = origType = tmp[1];
              namespaces = (tmp[2] || "").split(".").sort();
              if (!type) {
                continue;
              }
              special = jQuery.event.special[type] || {};
              type = (selector ? special.delegateType : special.bindType) || type;
              special = jQuery.event.special[type] || {};
              handleObj = jQuery.extend({
                type,
                origType,
                data,
                handler,
                guid: handler.guid,
                selector,
                needsContext: selector && jQuery.expr.match.needsContext.test(selector),
                namespace: namespaces.join(".")
              }, handleObjIn);
              if (!(handlers = events[type])) {
                handlers = events[type] = [];
                handlers.delegateCount = 0;
                if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
                  if (elem.addEventListener) {
                    elem.addEventListener(type, eventHandle);
                  }
                }
              }
              if (special.add) {
                special.add.call(elem, handleObj);
                if (!handleObj.handler.guid) {
                  handleObj.handler.guid = handler.guid;
                }
              }
              if (selector) {
                handlers.splice(handlers.delegateCount++, 0, handleObj);
              } else {
                handlers.push(handleObj);
              }
              jQuery.event.global[type] = true;
            }
          },
          // Detach an event or set of events from an element
          remove: function(elem, types, handler, selector, mappedTypes) {
            var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
            if (!elemData || !(events = elemData.events)) {
              return;
            }
            types = (types || "").match(rnothtmlwhite) || [""];
            t = types.length;
            while (t--) {
              tmp = rtypenamespace.exec(types[t]) || [];
              type = origType = tmp[1];
              namespaces = (tmp[2] || "").split(".").sort();
              if (!type) {
                for (type in events) {
                  jQuery.event.remove(elem, type + types[t], handler, selector, true);
                }
                continue;
              }
              special = jQuery.event.special[type] || {};
              type = (selector ? special.delegateType : special.bindType) || type;
              handlers = events[type] || [];
              tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
              origCount = j = handlers.length;
              while (j--) {
                handleObj = handlers[j];
                if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
                  handlers.splice(j, 1);
                  if (handleObj.selector) {
                    handlers.delegateCount--;
                  }
                  if (special.remove) {
                    special.remove.call(elem, handleObj);
                  }
                }
              }
              if (origCount && !handlers.length) {
                if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
                  jQuery.removeEvent(elem, type, elemData.handle);
                }
                delete events[type];
              }
            }
            if (jQuery.isEmptyObject(events)) {
              dataPriv.remove(elem, "handle events");
            }
          },
          dispatch: function(nativeEvent) {
            var i, j, ret, matched, handleObj, handlerQueue, args = new Array(arguments.length), event = jQuery.event.fix(nativeEvent), handlers = (dataPriv.get(this, "events") || /* @__PURE__ */ Object.create(null))[event.type] || [], special = jQuery.event.special[event.type] || {};
            args[0] = event;
            for (i = 1; i < arguments.length; i++) {
              args[i] = arguments[i];
            }
            event.delegateTarget = this;
            if (special.preDispatch && special.preDispatch.call(this, event) === false) {
              return;
            }
            handlerQueue = jQuery.event.handlers.call(this, event, handlers);
            i = 0;
            while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
              event.currentTarget = matched.elem;
              j = 0;
              while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
                if (!event.rnamespace || handleObj.namespace === false || event.rnamespace.test(handleObj.namespace)) {
                  event.handleObj = handleObj;
                  event.data = handleObj.data;
                  ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
                  if (ret !== void 0) {
                    if ((event.result = ret) === false) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }
                }
              }
            }
            if (special.postDispatch) {
              special.postDispatch.call(this, event);
            }
            return event.result;
          },
          handlers: function(event, handlers) {
            var i, handleObj, sel, matchedHandlers, matchedSelectors, handlerQueue = [], delegateCount = handlers.delegateCount, cur = event.target;
            if (delegateCount && // Support: IE <=9
            // Black-hole SVG <use> instance trees (trac-13180)
            cur.nodeType && // Support: Firefox <=42
            // Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
            // https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
            // Support: IE 11 only
            // ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
            !(event.type === "click" && event.button >= 1)) {
              for (; cur !== this; cur = cur.parentNode || this) {
                if (cur.nodeType === 1 && !(event.type === "click" && cur.disabled === true)) {
                  matchedHandlers = [];
                  matchedSelectors = {};
                  for (i = 0; i < delegateCount; i++) {
                    handleObj = handlers[i];
                    sel = handleObj.selector + " ";
                    if (matchedSelectors[sel] === void 0) {
                      matchedSelectors[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) > -1 : jQuery.find(sel, this, null, [cur]).length;
                    }
                    if (matchedSelectors[sel]) {
                      matchedHandlers.push(handleObj);
                    }
                  }
                  if (matchedHandlers.length) {
                    handlerQueue.push({ elem: cur, handlers: matchedHandlers });
                  }
                }
              }
            }
            cur = this;
            if (delegateCount < handlers.length) {
              handlerQueue.push({ elem: cur, handlers: handlers.slice(delegateCount) });
            }
            return handlerQueue;
          },
          addProp: function(name, hook) {
            Object.defineProperty(jQuery.Event.prototype, name, {
              enumerable: true,
              configurable: true,
              get: isFunction(hook) ? function() {
                if (this.originalEvent) {
                  return hook(this.originalEvent);
                }
              } : function() {
                if (this.originalEvent) {
                  return this.originalEvent[name];
                }
              },
              set: function(value) {
                Object.defineProperty(this, name, {
                  enumerable: true,
                  configurable: true,
                  writable: true,
                  value
                });
              }
            });
          },
          fix: function(originalEvent) {
            return originalEvent[jQuery.expando] ? originalEvent : new jQuery.Event(originalEvent);
          },
          special: {
            load: {
              // Prevent triggered image.load events from bubbling to window.load
              noBubble: true
            },
            click: {
              // Utilize native event to ensure correct state for checkable inputs
              setup: function(data) {
                var el = this || data;
                if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
                  leverageNative(el, "click", true);
                }
                return false;
              },
              trigger: function(data) {
                var el = this || data;
                if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
                  leverageNative(el, "click");
                }
                return true;
              },
              // For cross-browser consistency, suppress native .click() on links
              // Also prevent it if we're currently inside a leveraged native-event stack
              _default: function(event) {
                var target = event.target;
                return rcheckableType.test(target.type) && target.click && nodeName(target, "input") && dataPriv.get(target, "click") || nodeName(target, "a");
              }
            },
            beforeunload: {
              postDispatch: function(event) {
                if (event.result !== void 0 && event.originalEvent) {
                  event.originalEvent.returnValue = event.result;
                }
              }
            }
          }
        };
        function leverageNative(el, type, isSetup) {
          if (!isSetup) {
            if (dataPriv.get(el, type) === void 0) {
              jQuery.event.add(el, type, returnTrue);
            }
            return;
          }
          dataPriv.set(el, type, false);
          jQuery.event.add(el, type, {
            namespace: false,
            handler: function(event) {
              var result, saved = dataPriv.get(this, type);
              if (event.isTrigger & 1 && this[type]) {
                if (!saved.length) {
                  saved = slice.call(arguments);
                  dataPriv.set(this, type, saved);
                  this[type]();
                  result = dataPriv.get(this, type);
                  dataPriv.set(this, type, false);
                  if (saved !== result) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return result && result.value;
                  }
                } else if ((jQuery.event.special[type] || {}).delegateType) {
                  event.stopPropagation();
                }
              } else if (saved.length) {
                dataPriv.set(this, type, {
                  value: jQuery.event.trigger(
                    saved[0],
                    saved.slice(1),
                    this
                  )
                });
                event.stopPropagation();
                event.isImmediatePropagationStopped = returnTrue;
              }
            }
          });
        }
        jQuery.removeEvent = function(elem, type, handle) {
          if (elem.removeEventListener) {
            elem.removeEventListener(type, handle);
          }
        };
        jQuery.Event = function(src, props) {
          if (!(this instanceof jQuery.Event)) {
            return new jQuery.Event(src, props);
          }
          if (src && src.type) {
            this.originalEvent = src;
            this.type = src.type;
            this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === void 0 && // Support: Android <=2.3 only
            src.returnValue === false ? returnTrue : returnFalse;
            this.target = src.target && src.target.nodeType === 3 ? src.target.parentNode : src.target;
            this.currentTarget = src.currentTarget;
            this.relatedTarget = src.relatedTarget;
          } else {
            this.type = src;
          }
          if (props) {
            jQuery.extend(this, props);
          }
          this.timeStamp = src && src.timeStamp || Date.now();
          this[jQuery.expando] = true;
        };
        jQuery.Event.prototype = {
          constructor: jQuery.Event,
          isDefaultPrevented: returnFalse,
          isPropagationStopped: returnFalse,
          isImmediatePropagationStopped: returnFalse,
          isSimulated: false,
          preventDefault: function() {
            var e = this.originalEvent;
            this.isDefaultPrevented = returnTrue;
            if (e && !this.isSimulated) {
              e.preventDefault();
            }
          },
          stopPropagation: function() {
            var e = this.originalEvent;
            this.isPropagationStopped = returnTrue;
            if (e && !this.isSimulated) {
              e.stopPropagation();
            }
          },
          stopImmediatePropagation: function() {
            var e = this.originalEvent;
            this.isImmediatePropagationStopped = returnTrue;
            if (e && !this.isSimulated) {
              e.stopImmediatePropagation();
            }
            this.stopPropagation();
          }
        };
        jQuery.each({
          altKey: true,
          bubbles: true,
          cancelable: true,
          changedTouches: true,
          ctrlKey: true,
          detail: true,
          eventPhase: true,
          metaKey: true,
          pageX: true,
          pageY: true,
          shiftKey: true,
          view: true,
          "char": true,
          code: true,
          charCode: true,
          key: true,
          keyCode: true,
          button: true,
          buttons: true,
          clientX: true,
          clientY: true,
          offsetX: true,
          offsetY: true,
          pointerId: true,
          pointerType: true,
          screenX: true,
          screenY: true,
          targetTouches: true,
          toElement: true,
          touches: true,
          which: true
        }, jQuery.event.addProp);
        jQuery.each({ focus: "focusin", blur: "focusout" }, function(type, delegateType) {
          function focusMappedHandler(nativeEvent) {
            if (document2.documentMode) {
              var handle = dataPriv.get(this, "handle"), event = jQuery.event.fix(nativeEvent);
              event.type = nativeEvent.type === "focusin" ? "focus" : "blur";
              event.isSimulated = true;
              handle(nativeEvent);
              if (event.target === event.currentTarget) {
                handle(event);
              }
            } else {
              jQuery.event.simulate(
                delegateType,
                nativeEvent.target,
                jQuery.event.fix(nativeEvent)
              );
            }
          }
          jQuery.event.special[type] = {
            // Utilize native event if possible so blur/focus sequence is correct
            setup: function() {
              var attaches;
              leverageNative(this, type, true);
              if (document2.documentMode) {
                attaches = dataPriv.get(this, delegateType);
                if (!attaches) {
                  this.addEventListener(delegateType, focusMappedHandler);
                }
                dataPriv.set(this, delegateType, (attaches || 0) + 1);
              } else {
                return false;
              }
            },
            trigger: function() {
              leverageNative(this, type);
              return true;
            },
            teardown: function() {
              var attaches;
              if (document2.documentMode) {
                attaches = dataPriv.get(this, delegateType) - 1;
                if (!attaches) {
                  this.removeEventListener(delegateType, focusMappedHandler);
                  dataPriv.remove(this, delegateType);
                } else {
                  dataPriv.set(this, delegateType, attaches);
                }
              } else {
                return false;
              }
            },
            // Suppress native focus or blur if we're currently inside
            // a leveraged native-event stack
            _default: function(event) {
              return dataPriv.get(event.target, type);
            },
            delegateType
          };
          jQuery.event.special[delegateType] = {
            setup: function() {
              var doc = this.ownerDocument || this.document || this, dataHolder = document2.documentMode ? this : doc, attaches = dataPriv.get(dataHolder, delegateType);
              if (!attaches) {
                if (document2.documentMode) {
                  this.addEventListener(delegateType, focusMappedHandler);
                } else {
                  doc.addEventListener(type, focusMappedHandler, true);
                }
              }
              dataPriv.set(dataHolder, delegateType, (attaches || 0) + 1);
            },
            teardown: function() {
              var doc = this.ownerDocument || this.document || this, dataHolder = document2.documentMode ? this : doc, attaches = dataPriv.get(dataHolder, delegateType) - 1;
              if (!attaches) {
                if (document2.documentMode) {
                  this.removeEventListener(delegateType, focusMappedHandler);
                } else {
                  doc.removeEventListener(type, focusMappedHandler, true);
                }
                dataPriv.remove(dataHolder, delegateType);
              } else {
                dataPriv.set(dataHolder, delegateType, attaches);
              }
            }
          };
        });
        jQuery.each({
          mouseenter: "mouseover",
          mouseleave: "mouseout",
          pointerenter: "pointerover",
          pointerleave: "pointerout"
        }, function(orig, fix) {
          jQuery.event.special[orig] = {
            delegateType: fix,
            bindType: fix,
            handle: function(event) {
              var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
              if (!related || related !== target && !jQuery.contains(target, related)) {
                event.type = handleObj.origType;
                ret = handleObj.handler.apply(this, arguments);
                event.type = fix;
              }
              return ret;
            }
          };
        });
        jQuery.fn.extend({
          on: function(types, selector, data, fn) {
            return on(this, types, selector, data, fn);
          },
          one: function(types, selector, data, fn) {
            return on(this, types, selector, data, fn, 1);
          },
          off: function(types, selector, fn) {
            var handleObj, type;
            if (types && types.preventDefault && types.handleObj) {
              handleObj = types.handleObj;
              jQuery(types.delegateTarget).off(
                handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
                handleObj.selector,
                handleObj.handler
              );
              return this;
            }
            if (typeof types === "object") {
              for (type in types) {
                this.off(type, selector, types[type]);
              }
              return this;
            }
            if (selector === false || typeof selector === "function") {
              fn = selector;
              selector = void 0;
            }
            if (fn === false) {
              fn = returnFalse;
            }
            return this.each(function() {
              jQuery.event.remove(this, types, fn, selector);
            });
          }
        });
        var rnoInnerhtml = /<script|<style|<link/i, rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i, rcleanScript = /^\s*<!\[CDATA\[|\]\]>\s*$/g;
        function manipulationTarget(elem, content) {
          if (nodeName(elem, "table") && nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr")) {
            return jQuery(elem).children("tbody")[0] || elem;
          }
          return elem;
        }
        function disableScript(elem) {
          elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
          return elem;
        }
        function restoreScript(elem) {
          if ((elem.type || "").slice(0, 5) === "true/") {
            elem.type = elem.type.slice(5);
          } else {
            elem.removeAttribute("type");
          }
          return elem;
        }
        function cloneCopyEvent(src, dest) {
          var i, l, type, pdataOld, udataOld, udataCur, events;
          if (dest.nodeType !== 1) {
            return;
          }
          if (dataPriv.hasData(src)) {
            pdataOld = dataPriv.get(src);
            events = pdataOld.events;
            if (events) {
              dataPriv.remove(dest, "handle events");
              for (type in events) {
                for (i = 0, l = events[type].length; i < l; i++) {
                  jQuery.event.add(dest, type, events[type][i]);
                }
              }
            }
          }
          if (dataUser.hasData(src)) {
            udataOld = dataUser.access(src);
            udataCur = jQuery.extend({}, udataOld);
            dataUser.set(dest, udataCur);
          }
        }
        function fixInput(src, dest) {
          var nodeName2 = dest.nodeName.toLowerCase();
          if (nodeName2 === "input" && rcheckableType.test(src.type)) {
            dest.checked = src.checked;
          } else if (nodeName2 === "input" || nodeName2 === "textarea") {
            dest.defaultValue = src.defaultValue;
          }
        }
        function domManip(collection, args, callback, ignored) {
          args = flat(args);
          var fragment, first, scripts, hasScripts, node, doc, i = 0, l = collection.length, iNoClone = l - 1, value = args[0], valueIsFunction = isFunction(value);
          if (valueIsFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)) {
            return collection.each(function(index) {
              var self = collection.eq(index);
              if (valueIsFunction) {
                args[0] = value.call(this, index, self.html());
              }
              domManip(self, args, callback, ignored);
            });
          }
          if (l) {
            fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
            first = fragment.firstChild;
            if (fragment.childNodes.length === 1) {
              fragment = first;
            }
            if (first || ignored) {
              scripts = jQuery.map(getAll(fragment, "script"), disableScript);
              hasScripts = scripts.length;
              for (; i < l; i++) {
                node = fragment;
                if (i !== iNoClone) {
                  node = jQuery.clone(node, true, true);
                  if (hasScripts) {
                    jQuery.merge(scripts, getAll(node, "script"));
                  }
                }
                callback.call(collection[i], node, i);
              }
              if (hasScripts) {
                doc = scripts[scripts.length - 1].ownerDocument;
                jQuery.map(scripts, restoreScript);
                for (i = 0; i < hasScripts; i++) {
                  node = scripts[i];
                  if (rscriptType.test(node.type || "") && !dataPriv.access(node, "globalEval") && jQuery.contains(doc, node)) {
                    if (node.src && (node.type || "").toLowerCase() !== "module") {
                      if (jQuery._evalUrl && !node.noModule) {
                        jQuery._evalUrl(node.src, {
                          nonce: node.nonce || node.getAttribute("nonce")
                        }, doc);
                      }
                    } else {
                      DOMEval(node.textContent.replace(rcleanScript, ""), node, doc);
                    }
                  }
                }
              }
            }
          }
          return collection;
        }
        function remove(elem, selector, keepData) {
          var node, nodes = selector ? jQuery.filter(selector, elem) : elem, i = 0;
          for (; (node = nodes[i]) != null; i++) {
            if (!keepData && node.nodeType === 1) {
              jQuery.cleanData(getAll(node));
            }
            if (node.parentNode) {
              if (keepData && isAttached(node)) {
                setGlobalEval(getAll(node, "script"));
              }
              node.parentNode.removeChild(node);
            }
          }
          return elem;
        }
        jQuery.extend({
          htmlPrefilter: function(html) {
            return html;
          },
          clone: function(elem, dataAndEvents, deepDataAndEvents) {
            var i, l, srcElements, destElements, clone = elem.cloneNode(true), inPage = isAttached(elem);
            if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {
              destElements = getAll(clone);
              srcElements = getAll(elem);
              for (i = 0, l = srcElements.length; i < l; i++) {
                fixInput(srcElements[i], destElements[i]);
              }
            }
            if (dataAndEvents) {
              if (deepDataAndEvents) {
                srcElements = srcElements || getAll(elem);
                destElements = destElements || getAll(clone);
                for (i = 0, l = srcElements.length; i < l; i++) {
                  cloneCopyEvent(srcElements[i], destElements[i]);
                }
              } else {
                cloneCopyEvent(elem, clone);
              }
            }
            destElements = getAll(clone, "script");
            if (destElements.length > 0) {
              setGlobalEval(destElements, !inPage && getAll(elem, "script"));
            }
            return clone;
          },
          cleanData: function(elems) {
            var data, elem, type, special = jQuery.event.special, i = 0;
            for (; (elem = elems[i]) !== void 0; i++) {
              if (acceptData(elem)) {
                if (data = elem[dataPriv.expando]) {
                  if (data.events) {
                    for (type in data.events) {
                      if (special[type]) {
                        jQuery.event.remove(elem, type);
                      } else {
                        jQuery.removeEvent(elem, type, data.handle);
                      }
                    }
                  }
                  elem[dataPriv.expando] = void 0;
                }
                if (elem[dataUser.expando]) {
                  elem[dataUser.expando] = void 0;
                }
              }
            }
          }
        });
        jQuery.fn.extend({
          detach: function(selector) {
            return remove(this, selector, true);
          },
          remove: function(selector) {
            return remove(this, selector);
          },
          text: function(value) {
            return access(this, function(value2) {
              return value2 === void 0 ? jQuery.text(this) : this.empty().each(function() {
                if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                  this.textContent = value2;
                }
              });
            }, null, value, arguments.length);
          },
          append: function() {
            return domManip(this, arguments, function(elem) {
              if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                var target = manipulationTarget(this, elem);
                target.appendChild(elem);
              }
            });
          },
          prepend: function() {
            return domManip(this, arguments, function(elem) {
              if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                var target = manipulationTarget(this, elem);
                target.insertBefore(elem, target.firstChild);
              }
            });
          },
          before: function() {
            return domManip(this, arguments, function(elem) {
              if (this.parentNode) {
                this.parentNode.insertBefore(elem, this);
              }
            });
          },
          after: function() {
            return domManip(this, arguments, function(elem) {
              if (this.parentNode) {
                this.parentNode.insertBefore(elem, this.nextSibling);
              }
            });
          },
          empty: function() {
            var elem, i = 0;
            for (; (elem = this[i]) != null; i++) {
              if (elem.nodeType === 1) {
                jQuery.cleanData(getAll(elem, false));
                elem.textContent = "";
              }
            }
            return this;
          },
          clone: function(dataAndEvents, deepDataAndEvents) {
            dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
            deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
            return this.map(function() {
              return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
            });
          },
          html: function(value) {
            return access(this, function(value2) {
              var elem = this[0] || {}, i = 0, l = this.length;
              if (value2 === void 0 && elem.nodeType === 1) {
                return elem.innerHTML;
              }
              if (typeof value2 === "string" && !rnoInnerhtml.test(value2) && !wrapMap[(rtagName.exec(value2) || ["", ""])[1].toLowerCase()]) {
                value2 = jQuery.htmlPrefilter(value2);
                try {
                  for (; i < l; i++) {
                    elem = this[i] || {};
                    if (elem.nodeType === 1) {
                      jQuery.cleanData(getAll(elem, false));
                      elem.innerHTML = value2;
                    }
                  }
                  elem = 0;
                } catch (_) {
                }
              }
              if (elem) {
                this.empty().append(value2);
              }
            }, null, value, arguments.length);
          },
          replaceWith: function() {
            var ignored = [];
            return domManip(this, arguments, function(elem) {
              var parent = this.parentNode;
              if (jQuery.inArray(this, ignored) < 0) {
                jQuery.cleanData(getAll(this));
                if (parent) {
                  parent.replaceChild(elem, this);
                }
              }
            }, ignored);
          }
        });
        jQuery.each({
          appendTo: "append",
          prependTo: "prepend",
          insertBefore: "before",
          insertAfter: "after",
          replaceAll: "replaceWith"
        }, function(name, original) {
          jQuery.fn[name] = function(selector) {
            var elems, ret = [], insert = jQuery(selector), last = insert.length - 1, i = 0;
            for (; i <= last; i++) {
              elems = i === last ? this : this.clone(true);
              jQuery(insert[i])[original](elems);
              push.apply(ret, elems.get());
            }
            return this.pushStack(ret);
          };
        });
        var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
        var rcustomProp = /^--/;
        var getStyles = function(elem) {
          var view = elem.ownerDocument.defaultView;
          if (!view || !view.opener) {
            view = window2;
          }
          return view.getComputedStyle(elem);
        };
        var swap = function(elem, options, callback) {
          var ret, name, old = {};
          for (name in options) {
            old[name] = elem.style[name];
            elem.style[name] = options[name];
          }
          ret = callback.call(elem);
          for (name in options) {
            elem.style[name] = old[name];
          }
          return ret;
        };
        var rboxStyle = new RegExp(cssExpand.join("|"), "i");
        (function() {
          var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal, reliableMarginLeftVal, reliableTrDimensionsVal, reliableColDimensionsVal, container = document2.createElement("div"), div = document2.createElement("div"), table = document2.createElement("table");
          if (!div.style) {
            return;
          }
          function roundPixelMeasures(measure) {
            return Math.round(parseFloat(measure));
          }
          function computeStyleTests() {
            if (!div) {
              return;
            }
            container.style.cssText = "position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0";
            div.style.cssText = "position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%";
            documentElement.appendChild(container).appendChild(div);
            var divStyle = window2.getComputedStyle(div);
            pixelPositionVal = divStyle && divStyle.top !== "1%";
            if (div.offsetWidth === 0) {
              documentElement.removeChild(container).textContent = "";
              return;
            }
            reliableMarginLeftVal = roundPixelMeasures(divStyle.marginLeft) === 12;
            div.style.right = "60%";
            pixelBoxStylesVal = roundPixelMeasures(divStyle.right) === 36;
            boxSizingReliableVal = roundPixelMeasures(divStyle.width) === 36;
            div.style.position = "absolute";
            scrollboxSizeVal = roundPixelMeasures(div.offsetWidth / 3) === 12;
            documentElement.removeChild(container);
            div = null;
          }
          function computeTableStyleTests() {
            if (!table) {
              return;
            }
            var trStyle, col = document2.createElement("col"), tr = document2.createElement("tr"), td = document2.createElement("td");
            table.style.cssText = "position:absolute;left:-11111px;border-collapse:separate;border-spacing:0";
            tr.style.cssText = "box-sizing:content-box;border:1px solid;height:1px";
            td.style.cssText = "height:9px;width:9px;padding:0";
            col.span = 2;
            documentElement.appendChild(table).appendChild(col).parentNode.appendChild(tr).appendChild(td).parentNode.appendChild(td.cloneNode(true));
            if (table.offsetWidth === 0) {
              documentElement.removeChild(table);
              return;
            }
            trStyle = window2.getComputedStyle(tr);
            reliableColDimensionsVal = !!documentElement.msMatchesSelector || Math.round(
              parseFloat(
                window2.getComputedStyle(col).width
              )
            ) === 18;
            reliableTrDimensionsVal = Math.round(parseFloat(trStyle.height) + parseFloat(trStyle.borderTopWidth) + parseFloat(trStyle.borderBottomWidth)) === tr.offsetHeight;
            documentElement.removeChild(table);
            table = null;
          }
          div.style.backgroundClip = "content-box";
          div.cloneNode(true).style.backgroundClip = "";
          support.clearCloneStyle = div.style.backgroundClip === "content-box";
          jQuery.extend(support, {
            boxSizingReliable: function() {
              computeStyleTests();
              return boxSizingReliableVal;
            },
            pixelBoxStyles: function() {
              computeStyleTests();
              return pixelBoxStylesVal;
            },
            pixelPosition: function() {
              computeStyleTests();
              return pixelPositionVal;
            },
            reliableMarginLeft: function() {
              computeStyleTests();
              return reliableMarginLeftVal;
            },
            scrollboxSize: function() {
              computeStyleTests();
              return scrollboxSizeVal;
            },
            reliableTrDimensions: function() {
              computeTableStyleTests();
              return reliableTrDimensionsVal;
            },
            reliableColDimensions: function() {
              computeTableStyleTests();
              return reliableColDimensionsVal;
            }
          });
        })();
        function curCSS(elem, name, computed) {
          var width, minWidth, maxWidth, ret, isCustomProp = rcustomProp.test(name), style = elem.style;
          computed = computed || getStyles(elem);
          if (computed) {
            ret = computed.getPropertyValue(name) || computed[name];
            if (isCustomProp && ret) {
              ret = ret.replace(rtrimCSS, "$1") || void 0;
            }
            if (ret === "" && !isAttached(elem)) {
              ret = jQuery.style(elem, name);
            }
            if (!support.pixelBoxStyles() && rnumnonpx.test(ret) && rboxStyle.test(name)) {
              width = style.width;
              minWidth = style.minWidth;
              maxWidth = style.maxWidth;
              style.minWidth = style.maxWidth = style.width = ret;
              ret = computed.width;
              style.width = width;
              style.minWidth = minWidth;
              style.maxWidth = maxWidth;
            }
          }
          return ret !== void 0 ? (
            // Support: IE <=9 - 11 only
            // IE returns zIndex value as an integer.
            ret + ""
          ) : ret;
        }
        function addGetHookIf(conditionFn, hookFn) {
          return {
            get: function() {
              if (conditionFn()) {
                delete this.get;
                return;
              }
              return (this.get = hookFn).apply(this, arguments);
            }
          };
        }
        var cssPrefixes = ["Webkit", "Moz", "ms"], emptyStyle = document2.createElement("div").style, vendorProps = {};
        function vendorPropName(name) {
          var capName = name[0].toUpperCase() + name.slice(1), i = cssPrefixes.length;
          while (i--) {
            name = cssPrefixes[i] + capName;
            if (name in emptyStyle) {
              return name;
            }
          }
        }
        function finalPropName(name) {
          var final = jQuery.cssProps[name] || vendorProps[name];
          if (final) {
            return final;
          }
          if (name in emptyStyle) {
            return name;
          }
          return vendorProps[name] = vendorPropName(name) || name;
        }
        var cssShow = { position: "absolute", visibility: "hidden", display: "block" }, cssNormalTransform = {
          letterSpacing: "0",
          fontWeight: "400"
        };
        function setPositiveNumber(_elem, value, subtract) {
          var matches2 = rcssNum.exec(value);
          return matches2 ? (
            // Guard against undefined "subtract", e.g., when used as in cssHooks
            Math.max(0, matches2[2] - (subtract || 0)) + (matches2[3] || "px")
          ) : value;
        }
        function boxModelAdjustment(elem, dimension, box, isBorderBox, styles, computedVal) {
          var i = dimension === "width" ? 1 : 0, extra = 0, delta = 0, marginDelta = 0;
          if (box === (isBorderBox ? "border" : "content")) {
            return 0;
          }
          for (; i < 4; i += 2) {
            if (box === "margin") {
              marginDelta += jQuery.css(elem, box + cssExpand[i], true, styles);
            }
            if (!isBorderBox) {
              delta += jQuery.css(elem, "padding" + cssExpand[i], true, styles);
              if (box !== "padding") {
                delta += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
              } else {
                extra += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
              }
            } else {
              if (box === "content") {
                delta -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
              }
              if (box !== "margin") {
                delta -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
              }
            }
          }
          if (!isBorderBox && computedVal >= 0) {
            delta += Math.max(0, Math.ceil(
              elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - computedVal - delta - extra - 0.5
              // If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
              // Use an explicit zero to avoid NaN (gh-3964)
            )) || 0;
          }
          return delta + marginDelta;
        }
        function getWidthOrHeight(elem, dimension, extra) {
          var styles = getStyles(elem), boxSizingNeeded = !support.boxSizingReliable() || extra, isBorderBox = boxSizingNeeded && jQuery.css(elem, "boxSizing", false, styles) === "border-box", valueIsBorderBox = isBorderBox, val = curCSS(elem, dimension, styles), offsetProp = "offset" + dimension[0].toUpperCase() + dimension.slice(1);
          if (rnumnonpx.test(val)) {
            if (!extra) {
              return val;
            }
            val = "auto";
          }
          if (
            // Fall back to offsetWidth/offsetHeight when value is "auto"
            // This happens for inline elements with no explicit setting (gh-3571)
            (val === "auto" || // Support: IE 9 - 11 only
            // Use offsetWidth/offsetHeight for when box sizing is unreliable.
            // In those cases, the computed value can be trusted to be border-box.
            !support.boxSizingReliable() && isBorderBox || !support.reliableColDimensions() && nodeName(elem, "col") || !support.reliableTrDimensions() && nodeName(elem, "tr") || // Support: Android <=4.1 - 4.3 only
            // Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
            !parseFloat(val) && jQuery.css(elem, "display", false, styles) === "inline") && // Make sure the element is visible & connected
            elem.getClientRects().length
          ) {
            isBorderBox = jQuery.css(elem, "boxSizing", false, styles) === "border-box";
            valueIsBorderBox = offsetProp in elem;
            if (valueIsBorderBox) {
              val = elem[offsetProp];
            }
          }
          val = parseFloat(val) || 0;
          return val + boxModelAdjustment(
            elem,
            dimension,
            extra || (isBorderBox ? "border" : "content"),
            valueIsBorderBox,
            styles,
            // Provide the current computed size to request scroll gutter calculation (gh-3589)
            val
          ) + "px";
        }
        jQuery.extend({
          // Add in style property hooks for overriding the default
          // behavior of getting and setting a style property
          cssHooks: {
            opacity: {
              get: function(elem, computed) {
                if (computed) {
                  var ret = curCSS(elem, "opacity");
                  return ret === "" ? "1" : ret;
                }
              }
            }
          },
          // Don't automatically add "px" to these possibly-unitless properties
          cssNumber: {
            animationIterationCount: true,
            aspectRatio: true,
            borderImageSlice: true,
            columnCount: true,
            flexGrow: true,
            flexShrink: true,
            fontWeight: true,
            gridArea: true,
            gridColumn: true,
            gridColumnEnd: true,
            gridColumnStart: true,
            gridRow: true,
            gridRowEnd: true,
            gridRowStart: true,
            lineHeight: true,
            opacity: true,
            order: true,
            orphans: true,
            scale: true,
            widows: true,
            zIndex: true,
            zoom: true,
            // SVG-related
            fillOpacity: true,
            floodOpacity: true,
            stopOpacity: true,
            strokeMiterlimit: true,
            strokeOpacity: true
          },
          // Add in properties whose names you wish to fix before
          // setting or getting the value
          cssProps: {},
          // Get and set the style property on a DOM Node
          style: function(elem, name, value, extra) {
            if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
              return;
            }
            var ret, type, hooks2, origName = camelCase(name), isCustomProp = rcustomProp.test(name), style = elem.style;
            if (!isCustomProp) {
              name = finalPropName(origName);
            }
            hooks2 = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
            if (value !== void 0) {
              type = typeof value;
              if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
                value = adjustCSS(elem, name, ret);
                type = "number";
              }
              if (value == null || value !== value) {
                return;
              }
              if (type === "number" && !isCustomProp) {
                value += ret && ret[3] || (jQuery.cssNumber[origName] ? "" : "px");
              }
              if (!support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
                style[name] = "inherit";
              }
              if (!hooks2 || !("set" in hooks2) || (value = hooks2.set(elem, value, extra)) !== void 0) {
                if (isCustomProp) {
                  style.setProperty(name, value);
                } else {
                  style[name] = value;
                }
              }
            } else {
              if (hooks2 && "get" in hooks2 && (ret = hooks2.get(elem, false, extra)) !== void 0) {
                return ret;
              }
              return style[name];
            }
          },
          css: function(elem, name, extra, styles) {
            var val, num, hooks2, origName = camelCase(name), isCustomProp = rcustomProp.test(name);
            if (!isCustomProp) {
              name = finalPropName(origName);
            }
            hooks2 = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
            if (hooks2 && "get" in hooks2) {
              val = hooks2.get(elem, true, extra);
            }
            if (val === void 0) {
              val = curCSS(elem, name, styles);
            }
            if (val === "normal" && name in cssNormalTransform) {
              val = cssNormalTransform[name];
            }
            if (extra === "" || extra) {
              num = parseFloat(val);
              return extra === true || isFinite(num) ? num || 0 : val;
            }
            return val;
          }
        });
        jQuery.each(["height", "width"], function(_i, dimension) {
          jQuery.cssHooks[dimension] = {
            get: function(elem, computed, extra) {
              if (computed) {
                return jQuery.css(elem, "display") === "none" ? swap(elem, cssShow, function() {
                  return getWidthOrHeight(elem, dimension, extra);
                }) : getWidthOrHeight(elem, dimension, extra);
              }
            },
            set: function(elem, value, extra) {
              var matches2, styles = getStyles(elem), scrollboxSizeBuggy = !support.scrollboxSize() && styles.position === "absolute", boxSizingNeeded = scrollboxSizeBuggy || extra, isBorderBox = boxSizingNeeded && jQuery.css(elem, "boxSizing", false, styles) === "border-box", subtract = extra ? boxModelAdjustment(
                elem,
                dimension,
                extra,
                isBorderBox,
                styles
              ) : 0;
              if (isBorderBox && scrollboxSizeBuggy) {
                subtract -= Math.ceil(
                  elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - parseFloat(styles[dimension]) - boxModelAdjustment(elem, dimension, "border", false, styles) - 0.5
                );
              }
              if (subtract && (matches2 = rcssNum.exec(value)) && (matches2[3] || "px") !== "px") {
                elem.style[dimension] = value;
                value = jQuery.css(elem, dimension);
              }
              return setPositiveNumber(elem, value, subtract);
            }
          };
        });
        jQuery.cssHooks.marginLeft = addGetHookIf(
          support.reliableMarginLeft,
          function(elem, computed) {
            if (computed) {
              return (parseFloat(curCSS(elem, "marginLeft")) || elem.getBoundingClientRect().left - swap(elem, { marginLeft: 0 }, function() {
                return elem.getBoundingClientRect().left;
              })) + "px";
            }
          }
        );
        jQuery.each({
          margin: "",
          padding: "",
          border: "Width"
        }, function(prefix, suffix) {
          jQuery.cssHooks[prefix + suffix] = {
            expand: function(value) {
              var i = 0, expanded = {}, parts = typeof value === "string" ? value.split(" ") : [value];
              for (; i < 4; i++) {
                expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
              }
              return expanded;
            }
          };
          if (prefix !== "margin") {
            jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
          }
        });
        jQuery.fn.extend({
          css: function(name, value) {
            return access(this, function(elem, name2, value2) {
              var styles, len, map = {}, i = 0;
              if (Array.isArray(name2)) {
                styles = getStyles(elem);
                len = name2.length;
                for (; i < len; i++) {
                  map[name2[i]] = jQuery.css(elem, name2[i], false, styles);
                }
                return map;
              }
              return value2 !== void 0 ? jQuery.style(elem, name2, value2) : jQuery.css(elem, name2);
            }, name, value, arguments.length > 1);
          }
        });
        function Tween(elem, options, prop, end, easing) {
          return new Tween.prototype.init(elem, options, prop, end, easing);
        }
        jQuery.Tween = Tween;
        Tween.prototype = {
          constructor: Tween,
          init: function(elem, options, prop, end, easing, unit) {
            this.elem = elem;
            this.prop = prop;
            this.easing = easing || jQuery.easing._default;
            this.options = options;
            this.start = this.now = this.cur();
            this.end = end;
            this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
          },
          cur: function() {
            var hooks2 = Tween.propHooks[this.prop];
            return hooks2 && hooks2.get ? hooks2.get(this) : Tween.propHooks._default.get(this);
          },
          run: function(percent) {
            var eased, hooks2 = Tween.propHooks[this.prop];
            if (this.options.duration) {
              this.pos = eased = jQuery.easing[this.easing](
                percent,
                this.options.duration * percent,
                0,
                1,
                this.options.duration
              );
            } else {
              this.pos = eased = percent;
            }
            this.now = (this.end - this.start) * eased + this.start;
            if (this.options.step) {
              this.options.step.call(this.elem, this.now, this);
            }
            if (hooks2 && hooks2.set) {
              hooks2.set(this);
            } else {
              Tween.propHooks._default.set(this);
            }
            return this;
          }
        };
        Tween.prototype.init.prototype = Tween.prototype;
        Tween.propHooks = {
          _default: {
            get: function(tween) {
              var result;
              if (tween.elem.nodeType !== 1 || tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null) {
                return tween.elem[tween.prop];
              }
              result = jQuery.css(tween.elem, tween.prop, "");
              return !result || result === "auto" ? 0 : result;
            },
            set: function(tween) {
              if (jQuery.fx.step[tween.prop]) {
                jQuery.fx.step[tween.prop](tween);
              } else if (tween.elem.nodeType === 1 && (jQuery.cssHooks[tween.prop] || tween.elem.style[finalPropName(tween.prop)] != null)) {
                jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
              } else {
                tween.elem[tween.prop] = tween.now;
              }
            }
          }
        };
        Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
          set: function(tween) {
            if (tween.elem.nodeType && tween.elem.parentNode) {
              tween.elem[tween.prop] = tween.now;
            }
          }
        };
        jQuery.easing = {
          linear: function(p) {
            return p;
          },
          swing: function(p) {
            return 0.5 - Math.cos(p * Math.PI) / 2;
          },
          _default: "swing"
        };
        jQuery.fx = Tween.prototype.init;
        jQuery.fx.step = {};
        var fxNow, inProgress, rfxtypes = /^(?:toggle|show|hide)$/, rrun = /queueHooks$/;
        function schedule() {
          if (inProgress) {
            if (document2.hidden === false && window2.requestAnimationFrame) {
              window2.requestAnimationFrame(schedule);
            } else {
              window2.setTimeout(schedule, jQuery.fx.interval);
            }
            jQuery.fx.tick();
          }
        }
        function createFxNow() {
          window2.setTimeout(function() {
            fxNow = void 0;
          });
          return fxNow = Date.now();
        }
        function genFx(type, includeWidth) {
          var which, i = 0, attrs = { height: type };
          includeWidth = includeWidth ? 1 : 0;
          for (; i < 4; i += 2 - includeWidth) {
            which = cssExpand[i];
            attrs["margin" + which] = attrs["padding" + which] = type;
          }
          if (includeWidth) {
            attrs.opacity = attrs.width = type;
          }
          return attrs;
        }
        function createTween(value, prop, animation) {
          var tween, collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]), index = 0, length = collection.length;
          for (; index < length; index++) {
            if (tween = collection[index].call(animation, prop, value)) {
              return tween;
            }
          }
        }
        function defaultPrefilter(elem, props, opts) {
          var prop, value, toggle, hooks2, oldfire, propTween, restoreDisplay, display, isBox = "width" in props || "height" in props, anim = this, orig = {}, style = elem.style, hidden = elem.nodeType && isHiddenWithinTree(elem), dataShow = dataPriv.get(elem, "fxshow");
          if (!opts.queue) {
            hooks2 = jQuery._queueHooks(elem, "fx");
            if (hooks2.unqueued == null) {
              hooks2.unqueued = 0;
              oldfire = hooks2.empty.fire;
              hooks2.empty.fire = function() {
                if (!hooks2.unqueued) {
                  oldfire();
                }
              };
            }
            hooks2.unqueued++;
            anim.always(function() {
              anim.always(function() {
                hooks2.unqueued--;
                if (!jQuery.queue(elem, "fx").length) {
                  hooks2.empty.fire();
                }
              });
            });
          }
          for (prop in props) {
            value = props[prop];
            if (rfxtypes.test(value)) {
              delete props[prop];
              toggle = toggle || value === "toggle";
              if (value === (hidden ? "hide" : "show")) {
                if (value === "show" && dataShow && dataShow[prop] !== void 0) {
                  hidden = true;
                } else {
                  continue;
                }
              }
              orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);
            }
          }
          propTween = !jQuery.isEmptyObject(props);
          if (!propTween && jQuery.isEmptyObject(orig)) {
            return;
          }
          if (isBox && elem.nodeType === 1) {
            opts.overflow = [style.overflow, style.overflowX, style.overflowY];
            restoreDisplay = dataShow && dataShow.display;
            if (restoreDisplay == null) {
              restoreDisplay = dataPriv.get(elem, "display");
            }
            display = jQuery.css(elem, "display");
            if (display === "none") {
              if (restoreDisplay) {
                display = restoreDisplay;
              } else {
                showHide([elem], true);
                restoreDisplay = elem.style.display || restoreDisplay;
                display = jQuery.css(elem, "display");
                showHide([elem]);
              }
            }
            if (display === "inline" || display === "inline-block" && restoreDisplay != null) {
              if (jQuery.css(elem, "float") === "none") {
                if (!propTween) {
                  anim.done(function() {
                    style.display = restoreDisplay;
                  });
                  if (restoreDisplay == null) {
                    display = style.display;
                    restoreDisplay = display === "none" ? "" : display;
                  }
                }
                style.display = "inline-block";
              }
            }
          }
          if (opts.overflow) {
            style.overflow = "hidden";
            anim.always(function() {
              style.overflow = opts.overflow[0];
              style.overflowX = opts.overflow[1];
              style.overflowY = opts.overflow[2];
            });
          }
          propTween = false;
          for (prop in orig) {
            if (!propTween) {
              if (dataShow) {
                if ("hidden" in dataShow) {
                  hidden = dataShow.hidden;
                }
              } else {
                dataShow = dataPriv.access(elem, "fxshow", { display: restoreDisplay });
              }
              if (toggle) {
                dataShow.hidden = !hidden;
              }
              if (hidden) {
                showHide([elem], true);
              }
              anim.done(function() {
                if (!hidden) {
                  showHide([elem]);
                }
                dataPriv.remove(elem, "fxshow");
                for (prop in orig) {
                  jQuery.style(elem, prop, orig[prop]);
                }
              });
            }
            propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
            if (!(prop in dataShow)) {
              dataShow[prop] = propTween.start;
              if (hidden) {
                propTween.end = propTween.start;
                propTween.start = 0;
              }
            }
          }
        }
        function propFilter(props, specialEasing) {
          var index, name, easing, value, hooks2;
          for (index in props) {
            name = camelCase(index);
            easing = specialEasing[name];
            value = props[index];
            if (Array.isArray(value)) {
              easing = value[1];
              value = props[index] = value[0];
            }
            if (index !== name) {
              props[name] = value;
              delete props[index];
            }
            hooks2 = jQuery.cssHooks[name];
            if (hooks2 && "expand" in hooks2) {
              value = hooks2.expand(value);
              delete props[name];
              for (index in value) {
                if (!(index in props)) {
                  props[index] = value[index];
                  specialEasing[index] = easing;
                }
              }
            } else {
              specialEasing[name] = easing;
            }
          }
        }
        function Animation(elem, properties, options) {
          var result, stopped, index = 0, length = Animation.prefilters.length, deferred = jQuery.Deferred().always(function() {
            delete tick.elem;
          }), tick = function() {
            if (stopped) {
              return false;
            }
            var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), temp = remaining / animation.duration || 0, percent = 1 - temp, index2 = 0, length2 = animation.tweens.length;
            for (; index2 < length2; index2++) {
              animation.tweens[index2].run(percent);
            }
            deferred.notifyWith(elem, [animation, percent, remaining]);
            if (percent < 1 && length2) {
              return remaining;
            }
            if (!length2) {
              deferred.notifyWith(elem, [animation, 1, 0]);
            }
            deferred.resolveWith(elem, [animation]);
            return false;
          }, animation = deferred.promise({
            elem,
            props: jQuery.extend({}, properties),
            opts: jQuery.extend(true, {
              specialEasing: {},
              easing: jQuery.easing._default
            }, options),
            originalProperties: properties,
            originalOptions: options,
            startTime: fxNow || createFxNow(),
            duration: options.duration,
            tweens: [],
            createTween: function(prop, end) {
              var tween = jQuery.Tween(
                elem,
                animation.opts,
                prop,
                end,
                animation.opts.specialEasing[prop] || animation.opts.easing
              );
              animation.tweens.push(tween);
              return tween;
            },
            stop: function(gotoEnd) {
              var index2 = 0, length2 = gotoEnd ? animation.tweens.length : 0;
              if (stopped) {
                return this;
              }
              stopped = true;
              for (; index2 < length2; index2++) {
                animation.tweens[index2].run(1);
              }
              if (gotoEnd) {
                deferred.notifyWith(elem, [animation, 1, 0]);
                deferred.resolveWith(elem, [animation, gotoEnd]);
              } else {
                deferred.rejectWith(elem, [animation, gotoEnd]);
              }
              return this;
            }
          }), props = animation.props;
          propFilter(props, animation.opts.specialEasing);
          for (; index < length; index++) {
            result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
            if (result) {
              if (isFunction(result.stop)) {
                jQuery._queueHooks(animation.elem, animation.opts.queue).stop = result.stop.bind(result);
              }
              return result;
            }
          }
          jQuery.map(props, createTween, animation);
          if (isFunction(animation.opts.start)) {
            animation.opts.start.call(elem, animation);
          }
          animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
          jQuery.fx.timer(
            jQuery.extend(tick, {
              elem,
              anim: animation,
              queue: animation.opts.queue
            })
          );
          return animation;
        }
        jQuery.Animation = jQuery.extend(Animation, {
          tweeners: {
            "*": [function(prop, value) {
              var tween = this.createTween(prop, value);
              adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
              return tween;
            }]
          },
          tweener: function(props, callback) {
            if (isFunction(props)) {
              callback = props;
              props = ["*"];
            } else {
              props = props.match(rnothtmlwhite);
            }
            var prop, index = 0, length = props.length;
            for (; index < length; index++) {
              prop = props[index];
              Animation.tweeners[prop] = Animation.tweeners[prop] || [];
              Animation.tweeners[prop].unshift(callback);
            }
          },
          prefilters: [defaultPrefilter],
          prefilter: function(callback, prepend) {
            if (prepend) {
              Animation.prefilters.unshift(callback);
            } else {
              Animation.prefilters.push(callback);
            }
          }
        });
        jQuery.speed = function(speed, easing, fn) {
          var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
            complete: fn || easing || isFunction(speed) && speed,
            duration: speed,
            easing: fn && easing || easing && !isFunction(easing) && easing
          };
          if (jQuery.fx.off) {
            opt.duration = 0;
          } else {
            if (typeof opt.duration !== "number") {
              if (opt.duration in jQuery.fx.speeds) {
                opt.duration = jQuery.fx.speeds[opt.duration];
              } else {
                opt.duration = jQuery.fx.speeds._default;
              }
            }
          }
          if (opt.queue == null || opt.queue === true) {
            opt.queue = "fx";
          }
          opt.old = opt.complete;
          opt.complete = function() {
            if (isFunction(opt.old)) {
              opt.old.call(this);
            }
            if (opt.queue) {
              jQuery.dequeue(this, opt.queue);
            }
          };
          return opt;
        };
        jQuery.fn.extend({
          fadeTo: function(speed, to, easing, callback) {
            return this.filter(isHiddenWithinTree).css("opacity", 0).show().end().animate({ opacity: to }, speed, easing, callback);
          },
          animate: function(prop, speed, easing, callback) {
            var empty = jQuery.isEmptyObject(prop), optall = jQuery.speed(speed, easing, callback), doAnimation = function() {
              var anim = Animation(this, jQuery.extend({}, prop), optall);
              if (empty || dataPriv.get(this, "finish")) {
                anim.stop(true);
              }
            };
            doAnimation.finish = doAnimation;
            return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
          },
          stop: function(type, clearQueue, gotoEnd) {
            var stopQueue = function(hooks2) {
              var stop = hooks2.stop;
              delete hooks2.stop;
              stop(gotoEnd);
            };
            if (typeof type !== "string") {
              gotoEnd = clearQueue;
              clearQueue = type;
              type = void 0;
            }
            if (clearQueue) {
              this.queue(type || "fx", []);
            }
            return this.each(function() {
              var dequeue = true, index = type != null && type + "queueHooks", timers = jQuery.timers, data = dataPriv.get(this);
              if (index) {
                if (data[index] && data[index].stop) {
                  stopQueue(data[index]);
                }
              } else {
                for (index in data) {
                  if (data[index] && data[index].stop && rrun.test(index)) {
                    stopQueue(data[index]);
                  }
                }
              }
              for (index = timers.length; index--; ) {
                if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
                  timers[index].anim.stop(gotoEnd);
                  dequeue = false;
                  timers.splice(index, 1);
                }
              }
              if (dequeue || !gotoEnd) {
                jQuery.dequeue(this, type);
              }
            });
          },
          finish: function(type) {
            if (type !== false) {
              type = type || "fx";
            }
            return this.each(function() {
              var index, data = dataPriv.get(this), queue = data[type + "queue"], hooks2 = data[type + "queueHooks"], timers = jQuery.timers, length = queue ? queue.length : 0;
              data.finish = true;
              jQuery.queue(this, type, []);
              if (hooks2 && hooks2.stop) {
                hooks2.stop.call(this, true);
              }
              for (index = timers.length; index--; ) {
                if (timers[index].elem === this && timers[index].queue === type) {
                  timers[index].anim.stop(true);
                  timers.splice(index, 1);
                }
              }
              for (index = 0; index < length; index++) {
                if (queue[index] && queue[index].finish) {
                  queue[index].finish.call(this);
                }
              }
              delete data.finish;
            });
          }
        });
        jQuery.each(["toggle", "show", "hide"], function(_i, name) {
          var cssFn = jQuery.fn[name];
          jQuery.fn[name] = function(speed, easing, callback) {
            return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
          };
        });
        jQuery.each({
          slideDown: genFx("show"),
          slideUp: genFx("hide"),
          slideToggle: genFx("toggle"),
          fadeIn: { opacity: "show" },
          fadeOut: { opacity: "hide" },
          fadeToggle: { opacity: "toggle" }
        }, function(name, props) {
          jQuery.fn[name] = function(speed, easing, callback) {
            return this.animate(props, speed, easing, callback);
          };
        });
        jQuery.timers = [];
        jQuery.fx.tick = function() {
          var timer, i = 0, timers = jQuery.timers;
          fxNow = Date.now();
          for (; i < timers.length; i++) {
            timer = timers[i];
            if (!timer() && timers[i] === timer) {
              timers.splice(i--, 1);
            }
          }
          if (!timers.length) {
            jQuery.fx.stop();
          }
          fxNow = void 0;
        };
        jQuery.fx.timer = function(timer) {
          jQuery.timers.push(timer);
          jQuery.fx.start();
        };
        jQuery.fx.interval = 13;
        jQuery.fx.start = function() {
          if (inProgress) {
            return;
          }
          inProgress = true;
          schedule();
        };
        jQuery.fx.stop = function() {
          inProgress = null;
        };
        jQuery.fx.speeds = {
          slow: 600,
          fast: 200,
          // Default speed
          _default: 400
        };
        jQuery.fn.delay = function(time, type) {
          time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
          type = type || "fx";
          return this.queue(type, function(next, hooks2) {
            var timeout = window2.setTimeout(next, time);
            hooks2.stop = function() {
              window2.clearTimeout(timeout);
            };
          });
        };
        (function() {
          var input = document2.createElement("input"), select = document2.createElement("select"), opt = select.appendChild(document2.createElement("option"));
          input.type = "checkbox";
          support.checkOn = input.value !== "";
          support.optSelected = opt.selected;
          input = document2.createElement("input");
          input.value = "t";
          input.type = "radio";
          support.radioValue = input.value === "t";
        })();
        var boolHook, attrHandle = jQuery.expr.attrHandle;
        jQuery.fn.extend({
          attr: function(name, value) {
            return access(this, jQuery.attr, name, value, arguments.length > 1);
          },
          removeAttr: function(name) {
            return this.each(function() {
              jQuery.removeAttr(this, name);
            });
          }
        });
        jQuery.extend({
          attr: function(elem, name, value) {
            var ret, hooks2, nType = elem.nodeType;
            if (nType === 3 || nType === 8 || nType === 2) {
              return;
            }
            if (typeof elem.getAttribute === "undefined") {
              return jQuery.prop(elem, name, value);
            }
            if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
              hooks2 = jQuery.attrHooks[name.toLowerCase()] || (jQuery.expr.match.bool.test(name) ? boolHook : void 0);
            }
            if (value !== void 0) {
              if (value === null) {
                jQuery.removeAttr(elem, name);
                return;
              }
              if (hooks2 && "set" in hooks2 && (ret = hooks2.set(elem, value, name)) !== void 0) {
                return ret;
              }
              elem.setAttribute(name, value + "");
              return value;
            }
            if (hooks2 && "get" in hooks2 && (ret = hooks2.get(elem, name)) !== null) {
              return ret;
            }
            ret = jQuery.find.attr(elem, name);
            return ret == null ? void 0 : ret;
          },
          attrHooks: {
            type: {
              set: function(elem, value) {
                if (!support.radioValue && value === "radio" && nodeName(elem, "input")) {
                  var val = elem.value;
                  elem.setAttribute("type", value);
                  if (val) {
                    elem.value = val;
                  }
                  return value;
                }
              }
            }
          },
          removeAttr: function(elem, value) {
            var name, i = 0, attrNames = value && value.match(rnothtmlwhite);
            if (attrNames && elem.nodeType === 1) {
              while (name = attrNames[i++]) {
                elem.removeAttribute(name);
              }
            }
          }
        });
        boolHook = {
          set: function(elem, value, name) {
            var strValue = String(value);
            if (value === false) {
              jQuery.removeAttr(elem, name);
            } else {
              elem.setAttribute(
                name,
                name.toLowerCase() === "hidden" && strValue.toLowerCase() === "until-found" ? strValue : name
              );
            }
            return name;
          }
        };
        jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function(_i, name) {
          var getter = attrHandle[name] || jQuery.find.attr;
          attrHandle[name] = function(elem, name2, isXML) {
            var ret, handle, lowercaseName = name2.toLowerCase();
            if (!isXML) {
              handle = attrHandle[lowercaseName];
              attrHandle[lowercaseName] = ret;
              ret = getter(elem, name2, isXML);
              ret = ret == null || lowercaseName === "hidden" && ret.toLowerCase() === "until-found" ? ret : lowercaseName;
              attrHandle[lowercaseName] = handle;
            }
            return ret;
          };
        });
        var rfocusable = /^(?:input|select|textarea|button)$/i, rclickable = /^(?:a|area)$/i;
        jQuery.fn.extend({
          prop: function(name, value) {
            return access(this, jQuery.prop, name, value, arguments.length > 1);
          },
          removeProp: function(name) {
            return this.each(function() {
              delete this[jQuery.propFix[name] || name];
            });
          }
        });
        jQuery.extend({
          prop: function(elem, name, value) {
            var ret, hooks2, nType = elem.nodeType;
            if (nType === 3 || nType === 8 || nType === 2) {
              return;
            }
            if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
              name = jQuery.propFix[name] || name;
              hooks2 = jQuery.propHooks[name];
            }
            if (value !== void 0) {
              if (hooks2 && "set" in hooks2 && (ret = hooks2.set(elem, value, name)) !== void 0) {
                return ret;
              }
              return elem[name] = value;
            }
            if (hooks2 && "get" in hooks2 && (ret = hooks2.get(elem, name)) !== null) {
              return ret;
            }
            return elem[name];
          },
          propHooks: {
            tabIndex: {
              get: function(elem) {
                var tabindex = jQuery.find.attr(elem, "tabindex");
                if (tabindex) {
                  return parseInt(tabindex, 10);
                }
                if (rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href) {
                  return 0;
                }
                return -1;
              }
            }
          },
          propFix: {
            "for": "htmlFor",
            "class": "className"
          }
        });
        if (!support.optSelected) {
          jQuery.propHooks.selected = {
            get: function(elem) {
              var parent = elem.parentNode;
              if (parent && parent.parentNode) {
                parent.parentNode.selectedIndex;
              }
              return null;
            },
            set: function(elem) {
              var parent = elem.parentNode;
              if (parent) {
                parent.selectedIndex;
                if (parent.parentNode) {
                  parent.parentNode.selectedIndex;
                }
              }
            }
          };
        }
        jQuery.each([
          "tabIndex",
          "readOnly",
          "maxLength",
          "cellSpacing",
          "cellPadding",
          "rowSpan",
          "colSpan",
          "useMap",
          "frameBorder",
          "contentEditable"
        ], function() {
          jQuery.propFix[this.toLowerCase()] = this;
        });
        function stripAndCollapse(value) {
          var tokens = value.match(rnothtmlwhite) || [];
          return tokens.join(" ");
        }
        function getClass(elem) {
          return elem.getAttribute && elem.getAttribute("class") || "";
        }
        function classesToArray(value) {
          if (Array.isArray(value)) {
            return value;
          }
          if (typeof value === "string") {
            return value.match(rnothtmlwhite) || [];
          }
          return [];
        }
        jQuery.fn.extend({
          addClass: function(value) {
            var classNames, cur, curValue, className, i, finalValue;
            if (isFunction(value)) {
              return this.each(function(j) {
                jQuery(this).addClass(value.call(this, j, getClass(this)));
              });
            }
            classNames = classesToArray(value);
            if (classNames.length) {
              return this.each(function() {
                curValue = getClass(this);
                cur = this.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
                if (cur) {
                  for (i = 0; i < classNames.length; i++) {
                    className = classNames[i];
                    if (cur.indexOf(" " + className + " ") < 0) {
                      cur += className + " ";
                    }
                  }
                  finalValue = stripAndCollapse(cur);
                  if (curValue !== finalValue) {
                    this.setAttribute("class", finalValue);
                  }
                }
              });
            }
            return this;
          },
          removeClass: function(value) {
            var classNames, cur, curValue, className, i, finalValue;
            if (isFunction(value)) {
              return this.each(function(j) {
                jQuery(this).removeClass(value.call(this, j, getClass(this)));
              });
            }
            if (!arguments.length) {
              return this.attr("class", "");
            }
            classNames = classesToArray(value);
            if (classNames.length) {
              return this.each(function() {
                curValue = getClass(this);
                cur = this.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
                if (cur) {
                  for (i = 0; i < classNames.length; i++) {
                    className = classNames[i];
                    while (cur.indexOf(" " + className + " ") > -1) {
                      cur = cur.replace(" " + className + " ", " ");
                    }
                  }
                  finalValue = stripAndCollapse(cur);
                  if (curValue !== finalValue) {
                    this.setAttribute("class", finalValue);
                  }
                }
              });
            }
            return this;
          },
          toggleClass: function(value, stateVal) {
            var classNames, className, i, self, type = typeof value, isValidValue = type === "string" || Array.isArray(value);
            if (isFunction(value)) {
              return this.each(function(i2) {
                jQuery(this).toggleClass(
                  value.call(this, i2, getClass(this), stateVal),
                  stateVal
                );
              });
            }
            if (typeof stateVal === "boolean" && isValidValue) {
              return stateVal ? this.addClass(value) : this.removeClass(value);
            }
            classNames = classesToArray(value);
            return this.each(function() {
              if (isValidValue) {
                self = jQuery(this);
                for (i = 0; i < classNames.length; i++) {
                  className = classNames[i];
                  if (self.hasClass(className)) {
                    self.removeClass(className);
                  } else {
                    self.addClass(className);
                  }
                }
              } else if (value === void 0 || type === "boolean") {
                className = getClass(this);
                if (className) {
                  dataPriv.set(this, "__className__", className);
                }
                if (this.setAttribute) {
                  this.setAttribute(
                    "class",
                    className || value === false ? "" : dataPriv.get(this, "__className__") || ""
                  );
                }
              }
            });
          },
          hasClass: function(selector) {
            var className, elem, i = 0;
            className = " " + selector + " ";
            while (elem = this[i++]) {
              if (elem.nodeType === 1 && (" " + stripAndCollapse(getClass(elem)) + " ").indexOf(className) > -1) {
                return true;
              }
            }
            return false;
          }
        });
        var rreturn = /\r/g;
        jQuery.fn.extend({
          val: function(value) {
            var hooks2, ret, valueIsFunction, elem = this[0];
            if (!arguments.length) {
              if (elem) {
                hooks2 = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];
                if (hooks2 && "get" in hooks2 && (ret = hooks2.get(elem, "value")) !== void 0) {
                  return ret;
                }
                ret = elem.value;
                if (typeof ret === "string") {
                  return ret.replace(rreturn, "");
                }
                return ret == null ? "" : ret;
              }
              return;
            }
            valueIsFunction = isFunction(value);
            return this.each(function(i) {
              var val;
              if (this.nodeType !== 1) {
                return;
              }
              if (valueIsFunction) {
                val = value.call(this, i, jQuery(this).val());
              } else {
                val = value;
              }
              if (val == null) {
                val = "";
              } else if (typeof val === "number") {
                val += "";
              } else if (Array.isArray(val)) {
                val = jQuery.map(val, function(value2) {
                  return value2 == null ? "" : value2 + "";
                });
              }
              hooks2 = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];
              if (!hooks2 || !("set" in hooks2) || hooks2.set(this, val, "value") === void 0) {
                this.value = val;
              }
            });
          }
        });
        jQuery.extend({
          valHooks: {
            option: {
              get: function(elem) {
                var val = jQuery.find.attr(elem, "value");
                return val != null ? val : (
                  // Support: IE <=10 - 11 only
                  // option.text throws exceptions (trac-14686, trac-14858)
                  // Strip and collapse whitespace
                  // https://html.spec.whatwg.org/#strip-and-collapse-whitespace
                  stripAndCollapse(jQuery.text(elem))
                );
              }
            },
            select: {
              get: function(elem) {
                var value, option, i, options = elem.options, index = elem.selectedIndex, one = elem.type === "select-one", values = one ? null : [], max = one ? index + 1 : options.length;
                if (index < 0) {
                  i = max;
                } else {
                  i = one ? index : 0;
                }
                for (; i < max; i++) {
                  option = options[i];
                  if ((option.selected || i === index) && // Don't return options that are disabled or in a disabled optgroup
                  !option.disabled && (!option.parentNode.disabled || !nodeName(option.parentNode, "optgroup"))) {
                    value = jQuery(option).val();
                    if (one) {
                      return value;
                    }
                    values.push(value);
                  }
                }
                return values;
              },
              set: function(elem, value) {
                var optionSet, option, options = elem.options, values = jQuery.makeArray(value), i = options.length;
                while (i--) {
                  option = options[i];
                  if (option.selected = jQuery.inArray(jQuery.valHooks.option.get(option), values) > -1) {
                    optionSet = true;
                  }
                }
                if (!optionSet) {
                  elem.selectedIndex = -1;
                }
                return values;
              }
            }
          }
        });
        jQuery.each(["radio", "checkbox"], function() {
          jQuery.valHooks[this] = {
            set: function(elem, value) {
              if (Array.isArray(value)) {
                return elem.checked = jQuery.inArray(jQuery(elem).val(), value) > -1;
              }
            }
          };
          if (!support.checkOn) {
            jQuery.valHooks[this].get = function(elem) {
              return elem.getAttribute("value") === null ? "on" : elem.value;
            };
          }
        });
        var location = window2.location;
        var nonce = { guid: Date.now() };
        var rquery = /\?/;
        jQuery.parseXML = function(data) {
          var xml, parserErrorElem;
          if (!data || typeof data !== "string") {
            return null;
          }
          try {
            xml = new window2.DOMParser().parseFromString(data, "text/xml");
          } catch (_) {
          }
          parserErrorElem = xml && xml.getElementsByTagName("parsererror")[0];
          if (!xml || parserErrorElem) {
            jQuery.error("Invalid XML: " + (parserErrorElem ? jQuery.map(parserErrorElem.childNodes, function(el) {
              return el.textContent;
            }).join("\n") : data));
          }
          return xml;
        };
        var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/, stopPropagationCallback = function(e) {
          e.stopPropagation();
        };
        jQuery.extend(jQuery.event, {
          trigger: function(event, data, elem, onlyHandlers) {
            var i, cur, tmp, bubbleType, ontype, handle, special, lastElement, eventPath = [elem || document2], type = hasOwn.call(event, "type") ? event.type : event, namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
            cur = lastElement = tmp = elem = elem || document2;
            if (elem.nodeType === 3 || elem.nodeType === 8) {
              return;
            }
            if (rfocusMorph.test(type + jQuery.event.triggered)) {
              return;
            }
            if (type.indexOf(".") > -1) {
              namespaces = type.split(".");
              type = namespaces.shift();
              namespaces.sort();
            }
            ontype = type.indexOf(":") < 0 && "on" + type;
            event = event[jQuery.expando] ? event : new jQuery.Event(type, typeof event === "object" && event);
            event.isTrigger = onlyHandlers ? 2 : 3;
            event.namespace = namespaces.join(".");
            event.rnamespace = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
            event.result = void 0;
            if (!event.target) {
              event.target = elem;
            }
            data = data == null ? [event] : jQuery.makeArray(data, [event]);
            special = jQuery.event.special[type] || {};
            if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
              return;
            }
            if (!onlyHandlers && !special.noBubble && !isWindow(elem)) {
              bubbleType = special.delegateType || type;
              if (!rfocusMorph.test(bubbleType + type)) {
                cur = cur.parentNode;
              }
              for (; cur; cur = cur.parentNode) {
                eventPath.push(cur);
                tmp = cur;
              }
              if (tmp === (elem.ownerDocument || document2)) {
                eventPath.push(tmp.defaultView || tmp.parentWindow || window2);
              }
            }
            i = 0;
            while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
              lastElement = cur;
              event.type = i > 1 ? bubbleType : special.bindType || type;
              handle = (dataPriv.get(cur, "events") || /* @__PURE__ */ Object.create(null))[event.type] && dataPriv.get(cur, "handle");
              if (handle) {
                handle.apply(cur, data);
              }
              handle = ontype && cur[ontype];
              if (handle && handle.apply && acceptData(cur)) {
                event.result = handle.apply(cur, data);
                if (event.result === false) {
                  event.preventDefault();
                }
              }
            }
            event.type = type;
            if (!onlyHandlers && !event.isDefaultPrevented()) {
              if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
                if (ontype && isFunction(elem[type]) && !isWindow(elem)) {
                  tmp = elem[ontype];
                  if (tmp) {
                    elem[ontype] = null;
                  }
                  jQuery.event.triggered = type;
                  if (event.isPropagationStopped()) {
                    lastElement.addEventListener(type, stopPropagationCallback);
                  }
                  elem[type]();
                  if (event.isPropagationStopped()) {
                    lastElement.removeEventListener(type, stopPropagationCallback);
                  }
                  jQuery.event.triggered = void 0;
                  if (tmp) {
                    elem[ontype] = tmp;
                  }
                }
              }
            }
            return event.result;
          },
          // Piggyback on a donor event to simulate a different one
          // Used only for `focus(in | out)` events
          simulate: function(type, elem, event) {
            var e = jQuery.extend(
              new jQuery.Event(),
              event,
              {
                type,
                isSimulated: true
              }
            );
            jQuery.event.trigger(e, null, elem);
          }
        });
        jQuery.fn.extend({
          trigger: function(type, data) {
            return this.each(function() {
              jQuery.event.trigger(type, data, this);
            });
          },
          triggerHandler: function(type, data) {
            var elem = this[0];
            if (elem) {
              return jQuery.event.trigger(type, data, elem, true);
            }
          }
        });
        var rbracket = /\[\]$/, rCRLF = /\r?\n/g, rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rsubmittable = /^(?:input|select|textarea|keygen)/i;
        function buildParams(prefix, obj, traditional, add) {
          var name;
          if (Array.isArray(obj)) {
            jQuery.each(obj, function(i, v) {
              if (traditional || rbracket.test(prefix)) {
                add(prefix, v);
              } else {
                buildParams(
                  prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]",
                  v,
                  traditional,
                  add
                );
              }
            });
          } else if (!traditional && toType(obj) === "object") {
            for (name in obj) {
              buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
            }
          } else {
            add(prefix, obj);
          }
        }
        jQuery.param = function(a, traditional) {
          var prefix, s = [], add = function(key, valueOrFunction) {
            var value = isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
            s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
          };
          if (a == null) {
            return "";
          }
          if (Array.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) {
            jQuery.each(a, function() {
              add(this.name, this.value);
            });
          } else {
            for (prefix in a) {
              buildParams(prefix, a[prefix], traditional, add);
            }
          }
          return s.join("&");
        };
        jQuery.fn.extend({
          serialize: function() {
            return jQuery.param(this.serializeArray());
          },
          serializeArray: function() {
            return this.map(function() {
              var elements = jQuery.prop(this, "elements");
              return elements ? jQuery.makeArray(elements) : this;
            }).filter(function() {
              var type = this.type;
              return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
            }).map(function(_i, elem) {
              var val = jQuery(this).val();
              if (val == null) {
                return null;
              }
              if (Array.isArray(val)) {
                return jQuery.map(val, function(val2) {
                  return { name: elem.name, value: val2.replace(rCRLF, "\r\n") };
                });
              }
              return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
            }).get();
          }
        });
        var r20 = /%20/g, rhash = /#.*$/, rantiCache = /([?&])_=[^&]*/, rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg, rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, rnoContent = /^(?:GET|HEAD)$/, rprotocol = /^\/\//, prefilters = {}, transports = {}, allTypes = "*/".concat("*"), originAnchor = document2.createElement("a");
        originAnchor.href = location.href;
        function addToPrefiltersOrTransports(structure) {
          return function(dataTypeExpression, func) {
            if (typeof dataTypeExpression !== "string") {
              func = dataTypeExpression;
              dataTypeExpression = "*";
            }
            var dataType, i = 0, dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];
            if (isFunction(func)) {
              while (dataType = dataTypes[i++]) {
                if (dataType[0] === "+") {
                  dataType = dataType.slice(1) || "*";
                  (structure[dataType] = structure[dataType] || []).unshift(func);
                } else {
                  (structure[dataType] = structure[dataType] || []).push(func);
                }
              }
            }
          };
        }
        function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
          var inspected = {}, seekingTransport = structure === transports;
          function inspect(dataType) {
            var selected;
            inspected[dataType] = true;
            jQuery.each(structure[dataType] || [], function(_, prefilterOrFactory) {
              var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
              if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
                options.dataTypes.unshift(dataTypeOrTransport);
                inspect(dataTypeOrTransport);
                return false;
              } else if (seekingTransport) {
                return !(selected = dataTypeOrTransport);
              }
            });
            return selected;
          }
          return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
        }
        function ajaxExtend(target, src) {
          var key, deep, flatOptions = jQuery.ajaxSettings.flatOptions || {};
          for (key in src) {
            if (src[key] !== void 0) {
              (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
            }
          }
          if (deep) {
            jQuery.extend(true, target, deep);
          }
          return target;
        }
        function ajaxHandleResponses(s, jqXHR, responses) {
          var ct, type, finalDataType, firstDataType, contents = s.contents, dataTypes = s.dataTypes;
          while (dataTypes[0] === "*") {
            dataTypes.shift();
            if (ct === void 0) {
              ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
            }
          }
          if (ct) {
            for (type in contents) {
              if (contents[type] && contents[type].test(ct)) {
                dataTypes.unshift(type);
                break;
              }
            }
          }
          if (dataTypes[0] in responses) {
            finalDataType = dataTypes[0];
          } else {
            for (type in responses) {
              if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
                finalDataType = type;
                break;
              }
              if (!firstDataType) {
                firstDataType = type;
              }
            }
            finalDataType = finalDataType || firstDataType;
          }
          if (finalDataType) {
            if (finalDataType !== dataTypes[0]) {
              dataTypes.unshift(finalDataType);
            }
            return responses[finalDataType];
          }
        }
        function ajaxConvert(s, response, jqXHR, isSuccess) {
          var conv2, current, conv, tmp, prev, converters = {}, dataTypes = s.dataTypes.slice();
          if (dataTypes[1]) {
            for (conv in s.converters) {
              converters[conv.toLowerCase()] = s.converters[conv];
            }
          }
          current = dataTypes.shift();
          while (current) {
            if (s.responseFields[current]) {
              jqXHR[s.responseFields[current]] = response;
            }
            if (!prev && isSuccess && s.dataFilter) {
              response = s.dataFilter(response, s.dataType);
            }
            prev = current;
            current = dataTypes.shift();
            if (current) {
              if (current === "*") {
                current = prev;
              } else if (prev !== "*" && prev !== current) {
                conv = converters[prev + " " + current] || converters["* " + current];
                if (!conv) {
                  for (conv2 in converters) {
                    tmp = conv2.split(" ");
                    if (tmp[1] === current) {
                      conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
                      if (conv) {
                        if (conv === true) {
                          conv = converters[conv2];
                        } else if (converters[conv2] !== true) {
                          current = tmp[0];
                          dataTypes.unshift(tmp[1]);
                        }
                        break;
                      }
                    }
                  }
                }
                if (conv !== true) {
                  if (conv && s.throws) {
                    response = conv(response);
                  } else {
                    try {
                      response = conv(response);
                    } catch (e) {
                      return {
                        state: "parsererror",
                        error: conv ? e : "No conversion from " + prev + " to " + current
                      };
                    }
                  }
                }
              }
            }
          }
          return { state: "success", data: response };
        }
        jQuery.extend({
          // Counter for holding the number of active queries
          active: 0,
          // Last-Modified header cache for next request
          lastModified: {},
          etag: {},
          ajaxSettings: {
            url: location.href,
            type: "GET",
            isLocal: rlocalProtocol.test(location.protocol),
            global: true,
            processData: true,
            async: true,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            /*
            timeout: 0,
            data: null,
            dataType: null,
            username: null,
            password: null,
            cache: null,
            throws: false,
            traditional: false,
            headers: {},
            */
            accepts: {
              "*": allTypes,
              text: "text/plain",
              html: "text/html",
              xml: "application/xml, text/xml",
              json: "application/json, text/javascript"
            },
            contents: {
              xml: /\bxml\b/,
              html: /\bhtml/,
              json: /\bjson\b/
            },
            responseFields: {
              xml: "responseXML",
              text: "responseText",
              json: "responseJSON"
            },
            // Data converters
            // Keys separate source (or catchall "*") and destination types with a single space
            converters: {
              // Convert anything to text
              "* text": String,
              // Text to html (true = no transformation)
              "text html": true,
              // Evaluate text as a json expression
              "text json": JSON.parse,
              // Parse text as xml
              "text xml": jQuery.parseXML
            },
            // For options that shouldn't be deep extended:
            // you can add your own custom options here if
            // and when you create one that shouldn't be
            // deep extended (see ajaxExtend)
            flatOptions: {
              url: true,
              context: true
            }
          },
          // Creates a full fledged settings object into target
          // with both ajaxSettings and settings fields.
          // If target is omitted, writes into ajaxSettings.
          ajaxSetup: function(target, settings) {
            return settings ? (
              // Building a settings object
              ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings)
            ) : (
              // Extending ajaxSettings
              ajaxExtend(jQuery.ajaxSettings, target)
            );
          },
          ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
          ajaxTransport: addToPrefiltersOrTransports(transports),
          // Main method
          ajax: function(url, options) {
            if (typeof url === "object") {
              options = url;
              url = void 0;
            }
            options = options || {};
            var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, urlAnchor, completed2, fireGlobals, i, uncached, s = jQuery.ajaxSetup({}, options), callbackContext = s.context || s, globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event, deferred = jQuery.Deferred(), completeDeferred = jQuery.Callbacks("once memory"), statusCode = s.statusCode || {}, requestHeaders = {}, requestHeadersNames = {}, strAbort = "canceled", jqXHR = {
              readyState: 0,
              // Builds headers hashtable if needed
              getResponseHeader: function(key) {
                var match;
                if (completed2) {
                  if (!responseHeaders) {
                    responseHeaders = {};
                    while (match = rheaders.exec(responseHeadersString)) {
                      responseHeaders[match[1].toLowerCase() + " "] = (responseHeaders[match[1].toLowerCase() + " "] || []).concat(match[2]);
                    }
                  }
                  match = responseHeaders[key.toLowerCase() + " "];
                }
                return match == null ? null : match.join(", ");
              },
              // Raw string
              getAllResponseHeaders: function() {
                return completed2 ? responseHeadersString : null;
              },
              // Caches the header
              setRequestHeader: function(name, value) {
                if (completed2 == null) {
                  name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name;
                  requestHeaders[name] = value;
                }
                return this;
              },
              // Overrides response content-type header
              overrideMimeType: function(type) {
                if (completed2 == null) {
                  s.mimeType = type;
                }
                return this;
              },
              // Status-dependent callbacks
              statusCode: function(map) {
                var code;
                if (map) {
                  if (completed2) {
                    jqXHR.always(map[jqXHR.status]);
                  } else {
                    for (code in map) {
                      statusCode[code] = [statusCode[code], map[code]];
                    }
                  }
                }
                return this;
              },
              // Cancel the request
              abort: function(statusText) {
                var finalText = statusText || strAbort;
                if (transport) {
                  transport.abort(finalText);
                }
                done(0, finalText);
                return this;
              }
            };
            deferred.promise(jqXHR);
            s.url = ((url || s.url || location.href) + "").replace(rprotocol, location.protocol + "//");
            s.type = options.method || options.type || s.method || s.type;
            s.dataTypes = (s.dataType || "*").toLowerCase().match(rnothtmlwhite) || [""];
            if (s.crossDomain == null) {
              urlAnchor = document2.createElement("a");
              try {
                urlAnchor.href = s.url;
                urlAnchor.href = urlAnchor.href;
                s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
              } catch (_) {
                s.crossDomain = true;
              }
            }
            if (s.data && s.processData && typeof s.data !== "string") {
              s.data = jQuery.param(s.data, s.traditional);
            }
            inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);
            if (completed2) {
              return jqXHR;
            }
            fireGlobals = jQuery.event && s.global;
            if (fireGlobals && jQuery.active++ === 0) {
              jQuery.event.trigger("ajaxStart");
            }
            s.type = s.type.toUpperCase();
            s.hasContent = !rnoContent.test(s.type);
            cacheURL = s.url.replace(rhash, "");
            if (!s.hasContent) {
              uncached = s.url.slice(cacheURL.length);
              if (s.data && (s.processData || typeof s.data === "string")) {
                cacheURL += (rquery.test(cacheURL) ? "&" : "?") + s.data;
                delete s.data;
              }
              if (s.cache === false) {
                cacheURL = cacheURL.replace(rantiCache, "$1");
                uncached = (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce.guid++ + uncached;
              }
              s.url = cacheURL + uncached;
            } else if (s.data && s.processData && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0) {
              s.data = s.data.replace(r20, "+");
            }
            if (s.ifModified) {
              if (jQuery.lastModified[cacheURL]) {
                jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);
              }
              if (jQuery.etag[cacheURL]) {
                jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);
              }
            }
            if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
              jqXHR.setRequestHeader("Content-Type", s.contentType);
            }
            jqXHR.setRequestHeader(
              "Accept",
              s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]
            );
            for (i in s.headers) {
              jqXHR.setRequestHeader(i, s.headers[i]);
            }
            if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed2)) {
              return jqXHR.abort();
            }
            strAbort = "abort";
            completeDeferred.add(s.complete);
            jqXHR.done(s.success);
            jqXHR.fail(s.error);
            transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
            if (!transport) {
              done(-1, "No Transport");
            } else {
              jqXHR.readyState = 1;
              if (fireGlobals) {
                globalEventContext.trigger("ajaxSend", [jqXHR, s]);
              }
              if (completed2) {
                return jqXHR;
              }
              if (s.async && s.timeout > 0) {
                timeoutTimer = window2.setTimeout(function() {
                  jqXHR.abort("timeout");
                }, s.timeout);
              }
              try {
                completed2 = false;
                transport.send(requestHeaders, done);
              } catch (e) {
                if (completed2) {
                  throw e;
                }
                done(-1, e);
              }
            }
            function done(status, nativeStatusText, responses, headers) {
              var isSuccess, success, error, response, modified, statusText;
              if (typeof status === "object") {
                nativeStatusText = status.statusText;
                responses = status.responses;
                headers = status.headers;
                status = status.status;
              }
              statusText = nativeStatusText;
              if (completed2) {
                return;
              }
              completed2 = true;
              if (timeoutTimer) {
                window2.clearTimeout(timeoutTimer);
              }
              transport = void 0;
              responseHeadersString = headers || "";
              jqXHR.readyState = status > 0 ? 4 : 0;
              isSuccess = status >= 200 && status < 300 || status === 304;
              if (responses) {
                response = ajaxHandleResponses(s, jqXHR, responses);
              }
              if (!isSuccess && jQuery.inArray("script", s.dataTypes) > -1 && jQuery.inArray("json", s.dataTypes) < 0) {
                s.converters["text script"] = function() {
                };
              }
              response = ajaxConvert(s, response, jqXHR, isSuccess);
              if (isSuccess) {
                if (s.ifModified) {
                  modified = jqXHR.getResponseHeader("Last-Modified");
                  if (modified) {
                    jQuery.lastModified[cacheURL] = modified;
                  }
                  modified = jqXHR.getResponseHeader("etag");
                  if (modified) {
                    jQuery.etag[cacheURL] = modified;
                  }
                }
                if (status === 204 || s.type === "HEAD") {
                  statusText = "nocontent";
                } else if (status === 304) {
                  statusText = "notmodified";
                } else {
                  statusText = response.state;
                  success = response.data;
                  error = response.error;
                  isSuccess = !error;
                }
              } else {
                error = statusText;
                if (status || !statusText) {
                  statusText = "error";
                  if (status < 0) {
                    status = 0;
                  }
                }
              }
              jqXHR.status = status;
              jqXHR.statusText = (nativeStatusText || statusText) + "";
              if (isSuccess) {
                deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
              } else {
                deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
              }
              jqXHR.statusCode(statusCode);
              statusCode = void 0;
              if (fireGlobals) {
                globalEventContext.trigger(
                  isSuccess ? "ajaxSuccess" : "ajaxError",
                  [jqXHR, s, isSuccess ? success : error]
                );
              }
              completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
              if (fireGlobals) {
                globalEventContext.trigger("ajaxComplete", [jqXHR, s]);
                if (!--jQuery.active) {
                  jQuery.event.trigger("ajaxStop");
                }
              }
            }
            return jqXHR;
          },
          getJSON: function(url, data, callback) {
            return jQuery.get(url, data, callback, "json");
          },
          getScript: function(url, callback) {
            return jQuery.get(url, void 0, callback, "script");
          }
        });
        jQuery.each(["get", "post"], function(_i, method) {
          jQuery[method] = function(url, data, callback, type) {
            if (isFunction(data)) {
              type = type || callback;
              callback = data;
              data = void 0;
            }
            return jQuery.ajax(jQuery.extend({
              url,
              type: method,
              dataType: type,
              data,
              success: callback
            }, jQuery.isPlainObject(url) && url));
          };
        });
        jQuery.ajaxPrefilter(function(s) {
          var i;
          for (i in s.headers) {
            if (i.toLowerCase() === "content-type") {
              s.contentType = s.headers[i] || "";
            }
          }
        });
        jQuery._evalUrl = function(url, options, doc) {
          return jQuery.ajax({
            url,
            // Make this explicit, since user can override this through ajaxSetup (trac-11264)
            type: "GET",
            dataType: "script",
            cache: true,
            async: false,
            global: false,
            // Only evaluate the response if it is successful (gh-4126)
            // dataFilter is not invoked for failure responses, so using it instead
            // of the default converter is kludgy but it works.
            converters: {
              "text script": function() {
              }
            },
            dataFilter: function(response) {
              jQuery.globalEval(response, options, doc);
            }
          });
        };
        jQuery.fn.extend({
          wrapAll: function(html) {
            var wrap;
            if (this[0]) {
              if (isFunction(html)) {
                html = html.call(this[0]);
              }
              wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);
              if (this[0].parentNode) {
                wrap.insertBefore(this[0]);
              }
              wrap.map(function() {
                var elem = this;
                while (elem.firstElementChild) {
                  elem = elem.firstElementChild;
                }
                return elem;
              }).append(this);
            }
            return this;
          },
          wrapInner: function(html) {
            if (isFunction(html)) {
              return this.each(function(i) {
                jQuery(this).wrapInner(html.call(this, i));
              });
            }
            return this.each(function() {
              var self = jQuery(this), contents = self.contents();
              if (contents.length) {
                contents.wrapAll(html);
              } else {
                self.append(html);
              }
            });
          },
          wrap: function(html) {
            var htmlIsFunction = isFunction(html);
            return this.each(function(i) {
              jQuery(this).wrapAll(htmlIsFunction ? html.call(this, i) : html);
            });
          },
          unwrap: function(selector) {
            this.parent(selector).not("body").each(function() {
              jQuery(this).replaceWith(this.childNodes);
            });
            return this;
          }
        });
        jQuery.expr.pseudos.hidden = function(elem) {
          return !jQuery.expr.pseudos.visible(elem);
        };
        jQuery.expr.pseudos.visible = function(elem) {
          return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
        };
        jQuery.ajaxSettings.xhr = function() {
          try {
            return new window2.XMLHttpRequest();
          } catch (_) {
          }
        };
        var xhrSuccessStatus = {
          // File protocol always yields status code 0, assume 200
          0: 200,
          // Support: IE <=9 only
          // trac-1450: sometimes IE returns 1223 when it should be 204
          1223: 204
        }, xhrSupported = jQuery.ajaxSettings.xhr();
        support.cors = !!xhrSupported && "withCredentials" in xhrSupported;
        support.ajax = xhrSupported = !!xhrSupported;
        jQuery.ajaxTransport(function(options) {
          var callback, errorCallback;
          if (support.cors || xhrSupported && !options.crossDomain) {
            return {
              send: function(headers, complete) {
                var i, xhr = options.xhr();
                xhr.open(
                  options.type,
                  options.url,
                  options.async,
                  options.username,
                  options.password
                );
                if (options.xhrFields) {
                  for (i in options.xhrFields) {
                    xhr[i] = options.xhrFields[i];
                  }
                }
                if (options.mimeType && xhr.overrideMimeType) {
                  xhr.overrideMimeType(options.mimeType);
                }
                if (!options.crossDomain && !headers["X-Requested-With"]) {
                  headers["X-Requested-With"] = "XMLHttpRequest";
                }
                for (i in headers) {
                  xhr.setRequestHeader(i, headers[i]);
                }
                callback = function(type) {
                  return function() {
                    if (callback) {
                      callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = xhr.onreadystatechange = null;
                      if (type === "abort") {
                        xhr.abort();
                      } else if (type === "error") {
                        if (typeof xhr.status !== "number") {
                          complete(0, "error");
                        } else {
                          complete({
                            // File: protocol always yields status 0; see trac-8605, trac-14207
                            status: xhr.status,
                            statusText: xhr.statusText
                          });
                        }
                      } else {
                        complete({
                          status: xhrSuccessStatus[xhr.status] || xhr.status,
                          statusText: xhr.statusText,
                          // Support: IE <=9 only
                          // IE9 has no XHR2 but throws on binary (trac-11426)
                          // For XHR2 non-text, let the caller handle it (gh-2498)
                          responses: (xhr.responseType || "text") !== "text" || typeof xhr.responseText !== "string" ? { binary: xhr.response } : { text: xhr.responseText },
                          headers: xhr.getAllResponseHeaders()
                        });
                      }
                    }
                  };
                };
                xhr.onload = callback();
                errorCallback = xhr.onerror = xhr.ontimeout = callback("error");
                if (xhr.onabort !== void 0) {
                  xhr.onabort = errorCallback;
                } else {
                  xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                      window2.setTimeout(function() {
                        if (callback) {
                          errorCallback();
                        }
                      });
                    }
                  };
                }
                callback = callback("abort");
                try {
                  xhr.send(options.hasContent && options.data || null);
                } catch (e) {
                  if (callback) {
                    throw e;
                  }
                }
              },
              abort: function() {
                if (callback) {
                  callback();
                }
              }
            };
          }
        });
        jQuery.ajaxPrefilter(function(s) {
          if (s.crossDomain) {
            s.contents.script = false;
          }
        });
        jQuery.ajaxSetup({
          accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
          },
          contents: {
            script: /\b(?:java|ecma)script\b/
          },
          converters: {
            "text script": function(text) {
              jQuery.globalEval(text);
              return text;
            }
          }
        });
        jQuery.ajaxPrefilter("script", function(s) {
          if (s.cache === void 0) {
            s.cache = false;
          }
          if (s.crossDomain) {
            s.type = "GET";
          }
        });
        jQuery.ajaxTransport("script", function(s) {
          if (s.crossDomain || s.scriptAttrs) {
            var script, callback;
            return {
              send: function(_, complete) {
                script = jQuery("<script>").attr(s.scriptAttrs || {}).prop({ charset: s.scriptCharset, src: s.url }).on("load error", callback = function(evt) {
                  script.remove();
                  callback = null;
                  if (evt) {
                    complete(evt.type === "error" ? 404 : 200, evt.type);
                  }
                });
                document2.head.appendChild(script[0]);
              },
              abort: function() {
                if (callback) {
                  callback();
                }
              }
            };
          }
        });
        var oldCallbacks = [], rjsonp = /(=)\?(?=&|$)|\?\?/;
        jQuery.ajaxSetup({
          jsonp: "callback",
          jsonpCallback: function() {
            var callback = oldCallbacks.pop() || jQuery.expando + "_" + nonce.guid++;
            this[callback] = true;
            return callback;
          }
        });
        jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
          var callbackName, overwritten, responseContainer, jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ? "url" : typeof s.data === "string" && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && rjsonp.test(s.data) && "data");
          if (jsonProp || s.dataTypes[0] === "jsonp") {
            callbackName = s.jsonpCallback = isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
            if (jsonProp) {
              s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
            } else if (s.jsonp !== false) {
              s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
            }
            s.converters["script json"] = function() {
              if (!responseContainer) {
                jQuery.error(callbackName + " was not called");
              }
              return responseContainer[0];
            };
            s.dataTypes[0] = "json";
            overwritten = window2[callbackName];
            window2[callbackName] = function() {
              responseContainer = arguments;
            };
            jqXHR.always(function() {
              if (overwritten === void 0) {
                jQuery(window2).removeProp(callbackName);
              } else {
                window2[callbackName] = overwritten;
              }
              if (s[callbackName]) {
                s.jsonpCallback = originalSettings.jsonpCallback;
                oldCallbacks.push(callbackName);
              }
              if (responseContainer && isFunction(overwritten)) {
                overwritten(responseContainer[0]);
              }
              responseContainer = overwritten = void 0;
            });
            return "script";
          }
        });
        support.createHTMLDocument = (function() {
          var body = document2.implementation.createHTMLDocument("").body;
          body.innerHTML = "<form></form><form></form>";
          return body.childNodes.length === 2;
        })();
        jQuery.parseHTML = function(data, context, keepScripts) {
          if (typeof data !== "string") {
            return [];
          }
          if (typeof context === "boolean") {
            keepScripts = context;
            context = false;
          }
          var base, parsed, scripts;
          if (!context) {
            if (support.createHTMLDocument) {
              context = document2.implementation.createHTMLDocument("");
              base = context.createElement("base");
              base.href = document2.location.href;
              context.head.appendChild(base);
            } else {
              context = document2;
            }
          }
          parsed = rsingleTag.exec(data);
          scripts = !keepScripts && [];
          if (parsed) {
            return [context.createElement(parsed[1])];
          }
          parsed = buildFragment([data], context, scripts);
          if (scripts && scripts.length) {
            jQuery(scripts).remove();
          }
          return jQuery.merge([], parsed.childNodes);
        };
        jQuery.fn.load = function(url, params, callback) {
          var selector, type, response, self = this, off = url.indexOf(" ");
          if (off > -1) {
            selector = stripAndCollapse(url.slice(off));
            url = url.slice(0, off);
          }
          if (isFunction(params)) {
            callback = params;
            params = void 0;
          } else if (params && typeof params === "object") {
            type = "POST";
          }
          if (self.length > 0) {
            jQuery.ajax({
              url,
              // If "type" variable is undefined, then "GET" method will be used.
              // Make value of this field explicit since
              // user can override it through ajaxSetup method
              type: type || "GET",
              dataType: "html",
              data: params
            }).done(function(responseText) {
              response = arguments;
              self.html(selector ? (
                // If a selector was specified, locate the right elements in a dummy div
                // Exclude scripts to avoid IE 'Permission Denied' errors
                jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector)
              ) : (
                // Otherwise use the full result
                responseText
              ));
            }).always(callback && function(jqXHR, status) {
              self.each(function() {
                callback.apply(this, response || [jqXHR.responseText, status, jqXHR]);
              });
            });
          }
          return this;
        };
        jQuery.expr.pseudos.animated = function(elem) {
          return jQuery.grep(jQuery.timers, function(fn) {
            return elem === fn.elem;
          }).length;
        };
        jQuery.offset = {
          setOffset: function(elem, options, i) {
            var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position = jQuery.css(elem, "position"), curElem = jQuery(elem), props = {};
            if (position === "static") {
              elem.style.position = "relative";
            }
            curOffset = curElem.offset();
            curCSSTop = jQuery.css(elem, "top");
            curCSSLeft = jQuery.css(elem, "left");
            calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;
            if (calculatePosition) {
              curPosition = curElem.position();
              curTop = curPosition.top;
              curLeft = curPosition.left;
            } else {
              curTop = parseFloat(curCSSTop) || 0;
              curLeft = parseFloat(curCSSLeft) || 0;
            }
            if (isFunction(options)) {
              options = options.call(elem, i, jQuery.extend({}, curOffset));
            }
            if (options.top != null) {
              props.top = options.top - curOffset.top + curTop;
            }
            if (options.left != null) {
              props.left = options.left - curOffset.left + curLeft;
            }
            if ("using" in options) {
              options.using.call(elem, props);
            } else {
              curElem.css(props);
            }
          }
        };
        jQuery.fn.extend({
          // offset() relates an element's border box to the document origin
          offset: function(options) {
            if (arguments.length) {
              return options === void 0 ? this : this.each(function(i) {
                jQuery.offset.setOffset(this, options, i);
              });
            }
            var rect, win, elem = this[0];
            if (!elem) {
              return;
            }
            if (!elem.getClientRects().length) {
              return { top: 0, left: 0 };
            }
            rect = elem.getBoundingClientRect();
            win = elem.ownerDocument.defaultView;
            return {
              top: rect.top + win.pageYOffset,
              left: rect.left + win.pageXOffset
            };
          },
          // position() relates an element's margin box to its offset parent's padding box
          // This corresponds to the behavior of CSS absolute positioning
          position: function() {
            if (!this[0]) {
              return;
            }
            var offsetParent, offset, doc, elem = this[0], parentOffset = { top: 0, left: 0 };
            if (jQuery.css(elem, "position") === "fixed") {
              offset = elem.getBoundingClientRect();
            } else {
              offset = this.offset();
              doc = elem.ownerDocument;
              offsetParent = elem.offsetParent || doc.documentElement;
              while (offsetParent && (offsetParent === doc.body || offsetParent === doc.documentElement) && jQuery.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.parentNode;
              }
              if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1) {
                parentOffset = jQuery(offsetParent).offset();
                parentOffset.top += jQuery.css(offsetParent, "borderTopWidth", true);
                parentOffset.left += jQuery.css(offsetParent, "borderLeftWidth", true);
              }
            }
            return {
              top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
              left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)
            };
          },
          // This method will return documentElement in the following cases:
          // 1) For the element inside the iframe without offsetParent, this method will return
          //    documentElement of the parent window
          // 2) For the hidden or detached element
          // 3) For body or html element, i.e. in case of the html node - it will return itself
          //
          // but those exceptions were never presented as a real life use-cases
          // and might be considered as more preferable results.
          //
          // This logic, however, is not guaranteed and can change at any point in the future
          offsetParent: function() {
            return this.map(function() {
              var offsetParent = this.offsetParent;
              while (offsetParent && jQuery.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.offsetParent;
              }
              return offsetParent || documentElement;
            });
          }
        });
        jQuery.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function(method, prop) {
          var top = "pageYOffset" === prop;
          jQuery.fn[method] = function(val) {
            return access(this, function(elem, method2, val2) {
              var win;
              if (isWindow(elem)) {
                win = elem;
              } else if (elem.nodeType === 9) {
                win = elem.defaultView;
              }
              if (val2 === void 0) {
                return win ? win[prop] : elem[method2];
              }
              if (win) {
                win.scrollTo(
                  !top ? val2 : win.pageXOffset,
                  top ? val2 : win.pageYOffset
                );
              } else {
                elem[method2] = val2;
              }
            }, method, val, arguments.length);
          };
        });
        jQuery.each(["top", "left"], function(_i, prop) {
          jQuery.cssHooks[prop] = addGetHookIf(
            support.pixelPosition,
            function(elem, computed) {
              if (computed) {
                computed = curCSS(elem, prop);
                return rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + "px" : computed;
              }
            }
          );
        });
        jQuery.each({ Height: "height", Width: "width" }, function(name, type) {
          jQuery.each({
            padding: "inner" + name,
            content: type,
            "": "outer" + name
          }, function(defaultExtra, funcName) {
            jQuery.fn[funcName] = function(margin, value) {
              var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"), extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
              return access(this, function(elem, type2, value2) {
                var doc;
                if (isWindow(elem)) {
                  return funcName.indexOf("outer") === 0 ? elem["inner" + name] : elem.document.documentElement["client" + name];
                }
                if (elem.nodeType === 9) {
                  doc = elem.documentElement;
                  return Math.max(
                    elem.body["scroll" + name],
                    doc["scroll" + name],
                    elem.body["offset" + name],
                    doc["offset" + name],
                    doc["client" + name]
                  );
                }
                return value2 === void 0 ? (
                  // Get width or height on the element, requesting but not forcing parseFloat
                  jQuery.css(elem, type2, extra)
                ) : (
                  // Set width or height on the element
                  jQuery.style(elem, type2, value2, extra)
                );
              }, type, chainable ? margin : void 0, chainable);
            };
          });
        });
        jQuery.each([
          "ajaxStart",
          "ajaxStop",
          "ajaxComplete",
          "ajaxError",
          "ajaxSuccess",
          "ajaxSend"
        ], function(_i, type) {
          jQuery.fn[type] = function(fn) {
            return this.on(type, fn);
          };
        });
        jQuery.fn.extend({
          bind: function(types, data, fn) {
            return this.on(types, null, data, fn);
          },
          unbind: function(types, fn) {
            return this.off(types, null, fn);
          },
          delegate: function(selector, types, data, fn) {
            return this.on(types, selector, data, fn);
          },
          undelegate: function(selector, types, fn) {
            return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
          },
          hover: function(fnOver, fnOut) {
            return this.on("mouseenter", fnOver).on("mouseleave", fnOut || fnOver);
          }
        });
        jQuery.each(
          "blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),
          function(_i, name) {
            jQuery.fn[name] = function(data, fn) {
              return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
            };
          }
        );
        var rtrim = /^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;
        jQuery.proxy = function(fn, context) {
          var tmp, args, proxy;
          if (typeof context === "string") {
            tmp = fn[context];
            context = fn;
            fn = tmp;
          }
          if (!isFunction(fn)) {
            return void 0;
          }
          args = slice.call(arguments, 2);
          proxy = function() {
            return fn.apply(context || this, args.concat(slice.call(arguments)));
          };
          proxy.guid = fn.guid = fn.guid || jQuery.guid++;
          return proxy;
        };
        jQuery.holdReady = function(hold) {
          if (hold) {
            jQuery.readyWait++;
          } else {
            jQuery.ready(true);
          }
        };
        jQuery.isArray = Array.isArray;
        jQuery.parseJSON = JSON.parse;
        jQuery.nodeName = nodeName;
        jQuery.isFunction = isFunction;
        jQuery.isWindow = isWindow;
        jQuery.camelCase = camelCase;
        jQuery.type = toType;
        jQuery.now = Date.now;
        jQuery.isNumeric = function(obj) {
          var type = jQuery.type(obj);
          return (type === "number" || type === "string") && // parseFloat NaNs numeric-cast false positives ("")
          // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
          // subtraction forces infinities to NaN
          !isNaN(obj - parseFloat(obj));
        };
        jQuery.trim = function(text) {
          return text == null ? "" : (text + "").replace(rtrim, "$1");
        };
        jQuery.expr[":"] = jQuery.expr.filters = jQuery.expr.pseudos;
        jQuery.unique = jQuery.uniqueSort;
        jQuery.fn.extend({
          push,
          sort: arr.sort,
          splice: arr.splice
        });
        if (typeof define === "function" && define.amd) {
          define("jquery", [], function() {
            return jQuery;
          });
        }
        var _jQuery = window2.jQuery, _$ = window2.$;
        jQuery.noConflict = function(deep) {
          if (window2.$ === jQuery) {
            window2.$ = _$;
          }
          if (deep && window2.jQuery === jQuery) {
            window2.jQuery = _jQuery;
          }
          return jQuery;
        };
        if (typeof noGlobal === "undefined") {
          window2.jQuery = window2.$ = jQuery;
        }
        return jQuery;
      });
    }
  });

  // shim/globals.js
  var import_mithril, import_jquery;
  var init_globals = __esm({
    "shim/globals.js"() {
      import_mithril = __toESM(require_mithril(), 1);
      import_jquery = __toESM(require_jquery(), 1);
      import_jquery.default.fn.tooltip = function() {
        return this;
      };
      window.m = import_mithril.default;
      window.$ = window.jQuery = import_jquery.default;
    }
  });

  // node_modules/mithril/stream/stream.js
  var require_stream = __commonJS({
    "node_modules/mithril/stream/stream.js"(exports, module) {
      init_globals();
      (function() {
        "use strict";
        Stream2.SKIP = {};
        Stream2.lift = lift;
        Stream2.scan = scan;
        Stream2.merge = merge;
        Stream2.combine = combine;
        Stream2.scanMerge = scanMerge;
        Stream2["fantasy-land/of"] = Stream2;
        var warnedHalt = false;
        Object.defineProperty(Stream2, "HALT", {
          get: function() {
            warnedHalt || console.log("HALT is deprecated and has been renamed to SKIP");
            warnedHalt = true;
            return Stream2.SKIP;
          }
        });
        function Stream2(value) {
          var dependentStreams = [];
          var dependentFns = [];
          function stream(v) {
            if (arguments.length && v !== Stream2.SKIP) {
              value = v;
              if (open(stream)) {
                stream._changing();
                stream._state = "active";
                dependentStreams.slice().forEach(function(s, i) {
                  if (open(s)) s(this[i](value));
                }, dependentFns.slice());
              }
            }
            return value;
          }
          stream.constructor = Stream2;
          stream._state = arguments.length && value !== Stream2.SKIP ? "active" : "pending";
          stream._parents = [];
          stream._changing = function() {
            if (open(stream)) stream._state = "changing";
            dependentStreams.forEach(function(s) {
              s._changing();
            });
          };
          stream._map = function(fn, ignoreInitial) {
            var target = ignoreInitial ? Stream2() : Stream2(fn(value));
            target._parents.push(stream);
            dependentStreams.push(target);
            dependentFns.push(fn);
            return target;
          };
          stream.map = function(fn) {
            return stream._map(fn, stream._state !== "active");
          };
          var end;
          function createEnd() {
            end = Stream2();
            end.map(function(value2) {
              if (value2 === true) {
                stream._parents.forEach(function(p) {
                  p._unregisterChild(stream);
                });
                stream._state = "ended";
                stream._parents.length = dependentStreams.length = dependentFns.length = 0;
              }
              return value2;
            });
            return end;
          }
          stream.toJSON = function() {
            return value != null && typeof value.toJSON === "function" ? value.toJSON() : value;
          };
          stream["fantasy-land/map"] = stream.map;
          stream["fantasy-land/ap"] = function(x) {
            return combine(function(s1, s2) {
              return s1()(s2());
            }, [x, stream]);
          };
          stream._unregisterChild = function(child) {
            var childIndex = dependentStreams.indexOf(child);
            if (childIndex !== -1) {
              dependentStreams.splice(childIndex, 1);
              dependentFns.splice(childIndex, 1);
            }
          };
          Object.defineProperty(stream, "end", {
            get: function() {
              return end || createEnd();
            }
          });
          return stream;
        }
        function combine(fn, streams) {
          var ready = streams.every(function(s) {
            if (s.constructor !== Stream2)
              throw new Error("Ensure that each item passed to stream.combine/stream.merge/lift is a stream.");
            return s._state === "active";
          });
          var stream = ready ? Stream2(fn.apply(null, streams.concat([streams]))) : Stream2();
          var changed = [];
          var mappers = streams.map(function(s) {
            return s._map(function(value) {
              changed.push(s);
              if (ready || streams.every(function(s2) {
                return s2._state !== "pending";
              })) {
                ready = true;
                stream(fn.apply(null, streams.concat([changed])));
                changed = [];
              }
              return value;
            }, true);
          });
          var endStream = stream.end.map(function(value) {
            if (value === true) {
              mappers.forEach(function(mapper) {
                mapper.end(true);
              });
              endStream.end(true);
            }
            return void 0;
          });
          return stream;
        }
        function merge(streams) {
          return combine(function() {
            return streams.map(function(s) {
              return s();
            });
          }, streams);
        }
        function scan(fn, acc, origin) {
          var stream = origin.map(function(v) {
            var next = fn(acc, v);
            if (next !== Stream2.SKIP) acc = next;
            return next;
          });
          stream(acc);
          return stream;
        }
        function scanMerge(tuples, seed) {
          var streams = tuples.map(function(tuple) {
            return tuple[0];
          });
          var stream = combine(function() {
            var changed = arguments[arguments.length - 1];
            streams.forEach(function(stream2, i) {
              if (changed.indexOf(stream2) > -1)
                seed = tuples[i][1](seed, stream2());
            });
            return seed;
          }, streams);
          stream(seed);
          return stream;
        }
        function lift() {
          var fn = arguments[0];
          var streams = Array.prototype.slice.call(arguments, 1);
          return merge(streams).map(function(streams2) {
            return fn.apply(void 0, streams2);
          });
        }
        function open(s) {
          return s._state === "pending" || s._state === "active" || s._state === "changing";
        }
        if (typeof module !== "undefined") module["exports"] = Stream2;
        else if (typeof window.m === "function" && !("stream" in window.m)) window.m.stream = Stream2;
        else window.m = { stream: Stream2 };
      })();
    }
  });

  // node_modules/mithril/stream.js
  var require_stream2 = __commonJS({
    "node_modules/mithril/stream.js"(exports, module) {
      "use strict";
      init_globals();
      module.exports = require_stream();
    }
  });

  // shim/entry.js
  var entry_exports = {};
  __export(entry_exports, {
    FDiscussion: () => FDiscussion,
    addFiles: () => addFiles,
    apiUrl: () => apiUrl,
    applyCrosspost: () => applyCrosspost,
    clearPostAs: () => clearPostAs,
    configure: () => configure,
    getCrosspostIntent: () => getCrosspostIntent,
    getPostAs: () => getPostAs,
    mountUpload: () => mountUpload,
    openTopic: () => openTopic,
    request: () => request,
    resolveAi: () => resolveAi,
    setHooks: () => setHooks
  });
  init_globals();

  // shim/app.js
  init_globals();

  // vendor/flarum-core/js/src/common/states/ModalManagerState.ts
  init_globals();

  // vendor/flarum-core/js/src/common/components/Modal.tsx
  init_globals();

  // vendor/flarum-core/js/src/common/Component.ts
  init_globals();
  var Component = class {
    /**
     * The root DOM element for the component.
     */
    element;
    /**
     * The attributes passed into the component.
     *
     * @see https://mithril.js.org/components.html#passing-data-to-components
     */
    attrs;
    /**
     * Class component state that is persisted between redraws.
     *
     * Updating this will **not** automatically trigger a redraw, unlike
     * other frameworks.
     *
     * This is different to Vnode state, which is always an instance of your
     * class component.
     *
     * This is `undefined` by default.
     */
    state;
    /**
     * @inheritdoc
     */
    oninit(vnode) {
      this.setAttrs(vnode.attrs);
    }
    /**
     * @inheritdoc
     */
    oncreate(vnode) {
      this.element = vnode.dom;
    }
    /**
     * @inheritdoc
     */
    onbeforeupdate(vnode) {
      this.setAttrs(vnode.attrs);
    }
    /**
     * @inheritdoc
     */
    onupdate(vnode) {
    }
    /**
     * @inheritdoc
     */
    onbeforeremove(vnode) {
    }
    /**
     * @inheritdoc
     */
    onremove(vnode) {
    }
    /**
     * Returns a jQuery object for this component's element. If you pass in a
     * selector string, this method will return a jQuery object, using the current
     * element as its buffer.
     *
     * For example, calling `component.$('li')` will return a jQuery object
     * containing all of the `li` elements inside the DOM element of this
     * component.
     *
     * @param [selector] a jQuery-compatible selector string
     * @returns the jQuery object for the DOM node
     * @final
     */
    $(selector) {
      const $element = (0, import_jquery.default)(this.element);
      return selector ? $element.find(selector) : $element;
    }
    /**
     * Convenience method to attach a component without JSX.
     * Has the same effect as calling `m(THIS_CLASS, attrs, children)`.
     *
     * @see https://mithril.js.org/hyperscript.html#mselector,-attributes,-children
     */
    static component(attrs = {}, children = null) {
      const componentAttrs = { ...attrs };
      return (0, import_mithril.default)(this, componentAttrs, children);
    }
    /**
     * Saves a reference to the vnode attrs after running them through initAttrs,
     * and checking for common issues.
     */
    setAttrs(attrs = {}) {
      this.constructor.initAttrs(attrs);
      if (attrs) {
        if ("children" in attrs) {
          throw new Error(
            `[${this.constructor.name}] The "children" attribute of attrs should never be used. Either pass children in as the vnode children or rename the attribute`
          );
        }
        if ("tag" in attrs) {
          throw new Error(`[${this.constructor.name}] You cannot use the "tag" attribute name with Mithril 2.`);
        }
      }
      this.attrs = attrs;
    }
    /**
     * Initialize the component's attrs.
     *
     * This can be used to assign default values for missing, optional attrs.
     */
    static initAttrs(attrs) {
    }
  };

  // vendor/flarum-core/js/src/common/components/Alert.tsx
  init_globals();

  // vendor/flarum-core/js/src/common/components/Button.tsx
  init_globals();

  // vendor/flarum-core/js/src/common/helpers/fireDebugWarning.ts
  init_globals();
  function fireDebugWarning(...args) {
    if (!app_default.data.resources.find((r2) => r2.type === "forums")?.attributes?.debug) return;
    console.warn(...args);
  }

  // vendor/flarum-core/js/src/common/utils/classList.ts
  init_globals();

  // node_modules/clsx/dist/clsx.m.js
  init_globals();
  function r(e) {
    var t, f, n = "";
    if ("string" == typeof e || "number" == typeof e) n += e;
    else if ("object" == typeof e) if (Array.isArray(e)) for (t = 0; t < e.length; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
    else for (t in e) e[t] && (n && (n += " "), n += t);
    return n;
  }
  function clsx() {
    for (var e, t, f = 0, n = ""; f < arguments.length; ) (e = arguments[f++]) && (t = r(e)) && (n && (n += " "), n += t);
    return n;
  }
  var clsx_m_default = clsx;

  // vendor/flarum-core/js/src/common/utils/classList.ts
  var classList = clsx_m_default;
  var classList_default = classList;

  // vendor/flarum-core/js/src/common/utils/extractText.ts
  init_globals();
  function extractText(vdom) {
    if (vdom instanceof Array) {
      return vdom.map((element) => extractText(element)).join("");
    } else if (typeof vdom === "object" && vdom !== null) {
      return extractText(vdom.children);
    } else {
      return String(vdom);
    }
  }

  // vendor/flarum-core/js/src/common/components/LoadingIndicator.tsx
  init_globals();
  var LoadingIndicator = class extends Component {
    view() {
      const { display = "block", size = "medium", containerClassName, className, ...attrs } = this.attrs;
      const completeClassName = classList_default("LoadingIndicator", className);
      const completeContainerClassName = classList_default(
        "LoadingIndicator-container",
        display !== "unset" && `LoadingIndicator-container--${display}`,
        size && `LoadingIndicator-container--${size}`,
        containerClassName
      );
      return /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          "aria-label": app_default.translator.trans("core.lib.loading_indicator.accessible_label"),
          role: "status",
          ...attrs.containerAttrs,
          "data-size": size,
          className: completeContainerClassName
        },
        /* @__PURE__ */ (0, import_mithril.default)("div", { "aria-hidden": "true", className: completeClassName, ...attrs })
      );
    }
  };

  // vendor/flarum-core/js/src/common/components/Icon.tsx
  init_globals();

  // vendor/flarum-core/js/src/common/utils/applyIconStyle.ts
  init_globals();
  var STYLE_CLASSES = /* @__PURE__ */ new Set([
    "fa",
    "fas",
    "far",
    "fal",
    "fat",
    "fad",
    "fass",
    "fasr",
    "fasl",
    "fast",
    "fasds",
    "fa-solid",
    "fa-regular",
    "fa-light",
    "fa-thin",
    "fa-duotone",
    "fa-sharp",
    "fa-sharp-duotone"
  ]);
  var BRAND_CLASSES = /* @__PURE__ */ new Set(["fab", "fa-brands"]);
  function applyIconStyle(name, style) {
    if (!style || typeof name !== "string") return name;
    const classes = name.split(/\s+/).filter(Boolean);
    if (classes.some((cls) => BRAND_CLASSES.has(cls))) {
      return name;
    }
    const kept = classes.filter((cls) => !STYLE_CLASSES.has(cls));
    return `${style} ${kept.join(" ")}`.trim();
  }

  // vendor/flarum-core/js/src/common/components/Icon.tsx
  var Icon = class extends Component {
    view(vnode) {
      const { name, noStyleOverride, ...attrs } = vnode.attrs;
      const forcedStyle = noStyleOverride ? null : app_default?.forum?.attribute("fontAwesomeForcedStyle");
      attrs.className = classList_default("icon", forcedStyle ? applyIconStyle(name, forcedStyle) : name, attrs.className);
      return /* @__PURE__ */ (0, import_mithril.default)("i", { "aria-hidden": "true", ...attrs });
    }
  };

  // vendor/flarum-core/js/src/common/components/Button.tsx
  var Button = class _Button extends Component {
    view(vnode) {
      let {
        type,
        "aria-label": ariaLabel,
        icon: iconName,
        noStyleOverride,
        disabled,
        loading,
        className,
        class: _class,
        helperText,
        ...attrs
      } = this.attrs;
      type ||= "button";
      if (typeof ariaLabel === "object") {
        ariaLabel = extractText(ariaLabel);
      }
      if (disabled || loading) {
        delete attrs.onclick;
      }
      className = classList_default(_class, className, {
        hasIcon: iconName,
        disabled: disabled || loading,
        loading,
        hasSubContent: !!this.getButtonSubContent()
      });
      const buttonAttrs = {
        disabled,
        className,
        type,
        "aria-label": ariaLabel,
        ...attrs
      };
      return /* @__PURE__ */ (0, import_mithril.default)("button", { ...buttonAttrs }, this.getButtonContent(vnode.children));
    }
    oncreate(vnode) {
      super.oncreate(vnode);
      const { "aria-label": ariaLabel } = this.attrs;
      if (this.view === _Button.prototype.view && !ariaLabel && !extractText(vnode.children) && !this.element?.getAttribute?.("aria-label")) {
        fireDebugWarning(
          '[Flarum Accessibility Warning] Button has no content and no accessible label. This means that screen-readers will not be able to interpret its meaning and just read "Button". Consider providing accessible text via the `aria-label` attribute. https://web.dev/button-name',
          this.element
        );
      }
    }
    /**
     * Get the template for the button's content.
     */
    getButtonContent(children) {
      const icon = this.attrs.icon;
      return [
        icon && (typeof icon === "string" || icon === true ? /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: icon, noStyleOverride: this.attrs.noStyleOverride, className: "Button-icon" }) : icon),
        children && /* @__PURE__ */ (0, import_mithril.default)("span", { className: "Button-label" }, /* @__PURE__ */ (0, import_mithril.default)("span", { className: "Button-labelText" }, children), this.getButtonSubContent()),
        this.attrs.loading && /* @__PURE__ */ (0, import_mithril.default)(LoadingIndicator, { size: "small", display: "inline" })
      ];
    }
    getButtonSubContent() {
      return this.attrs.helperText ? /* @__PURE__ */ (0, import_mithril.default)("span", { className: "Button-helperText" }, this.attrs.helperText) : null;
    }
  };

  // vendor/flarum-core/js/src/common/helpers/listItems.tsx
  init_globals();

  // vendor/flarum-core/js/src/common/components/Separator.js
  init_globals();
  var Separator = class extends Component {
    view() {
      return /* @__PURE__ */ (0, import_mithril.default)("li", { className: "Dropdown-separator" });
    }
  };
  Separator.isListItem = true;
  var Separator_default = Separator;

  // vendor/flarum-core/js/src/common/helpers/listItems.tsx
  function isVnode(item) {
    return typeof item === "object" && item !== null && "tag" in item;
  }
  function isSeparator(item) {
    return isVnode(item) && item.tag === Separator_default;
  }
  function withoutUnnecessarySeparators(items) {
    const newItems = [];
    let prevItem;
    items.filter(Boolean).forEach((item, i) => {
      if (!isSeparator(item) || prevItem && !isSeparator(prevItem) && i !== items.length - 1) {
        prevItem = item;
        newItems.push(item);
      }
    });
    return newItems;
  }
  function listItems(rawItems, customTag = "li", attributes = {}) {
    const items = rawItems instanceof Array ? rawItems : [rawItems];
    const Tag = customTag;
    return withoutUnnecessarySeparators(items).map((item) => {
      const classes = [item.itemName && `item-${item.itemName}`];
      if (isVnode(item) && item.tag.isListItem) {
        item.attrs = item.attrs || {};
        item.attrs.key = item.attrs.key || item.itemName;
        item.key = item.attrs.key;
        return item;
      }
      if (isVnode(item)) {
        classes.push(item.attrs?.itemClassName || item.itemClassName);
        if (item.tag.isActive?.(item.attrs)) {
          classes.push("active");
        }
      }
      const key = isVnode(item) && item?.attrs?.key || item.itemName;
      return /* @__PURE__ */ (0, import_mithril.default)(Tag, { className: classList_default(classes), key, ...attributes }, item);
    });
  }

  // vendor/flarum-core/js/src/common/utils/extract.ts
  init_globals();
  function extract(object, property) {
    const value = object[property];
    delete object[property];
    return value;
  }

  // vendor/flarum-core/js/src/common/components/Alert.tsx
  var Alert = class extends Component {
    view(vnode) {
      const attrs = Object.assign({}, this.attrs);
      const type = extract(attrs, "type");
      attrs.className = classList_default("Alert", `Alert--${type}`, attrs.className);
      const title = extract(attrs, "title");
      const icon = extract(attrs, "icon");
      const content = extract(attrs, "content") || vnode.children;
      const controls = extract(attrs, "controls") || [];
      const dismissible = extract(attrs, "dismissible");
      const ondismiss = extract(attrs, "ondismiss");
      const dismissControl = [];
      if (dismissible || dismissible === void 0) {
        dismissControl.push(
          /* @__PURE__ */ (0, import_mithril.default)(
            Button,
            {
              "aria-label": app_default.translator.trans("core.lib.alert.dismiss_a11y_label"),
              icon: "fas fa-times",
              className: "Button Button--link Button--icon Alert-dismiss",
              onclick: ondismiss
            }
          )
        );
      }
      return /* @__PURE__ */ (0, import_mithril.default)("div", { ...attrs }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: classList_default("Alert-container", attrs.containerClassName) }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Alert-content" }, !!title && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Alert-title" }, !!icon && /* @__PURE__ */ (0, import_mithril.default)("span", { className: "Alert-title-icon" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: icon })), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "Alert-title-text" }, title)), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "Alert-body" }, content)), /* @__PURE__ */ (0, import_mithril.default)("ul", { className: "Alert-controls" }, listItems(controls.concat(dismissControl)))));
    }
  };

  // vendor/flarum-core/js/src/common/components/Modal.tsx
  var Modal = class extends Component {
    /**
     * Can the model be dismissed with a close button (X)?
     *
     * If `false`, no close button is shown.
     */
    static isDismissibleViaCloseButton = true;
    /**
     * Can the modal be dismissed by pressing the Esc key on a keyboard?
     */
    static isDismissibleViaEscKey = true;
    /**
     * Can the modal be dismissed via a click on the backdrop.
     */
    static isDismissibleViaBackdropClick = true;
    static get dismissibleOptions() {
      return {
        viaCloseButton: this.isDismissibleViaCloseButton,
        viaEscKey: this.isDismissibleViaEscKey,
        viaBackdropClick: this.isDismissibleViaBackdropClick
      };
    }
    loading = false;
    /**
     * Attributes for an alert component to show below the header.
     */
    alertAttrs = null;
    oncreate(vnode) {
      super.oncreate(vnode);
      this.attrs.animateShow(() => this.onready());
    }
    onbeforeremove(vnode) {
      super.onbeforeremove(vnode);
      if (!this.attrs.state.modal) {
        return new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
    view() {
      if (this.alertAttrs) {
        this.alertAttrs.dismissible = false;
      }
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: classList_default("Modal modal-dialog fade", this.className()) }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modal-content" }, this.dismissibleOptions.viaCloseButton && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modal-close App-backControl" }, /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          icon: "fas fa-times",
          onclick: () => this.hide(),
          className: "Button Button--icon Button--link",
          "aria-label": app_default.translator.trans("core.lib.modal.close")
        }
      )), this.wrapper(this.inner())));
    }
    wrapper(children) {
      return /* @__PURE__ */ (0, import_mithril.default)(import_mithril.default.Fragment, null, children);
    }
    inner() {
      return /* @__PURE__ */ (0, import_mithril.default)(import_mithril.default.Fragment, null, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modal-header" }, /* @__PURE__ */ (0, import_mithril.default)("h3", { className: "App-titleControl App-titleControl--text" }, this.title())), !!this.alertAttrs && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modal-alert" }, /* @__PURE__ */ (0, import_mithril.default)(Alert, { ...this.alertAttrs })), this.content());
    }
    /**
     * Callback executed when the modal is shown and ready to be interacted with.
     */
    onready() {
    }
    /**
     * Hides the modal.
     */
    hide() {
      this.attrs.animateHide();
    }
    /**
     * Sets `loading` to false and triggers a redraw.
     */
    loaded() {
      this.loading = false;
      import_mithril.default.redraw();
    }
    get dismissibleOptions() {
      return this.constructor.dismissibleOptions;
    }
  };

  // vendor/flarum-core/js/src/common/states/ModalManagerState.ts
  var ModalManagerState = class {
    /**
     * @internal
     */
    modal = null;
    /**
     * @internal
     */
    modalList = [];
    /**
     * @internal
     */
    backdropShown = false;
    /**
     * @internal
     */
    loadingModal = false;
    /**
     * Used to force re-initialization of modals if a modal
     * is replaced by another of the same type.
     */
    key = 0;
    /**
     * Shows a modal dialog.
     *
     * If `stackModal` is `true`, the modal will be shown on top of the current modal.
     *
     * If a value for `stackModal` is not provided, opening a new modal will close
     * any others currently being shown for backwards compatibility.
     *
     * @example <caption>Show a modal</caption>
     * app.modal.show(MyCoolModal, { attr: 'value' });
     *
     * @example <caption>Show a modal from a lifecycle method (`oncreate`, `view`, etc.)</caption>
     * // This "hack" is needed due to quirks with nested redraws in Mithril.
     * setTimeout(() => app.modal.show(MyCoolModal, { attr: 'value' }), 0);
     *
     * @example <caption>Stacking modals</caption>
     * app.modal.show(MyCoolStackedModal, { attr: 'value' }, true);
     */
    async show(componentClass, attrs = {}, stackModal = false) {
      if (!(componentClass.prototype instanceof Modal) && typeof componentClass !== "function") {
        const invalidModalWarning = "The ModalManager can only show Modals.";
        console.error(invalidModalWarning);
        throw new Error(invalidModalWarning);
      }
      if (!(componentClass.prototype instanceof Modal)) {
        this.loadingModal = true;
        import_mithril.default.redraw.sync();
        componentClass = componentClass;
        componentClass = (await componentClass()).default;
        this.loadingModal = false;
      }
      this.backdropShown = true;
      import_mithril.default.redraw.sync();
      requestAnimationFrame(() => {
        componentClass = componentClass;
        this.modal = { componentClass, attrs, key: this.key++ };
        if (stackModal) {
          this.modalList.push(this.modal);
        } else {
          this.modalList = [this.modal];
        }
        import_mithril.default.redraw();
      });
    }
    /**
     * Closes the topmost currently open dialog, if one is open.
     */
    close() {
      if (!this.modal) return;
      if (this.modalList.length > 1) {
        this.modalList.pop();
        this.modal = this.modalList[this.modalList.length - 1];
      } else {
        this.modal = null;
        this.modalList = [];
      }
      import_mithril.default.redraw();
    }
    /**
     * Checks if a modal is currently open.
     *
     * @return `true` if a modal dialog is currently open, otherwise `false`.
     */
    isModalOpen() {
      return !!this.modal;
    }
  };

  // vendor/flarum-core/js/src/common/states/AlertManagerState.ts
  init_globals();
  var AlertManagerState = class _AlertManagerState {
    activeAlerts = {};
    alertId = 0;
    loadingPool = 0;
    /**
     * How long (ms) a load must run before the loading indicator is shown. Loads
     * that complete faster than this never show an indicator, avoiding a flicker
     * for fast (e.g. cached) chunk loads.
     */
    static LOADING_DELAY = 250;
    /**
     * Pending timer for the delayed display of the loading indicator, or null when
     * no display is pending.
     */
    loadingTimeout = null;
    /**
     * Identifier of the currently-shown loading alert, or null when none is shown.
     */
    loadingAlertId = null;
    getActiveAlerts() {
      return this.activeAlerts;
    }
    show(arg1, arg2, arg3) {
      let componentClass = Alert;
      let attrs = {};
      let children;
      if (arguments.length == 1) {
        children = arg1;
      } else if (arguments.length == 2) {
        attrs = arg1;
        children = arg2;
      } else if (arguments.length == 3) {
        componentClass = arg1;
        attrs = arg2;
        children = arg3;
      }
      this.activeAlerts[++this.alertId] = { children, attrs, componentClass };
      import_mithril.default.redraw();
      return this.alertId;
    }
    /**
     * Dismiss an alert.
     */
    dismiss(key) {
      if (!key || !(key in this.activeAlerts)) return;
      delete this.activeAlerts[key];
      import_mithril.default.redraw();
    }
    /**
     * Clear all alerts.
     */
    clear() {
      this.activeAlerts = {};
      import_mithril.default.redraw();
    }
    /**
     * Register an outstanding load and, if this is the first one, schedule the
     * loading indicator to appear after {@link AlertManagerState.LOADING_DELAY}.
     *
     * Concurrent loads share a single indicator (tracked via `loadingPool`), so the
     * UI never shows more than one "loading" alert regardless of how many chunks or
     * requests are in flight. Loads that finish before the delay never show one.
     */
    showLoading() {
      this.loadingPool++;
      if (this.loadingPool > 1 || this.loadingTimeout !== null || this.loadingAlertId !== null) {
        return;
      }
      this.loadingTimeout = setTimeout(() => {
        this.loadingTimeout = null;
        this.loadingAlertId = this.show(
          {
            type: "warning",
            dismissible: false
          },
          app_default.translator.trans("core.lib.loading_indicator.accessible_label")
        );
      }, _AlertManagerState.LOADING_DELAY);
    }
    /**
     * Mark one outstanding load as finished. When the last one completes, cancel a
     * still-pending indicator (so a fast load never flickers) and dismiss the
     * indicator if it was already shown.
     */
    clearLoading() {
      if (this.loadingPool > 0) {
        this.loadingPool--;
      }
      if (this.loadingPool > 0) return;
      if (this.loadingTimeout !== null) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }
      if (this.loadingAlertId !== null) {
        this.dismiss(this.loadingAlertId);
        this.loadingAlertId = null;
      }
    }
  };

  // shim/net.js
  init_globals();
  var inv = (...a) => window.__TAURI__.core.invoke(...a);
  var ctx = { id: "", base: "" };
  function toPath(url) {
    const u = String(url);
    if (ctx.base && u.startsWith(ctx.base)) return u.slice(ctx.base.length) || "/";
    return u.startsWith("/") ? u : "/" + u;
  }
  async function fwd(method, url, contentType, bytes) {
    const headers = { "x-fid": ctx.id, "x-method": method, "x-path": encodeURIComponent(toPath(url)) };
    if (contentType) headers["x-ct"] = contentType;
    return inv("forum_fwd", bytes || new Uint8Array(0), { headers });
  }
  async function encodeBody(body, headers) {
    if (body == null) return { bytes: null, ct: "" };
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      const req = new Request("http://x.invalid/", { method: "POST", body });
      return { bytes: new Uint8Array(await req.arrayBuffer()), ct: req.headers.get("content-type") || "" };
    }
    if (typeof body === "string") return { bytes: new TextEncoder().encode(body), ct: headers && (headers["Content-Type"] || headers["content-type"]) || "text/plain" };
    return { bytes: new TextEncoder().encode(JSON.stringify(body)), ct: "application/json" };
  }
  var FramioXHR = class {
    constructor() {
      this.upload = {};
      this.readyState = 0;
      this.status = 0;
      this.responseText = "";
      this._h = {};
    }
    open(method, url) {
      this._m = method;
      this._u = url;
      this.readyState = 1;
    }
    setRequestHeader(k, v) {
      this._h[k] = v;
    }
    getResponseHeader() {
      return null;
    }
    abort() {
      this._abort = true;
      if (this.onabort) this.onabort();
      if (this.onloadend) this.onloadend();
    }
    async send(body) {
      try {
        const { bytes, ct } = await encodeBody(body, this._h);
        this._prog(0.15);
        const r2 = await fwd(this._m, this._u, ct, bytes);
        if (this._abort) return;
        this._prog(1);
        this.status = r2.status;
        this.responseText = r2.body;
        this.readyState = 4;
        if (this.onload) this.onload();
      } catch (e) {
        if (this._abort) return;
        if (this.onerror) this.onerror(e);
      } finally {
        if (!this._abort && this.onloadend) this.onloadend();
      }
    }
    _prog(f) {
      if (this.upload.onprogress) this.upload.onprogress({ lengthComputable: true, loaded: Math.round(f * 100), total: 100 });
    }
  };
  window.FramioXHR = FramioXHR;
  function makeRequest(app2) {
    return function request2(opts) {
      let url = opts.url;
      if (opts.params && Object.keys(opts.params).length) url += (url.includes("?") ? "&" : "?") + import_mithril.default.buildQueryString(opts.params);
      return encodeBody(opts.body, opts.headers).then(({ bytes, ct }) => fwd((opts.method || "GET").toUpperCase(), url, ct, bytes)).then((r2) => {
        let data = null;
        try {
          data = r2.body ? JSON.parse(r2.body) : null;
        } catch (e) {
          data = null;
        }
        if (r2.status >= 400) {
          const err = { status: r2.status, response: data, responseText: r2.body, options: opts, alert: null };
          const msg = data && data.errors && data.errors[0] && (data.errors[0].detail || data.errors[0].title) || data && (data.error || data.message) || `\u0130stek ba\u015Far\u0131s\u0131z (HTTP ${r2.status})`;
          if (typeof opts.errorHandler === "function") opts.errorHandler(err);
          else if (!opts.background && r2.status !== 404) app2.alerts.show({ type: "error" }, String(msg));
          throw err;
        }
        return data;
      });
    };
  }

  // shim/app.js
  var FUser = class {
    constructor(d) {
      this.d = d || { id: "", attributes: {} };
    }
    id() {
      return String(this.d.id);
    }
    attribute(k) {
      return (this.d.attributes || {})[k];
    }
    username() {
      return this.attribute("username") || "";
    }
    displayName() {
      return this.attribute("displayName") || this.username();
    }
    avatarUrl() {
      return this.attribute("avatarUrl") || null;
    }
    color() {
      return null;
    }
    isAdmin() {
      return !!this.d.isAdmin;
    }
    preferences() {
      return this.attribute("preferences") || {};
    }
  };
  var FTag = class {
    constructor(s) {
      this.s = s;
    }
    slug() {
      return this.s;
    }
    name() {
      return this.s;
    }
  };
  var FDiscussion = class {
    constructor(d) {
      this.d = d;
    }
    id() {
      return String(this.d.id);
    }
    title() {
      return this.d.title || "";
    }
    tags() {
      return (this.d.tags || []).map((s) => new FTag(s));
    }
    user() {
      return null;
    }
  };
  var app = {
    data: { resources: [] },
    translator: { trans: (k) => k === "core.lib.modal.close" ? "Kapat" : String(k).split(".").pop(), transText: (k) => String(k).split(".").pop() },
    alerts: new AlertManagerState(),
    modal: new ModalManagerState(),
    session: { user: null, csrfToken: "framio" },
    forum: { attribute: (k) => (app._attrs || {})[k] },
    current: { get: (k) => k === "discussion" ? app._discussion : null },
    composer: { body: { attrs: {} }, editor: { insertAtCursor: (t) => app._onInsert && app._onInsert(t) } },
    store: {
      async find(type, params) {
        if (type !== "users") return [];
        const q = params && params.filter && params.filter.q || "";
        const r2 = await app.request({ method: "GET", url: app.forum.attribute("apiUrl") + "/users?filter[q]=" + encodeURIComponent(q) + "&page[limit]=" + (params && params.page && params.page.limit || 6), background: true });
        return (r2 && r2.data || []).map((u) => new FUser({ id: u.id, attributes: u.attributes }));
      }
    },
    screen: () => window.innerWidth >= 1200 ? "desktop-hd" : window.innerWidth >= 992 ? "desktop" : window.innerWidth >= 768 ? "tablet" : "phone"
  };
  app.request = makeRequest(app);
  app.configure = function(f) {
    ctx.id = f.id;
    ctx.base = f.base.replace(/\/$/, "");
    app._attrs = Object.assign({}, f.attrs || {}, { apiUrl: ctx.base + "/api", baseUrl: ctx.base });
    app.session.user = f.user ? new FUser(f.user) : null;
    app._discussion = f.discussion ? new FDiscussion(f.discussion) : null;
    app.composer.body.attrs = {};
    if (app._discussion) app.composer.body.attrs.discussion = app._discussion;
  };
  app.setDiscussion = function(d) {
    app._discussion = d ? new FDiscussion(d) : null;
    if (app._discussion) app.composer.body.attrs.discussion = app._discussion;
    else delete app.composer.body.attrs.discussion;
  };
  var app_default = app;

  // vendor/flarum-core/js/src/common/components/ModalManager.tsx
  init_globals();

  // vendor/flarum-core/js/src/common/utils/focusTrap.ts
  init_globals();

  // node_modules/focus-trap/dist/focus-trap.esm.js
  init_globals();

  // node_modules/tabbable/dist/index.esm.js
  init_globals();
  var candidateSelectors = ["input", "select", "textarea", "a[href]", "button", "[tabindex]:not(slot)", "audio[controls]", "video[controls]", '[contenteditable]:not([contenteditable="false"])', "details>summary:first-of-type", "details"];
  var candidateSelector = /* @__PURE__ */ candidateSelectors.join(",");
  var NoElement = typeof Element === "undefined";
  var matches = NoElement ? function() {
  } : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  var getRootNode = !NoElement && Element.prototype.getRootNode ? function(element) {
    return element.getRootNode();
  } : function(element) {
    return element.ownerDocument;
  };
  var getCandidates = function getCandidates2(el, includeContainer, filter) {
    var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));
    if (includeContainer && matches.call(el, candidateSelector)) {
      candidates.unshift(el);
    }
    candidates = candidates.filter(filter);
    return candidates;
  };
  var getCandidatesIteratively = function getCandidatesIteratively2(elements, includeContainer, options) {
    var candidates = [];
    var elementsToCheck = Array.from(elements);
    while (elementsToCheck.length) {
      var element = elementsToCheck.shift();
      if (element.tagName === "SLOT") {
        var assigned = element.assignedElements();
        var content = assigned.length ? assigned : element.children;
        var nestedCandidates = getCandidatesIteratively2(content, true, options);
        if (options.flatten) {
          candidates.push.apply(candidates, nestedCandidates);
        } else {
          candidates.push({
            scope: element,
            candidates: nestedCandidates
          });
        }
      } else {
        var validCandidate = matches.call(element, candidateSelector);
        if (validCandidate && options.filter(element) && (includeContainer || !elements.includes(element))) {
          candidates.push(element);
        }
        var shadowRoot = element.shadowRoot || // check for an undisclosed shadow
        typeof options.getShadowRoot === "function" && options.getShadowRoot(element);
        var validShadowRoot = !options.shadowRootFilter || options.shadowRootFilter(element);
        if (shadowRoot && validShadowRoot) {
          var _nestedCandidates = getCandidatesIteratively2(shadowRoot === true ? element.children : shadowRoot.children, true, options);
          if (options.flatten) {
            candidates.push.apply(candidates, _nestedCandidates);
          } else {
            candidates.push({
              scope: element,
              candidates: _nestedCandidates
            });
          }
        } else {
          elementsToCheck.unshift.apply(elementsToCheck, element.children);
        }
      }
    }
    return candidates;
  };
  var getTabindex = function getTabindex2(node, isScope) {
    if (node.tabIndex < 0) {
      if ((isScope || /^(AUDIO|VIDEO|DETAILS)$/.test(node.tagName) || node.isContentEditable) && isNaN(parseInt(node.getAttribute("tabindex"), 10))) {
        return 0;
      }
    }
    return node.tabIndex;
  };
  var sortOrderedTabbables = function sortOrderedTabbables2(a, b) {
    return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
  };
  var isInput = function isInput2(node) {
    return node.tagName === "INPUT";
  };
  var isHiddenInput = function isHiddenInput2(node) {
    return isInput(node) && node.type === "hidden";
  };
  var isDetailsWithSummary = function isDetailsWithSummary2(node) {
    var r2 = node.tagName === "DETAILS" && Array.prototype.slice.apply(node.children).some(function(child) {
      return child.tagName === "SUMMARY";
    });
    return r2;
  };
  var getCheckedRadio = function getCheckedRadio2(nodes, form) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].checked && nodes[i].form === form) {
        return nodes[i];
      }
    }
  };
  var isTabbableRadio = function isTabbableRadio2(node) {
    if (!node.name) {
      return true;
    }
    var radioScope = node.form || getRootNode(node);
    var queryRadios = function queryRadios2(name) {
      return radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
    };
    var radioSet;
    if (typeof window !== "undefined" && typeof window.CSS !== "undefined" && typeof window.CSS.escape === "function") {
      radioSet = queryRadios(window.CSS.escape(node.name));
    } else {
      try {
        radioSet = queryRadios(node.name);
      } catch (err) {
        console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s", err.message);
        return false;
      }
    }
    var checked = getCheckedRadio(radioSet, node.form);
    return !checked || checked === node;
  };
  var isRadio = function isRadio2(node) {
    return isInput(node) && node.type === "radio";
  };
  var isNonTabbableRadio = function isNonTabbableRadio2(node) {
    return isRadio(node) && !isTabbableRadio(node);
  };
  var isZeroArea = function isZeroArea2(node) {
    var _node$getBoundingClie = node.getBoundingClientRect(), width = _node$getBoundingClie.width, height = _node$getBoundingClie.height;
    return width === 0 && height === 0;
  };
  var isHidden = function isHidden2(node, _ref) {
    var displayCheck = _ref.displayCheck, getShadowRoot = _ref.getShadowRoot;
    if (getComputedStyle(node).visibility === "hidden") {
      return true;
    }
    var isDirectSummary = matches.call(node, "details>summary:first-of-type");
    var nodeUnderDetails = isDirectSummary ? node.parentElement : node;
    if (matches.call(nodeUnderDetails, "details:not([open]) *")) {
      return true;
    }
    var nodeRootHost = getRootNode(node).host;
    var nodeIsAttached = (nodeRootHost === null || nodeRootHost === void 0 ? void 0 : nodeRootHost.ownerDocument.contains(nodeRootHost)) || node.ownerDocument.contains(node);
    if (!displayCheck || displayCheck === "full") {
      if (typeof getShadowRoot === "function") {
        var originalNode = node;
        while (node) {
          var parentElement = node.parentElement;
          var rootNode = getRootNode(node);
          if (parentElement && !parentElement.shadowRoot && getShadowRoot(parentElement) === true) {
            return isZeroArea(node);
          } else if (node.assignedSlot) {
            node = node.assignedSlot;
          } else if (!parentElement && rootNode !== node.ownerDocument) {
            node = rootNode.host;
          } else {
            node = parentElement;
          }
        }
        node = originalNode;
      }
      if (nodeIsAttached) {
        return !node.getClientRects().length;
      }
    } else if (displayCheck === "non-zero-area") {
      return isZeroArea(node);
    }
    return false;
  };
  var isDisabledFromFieldset = function isDisabledFromFieldset2(node) {
    if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(node.tagName)) {
      var parentNode = node.parentElement;
      while (parentNode) {
        if (parentNode.tagName === "FIELDSET" && parentNode.disabled) {
          for (var i = 0; i < parentNode.children.length; i++) {
            var child = parentNode.children.item(i);
            if (child.tagName === "LEGEND") {
              return matches.call(parentNode, "fieldset[disabled] *") ? true : !child.contains(node);
            }
          }
          return true;
        }
        parentNode = parentNode.parentElement;
      }
    }
    return false;
  };
  var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable2(options, node) {
    if (node.disabled || isHiddenInput(node) || isHidden(node, options) || // For a details element with a summary, the summary element gets the focus
    isDetailsWithSummary(node) || isDisabledFromFieldset(node)) {
      return false;
    }
    return true;
  };
  var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable2(options, node) {
    if (isNonTabbableRadio(node) || getTabindex(node) < 0 || !isNodeMatchingSelectorFocusable(options, node)) {
      return false;
    }
    return true;
  };
  var isValidShadowRootTabbable = function isValidShadowRootTabbable2(shadowHostNode) {
    var tabIndex = parseInt(shadowHostNode.getAttribute("tabindex"), 10);
    if (isNaN(tabIndex) || tabIndex >= 0) {
      return true;
    }
    return false;
  };
  var sortByOrder = function sortByOrder2(candidates) {
    var regularTabbables = [];
    var orderedTabbables = [];
    candidates.forEach(function(item, i) {
      var isScope = !!item.scope;
      var element = isScope ? item.scope : item;
      var candidateTabindex = getTabindex(element, isScope);
      var elements = isScope ? sortByOrder2(item.candidates) : element;
      if (candidateTabindex === 0) {
        isScope ? regularTabbables.push.apply(regularTabbables, elements) : regularTabbables.push(element);
      } else {
        orderedTabbables.push({
          documentOrder: i,
          tabIndex: candidateTabindex,
          item,
          isScope,
          content: elements
        });
      }
    });
    return orderedTabbables.sort(sortOrderedTabbables).reduce(function(acc, sortable) {
      sortable.isScope ? acc.push.apply(acc, sortable.content) : acc.push(sortable.content);
      return acc;
    }, []).concat(regularTabbables);
  };
  var tabbable = function tabbable2(el, options) {
    options = options || {};
    var candidates;
    if (options.getShadowRoot) {
      candidates = getCandidatesIteratively([el], options.includeContainer, {
        filter: isNodeMatchingSelectorTabbable.bind(null, options),
        flatten: false,
        getShadowRoot: options.getShadowRoot,
        shadowRootFilter: isValidShadowRootTabbable
      });
    } else {
      candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
    }
    return sortByOrder(candidates);
  };
  var focusable = function focusable2(el, options) {
    options = options || {};
    var candidates;
    if (options.getShadowRoot) {
      candidates = getCandidatesIteratively([el], options.includeContainer, {
        filter: isNodeMatchingSelectorFocusable.bind(null, options),
        flatten: true,
        getShadowRoot: options.getShadowRoot
      });
    } else {
      candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorFocusable.bind(null, options));
    }
    return candidates;
  };
  var isTabbable = function isTabbable2(node, options) {
    options = options || {};
    if (!node) {
      throw new Error("No node provided");
    }
    if (matches.call(node, candidateSelector) === false) {
      return false;
    }
    return isNodeMatchingSelectorTabbable(options, node);
  };
  var focusableCandidateSelector = /* @__PURE__ */ candidateSelectors.concat("iframe").join(",");
  var isFocusable = function isFocusable2(node, options) {
    options = options || {};
    if (!node) {
      throw new Error("No node provided");
    }
    if (matches.call(node, focusableCandidateSelector) === false) {
      return false;
    }
    return isNodeMatchingSelectorFocusable(options, node);
  };

  // node_modules/focus-trap/dist/focus-trap.esm.js
  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      enumerableOnly && (symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })), keys.push.apply(keys, symbols);
    }
    return keys;
  }
  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {};
      i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
        _defineProperty(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
    return target;
  }
  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  var activeFocusTraps = /* @__PURE__ */ (function() {
    var trapQueue = [];
    return {
      activateTrap: function activateTrap(trap) {
        if (trapQueue.length > 0) {
          var activeTrap = trapQueue[trapQueue.length - 1];
          if (activeTrap !== trap) {
            activeTrap.pause();
          }
        }
        var trapIndex = trapQueue.indexOf(trap);
        if (trapIndex === -1) {
          trapQueue.push(trap);
        } else {
          trapQueue.splice(trapIndex, 1);
          trapQueue.push(trap);
        }
      },
      deactivateTrap: function deactivateTrap(trap) {
        var trapIndex = trapQueue.indexOf(trap);
        if (trapIndex !== -1) {
          trapQueue.splice(trapIndex, 1);
        }
        if (trapQueue.length > 0) {
          trapQueue[trapQueue.length - 1].unpause();
        }
      }
    };
  })();
  var isSelectableInput = function isSelectableInput2(node) {
    return node.tagName && node.tagName.toLowerCase() === "input" && typeof node.select === "function";
  };
  var isEscapeEvent = function isEscapeEvent2(e) {
    return e.key === "Escape" || e.key === "Esc" || e.keyCode === 27;
  };
  var isTabEvent = function isTabEvent2(e) {
    return e.key === "Tab" || e.keyCode === 9;
  };
  var delay = function delay2(fn) {
    return setTimeout(fn, 0);
  };
  var findIndex = function findIndex2(arr, fn) {
    var idx = -1;
    arr.every(function(value, i) {
      if (fn(value)) {
        idx = i;
        return false;
      }
      return true;
    });
    return idx;
  };
  var valueOrHandler = function valueOrHandler2(value) {
    for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }
    return typeof value === "function" ? value.apply(void 0, params) : value;
  };
  var getActualTarget = function getActualTarget2(event) {
    return event.target.shadowRoot && typeof event.composedPath === "function" ? event.composedPath()[0] : event.target;
  };
  var createFocusTrap = function createFocusTrap2(elements, userOptions) {
    var doc = (userOptions === null || userOptions === void 0 ? void 0 : userOptions.document) || document;
    var config = _objectSpread2({
      returnFocusOnDeactivate: true,
      escapeDeactivates: true,
      delayInitialFocus: true
    }, userOptions);
    var state = {
      // containers given to createFocusTrap()
      // @type {Array<HTMLElement>}
      containers: [],
      // list of objects identifying tabbable nodes in `containers` in the trap
      // NOTE: it's possible that a group has no tabbable nodes if nodes get removed while the trap
      //  is active, but the trap should never get to a state where there isn't at least one group
      //  with at least one tabbable node in it (that would lead to an error condition that would
      //  result in an error being thrown)
      // @type {Array<{
      //   container: HTMLElement,
      //   tabbableNodes: Array<HTMLElement>, // empty if none
      //   focusableNodes: Array<HTMLElement>, // empty if none
      //   firstTabbableNode: HTMLElement|null,
      //   lastTabbableNode: HTMLElement|null,
      //   nextTabbableNode: (node: HTMLElement, forward: boolean) => HTMLElement|undefined
      // }>}
      containerGroups: [],
      // same order/length as `containers` list
      // references to objects in `containerGroups`, but only those that actually have
      //  tabbable nodes in them
      // NOTE: same order as `containers` and `containerGroups`, but __not necessarily__
      //  the same length
      tabbableGroups: [],
      nodeFocusedBeforeActivation: null,
      mostRecentlyFocusedNode: null,
      active: false,
      paused: false,
      // timer ID for when delayInitialFocus is true and initial focus in this trap
      //  has been delayed during activation
      delayInitialFocusTimer: void 0
    };
    var trap;
    var getOption = function getOption2(configOverrideOptions, optionName, configOptionName) {
      return configOverrideOptions && configOverrideOptions[optionName] !== void 0 ? configOverrideOptions[optionName] : config[configOptionName || optionName];
    };
    var findContainerIndex = function findContainerIndex2(element) {
      return state.containerGroups.findIndex(function(_ref) {
        var container = _ref.container, tabbableNodes = _ref.tabbableNodes;
        return container.contains(element) || // fall back to explicit tabbable search which will take into consideration any
        //  web components if the `tabbableOptions.getShadowRoot` option was used for
        //  the trap, enabling shadow DOM support in tabbable (`Node.contains()` doesn't
        //  look inside web components even if open)
        tabbableNodes.find(function(node) {
          return node === element;
        });
      });
    };
    var getNodeForOption = function getNodeForOption2(optionName) {
      var optionValue = config[optionName];
      if (typeof optionValue === "function") {
        for (var _len2 = arguments.length, params = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          params[_key2 - 1] = arguments[_key2];
        }
        optionValue = optionValue.apply(void 0, params);
      }
      if (optionValue === true) {
        optionValue = void 0;
      }
      if (!optionValue) {
        if (optionValue === void 0 || optionValue === false) {
          return optionValue;
        }
        throw new Error("`".concat(optionName, "` was specified but was not a node, or did not return a node"));
      }
      var node = optionValue;
      if (typeof optionValue === "string") {
        node = doc.querySelector(optionValue);
        if (!node) {
          throw new Error("`".concat(optionName, "` as selector refers to no known node"));
        }
      }
      return node;
    };
    var getInitialFocusNode = function getInitialFocusNode2() {
      var node = getNodeForOption("initialFocus");
      if (node === false) {
        return false;
      }
      if (node === void 0) {
        if (findContainerIndex(doc.activeElement) >= 0) {
          node = doc.activeElement;
        } else {
          var firstTabbableGroup = state.tabbableGroups[0];
          var firstTabbableNode = firstTabbableGroup && firstTabbableGroup.firstTabbableNode;
          node = firstTabbableNode || getNodeForOption("fallbackFocus");
        }
      }
      if (!node) {
        throw new Error("Your focus-trap needs to have at least one focusable element");
      }
      return node;
    };
    var updateTabbableNodes = function updateTabbableNodes2() {
      state.containerGroups = state.containers.map(function(container) {
        var tabbableNodes = tabbable(container, config.tabbableOptions);
        var focusableNodes = focusable(container, config.tabbableOptions);
        return {
          container,
          tabbableNodes,
          focusableNodes,
          firstTabbableNode: tabbableNodes.length > 0 ? tabbableNodes[0] : null,
          lastTabbableNode: tabbableNodes.length > 0 ? tabbableNodes[tabbableNodes.length - 1] : null,
          /**
           * Finds the __tabbable__ node that follows the given node in the specified direction,
           *  in this container, if any.
           * @param {HTMLElement} node
           * @param {boolean} [forward] True if going in forward tab order; false if going
           *  in reverse.
           * @returns {HTMLElement|undefined} The next tabbable node, if any.
           */
          nextTabbableNode: function nextTabbableNode(node) {
            var forward = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
            var nodeIdx = focusableNodes.findIndex(function(n) {
              return n === node;
            });
            if (nodeIdx < 0) {
              return void 0;
            }
            if (forward) {
              return focusableNodes.slice(nodeIdx + 1).find(function(n) {
                return isTabbable(n, config.tabbableOptions);
              });
            }
            return focusableNodes.slice(0, nodeIdx).reverse().find(function(n) {
              return isTabbable(n, config.tabbableOptions);
            });
          }
        };
      });
      state.tabbableGroups = state.containerGroups.filter(function(group) {
        return group.tabbableNodes.length > 0;
      });
      if (state.tabbableGroups.length <= 0 && !getNodeForOption("fallbackFocus")) {
        throw new Error("Your focus-trap must have at least one container with at least one tabbable node in it at all times");
      }
    };
    var tryFocus = function tryFocus2(node) {
      if (node === false) {
        return;
      }
      if (node === doc.activeElement) {
        return;
      }
      if (!node || !node.focus) {
        tryFocus2(getInitialFocusNode());
        return;
      }
      node.focus({
        preventScroll: !!config.preventScroll
      });
      state.mostRecentlyFocusedNode = node;
      if (isSelectableInput(node)) {
        node.select();
      }
    };
    var getReturnFocusNode = function getReturnFocusNode2(previousActiveElement) {
      var node = getNodeForOption("setReturnFocus", previousActiveElement);
      return node ? node : node === false ? false : previousActiveElement;
    };
    var checkPointerDown = function checkPointerDown2(e) {
      var target = getActualTarget(e);
      if (findContainerIndex(target) >= 0) {
        return;
      }
      if (valueOrHandler(config.clickOutsideDeactivates, e)) {
        trap.deactivate({
          // if, on deactivation, we should return focus to the node originally-focused
          //  when the trap was activated (or the configured `setReturnFocus` node),
          //  then assume it's also OK to return focus to the outside node that was
          //  just clicked, causing deactivation, as long as that node is focusable;
          //  if it isn't focusable, then return focus to the original node focused
          //  on activation (or the configured `setReturnFocus` node)
          // NOTE: by setting `returnFocus: false`, deactivate() will do nothing,
          //  which will result in the outside click setting focus to the node
          //  that was clicked, whether it's focusable or not; by setting
          //  `returnFocus: true`, we'll attempt to re-focus the node originally-focused
          //  on activation (or the configured `setReturnFocus` node)
          returnFocus: config.returnFocusOnDeactivate && !isFocusable(target, config.tabbableOptions)
        });
        return;
      }
      if (valueOrHandler(config.allowOutsideClick, e)) {
        return;
      }
      e.preventDefault();
    };
    var checkFocusIn = function checkFocusIn2(e) {
      var target = getActualTarget(e);
      var targetContained = findContainerIndex(target) >= 0;
      if (targetContained || target instanceof Document) {
        if (targetContained) {
          state.mostRecentlyFocusedNode = target;
        }
      } else {
        e.stopImmediatePropagation();
        tryFocus(state.mostRecentlyFocusedNode || getInitialFocusNode());
      }
    };
    var checkTab = function checkTab2(e) {
      var target = getActualTarget(e);
      updateTabbableNodes();
      var destinationNode = null;
      if (state.tabbableGroups.length > 0) {
        var containerIndex = findContainerIndex(target);
        var containerGroup = containerIndex >= 0 ? state.containerGroups[containerIndex] : void 0;
        if (containerIndex < 0) {
          if (e.shiftKey) {
            destinationNode = state.tabbableGroups[state.tabbableGroups.length - 1].lastTabbableNode;
          } else {
            destinationNode = state.tabbableGroups[0].firstTabbableNode;
          }
        } else if (e.shiftKey) {
          var startOfGroupIndex = findIndex(state.tabbableGroups, function(_ref2) {
            var firstTabbableNode = _ref2.firstTabbableNode;
            return target === firstTabbableNode;
          });
          if (startOfGroupIndex < 0 && (containerGroup.container === target || isFocusable(target, config.tabbableOptions) && !isTabbable(target, config.tabbableOptions) && !containerGroup.nextTabbableNode(target, false))) {
            startOfGroupIndex = containerIndex;
          }
          if (startOfGroupIndex >= 0) {
            var destinationGroupIndex = startOfGroupIndex === 0 ? state.tabbableGroups.length - 1 : startOfGroupIndex - 1;
            var destinationGroup = state.tabbableGroups[destinationGroupIndex];
            destinationNode = destinationGroup.lastTabbableNode;
          }
        } else {
          var lastOfGroupIndex = findIndex(state.tabbableGroups, function(_ref3) {
            var lastTabbableNode = _ref3.lastTabbableNode;
            return target === lastTabbableNode;
          });
          if (lastOfGroupIndex < 0 && (containerGroup.container === target || isFocusable(target, config.tabbableOptions) && !isTabbable(target, config.tabbableOptions) && !containerGroup.nextTabbableNode(target))) {
            lastOfGroupIndex = containerIndex;
          }
          if (lastOfGroupIndex >= 0) {
            var _destinationGroupIndex = lastOfGroupIndex === state.tabbableGroups.length - 1 ? 0 : lastOfGroupIndex + 1;
            var _destinationGroup = state.tabbableGroups[_destinationGroupIndex];
            destinationNode = _destinationGroup.firstTabbableNode;
          }
        }
      } else {
        destinationNode = getNodeForOption("fallbackFocus");
      }
      if (destinationNode) {
        e.preventDefault();
        tryFocus(destinationNode);
      }
    };
    var checkKey = function checkKey2(e) {
      if (isEscapeEvent(e) && valueOrHandler(config.escapeDeactivates, e) !== false) {
        e.preventDefault();
        trap.deactivate();
        return;
      }
      if (isTabEvent(e)) {
        checkTab(e);
        return;
      }
    };
    var checkClick = function checkClick2(e) {
      var target = getActualTarget(e);
      if (findContainerIndex(target) >= 0) {
        return;
      }
      if (valueOrHandler(config.clickOutsideDeactivates, e)) {
        return;
      }
      if (valueOrHandler(config.allowOutsideClick, e)) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    var addListeners = function addListeners2() {
      if (!state.active) {
        return;
      }
      activeFocusTraps.activateTrap(trap);
      state.delayInitialFocusTimer = config.delayInitialFocus ? delay(function() {
        tryFocus(getInitialFocusNode());
      }) : tryFocus(getInitialFocusNode());
      doc.addEventListener("focusin", checkFocusIn, true);
      doc.addEventListener("mousedown", checkPointerDown, {
        capture: true,
        passive: false
      });
      doc.addEventListener("touchstart", checkPointerDown, {
        capture: true,
        passive: false
      });
      doc.addEventListener("click", checkClick, {
        capture: true,
        passive: false
      });
      doc.addEventListener("keydown", checkKey, {
        capture: true,
        passive: false
      });
      return trap;
    };
    var removeListeners = function removeListeners2() {
      if (!state.active) {
        return;
      }
      doc.removeEventListener("focusin", checkFocusIn, true);
      doc.removeEventListener("mousedown", checkPointerDown, true);
      doc.removeEventListener("touchstart", checkPointerDown, true);
      doc.removeEventListener("click", checkClick, true);
      doc.removeEventListener("keydown", checkKey, true);
      return trap;
    };
    trap = {
      get active() {
        return state.active;
      },
      get paused() {
        return state.paused;
      },
      activate: function activate(activateOptions) {
        if (state.active) {
          return this;
        }
        var onActivate = getOption(activateOptions, "onActivate");
        var onPostActivate = getOption(activateOptions, "onPostActivate");
        var checkCanFocusTrap = getOption(activateOptions, "checkCanFocusTrap");
        if (!checkCanFocusTrap) {
          updateTabbableNodes();
        }
        state.active = true;
        state.paused = false;
        state.nodeFocusedBeforeActivation = doc.activeElement;
        if (onActivate) {
          onActivate();
        }
        var finishActivation = function finishActivation2() {
          if (checkCanFocusTrap) {
            updateTabbableNodes();
          }
          addListeners();
          if (onPostActivate) {
            onPostActivate();
          }
        };
        if (checkCanFocusTrap) {
          checkCanFocusTrap(state.containers.concat()).then(finishActivation, finishActivation);
          return this;
        }
        finishActivation();
        return this;
      },
      deactivate: function deactivate(deactivateOptions) {
        if (!state.active) {
          return this;
        }
        var options = _objectSpread2({
          onDeactivate: config.onDeactivate,
          onPostDeactivate: config.onPostDeactivate,
          checkCanReturnFocus: config.checkCanReturnFocus
        }, deactivateOptions);
        clearTimeout(state.delayInitialFocusTimer);
        state.delayInitialFocusTimer = void 0;
        removeListeners();
        state.active = false;
        state.paused = false;
        activeFocusTraps.deactivateTrap(trap);
        var onDeactivate = getOption(options, "onDeactivate");
        var onPostDeactivate = getOption(options, "onPostDeactivate");
        var checkCanReturnFocus = getOption(options, "checkCanReturnFocus");
        var returnFocus = getOption(options, "returnFocus", "returnFocusOnDeactivate");
        if (onDeactivate) {
          onDeactivate();
        }
        var finishDeactivation = function finishDeactivation2() {
          delay(function() {
            if (returnFocus) {
              tryFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation));
            }
            if (onPostDeactivate) {
              onPostDeactivate();
            }
          });
        };
        if (returnFocus && checkCanReturnFocus) {
          checkCanReturnFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation)).then(finishDeactivation, finishDeactivation);
          return this;
        }
        finishDeactivation();
        return this;
      },
      pause: function pause() {
        if (state.paused || !state.active) {
          return this;
        }
        state.paused = true;
        removeListeners();
        return this;
      },
      unpause: function unpause() {
        if (!state.paused || !state.active) {
          return this;
        }
        state.paused = false;
        updateTabbableNodes();
        addListeners();
        return this;
      },
      updateContainerElements: function updateContainerElements(containerElements) {
        var elementsAsArray = [].concat(containerElements).filter(Boolean);
        state.containers = elementsAsArray.map(function(element) {
          return typeof element === "string" ? doc.querySelector(element) : element;
        });
        if (state.active) {
          updateTabbableNodes();
        }
        return this;
      }
    };
    trap.updateContainerElements(elements);
    return trap;
  };

  // vendor/flarum-core/js/src/common/utils/focusTrap.ts
  function createFocusTrap3(...args) {
    args[1] = {
      escapeDeactivates: false,
      ...args[1]
    };
    return createFocusTrap(...args);
  }

  // node_modules/body-scroll-lock/lib/bodyScrollLock.esm.js
  init_globals();
  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    } else {
      return Array.from(arr);
    }
  }
  var hasPassiveEvents = false;
  if (typeof window !== "undefined") {
    passiveTestOptions = {
      get passive() {
        hasPassiveEvents = true;
        return void 0;
      }
    };
    window.addEventListener("testPassive", null, passiveTestOptions);
    window.removeEventListener("testPassive", null, passiveTestOptions);
  }
  var passiveTestOptions;
  var isIosDevice = typeof window !== "undefined" && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  var locks = [];
  var documentListenerAdded = false;
  var initialClientY = -1;
  var previousBodyOverflowSetting = void 0;
  var previousBodyPosition = void 0;
  var previousBodyPaddingRight = void 0;
  var allowTouchMove = function allowTouchMove2(el) {
    return locks.some(function(lock) {
      if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
        return true;
      }
      return false;
    });
  };
  var preventDefault = function preventDefault2(rawEvent) {
    var e = rawEvent || window.event;
    if (allowTouchMove(e.target)) {
      return true;
    }
    if (e.touches.length > 1) return true;
    if (e.preventDefault) e.preventDefault();
    return false;
  };
  var setOverflowHidden = function setOverflowHidden2(options) {
    if (previousBodyPaddingRight === void 0) {
      var _reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
      var scrollBarGap = window.innerWidth - document.documentElement.clientWidth;
      if (_reserveScrollBarGap && scrollBarGap > 0) {
        var computedBodyPaddingRight = parseInt(window.getComputedStyle(document.body).getPropertyValue("padding-right"), 10);
        previousBodyPaddingRight = document.body.style.paddingRight;
        document.body.style.paddingRight = computedBodyPaddingRight + scrollBarGap + "px";
      }
    }
    if (previousBodyOverflowSetting === void 0) {
      previousBodyOverflowSetting = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
  };
  var restoreOverflowSetting = function restoreOverflowSetting2() {
    if (previousBodyPaddingRight !== void 0) {
      document.body.style.paddingRight = previousBodyPaddingRight;
      previousBodyPaddingRight = void 0;
    }
    if (previousBodyOverflowSetting !== void 0) {
      document.body.style.overflow = previousBodyOverflowSetting;
      previousBodyOverflowSetting = void 0;
    }
  };
  var setPositionFixed = function setPositionFixed2() {
    return window.requestAnimationFrame(function() {
      if (previousBodyPosition === void 0) {
        previousBodyPosition = {
          position: document.body.style.position,
          top: document.body.style.top,
          left: document.body.style.left
        };
        var _window = window, scrollY = _window.scrollY, scrollX = _window.scrollX, innerHeight = _window.innerHeight;
        document.body.style.position = "fixed";
        document.body.style.top = -scrollY;
        document.body.style.left = -scrollX;
        setTimeout(function() {
          return window.requestAnimationFrame(function() {
            var bottomBarHeight = innerHeight - window.innerHeight;
            if (bottomBarHeight && scrollY >= innerHeight) {
              document.body.style.top = -(scrollY + bottomBarHeight);
            }
          });
        }, 300);
      }
    });
  };
  var restorePositionSetting = function restorePositionSetting2() {
    if (previousBodyPosition !== void 0) {
      var y = -parseInt(document.body.style.top, 10);
      var x = -parseInt(document.body.style.left, 10);
      document.body.style.position = previousBodyPosition.position;
      document.body.style.top = previousBodyPosition.top;
      document.body.style.left = previousBodyPosition.left;
      window.scrollTo(x, y);
      previousBodyPosition = void 0;
    }
  };
  var isTargetElementTotallyScrolled = function isTargetElementTotallyScrolled2(targetElement) {
    return targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;
  };
  var handleScroll = function handleScroll2(event, targetElement) {
    var clientY = event.targetTouches[0].clientY - initialClientY;
    if (allowTouchMove(event.target)) {
      return false;
    }
    if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
      return preventDefault(event);
    }
    if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
      return preventDefault(event);
    }
    event.stopPropagation();
    return true;
  };
  var disableBodyScroll = function disableBodyScroll2(targetElement, options) {
    if (!targetElement) {
      console.error("disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.");
      return;
    }
    if (locks.some(function(lock2) {
      return lock2.targetElement === targetElement;
    })) {
      return;
    }
    var lock = {
      targetElement,
      options: options || {}
    };
    locks = [].concat(_toConsumableArray(locks), [lock]);
    if (isIosDevice) {
      setPositionFixed();
    } else {
      setOverflowHidden(options);
    }
    if (isIosDevice) {
      targetElement.ontouchstart = function(event) {
        if (event.targetTouches.length === 1) {
          initialClientY = event.targetTouches[0].clientY;
        }
      };
      targetElement.ontouchmove = function(event) {
        if (event.targetTouches.length === 1) {
          handleScroll(event, targetElement);
        }
      };
      if (!documentListenerAdded) {
        document.addEventListener("touchmove", preventDefault, hasPassiveEvents ? { passive: false } : void 0);
        documentListenerAdded = true;
      }
    }
  };
  var clearAllBodyScrollLocks = function clearAllBodyScrollLocks2() {
    if (isIosDevice) {
      locks.forEach(function(lock) {
        lock.targetElement.ontouchstart = null;
        lock.targetElement.ontouchmove = null;
      });
      if (documentListenerAdded) {
        document.removeEventListener("touchmove", preventDefault, hasPassiveEvents ? { passive: false } : void 0);
        documentListenerAdded = false;
      }
      initialClientY = -1;
    }
    if (isIosDevice) {
      restorePositionSetting();
    } else {
      restoreOverflowSetting();
    }
    locks = [];
  };

  // vendor/flarum-core/js/src/common/components/ModalManager.tsx
  var ModalManager = class extends Component {
    // Current focus trap
    focusTrap;
    // Keep track of the last set focus trap
    lastSetFocusTrap;
    // Current close watcher instance
    closeWatcher;
    // Keep track of the last set close watcher
    lastCloseWatcherKey;
    // Keep track if there's an modal closing
    modalClosing = false;
    keyUpListener = null;
    view(vnode) {
      return /* @__PURE__ */ (0, import_mithril.default)(import_mithril.default.Fragment, null, this.attrs.state.modalList.map((modal, i) => {
        const Tag = modal?.componentClass;
        return /* @__PURE__ */ (0, import_mithril.default)(
          "div",
          {
            key: modal.key,
            className: "ModalManager modal",
            "data-modal-key": modal.key,
            "data-modal-number": i,
            role: "dialog",
            "aria-modal": "true",
            style: !window.testing && { "--modal-number": i },
            "aria-hidden": this.attrs.state.modal !== modal && "true"
          },
          !!Tag && [
            /* @__PURE__ */ (0, import_mithril.default)(
              Tag,
              {
                key: modal.key,
                ...modal.attrs,
                animateShow: this.animateShow.bind(this),
                animateHide: this.animateHide.bind(this),
                state: this.attrs.state
              }
            ),
            /* This backdrop is invisible and used for outside clicks to close the modal. */
            /* @__PURE__ */ (0, import_mithril.default)("div", { key: modal.key, className: "ModalManager-invisibleBackdrop", onclick: this.handlePossibleBackdropClick.bind(this) })
          ]
        );
      }), (this.attrs.state.backdropShown || this.attrs.state.loadingModal) && /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          className: "Modal-backdrop backdrop",
          ontransitionend: this.onBackdropTransitionEnd.bind(this),
          "data-showing": !!this.attrs.state.modalList.length || this.attrs.state.loadingModal,
          style: !window.testing && { "--modal-count": this.attrs.state.modalList.length + Number(this.attrs.state.loadingModal) }
        },
        this.attrs.state.loadingModal && /* @__PURE__ */ (0, import_mithril.default)(LoadingIndicator, null)
      ));
    }
    oncreate(vnode) {
      super.oncreate(vnode);
      this.keyUpListener = this.handleEscPress.bind(this);
      document.body.addEventListener("keyup", this.keyUpListener);
    }
    onbeforeremove(vnode) {
      super.onbeforeremove(vnode);
      this.keyUpListener && document.body.removeEventListener("keyup", this.keyUpListener);
      this.keyUpListener = null;
    }
    onupdate(vnode) {
      super.onupdate(vnode);
      requestAnimationFrame(() => {
        try {
          if (!this.attrs.state.isModalOpen()) {
            document.getElementById("app")?.removeAttribute("aria-hidden");
            this.focusTrap.deactivate?.();
            this.closeWatcher?.destroy();
            this.closeWatcher = void 0;
            clearAllBodyScrollLocks();
            return;
          }
          document.getElementById("app")?.setAttribute("aria-hidden", "true");
          const dialogKey = this.attrs.state.modal.key;
          if (this.focusTrap && this.lastSetFocusTrap !== dialogKey) {
            this.focusTrap.deactivate?.();
            clearAllBodyScrollLocks();
          }
          if (this.activeDialogElement && this.lastSetFocusTrap !== dialogKey) {
            this.focusTrap = createFocusTrap3(this.activeDialogElement, { allowOutsideClick: true });
            this.focusTrap.activate?.();
            if (this.activeDialogManagerElement) {
              disableBodyScroll(this.activeDialogManagerElement, { reserveScrollBarGap: true });
            }
          }
          this.lastSetFocusTrap = dialogKey;
          if ("CloseWatcher" in window && this.lastCloseWatcherKey !== dialogKey) {
            this.closeWatcher?.destroy();
            this.closeWatcher = void 0;
            if (this.attrs.state.modal.componentClass.dismissibleOptions.viaEscKey) {
              this.closeWatcher = new CloseWatcher();
              this.closeWatcher.onclose = () => {
                this.animateHide();
              };
            }
            this.lastCloseWatcherKey = dialogKey;
          }
        } catch {
        }
      });
    }
    /**
     * Get current active dialog
     */
    get activeDialogElement() {
      return document.body.querySelector(`.ModalManager[data-modal-key="${this.attrs.state.modal?.key}"] .Modal`);
    }
    /**
     * Get current active dialog
     */
    get activeDialogManagerElement() {
      return document.body.querySelector(`.ModalManager[data-modal-key="${this.attrs.state.modal?.key}"]`);
    }
    animateShow(readyCallback = () => {
    }) {
      if (!this.attrs.state.modal) return;
      this.activeDialogElement?.addEventListener(
        "transitionend",
        () => {
          readyCallback();
        },
        { once: true }
      );
      requestAnimationFrame(() => {
        this.activeDialogElement?.classList.add("in");
      });
    }
    animateHide(closedCallback = () => {
    }) {
      if (this.modalClosing) return;
      this.modalClosing = true;
      const afterModalClosedCallback = () => {
        this.modalClosing = false;
        this.attrs.state.close();
        closedCallback();
      };
      this.activeDialogElement?.addEventListener("transitionend", afterModalClosedCallback, { once: true });
      this.activeDialogElement?.classList.remove("in");
      this.activeDialogElement?.classList.add("out");
    }
    handleEscPress(e) {
      if (!this.attrs.state.modal || this.closeWatcher?.onclose) return;
      const dismissibleState = this.attrs.state.modal.componentClass.dismissibleOptions;
      if (e.key === "Escape" && dismissibleState.viaEscKey) {
        e.preventDefault();
        this.animateHide();
      }
    }
    handlePossibleBackdropClick(e) {
      if (!this.attrs.state.modal || !this.attrs.state.modal.componentClass.dismissibleOptions.viaBackdropClick) return;
      this.animateHide();
    }
    onBackdropTransitionEnd(e) {
      if (e.propertyName === "opacity") {
        const backdrop = e.currentTarget;
        if (backdrop.getAttribute("data-showing") === null) {
          this.attrs.state.backdropShown = false;
          import_mithril.default.redraw();
        }
      }
    }
  };

  // vendor/flarum-core/js/src/common/components/AlertManager.tsx
  init_globals();
  var AlertManager = class extends Component {
    oninit(vnode) {
      super.oninit(vnode);
      this.state = this.attrs.state;
    }
    view() {
      const activeAlerts = this.state.getActiveAlerts();
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "AlertManager" }, Object.keys(activeAlerts).map(Number).map((key) => {
        const alert = activeAlerts[key];
        const urgent = alert.attrs.type === "error";
        const ondismiss = (...args) => {
          alert.attrs.ondismiss?.(...args);
          this.state.dismiss(key);
        };
        return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "AlertManager-alert", role: "alert", "aria-live": urgent ? "assertive" : "polite" }, /* @__PURE__ */ (0, import_mithril.default)(alert.componentClass, { ...alert.attrs, ondismiss }, alert.children));
      }));
    }
  };

  // vendor/upload-exif/forum/components/UploadButton.js
  init_globals();

  // vendor/flarum-core/js/src/common/components/Tooltip.tsx
  init_globals();
  var Tooltip = class extends Component {
    firstChild = null;
    childDomNode = null;
    oldText = "";
    oldVisibility;
    shouldRecreateTooltip = false;
    shouldUpdateText = false;
    shouldChangeTooltipVisibility = false;
    view(vnode) {
      const children = vnode.children;
      const {
        text,
        tooltipVisible,
        showOnFocus = true,
        position = "top",
        ignoreTitleWarning = false,
        html = false,
        delay: delay3 = 0,
        container = false,
        ...attrs
      } = this.attrs;
      if (this.attrs.title && !ignoreTitleWarning) {
        console.warn(
          "`title` attribute was passed to Tooltip component. Was this intentional? Tooltip content should be passed to the `text` attr instead."
        );
      }
      const realText = this.getRealText();
      if (realText !== this.oldText) {
        this.oldText = realText;
        this.shouldUpdateText = true;
      }
      if (tooltipVisible !== this.oldVisibility) {
        this.oldVisibility = this.attrs.tooltipVisible;
        this.shouldChangeTooltipVisibility = true;
      }
      if (typeof children === "undefined") {
        throw new Error(
          `Tooltip component was provided with no direct child DOM element. Tooltips must contain a single direct DOM node to attach to.`
        );
      }
      if (children.length !== 1) {
        throw new Error(
          `Tooltip component was either passed more than one or no child node.

Please wrap multiple children in another element, such as a <div> or <span>.`
        );
      }
      const firstChild = children[0];
      if (typeof firstChild !== "object" || Array.isArray(firstChild) || firstChild === null) {
        throw new Error(
          `Tooltip component was provided with no direct child DOM element. Tooltips must contain a single direct DOM node to attach to.`
        );
      }
      if (typeof firstChild.tag === "string" && ["#", "[", "<"].includes(firstChild.tag)) {
        throw new Error(
          `Tooltip component with provided with a vnode with tag "${firstChild.tag}". This is not a DOM element, so is not a valid child element. Please wrap this vnode in another element, such as a <div> or <span>.`
        );
      }
      this.firstChild = firstChild;
      return children;
    }
    oncreate(vnode) {
      super.oncreate(vnode);
      this.checkDomNodeChanged();
      this.recreateTooltip();
    }
    onupdate(vnode) {
      super.onupdate(vnode);
      this.checkDomNodeChanged();
      this.recreateTooltip();
      if (this.shouldUpdateText) {
        this.updateText();
        this.shouldUpdateText = false;
      }
    }
    onremove(vnode) {
      super.onremove(vnode);
      if (this.childDomNode !== null) {
        (0, import_jquery.default)(this.childDomNode).tooltip(
          "destroy",
          // @ts-expect-error We don't want this arg to be part of the public API. It only exists to prevent deprecation warnings when using `$.tooltip` in this component.
          "DANGEROUS_tooltip_jquery_fn_deprecation_exempt"
        );
      }
    }
    recreateTooltip() {
      if (this.shouldRecreateTooltip && this.childDomNode !== null) {
        const tooltip = (0, import_jquery.default)(this.childDomNode).data("bs.tooltip");
        if (tooltip && tooltip.$tip) {
          tooltip.$tip.removeClass("fade");
        }
        (0, import_jquery.default)(this.childDomNode).tooltip(
          "destroy",
          // @ts-expect-error We don't want this arg to be part of the public API. It only exists to prevent deprecation warnings when using `$.tooltip` in this component.
          "DANGEROUS_tooltip_jquery_fn_deprecation_exempt"
        );
        this.createTooltip();
        this.shouldRecreateTooltip = false;
      }
      if (this.shouldChangeTooltipVisibility) {
        this.shouldChangeTooltipVisibility = false;
        this.updateVisibility();
      }
    }
    updateText() {
      if (this.childDomNode === null) return;
      const realText = this.getRealText();
      this.childDomNode.setAttribute("data-original-title", realText);
      this.childDomNode.setAttribute("aria-label", realText);
      const tooltip = (0, import_jquery.default)(this.childDomNode).data("bs.tooltip");
      if (tooltip && tooltip.$tip && tooltip.$tip.hasClass("in")) {
        tooltip.$tip.find(".tooltip-inner")[this.attrs.html ? "html" : "text"](realText);
        tooltip.show();
      }
    }
    updateVisibility() {
      if (this.childDomNode === null) return;
      if (this.attrs.tooltipVisible === true) {
        (0, import_jquery.default)(this.childDomNode).tooltip(
          "show",
          // @ts-expect-error We don't want this arg to be part of the public API. It only exists to prevent deprecation warnings when using `$.tooltip` in this component.
          "DANGEROUS_tooltip_jquery_fn_deprecation_exempt"
        );
      } else if (this.attrs.tooltipVisible === false) {
        (0, import_jquery.default)(this.childDomNode).tooltip(
          "hide",
          // @ts-expect-error We don't want this arg to be part of the public API. It only exists to prevent deprecation warnings when using `$.tooltip` in this component.
          "DANGEROUS_tooltip_jquery_fn_deprecation_exempt"
        );
      }
    }
    createTooltip() {
      if (this.childDomNode === null) return;
      const {
        showOnFocus = true,
        position = "top",
        delay: delay3,
        // This will have no effect when switching to CSS tooltips
        html = false,
        container = false,
        tooltipVisible,
        text
      } = this.attrs;
      const trigger = typeof tooltipVisible === "boolean" ? "manual" : classList_default("hover", [showOnFocus && "focus"]);
      const realText = this.getRealText();
      this.childDomNode.setAttribute("aria-label", realText);
      this.childDomNode.removeAttribute("title");
      (0, import_jquery.default)(this.childDomNode).tooltip(
        {
          title: realText,
          html,
          delay: delay3,
          placement: position,
          trigger,
          container
        },
        // @ts-expect-error We don't want this arg to be part of the public API. It only exists to prevent deprecation warnings when using `$.tooltip` in this component.
        "DANGEROUS_tooltip_jquery_fn_deprecation_exempt"
      );
    }
    getRealText() {
      const { text } = this.attrs;
      return Array.isArray(text) ? extractText(text) : text;
    }
    /**
     * Checks if the tooltip DOM node has changed.
     *
     * If it has, it updates `this.childDomNode` to the new node, and sets
     * `shouldRecreateTooltip` to `true`.
     */
    checkDomNodeChanged() {
      const domNode = this.firstChild.dom;
      if (domNode && !domNode.isSameNode(this.childDomNode)) {
        if (this.childDomNode) {
          const tooltip = (0, import_jquery.default)(this.childDomNode).data("bs.tooltip");
          if (tooltip && tooltip.$tip) {
            tooltip.$tip.removeClass("fade");
          }
          (0, import_jquery.default)(this.childDomNode).tooltip(
            "destroy",
            // @ts-expect-error We don't want this arg to be part of the public API. It only exists to prevent deprecation warnings when using `$.tooltip` in this component.
            "DANGEROUS_tooltip_jquery_fn_deprecation_exempt"
          );
        }
        this.childDomNode = domNode;
        this.shouldRecreateTooltip = true;
      }
    }
  };

  // vendor/upload-exif/forum/components/WatermarkModal.js
  init_globals();

  // vendor/flarum-core/js/src/common/utils/Stream.ts
  init_globals();
  var import_stream = __toESM(require_stream2());
  var Stream_default = import_stream.default;

  // vendor/flarum-core/js/src/common/components/Avatar.tsx
  init_globals();
  var Avatar = class extends Component {
    view(vnode) {
      const { user, ...attrs } = vnode.attrs;
      attrs.className = classList_default("Avatar", attrs.className);
      attrs.loading ??= "lazy";
      let content = "";
      const hasTitle = attrs.title === "undefined" || attrs.title;
      if (!hasTitle) delete attrs.title;
      if (user) {
        const username = user.displayName() || "?";
        const avatarUrl = user.avatarUrl();
        if (hasTitle) attrs.title = attrs.title || username;
        const hasAlt = attrs.alt === "undefined" || attrs.alt;
        if (!hasAlt) delete attrs.alt;
        if (avatarUrl) {
          if (attrs.alt === void 0) {
            attrs.alt = username;
          }
          const srcset = user.avatarSrcset?.() ?? null;
          return /* @__PURE__ */ (0, import_mithril.default)("img", { ...attrs, src: avatarUrl, srcSet: srcset ?? void 0 });
        }
        content = username.charAt(0).toUpperCase();
        attrs.style = !window.testing && { "--avatar-bg": user.color() };
        delete attrs.loading;
        attrs.role = "img";
        attrs["aria-label"] = username;
      }
      return /* @__PURE__ */ (0, import_mithril.default)("span", { ...attrs }, content);
    }
  };

  // vendor/upload-exif/forum/utils/previewCache.js
  init_globals();
  var urls = /* @__PURE__ */ new WeakMap();
  var thumbs = /* @__PURE__ */ new WeakMap();
  var dims = /* @__PURE__ */ new WeakMap();
  function fileUrl(file) {
    if (!file) return null;
    let u = urls.get(file);
    if (!u) urls.set(file, u = URL.createObjectURL(file));
    return u;
  }
  function fileDims(file) {
    if (!file) return Promise.resolve({ width: 0, height: 0 });
    let p = dims.get(file);
    if (!p) {
      p = new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = fileUrl(file);
      });
      dims.set(file, p);
    }
    return p;
  }
  function warm(file) {
    if (file) fileDims(file);
  }
  function thumbBitmap(file, size) {
    let p = thumbs.get(file);
    if (!p) {
      p = (typeof createImageBitmap === "function" ? createImageBitmap(file, { resizeWidth: size, resizeQuality: "low", imageOrientation: "from-image" }) : Promise.reject()).catch(() => null);
      thumbs.set(file, p);
    }
    return p;
  }
  function drawThumb(canvas, file, size = 240) {
    if (!canvas || !file || canvas._file === file) return;
    canvas._file = file;
    thumbBitmap(file, size).then((bm) => {
      if (canvas._file !== file) return;
      const ctx2 = canvas.getContext("2d");
      const w = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1) || size;
      const h = canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1) || Math.round(size * 0.75);
      if (!bm) {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => cover(ctx2, img, img.naturalWidth, img.naturalHeight, w, h);
        img.src = fileUrl(file);
        return;
      }
      cover(ctx2, bm, bm.width, bm.height, w, h);
    });
  }
  var previews = /* @__PURE__ */ new WeakMap();
  function drawPreview(canvas, file, maxW = 1600) {
    if (!canvas || !file || canvas._file === file) return;
    canvas._file = file;
    let p = previews.get(file);
    if (!p) {
      p = fileDims(file).then(({ width, height }) => {
        if (typeof createImageBitmap !== "function" || !width) return null;
        const scale = Math.min(1, maxW / Math.max(width, height));
        return createImageBitmap(file, { resizeWidth: Math.round(width * scale), resizeHeight: Math.round(height * scale), resizeQuality: "high", imageOrientation: "from-image" }).catch(() => null);
      });
      previews.set(file, p);
    }
    const paint = (src, w, h) => {
      if (canvas._file !== file) return;
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(src, 0, 0, w, h);
      canvas.classList.add("is-ready");
    };
    thumbBitmap(file, 240).then((bm) => {
      if (bm && !canvas.classList.contains("is-sharp")) paint(bm, bm.width, bm.height);
    });
    p.then((bm) => {
      if (bm) {
        paint(bm, bm.width, bm.height);
        canvas.classList.add("is-sharp");
        return;
      }
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        paint(img, img.naturalWidth, img.naturalHeight);
        canvas.classList.add("is-sharp");
      };
      img.src = fileUrl(file);
    });
  }
  function cover(ctx2, src, sw, sh, w, h) {
    const scale = Math.max(w / sw, h / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx2.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  // vendor/upload-exif/forum/components/WatermarkModal.js
  var imgCache = {};
  function loadImg(src) {
    if (!imgCache[src]) {
      imgCache[src] = new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = src;
      });
    }
    return imgCache[src];
  }
  var lum = (r2, g, b) => 0.2126 * r2 + 0.7152 * g + 0.0722 * b;
  var SW = 240;
  var photoCache = /* @__PURE__ */ new WeakMap();
  function photoLum(file) {
    if (!photoCache.has(file)) {
      photoCache.set(file, (async () => {
        let src;
        try {
          src = await createImageBitmap(file, { resizeWidth: SW, resizeQuality: "low" });
        } catch (e) {
          src = await loadImg(fileUrl(file));
        }
        const w0 = src.width || src.naturalWidth, h0 = src.height || src.naturalHeight;
        const H = Math.max(1, Math.round(h0 * SW / w0));
        const c = document.createElement("canvas");
        c.width = SW;
        c.height = H;
        const x = c.getContext("2d", { willReadFrequently: true });
        x.drawImage(src, 0, 0, SW, H);
        if (src.close) src.close();
        const d = x.getImageData(0, 0, SW, H).data;
        const L = new Float32Array(SW * H);
        for (let p = 0, q = 0; q < L.length; p += 4, q++) L[q] = lum(d[p], d[p + 1], d[p + 2]);
        return { L, H, ratio: h0 / w0 };
      })());
    }
    return photoCache.get(file);
  }
  var wmCache = {};
  function wmPixels(url) {
    if (!wmCache[url]) {
      wmCache[url] = loadImg(url).then((wm) => {
        const H = Math.max(1, Math.round(wm.naturalHeight * SW / wm.naturalWidth));
        const c = document.createElement("canvas");
        c.width = SW;
        c.height = H;
        const x = c.getContext("2d", { willReadFrequently: true });
        x.drawImage(wm, 0, 0, SW, H);
        const d = x.getImageData(0, 0, SW, H).data;
        const idx = [], L = [];
        for (let p = 0, q = 0; p < d.length; p += 4, q++) if (d[p + 3] >= 110) {
          idx.push(q);
          L.push(lum(d[p], d[p + 1], d[p + 2]));
        }
        return { H, idx, L };
      });
    }
    return wmCache[url];
  }
  async function legibility(file, wmUrl) {
    const [ph, wm] = await Promise.all([photoLum(file), wmPixels(wmUrl)]);
    const wh = Math.min(ph.H, wm.H);
    const off = (ph.H - wh) * SW;
    let n = 0, diff = 0, sum = 0, sum2 = 0;
    for (let k = 0; k < wm.idx.length; k++) {
      const q = wm.idx[k];
      if (q >= wh * SW) break;
      const lb = ph.L[off + q];
      diff += Math.abs(wm.L[k] - lb);
      sum += lb;
      sum2 += lb * lb;
      n++;
    }
    if (!n) return 0;
    const mean = sum / n;
    const sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
    return diff / n / (1 + sd / 40);
  }
  var CUSTOM_CSS = `
    /* Modal Genel ve Ba\u015Fl\u0131k */
    .WatermarkModal, .WatermarkModal .Modal-dialog, .WatermarkModal .Modal-content {
        transform: none !important;
        filter: none !important;
        will-change: auto !important;
    }
    .WatermarkModal .Modal-dialog { max-width: 1000px !important; width: 94vw !important; }
    .WatermarkModal .Modal-content { border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: visible; }
    .WatermarkModal .Modal-header { padding: 16px 24px; border-bottom: 1px solid var(--control-bg); }
    .WatermarkModal .Modal-title { font-size: 1.25em; font-weight: 700; color: var(--heading-color); }
    .WatermarkModal .Modal-body { padding: 0; border-radius: 0 0 12px 12px; }
    .WatermarkModal .Modal-header { border-radius: 12px 12px 0 0; }
    
    /* D\xFCzen (Layout) */
    .Watermark-Layout {
        display: flex;
        flex-direction: column;
        padding: 20px;
        gap: 20px;
    }
    @media (min-width: 900px) {
        .Watermark-Layout {
            flex-direction: row;
            align-items: stretch;
        }
        .Watermark-Left {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }
        /* Foto\u011Fraf sa\u011F s\xFCtunla ayn\u0131 \xFCst hizadan ba\u015Flar; kutu foto\u011Fraf\u0131n kendisidir */
        .Watermark-Left .Watermark-preview-area {
            min-height: 0;
            align-items: flex-start;
            background: transparent;
            border: 0;
            box-shadow: none;
            border-radius: 12px;
        }
        .Watermark-Left .Watermark-preview-area > div { align-items: flex-start !important; }
        .WatermarkModal .Watermark-Left .Watermark-preview-area img { border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,.12); }
        .Watermark-Right {
            width: 340px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            min-width: 0;
        }
        .Watermark-Right::-webkit-scrollbar { width: 6px; }
        .Watermark-Right::-webkit-scrollbar-track { background: transparent; }
        .Watermark-Right::-webkit-scrollbar-thumb { background: #dcdfe6; border-radius: 4px; }
    }
    
    /* \xD6nizleme Alan\u0131 */
    .Preview-Wrapper {
        width: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .Watermark-preview-area {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--control-bg);
        border-radius: 12px;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
        overflow: hidden;
        min-height: 240px;
    }
    .Watermark-preview-area img {
        max-width: 100%;
        max-height: 440px;
        display: block;
        object-fit: contain;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    /* Ekran boyutunda \xF6nizleme (24 MP g\xF6rsel yerine): yazma / ge\xE7i\u015Flerde yeniden boyama maliyetsiz */
    .Watermark-preview-area canvas.WmPreviewCanvas { display: block; max-width: 100%; max-height: 440px; width: auto; height: auto; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,.12); background: #e9edf1; }
    /* Foto\u011Fraf haz\u0131rlan\u0131rken sabit boyutlu \xE7er\xE7eve ve i\xE7inde uyar\u0131; haz\u0131r olunca yumu\u015Fak\xE7a belirir */
    .Watermark-preview-area canvas.WmPreviewCanvas:not(.is-sharp) { width: 480px; max-width: 100%; height: 320px; opacity: 0; }
    .Watermark-preview-area canvas.WmPreviewCanvas.is-sharp { animation: wmPvIn .2s ease-out; }
    @keyframes wmPvIn { from { opacity: 0; } to { opacity: 1; } }
    .WmPreviewLoading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 12px; background: #e9edf1; color: #475569; font-size: 13px; font-weight: 600; pointer-events: none; }
    .WmPreviewBox.is-sharp .WmPreviewLoading { display: none; }

    /* Plaka / boyut bilgisi */
    .WmPick-info { margin-bottom: 18px; padding: 14px; border-radius: 12px; background: var(--control-bg); }
    .WmPick-file { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-color); min-width: 0; }
    .WmPick-file i { color: var(--primary-color); }
    .WmPick-file span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .WmPick-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
    .WmPick-stats div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .WmPick-stats span { font-size: 11px; color: var(--muted-color); }
    .WmPick-stats strong { font-size: 13px; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .WmPick-stats small { font-weight: 500; color: var(--muted-color); }
    .WmPick-sub { margin: -2px 0 10px; font-size: 12px; color: var(--muted-color); }
    .WmPick-notice { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; padding: 8px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--primary-color); background: var(--control-bg); }
    .WmPick-meta { margin-bottom: 0 !important; }
    .WmPick-plate { width: 100%; margin-top: 14px; }
    .WmPick-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
        font-size: 13px;
        font-weight: 600;
        color: var(--muted-color);
    }
    .WmPick-meta span:first-of-type { color: var(--text-color); font-variant-numeric: tabular-nums; }
    .WmPick-orient {
        margin-left: auto;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        color: var(--primary-color);
        background: var(--control-bg);
    }
    .WmPick-label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 700;
        color: var(--muted-color);
    }
    .Modern-Input-Group {
        display: flex;
        align-items: center;
        padding: 0 12px;
        border: 1px solid transparent;
        border-radius: 10px;
        background: var(--control-bg);
        transition: border-color .15s, box-shadow .15s;
    }
    .Modern-Input-Group:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 18%, transparent);
    }
    .Modern-Input-Group i { margin-right: 10px; font-size: 13px; color: var(--muted-color); }
    .Modern-Input-Group input {
        flex: 1;
        min-width: 0;
        height: 42px;
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: .5px;
        color: var(--text-color);
    }
    .WmPick-hint { margin-top: 6px; font-size: 12px; color: var(--muted-color); }
    .WmPick-hint i { color: #f59e0b; margin-right: 4px; }

    /* \u0130mza se\xE7imi: sade sat\u0131rlar */
    .WmPick-loading { padding: 16px; text-align: center; font-size: 13px; color: var(--muted-color); }
    .WmPick-title { margin-bottom: 8px; font-size: 12px; font-weight: 700; color: var(--muted-color); }
    .WmPick-list { display: flex; flex-direction: column; gap: 6px; }
    .WmPick-row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        height: 42px;
        margin: 0;
        padding: 0 12px;
        border: 1.5px solid transparent;
        border-radius: 10px;
        background: var(--control-bg);
        color: var(--text-color);
        font-size: 13px;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
        transition: border-color .15s, background .15s;
    }
    .WmPick-row:hover { border-color: var(--muted-more-color, rgba(0,0,0,.15)); }
    .WmPick-row:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .WmPick-row.is-selected { border-color: var(--primary-color); }
    .WmPick-rowIcon { width: 16px; text-align: center; color: var(--muted-color); }
    .WmPick-row.is-selected .WmPick-rowIcon { color: var(--primary-color); }
    .WmPick-rowLabel { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .WmPick-radio { font-size: 15px; color: var(--muted-color); opacity: .6; }
    .WmPick-row.is-selected .WmPick-radio { color: var(--primary-color); opacity: 1; }
    .WmPick-chevron { font-size: 11px; color: var(--muted-color); transition: transform .15s; }
    .WmPick-chevron.is-open { transform: rotate(180deg); }

    .WmPick-dd { position: relative; }
    .WmPick-menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 30;
        box-shadow: 0 10px 28px rgba(0,0,0,.18);
        max-height: 220px;
        overflow-y: auto;
        padding: 4px;
        border-radius: 10px;
        background: var(--body-bg);
        border: 1px solid var(--control-bg);
    }
    .WmPick-menuHead { padding: 6px 10px 4px; font-size: 11px; font-weight: 700; color: var(--muted-color); }
    .WmPick-menuItem {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 9px 10px;
        border: 0;
        border-radius: 8px;
        background: none;
        color: var(--text-color);
        font-size: 13px;
        text-align: left;
        cursor: pointer;
    }
    .WmPick-menuItem:hover { background: var(--control-bg); }
    .WmPick-menuItem.is-selected { font-weight: 700; color: var(--primary-color); }

    .WmPick-uploadLink {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--primary-color);
        cursor: pointer;
    }
    .WmPick-uploadLink.is-busy { opacity: .6; pointer-events: none; }
    .WmPick-empty { margin-top: 8px; font-size: 12px; color: var(--muted-color); }

    /* T\xFCm\xFCne uygula */
    .WmPick-applyAll {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 14px 0 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-color);
        cursor: pointer;
    }

    /* Geli\u015Fmi\u015F (y\xF6netici) */
    .WmPick-advanced { margin-top: 14px; }
    .WmPick-advancedToggle {
        display: flex; align-items: center; gap: 6px; width: 100%;
        padding: 6px 0; border: 0; background: none; cursor: pointer;
        font-size: 12px; font-weight: 700; color: var(--muted-color);
    }
    .WmPick-advancedToggle .WmPick-chevron { margin-left: auto; }
    .WmPick-advanced.is-open .WmPick-chevron { transform: rotate(180deg); }
    .WmPick-advancedBody { padding-top: 6px; }

    /* Alt butonlar */
    .WmPick-actions {
        display: flex; gap: 8px; margin-top: auto; padding-top: 16px;
        border-top: 1px solid var(--control-bg);
    }
    .WatermarkModal .WmPick-actions .Button {
        flex: 1; height: 40px; margin: 0; padding: 0 12px;
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        border-radius: 10px; font-size: 13px; font-weight: 700; white-space: nowrap;
    }
    .WatermarkModal .WmPick-addBtn { cursor: pointer; background: var(--control-bg); color: var(--control-color); }
    .WatermarkModal .WmPick-uploadBtn { flex: 1.4; }

    /* K\xFC\xE7\xFCk resim \u015Feridi */
    .WmPick-strip { display: flex; gap: 8px; width: 100%; margin-top: 10px; }
    .WmPick-thumbs { display: flex; gap: 8px; min-width: 0; overflow-x: auto; padding-bottom: 2px; }
    .WmPick-addTile {
        flex: 0 0 auto; width: 72px; height: 54px; margin: 0;
        display: flex; align-items: center; justify-content: center;
        border: 2px dashed var(--control-bg); border-radius: 8px;
        color: var(--muted-color); cursor: pointer; transition: border-color .15s, color .15s;
    }
    .WmPick-addTile:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .WmA-meta {
        display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 10px;
        font-size: 12px; font-weight: 600; color: var(--muted-color); font-variant-numeric: tabular-nums;
    }
    .WmA-meta i { color: var(--primary-color); }
    /* Dikey/kare foto\u011Fraf: kutu foto\u011Fraf\u0131 sarar ve ortalan\u0131r; \u015Feritler s\xFCtun geni\u015Fli\u011Finde kal\u0131r */
    .Watermark-Left .Preview-Wrapper { align-items: stretch; }
    .Watermark-Left .Watermark-preview-area { width: fit-content; max-width: 100%; margin: 0 auto; }
    .WatermarkModal .Watermark-Left .Watermark-preview-area img { max-height: 440px; }
    .WmPick-thumb {
        position: relative;
        flex: 0 0 auto;
        width: 72px;
        height: 54px;
        padding: 0;
        border: 2px solid transparent;
        border-radius: 8px;
        overflow: hidden;
        background: var(--control-bg);
        cursor: pointer;
        opacity: .7;
    }
    .WmPick-thumb.is-active { border-color: var(--primary-color); opacity: 1; }
    .WatermarkModal .WmPick-thumb img, .WatermarkModal .WmPick-thumbCanvas { width: 100%; height: 100%; max-height: none; object-fit: cover; box-shadow: none; display: block; }
    .WmPick-thumbBadge {
        position: absolute;
        right: 3px;
        bottom: 3px;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 9px;
        color: #fff;
        background: rgba(0,0,0,.6);
    }
    .WmPick-thumbBadge.is-signed { background: var(--primary-color); }
    /* S\u0131ralama: numara, oklar, s\xFCr\xFCkle-b\u0131rak (animasyonlu) */
    .WmPick-orderHint { display: flex; align-items: center; gap: 6px; margin: 2px 0 6px; font-size: 12px; font-weight: 600; color: var(--muted-color); }
    .WmPick-orderHint i { color: var(--primary-color); }
    .WatermarkModal .WmPick-thumb { width: 96px; height: 72px; cursor: grab; transition: transform .25s ease, box-shadow .2s, opacity .2s; }
    .WatermarkModal .WmPick-thumb:active { cursor: grabbing; }
    .WatermarkModal .WmPick-thumb.is-dragging { opacity: .35; transform: scale(.94); }
    .WatermarkModal .WmPick-thumb.is-over { box-shadow: -4px 0 0 0 var(--primary-color); }
    .WmPick-num { position: absolute; top: 3px; left: 3px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px; background: rgba(0,0,0,.65); color: #fff; font-size: 11px; font-weight: 800; line-height: 20px; text-align: center; }
    .WmPick-thumb.is-active .WmPick-num { background: var(--primary-color); }
    .WmPick-move { position: absolute; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border: 0; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity .15s, background .15s; }
    .WmPick-move.is-left { left: 3px; } .WmPick-move.is-right { right: 3px; }
    .WmPick-thumb:hover .WmPick-move, .WmPick-thumb:focus-within .WmPick-move, .WmPick-thumb.is-active .WmPick-move { opacity: 1; }
    .WmPick-move:hover { background: var(--primary-color); }
    @media (hover: none) { .WmPick-move { opacity: 1; } }
    .WmPick-auto { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; padding: 7px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 8%, transparent); }

    /* ===== Ar\u015Fiv d\xFCzeni (sade) ===== */
    .WmA-file { width: 100%; margin-bottom: 18px; }
    .WmA-fileHint { margin: 0 0 8px; font-size: 12px; font-weight: 500; color: var(--muted-color); }
    .WmA-fileHint i { margin-right: 4px; }
    .WatermarkModal .Modern-Input-Group {
        display: flex; align-items: center; padding: 0 12px;
        border: 1px solid var(--control-bg); border-radius: 8px;
        background: var(--body-bg);
        transition: border-color .15s, box-shadow .15s;
    }
    .WatermarkModal .Modern-Input-Group:focus-within { border-color: var(--primary-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 15%, transparent); }
    .WatermarkModal .Modern-Input-Group i { margin-right: 10px; font-size: 14px; color: var(--muted-color); }
    .WatermarkModal .Modern-Input-Group input { flex: 1; min-width: 0; height: 44px; border: 0; outline: 0; background: transparent; font-size: 14px; font-weight: 500; color: var(--text-color); }
    .WmA-plateWarn { margin-top: 8px; padding: 6px 8px; border-left: 3px solid #ffc107; border-radius: 4px; background: #fff3cd; color: #b26a00; font-size: 11px; font-weight: 600; }

    .WmA-alert {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 20px; padding: 12px 16px;
        border-left: 4px solid #ff4d4f; border-radius: 6px;
        background: #fff4f4;
    }
    .WmA-alert i { font-size: 18px; color: #ff4d4f; }
    .WmA-alert span { font-size: 12px; font-weight: 500; line-height: 1.5; color: #cf1322; }

    .WmA-dims {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 12px;
        font-size: 12px; font-weight: 700; letter-spacing: .5px; color: var(--muted-color);
    }
    .WmA-dims i { color: var(--primary-color); }
    .WmA-orient { margin-left: auto; font-weight: 600; letter-spacing: 0; }
    .WmA-loading { padding: 20px; text-align: center; font-size: 13px; color: var(--muted-color); }

    .WmA-options { display: flex; flex-direction: column; gap: 10px; }
    .WmA-optWrap { position: relative; }
    .WmA-opt {
        position: relative;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; min-height: 48px; margin: 0; padding: 0 16px;
        border: 2px solid transparent; border-radius: 8px;
        font-size: 13px; font-weight: 600; cursor: pointer; user-select: none;
        box-shadow: 0 2px 5px rgba(0,0,0,.04);
        transition: transform .15s, box-shadow .15s, border-color .15s;
    }
    .WmA-opt:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    .WmA-opt:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .WmA-opt.is-primary { background: var(--primary-color); color: #fff; }
    .WmA-opt.is-primary.is-selected { box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 30%, transparent); }
    .WmA-opt.is-site { background: var(--control-bg); color: var(--control-color); }
    .WmA-opt.is-site.is-selected { border-color: var(--primary-color); color: var(--primary-color); }
    .WmA-opt.is-upload { border: 2px dashed var(--control-bg); background: transparent; color: var(--primary-color); }
    .WmA-opt.is-upload.is-busy { opacity: .6; pointer-events: none; }
    .WmA-opt.is-none { background: var(--body-bg); color: var(--muted-color); border-color: var(--control-bg); }
    .WmA-opt.is-none.is-selected { border-color: var(--text-color); color: var(--text-color); }
    .WmA-chevron { position: absolute; right: 16px; font-size: 11px; transition: transform .15s; }
    .WmA-chevron.is-open { transform: rotate(180deg); }

    .WmA-menu {
        position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30;
        max-height: 220px; overflow-y: auto; padding: 4px;
        border: 1px solid var(--control-bg); border-radius: 8px;
        background: var(--body-bg); box-shadow: 0 10px 28px rgba(0,0,0,.18);
    }
    .WmA-menuHead { padding: 6px 10px 4px; font-size: 11px; font-weight: 700; color: var(--muted-color); }
    .WmA-menuItem {
        display: flex; align-items: center; justify-content: space-between;
        width: 100%; padding: 9px 10px; border: 0; border-radius: 6px;
        background: none; color: var(--text-color); font-size: 13px; text-align: left; cursor: pointer;
    }
    .WmA-menuItem:hover { background: var(--control-bg); }
    .WmA-menuItem.is-selected { font-weight: 700; color: var(--primary-color); }
    .WmA-menuLabel { display: inline-flex; align-items: center; gap: 8px; }
    .WmA-swatch { width: 12px; height: 12px; flex-shrink: 0; border-radius: 3px; border: 2px solid transparent; }

    .WmA-splitRow { position: relative; display: grid; grid-template-columns: 2fr 1fr; gap: 8px; align-items: stretch; }
    .WmA-splitMain { min-width: 0; }
    .WmA-splitRow .WmA-optWrap { position: static; }
    .WmA-splitRow .WmA-opt { height: 100%; }
    .WmA-allSwitch {
        flex: 0 0 auto;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
        width: 100%; min-height: 48px; margin: 0; padding: 0;
        border: 2px solid var(--control-bg); border-radius: 8px;
        background: var(--body-bg); cursor: pointer;
        transition: border-color .15s;
    }
    .WmA-allSwitch.is-on { border-color: var(--primary-color); }
    .WmA-allLabel { font-size: 10px; font-weight: 700; letter-spacing: .3px; text-transform: uppercase; color: var(--muted-color); }
    .WmA-allSwitch.is-on .WmA-allLabel { color: var(--primary-color); }
    .WmA-toggle { position: relative; width: 32px; height: 18px; border-radius: 999px; background: var(--control-bg); transition: background .15s; }
    .WmA-toggle span { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .15s; }
    .WmA-allSwitch.is-on .WmA-toggle { background: var(--primary-color); }
    .WmA-allSwitch.is-on .WmA-toggle span { transform: translateX(14px); }
    .WmA-allSwitch:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }

    .WmA-applyAll {
        display: flex; align-items: center; gap: 8px;
        width: 100%; margin: 2px 0 0; padding: 8px 12px;
        border: 1px dashed color-mix(in srgb, var(--primary-color) 45%, transparent); border-radius: 8px;
        background: color-mix(in srgb, var(--primary-color) 6%, transparent);
        color: var(--primary-color);
        font-size: 12px; font-weight: 600; text-align: left; cursor: pointer;
        transition: background .15s;
    }
    .WmA-applyAll:hover { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
    .WmA-applyAll span:first-of-type { flex: 1; }
    .WmA-applyCount { padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; background: var(--primary-color); }
    .WmA-applyAll.is-done { border-style: solid; border-color: var(--control-bg); background: none; color: var(--muted-color); cursor: default; }
    .WmA-applyAll.is-done .WmA-applyCount { background: var(--muted-color); }

    .WmA-wmLoading {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.25); pointer-events: none;
    }
    .WmA-wmLoading span {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 8px 14px; border-radius: 999px;
        background: rgba(0,0,0,.7); color: #fff;
        font-size: 12px; font-weight: 600;
    }

    .WmA-postAs { margin-top: 12px; border: 2px solid #fde68a; border-radius: 8px; background: #fffbeb; }
    .WmA-postAs.is-on { border-color: #f59e0b; }
    .WmA-postAsHead {
        display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 0 14px;
        border: 0; background: none; color: #b45309; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left;
    }
    .WmA-postAsHead > span:nth-of-type(1) { flex: 1; }
    .WmA-postAs.is-on .WmA-toggle { background: #f59e0b; }
    .WmA-postAs.is-on .WmA-toggle span { transform: translateX(14px); }
    .WmA-postAsBody { padding: 0 12px 12px; }
    .WmA-postAsSearch { position: relative; display: flex; align-items: center; gap: 8px; padding: 0 10px; border: 1px solid #fde68a; border-radius: 8px; background: #fff; }
    .WmA-postAsSearch i { color: #b45309; }
    .WmA-postAsSearch input { flex: 1; min-width: 0; height: 38px; border: 0; outline: 0; background: transparent; font-size: 13px; color: #1f2937; }
    .WmA-postAsResults {
        position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 40;
        margin: 0; padding: 4px; list-style: none; max-height: 220px; overflow-y: auto;
        border-radius: 8px; background: var(--body-bg); box-shadow: 0 10px 28px rgba(0,0,0,.18);
    }
    .WmA-postAsResults button {
        display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px;
        border: 0; border-radius: 6px; background: none; color: var(--text-color); font-size: 13px; text-align: left; cursor: pointer;
    }
    .WmA-postAsResults button:hover { background: var(--control-bg); }
    .WmA-postAsResults small { margin-left: auto; color: var(--muted-color); }
    .WmA-postAsUser { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; background: #fff; border: 1px solid #fde68a; }
    .WmA-postAsName { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
    .WmA-postAsName strong { font-size: 13px; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .WmA-postAsName small { font-size: 11px; color: #b45309; }
    .WmA-postAsClear { margin-left: auto; width: 28px; height: 28px; border: 0; border-radius: 50%; background: #fef3c7; color: #b45309; cursor: pointer; }
    .WmA-postAsNote { margin-top: 8px; font-size: 12px; color: #b45309; }
    .WmA-admin { margin-top: 10px; }
    /* Karanl\u0131k tema: uyar\u0131 ve y\xF6netici kutular\u0131 tonunu koruyarak koyula\u015F\u0131r */
    [data-theme^=dark] .WmA-plateWarn { background: color-mix(in srgb, #ffc107 14%, var(--control-bg)); color: #f5c26b; }
    [data-theme^=dark] .WmA-postAs { background: color-mix(in srgb, #f59e0b 12%, var(--control-bg)); border-color: color-mix(in srgb, #f59e0b 45%, transparent); }
    [data-theme^=dark] .WmA-postAsHead, [data-theme^=dark] .WmA-postAsSearch i, [data-theme^=dark] .WmA-postAsName small, [data-theme^=dark] .WmA-postAsNote { color: #f5c26b; }
    [data-theme^=dark] .WmA-postAsSearch, [data-theme^=dark] .WmA-postAsUser { background: var(--body-bg); border-color: color-mix(in srgb, #f59e0b 35%, transparent); }
    [data-theme^=dark] .WmA-postAsSearch input, [data-theme^=dark] .WmA-postAsName strong { color: var(--text-color); }
    [data-theme^=dark] .WmA-postAsClear { background: color-mix(in srgb, #f59e0b 20%, var(--control-bg)); color: #f5c26b; }
    .WmA-adminBtn {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; min-height: 48px; padding: 0 14px;
        border: 2px solid #fde68a; border-radius: 8px;
        background: #fffbeb; color: #b45309;
        font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .WmA-adminBtn.is-selected { border-color: #b45309; }

    .WmA-actions { display: flex; gap: 10px; margin-top: auto; padding-top: 20px; }
    .WatermarkModal .WmA-actions .Button {
        flex: 1; height: 44px; margin: 0; padding: 0 12px;
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        border-radius: 8px; font-size: 13px; white-space: nowrap;
    }
    .WatermarkModal .WmA-addBtn { background: var(--control-bg); color: var(--control-color); cursor: pointer; }
    .WatermarkModal .WmA-uploadBtn { font-weight: 700; width: 100%; }

    /* Animasyonlar */
    .slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .slide-in-left { animation: slideInLeft 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideInLeft { from { transform: translateX(-100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
`;
  var WatermarkModal = class extends Modal {
    oninit(vnode) {
      super.oninit(vnode);
      this.injectStyles();
      this.files = this.attrs.files || [];
      this.onconfirm = this.attrs.onconfirm;
      this.selections = new Array(this.files.length).fill("none");
      this.touched = new Array(this.files.length).fill(false);
      this.autoPicked = new Array(this.files.length).fill(false);
      this.files.forEach((f) => {
        if (!f.__wmKey) f.__wmKey = "f" + Math.random().toString(36).slice(2);
      });
      this.customFileNames = this.files.map((f) => {
        const name = f.name;
        const lastDotIndex = name.lastIndexOf(".");
        return lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
      });
      this.activeIndex = 0;
      this.previewUrl = Stream_default(null);
      this.currentImageOrientation = Stream_default("landscape");
      this.currentImageDimensions = Stream_default({ w: 0, h: 0 });
      this.hoveredOption = Stream_default(null);
      this.isZoomed = Stream_default(false);
      this.slideDirection = Stream_default("fade-in");
      this.isDropdownOpen = false;
      this.applyAll = this.files.length > 1;
      this.isUploadingPersonal = false;
      this.thumbUrls = [];
      this.handleKeyDown = this.handleKeyDown.bind(this);
      document.addEventListener("keydown", this.handleKeyDown);
      this.handleDocumentClick = (e) => {
        if (this.isDropdownOpen && !e.target.closest(".Watermark-Dropdown-Container")) {
          this.isDropdownOpen = false;
          import_mithril.default.redraw();
        }
      };
      document.addEventListener("click", this.handleDocumentClick);
      this.postAsEnabled = false;
      this.postAsUser = null;
      this.targetPersonal = [];
      this.userQuery = "";
      this.userSearchResults = [];
      this.isSearching = false;
      this.searchTimeout = null;
      this.loadingOptions = true;
      this.watermarkMode = Stream_default("hybrid");
      this.watermarksList = [];
      this.watermarkMap = {};
      if (this.files.length > 0) this.loadPreview(0);
      this.loadWatermarks();
    }
    injectStyles() {
      if (!document.getElementById("watermark-modal-css")) {
        const style = document.createElement("style");
        style.id = "watermark-modal-css";
        style.innerHTML = CUSTOM_CSS;
        document.head.appendChild(style);
      }
    }
    hide() {
      if (!this.isConfirmed) {
        if (confirm("Y\xFCkleme i\u015Flemi iptal edilecektir. Onayl\u0131yor musunuz?")) {
          if (this.attrs.oncancel) this.attrs.oncancel();
          super.hide();
        }
      } else {
        super.hide();
      }
    }
    onremove(vnode) {
      if (!this.isConfirmed && this.attrs.oncancel) {
        this.attrs.oncancel();
      }
      const styleTag = document.getElementById("watermark-modal-css");
      if (styleTag) styleTag.remove();
      document.removeEventListener("keydown", this.handleKeyDown);
      document.removeEventListener("click", this.handleDocumentClick);
      super.onremove(vnode);
    }
    handleKeyDown(e) {
      if (this.files.length <= 1) return;
      if (e.target && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") {
        if (this.activeIndex < this.files.length - 1) {
          this.changeActiveImage(1);
          import_mithril.default.redraw();
        }
      } else if (e.key === "ArrowLeft") {
        if (this.activeIndex > 0) {
          this.changeActiveImage(-1);
          import_mithril.default.redraw();
        }
      }
    }
    loadPreview(index) {
      const file = this.files[index];
      if (!file) return;
      this.previewUrl(fileUrl(file));
      fileDims(file).then(({ width: w, height: h }) => {
        if (this.activeIndex !== index) return;
        let orientation = "landscape";
        if (w && h) {
          const ratioDiff = Math.abs(w - h) / Math.max(w, h);
          if (ratioDiff < 0.04 || w === h) orientation = "square";
          else if (w < h) orientation = "portrait";
        }
        this.currentImageOrientation(orientation);
        this.currentImageDimensions({ w, h });
        this.isDropdownOpen = false;
        this.normalizeSelection(index);
        import_mithril.default.redraw();
      });
      warm(this.files[index + 1]);
    }
    changeActiveImage(direction) {
      const newIndex = this.activeIndex + direction;
      if (newIndex >= 0 && newIndex < this.files.length) {
        this.slideDirection(direction > 0 ? "slide-in-right" : "slide-in-left");
        this.activeIndex = newIndex;
        this.loadPreview(newIndex);
      }
    }
    handleFileNameChange(e) {
      const el = e.target;
      const v = el.value.toLocaleUpperCase("tr-TR").replace(/\s{2,}/g, " ");
      if (el.value !== v) {
        const pos = el.selectionStart;
        el.value = v;
        try {
          el.setSelectionRange(pos, pos);
        } catch (err) {
        }
      }
      this.customFileNames[this.activeIndex] = v;
      e.redraw = false;
      clearTimeout(this._nameRedraw);
      this._nameRedraw = setTimeout(() => import_mithril.default.redraw(), 300);
    }
    addMoreFiles(e) {
      const newFiles = Array.from(e.target.files);
      if (newFiles.length === 0) return;
      newFiles.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true, sensitivity: "base" }));
      const newSelections = new Array(newFiles.length).fill(this.applyAll ? this.selections[this.activeIndex] : this.defaultSelection());
      const newCustomFileNames = newFiles.map((f) => {
        const name = f.name;
        const lastDotIndex = name.lastIndexOf(".");
        return lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
      });
      newFiles.forEach((f) => {
        f.__wmKey = "f" + Math.random().toString(36).slice(2);
      });
      this.files.push(...newFiles);
      this.selections.push(...newSelections);
      this.customFileNames.push(...newCustomFileNames);
      this.touched.push(...newFiles.map(() => this.applyAll));
      this.autoPicked.push(...newFiles.map(() => false));
      if (!this.applyAll) this.autoSelectAll();
      e.target.value = "";
      import_mithril.default.redraw();
    }
    removeActiveFile() {
      if (this.files.length === 1) {
        this.hide();
        return;
      }
      this.files.splice(this.activeIndex, 1);
      this.selections.splice(this.activeIndex, 1);
      this.customFileNames.splice(this.activeIndex, 1);
      this.touched.splice(this.activeIndex, 1);
      this.autoPicked.splice(this.activeIndex, 1);
      if (this.activeIndex >= this.files.length) {
        this.activeIndex = this.files.length - 1;
      }
      this.loadPreview(this.activeIndex);
    }
    className() {
      return "WatermarkModal Modal--large";
    }
    title() {
      return `\u0130mza Se\xE7imi (${this.activeIndex + 1} / ${this.files.length})`;
    }
    content() {
      const isAdmin = app_default.session.user && app_default.session.user.isAdmin();
      const { w, h } = this.currentImageDimensions();
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modal-body", style: { padding: 0 } }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Watermark-Layout" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Watermark-Left" }, this.renderPreviewArea()), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Watermark-Right" }, this.renderPlateField(), this.loadingOptions ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-loading" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-spinner fa-spin" }), " \u0130mzalar y\xFCkleniyor...") : this.loadFailed ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-loading WmA-loadFailed" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-exclamation-triangle" }), " \u0130mzalar y\xFCklenemedi.", " ", /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", className: "Button Button--link", onclick: () => this.loadWatermarks() }, "Tekrar dene"), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { marginTop: "6px", fontSize: "12px", opacity: 0.8 } }, "\u0130mzas\u0131z y\xFCklemeye de devam edebilirsiniz.")) : this.renderSignatureControls(), isAdmin && this.renderAdminPanel(), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-actions" }, /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          className: "Button Button--primary WmA-uploadBtn",
          type: "button",
          icon: "fas fa-upload",
          onclick: (e) => {
            e.preventDefault();
            this.confirmUpload();
          }
        },
        this.files.length,
        " Foto\u011Fraf\u0131 Y\xFCkle"
      )))));
    }
    /** Önizleme canvas'ını çizer; hazır olunca kapsayıcıya is-sharp ekleyip yükleniyor yazısını gizler */
    attachPreview(canvas) {
      const box = canvas.parentNode;
      if (box) box.classList.add("WmPreviewBox");
      const file = this.files[this.activeIndex];
      if (canvas._file !== file && box) box.classList.remove("is-sharp");
      drawPreview(canvas, file);
      const sync = () => {
        if (box && canvas.classList.contains("is-sharp") && canvas._file === file) box.classList.add("is-sharp");
      };
      sync();
      if (!canvas._obs) {
        canvas._obs = new MutationObserver(() => {
          if (box && canvas.classList.contains("is-sharp")) box.classList.add("is-sharp");
        });
        canvas._obs.observe(canvas, { attributes: true, attributeFilter: ["class"] });
      }
    }
    /** Seçili imzanın önizleme adresi ('' = imzasız) */
    watermarkUrlFor(id) {
      const wm = id && id !== "none" ? this.watermarkMap[id] : null;
      if (!wm || !wm.url) return "";
      let baseUrl = app_default.forum.attribute("baseUrl").replace(/\/$/, "");
      if (window.location.protocol === "https:" && baseUrl.startsWith("http:")) baseUrl = baseUrl.replace(/^http:/, "https:");
      return wm.url.startsWith("http") ? wm.url : baseUrl + wm.url;
    }
    // --- SOL PANEL: ÖNİZLEME ALANI ---
    renderPreviewArea() {
      const currentSelectionId = this.selections[this.activeIndex];
      let baseUrl = app_default.forum.attribute("baseUrl").replace(/\/$/, "");
      if (window.location.protocol === "https:" && baseUrl.startsWith("http:")) baseUrl = baseUrl.replace(/^http:/, "https:");
      const selectedWm = this.watermarkMap[currentSelectionId];
      let watermarkUrl = "";
      if (selectedWm && selectedWm.url) {
        watermarkUrl = selectedWm.url.startsWith("http") ? selectedWm.url : baseUrl + selectedWm.url;
      }
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Preview-Wrapper" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Watermark-preview-area" }, /* @__PURE__ */ (0, import_mithril.default)("div", { style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" } }, this.previewUrl() ? /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          key: `preview-wrapper-${this.activeIndex}`,
          style: {
            position: "relative",
            display: "inline-block",
            maxWidth: "100%",
            cursor: "zoom-in"
          },
          onclick: () => {
            this.isZoomed(true);
            import_mithril.default.redraw();
          },
          title: "Tam ekranda incelemek i\xE7in t\u0131klay\u0131n"
        },
        /* @__PURE__ */ (0, import_mithril.default)("canvas", { className: "WmPreviewCanvas", oncreate: (v) => this.attachPreview(v.dom), onupdate: (v) => this.attachPreview(v.dom) }),
        /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmPreviewLoading" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-circle-notch fa-spin" }), " Foto\u011Fraf y\xFCkleniyor\u2026"),
        currentSelectionId !== "none" && watermarkUrl && /* @__PURE__ */ (0, import_mithril.default)(
          "img",
          {
            className: this.slideDirection(),
            src: watermarkUrl,
            style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: this.wmLoadedSrc === watermarkUrl ? 1 : 0, transition: "opacity .25s" },
            onload: () => {
              this.wmLoadedSrc = watermarkUrl;
              import_mithril.default.redraw();
            },
            onerror: (e) => {
              e.target.style.display = "none";
              this.wmLoadedSrc = watermarkUrl;
              import_mithril.default.redraw();
            }
          }
        ),
        currentSelectionId !== "none" && watermarkUrl && this.wmLoadedSrc !== watermarkUrl ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-wmLoading" }, /* @__PURE__ */ (0, import_mithril.default)("span", null, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-circle-notch fa-spin" }), " ", selectedWm && selectedWm.label ? selectedWm.label : "Se\xE7ilen imza", " y\xFCkleniyor\u2026")) : null
      ) : /* @__PURE__ */ (0, import_mithril.default)("div", { style: { color: "#64748b", padding: "20px" } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-spinner fa-spin" }), " \xD6nizleme haz\u0131rlan\u0131yor...")), /* @__PURE__ */ (0, import_mithril.default)(
        "button",
        {
          className: "Button Button--icon",
          type: "button",
          title: "Bu Foto\u011Fraf\u0131 Sil",
          style: { position: "absolute", top: "10px", left: "10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", boxShadow: "0 2px 5px rgba(0,0,0,0.2)", width: "32px", height: "32px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.removeActiveFile();
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-trash" })
      ), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.65)", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" } }, this.activeIndex + 1, " / ", this.files.length), this.files.length > 1 && /* @__PURE__ */ (0, import_mithril.default)("div", { style: { position: "absolute", width: "100%", top: "50%", left: 0, transform: "translateY(-50%)", display: "flex", justifyContent: "space-between", padding: "0 8px", pointerEvents: "none" } }, /* @__PURE__ */ (0, import_mithril.default)("button", { className: "Button Button--icon Button--primary", type: "button", style: { pointerEvents: "auto", opacity: this.activeIndex === 0 ? 0.3 : 1, boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }, onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.changeActiveImage(-1);
      }, disabled: this.activeIndex === 0 }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-chevron-left" })), /* @__PURE__ */ (0, import_mithril.default)("button", { className: "Button Button--icon Button--primary", type: "button", style: { pointerEvents: "auto", opacity: this.activeIndex === this.files.length - 1 ? 0.3 : 1, boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }, onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.changeActiveImage(1);
      }, disabled: this.activeIndex === this.files.length - 1 }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-chevron-right" })))), this.renderMetaStrip(), this.files.length > 1 ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmPick-orderHint" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-arrows-alt-h" }), " Foto\u011Fraflar\u0131 s\xFCr\xFCkleyerek ya da oklarla s\u0131ralay\u0131n; mesajda bu s\u0131rayla yer al\u0131rlar.") : null, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmPick-strip" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmPick-thumbs" }, this.files.map((f, i) => {
        const sel = this.selections[i];
        const signed = sel && sel !== "none";
        if (!f.__wmKey) f.__wmKey = "f" + Math.random().toString(36).slice(2);
        return /* @__PURE__ */ (0, import_mithril.default)(
          "div",
          {
            key: f.__wmKey,
            "data-key": f.__wmKey,
            role: "button",
            tabindex: "0",
            draggable: "true",
            className: "WmPick-thumb" + (i === this.activeIndex ? " is-active" : "") + (this.dragFrom === i ? " is-dragging" : "") + (this.dragOver === i && this.dragFrom !== i ? " is-over" : ""),
            title: f.name + " \u2014 s\xFCr\xFCkleyerek s\u0131ralay\u0131n",
            ondragstart: (e) => {
              this.dragFrom = i;
              try {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(i));
              } catch (x) {
              }
            },
            ondragover: (e) => {
              e.preventDefault();
              if (this.dragOver !== i) {
                this.dragOver = i;
                import_mithril.default.redraw();
              } else e.redraw = false;
            },
            ondragleave: (e) => {
              e.redraw = false;
            },
            ondrop: (e) => {
              e.preventDefault();
              const from = this.dragFrom;
              this.dragFrom = null;
              this.dragOver = null;
              if (from != null) this.moveFile(from, i);
            },
            ondragend: () => {
              this.dragFrom = null;
              this.dragOver = null;
            },
            onclick: () => {
              if (i === this.activeIndex) return;
              this.slideDirection(i > this.activeIndex ? "slide-in-right" : "slide-in-left");
              this.activeIndex = i;
              this.loadPreview(i);
            }
          },
          /* @__PURE__ */ (0, import_mithril.default)("canvas", { className: "WmPick-thumbCanvas", oncreate: (v) => drawThumb(v.dom, f), onupdate: (v) => drawThumb(v.dom, f) }),
          /* @__PURE__ */ (0, import_mithril.default)("span", { className: "WmPick-num" }, i + 1),
          i > 0 ? /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", className: "WmPick-move is-left", title: "Sola ta\u015F\u0131", "aria-label": "Sola ta\u015F\u0131", onclick: (e) => {
            e.stopPropagation();
            this.moveFile(i, i - 1);
          } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-chevron-left" })) : null,
          i < this.files.length - 1 ? /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", className: "WmPick-move is-right", title: "Sa\u011Fa ta\u015F\u0131", "aria-label": "Sa\u011Fa ta\u015F\u0131", onclick: (e) => {
            e.stopPropagation();
            this.moveFile(i, i + 1);
          } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-chevron-right" })) : null,
          /* @__PURE__ */ (0, import_mithril.default)("span", { className: "WmPick-thumbBadge" + (signed ? " is-signed" : "") }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: signed ? "fas fa-signature" : "fas fa-ban" }))
        );
      })), /* @__PURE__ */ (0, import_mithril.default)("label", { className: "WmPick-addTile", title: "Foto\u011Fraf ekle" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-plus" }), /* @__PURE__ */ (0, import_mithril.default)("input", { type: "file", multiple: true, accept: "image/*", style: { display: "none" }, onchange: this.addMoreFiles.bind(this) }))), this.isZoomed() && /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          style: {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.85)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out"
          },
          onclick: (e) => {
            e.stopPropagation();
            this.isZoomed(false);
            import_mithril.default.redraw();
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("div", { style: { position: "relative", display: "inline-block", maxWidth: "95vw", maxHeight: "95vh" } }, /* @__PURE__ */ (0, import_mithril.default)("img", { className: this.slideDirection(), src: this.previewUrl(), style: { maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", display: "block", borderRadius: "8px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" } }), currentSelectionId !== "none" && watermarkUrl && /* @__PURE__ */ (0, import_mithril.default)("img", { className: this.slideDirection(), src: watermarkUrl, style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }, onerror: (e) => {
          e.target.style.display = "none";
        } })),
        /* @__PURE__ */ (0, import_mithril.default)("button", { style: { position: "absolute", top: "20px", right: "30px", background: "transparent", border: "none", color: "#fff", fontSize: "30px", cursor: "pointer", padding: "10px" }, onclick: (e) => {
          e.stopPropagation();
          this.isZoomed(false);
          import_mithril.default.redraw();
        } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-times" }))
      ));
    }
    // --- SOL: FOTOĞRAF BİLGİ ŞERİDİ ---
    renderMetaStrip() {
      const { w, h } = this.currentImageDimensions();
      const file = this.files[this.activeIndex];
      const parts = [];
      if (w > 0) {
        parts.push(w + " \xD7 " + h);
        parts.push(this.orientationLabel());
        parts.push((w * h / 1e6).toFixed(1).replace(".", ",") + " MP");
      }
      if (file) parts.push(file.size >= 1048576 ? (file.size / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(file.size / 1024)) + " KB");
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-meta" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: this.currentImageOrientation() === "portrait" ? "fas fa-portrait" : "fas fa-image" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, parts.length ? parts.join(" \xB7 ") : "\xD6l\xE7\xFCl\xFCyor\u2026"));
    }
    // --- SOL: DOSYA ADI / PLAKA ---
    renderPlateField() {
      const name = this.customFileNames[this.activeIndex] || "";
      const looksLikePlate = /^[0-9]{2}\s*[A-ZÇĞİÖŞÜ]{1,3}\s*[0-9]{2,4}(?:\s*[-_.]\s*\d{1,3}|\s*\(\d{1,3}\))?$/i.test(name.trim());
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-file" }, /* @__PURE__ */ (0, import_mithril.default)("p", { className: "WmA-fileHint" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-info-circle" }), " G\xF6rsel ad\u0131n\u0131 ara\xE7 plakas\u0131 olarak yaz\u0131n\u0131z (\xD6rn: 34 CDL 37)."), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modern-Input-Group" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-pen" }), /* @__PURE__ */ (0, import_mithril.default)("input", { type: "text", placeholder: "Dosya ad\u0131", value: name, oninput: this.handleFileNameChange.bind(this) })), name.trim() && !looksLikePlate ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-plateWarn" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-exclamation-triangle" }), " Dosya ad\u0131 ara\xE7 plakas\u0131na benzemiyor. Do\u011Fru k\xFCnye e\u015Fle\u015Fmesi i\xE7in plaka girmeniz tavsiye edilir.") : null);
    }
    // --- SAĞ: İMZA SEÇENEKLERİ ---
    // Kişisel imza (varsa) · fotoğrafın yönüne uygun site imzaları (varsa) · İmza Ekleme (Orijinal Kalsın)
    renderSignatureControls() {
      const mode = this.watermarkMode();
      const current = this.selections[this.activeIndex];
      const allowPersonal = mode !== "templates";
      const allowTemplates = mode !== "personal";
      const personal = allowPersonal ? this.getMatchingPersonalWatermark() : null;
      const templates = allowTemplates ? this.getFilteredSiteTemplates() : [];
      const personalId = personal ? personal.id || personal.filename : null;
      const canUpload = allowPersonal && !personal && this.allowPersonalUpload && !this.postAsUser;
      const autoNote = this.autoBusy && !this.autoPicked[this.activeIndex] && !this.touched[this.activeIndex] ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmPick-auto" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-circle-notch fa-spin" }), " Bu foto\u011Frafa en uygun imza se\xE7iliyor\u2026") : this.autoPicked[this.activeIndex] ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmPick-auto" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-magic" }), " ", personal ? "\u0130mzan\u0131z otomatik se\xE7ildi." : "Bu foto\u011Frafta en iyi g\xF6r\xFCnen imza (renk ve konum) otomatik se\xE7ildi.", " De\u011Fi\u015Ftirebilirsiniz.") : null;
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-options" }, autoNote, personal ? this.renderBigOption(personalId, "fas fa-signature", this.postAsUser ? "@" + this.postAsUser.username() + " imzas\u0131" : "Ki\u015Fisel \u0130mza", current === personalId, "is-primary") : null, canUpload ? /* @__PURE__ */ (0, import_mithril.default)("label", { className: "WmA-opt is-upload" + (this.isUploadingPersonal ? " is-busy" : "") }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: this.isUploadingPersonal ? "fas fa-spinner fa-spin" : "fas fa-signature" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "Ki\u015Fisel \u0130mza Y\xFCkle"), /* @__PURE__ */ (0, import_mithril.default)("input", { type: "file", accept: "image/png,image/webp", style: { display: "none" }, disabled: this.isUploadingPersonal, onchange: (e) => this.uploadPersonalWatermark(e) })) : null, templates.length ? this.withApplySwitch(this.renderSiteDropdown(templates, current)) : null, templates.length ? this.renderBigOption("none", "fas fa-ban", "\u0130mza Ekleme (Orijinal Kals\u0131n)", current === "none", "is-none") : this.withApplySwitch(this.renderBigOption("none", "fas fa-ban", "\u0130mza Ekleme (Orijinal Kals\u0131n)", current === "none", "is-none")));
    }
    orientationLabel() {
      const o = this.currentImageOrientation();
      return o === "portrait" ? "Dikey" : o === "square" ? "Kare" : "Yatay";
    }
    /**
     * Çoklu fotoğrafta seçeneğin yanına "Tümüne" anahtarı ekler.
     * Açıkken yapılan seçim tüm fotoğraflara, kapalıyken yalnızca etkin fotoğrafa uygulanır.
     */
    withApplySwitch(control) {
      if (this.files.length < 2) return control;
      const on = !!this.applyAll;
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-splitRow" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-splitMain" }, control), /* @__PURE__ */ (0, import_mithril.default)(
        "button",
        {
          type: "button",
          className: "WmA-allSwitch" + (on ? " is-on" : ""),
          role: "switch",
          "aria-checked": on ? "true" : "false",
          title: on ? "Se\xE7im t\xFCm foto\u011Fraflara uygulan\u0131yor" : "Se\xE7im yaln\u0131zca bu foto\u011Frafa uygulan\u0131yor",
          onclick: (e) => {
            e.preventDefault();
            this.applyAll = !on;
            if (this.applyAll) this.applyToAll(this.selections[this.activeIndex]);
            import_mithril.default.redraw();
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("span", { className: "WmA-allLabel" }, "T\xFCm\xFCne"),
        /* @__PURE__ */ (0, import_mithril.default)("span", { className: "WmA-toggle" }, /* @__PURE__ */ (0, import_mithril.default)("span", null))
      ));
    }
    renderBigOption(id, icon, label, isSelected, variant) {
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-optWrap" }, /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", className: "WmA-opt " + variant + (isSelected ? " is-selected" : ""), "aria-pressed": isSelected ? "true" : "false", onclick: () => {
        this.selectWatermark(id);
        this.isDropdownOpen = false;
      } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: icon }), /* @__PURE__ */ (0, import_mithril.default)("span", null, label)));
    }
    /** Admin'de tanımlı buton renkleri (zemin/yazı/kenarlık); boş olanlar temadan gelir */
    wmButtonStyle(wm, swatch) {
      const st = {};
      if (wm.bg_color) st.background = wm.bg_color;
      if (wm.text_color) st.color = wm.text_color;
      if (wm.border_color) st.borderColor = wm.border_color;
      if (swatch && !wm.bg_color && !wm.border_color) st.background = "var(--control-bg)";
      return st;
    }
    renderSiteDropdown(templates, current) {
      const selected = templates.find((t) => (t.id || t.filename) === current);
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Watermark-Dropdown-Container WmA-optWrap" }, /* @__PURE__ */ (0, import_mithril.default)(
        "button",
        {
          type: "button",
          className: "WmA-opt is-site" + (selected ? " is-selected" : ""),
          style: selected ? this.wmButtonStyle(selected) : void 0,
          "aria-expanded": this.isDropdownOpen ? "true" : "false",
          onclick: (e) => {
            e.preventDefault();
            this.isDropdownOpen = !this.isDropdownOpen;
            import_mithril.default.redraw();
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-stamp" }),
        /* @__PURE__ */ (0, import_mithril.default)("span", null, selected ? selected.label : "Site \u0130mzas\u0131 Se\xE7"),
        /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-chevron-down WmA-chevron" + (this.isDropdownOpen ? " is-open" : "") })
      ), this.isDropdownOpen ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-menu" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-menuHead" }, this.orientationLabel(), " foto\u011Fraf imzalar\u0131"), templates.map((wm) => {
        const id = wm.id || wm.filename;
        const on = current === id;
        return /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", className: "WmA-menuItem" + (on ? " is-selected" : ""), onclick: () => {
          this.selectWatermark(id);
          this.isDropdownOpen = false;
          import_mithril.default.redraw();
        } }, /* @__PURE__ */ (0, import_mithril.default)("span", { className: "WmA-menuLabel" }, /* @__PURE__ */ (0, import_mithril.default)("span", { className: "WmA-swatch", style: this.wmButtonStyle(wm, true) }), wm.label), on ? /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-check" }) : null);
      })) : null);
    }
    uploadPersonalWatermark(e) {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const name = (this.currentImageOrientation() === "portrait" ? "kisisel_dikey." : "kisisel_yatay.") + ext;
      const fd = new FormData();
      fd.append("watermark", new File([file], name, { type: file.type }));
      this.isUploadingPersonal = true;
      import_mithril.default.redraw();
      app_default.request({
        method: "POST",
        url: app_default.forum.attribute("apiUrl") + "/framio-media/watermarks",
        body: fd
      }).then((res) => {
        this.isUploadingPersonal = false;
        app_default.alerts.show({ type: "success" }, "Ki\u015Fisel imzan\u0131z kaydedildi.");
        return this.loadWatermarks().then(() => {
          if (res && res.filename && this.watermarkMap[res.filename]) this.selectWatermark(res.filename);
        });
      }).catch(() => {
        this.isUploadingPersonal = false;
        app_default.alerts.show({ type: "error" }, "\u0130mza y\xFCklenemedi. Yaln\u0131zca \u015Feffaf PNG veya WebP desteklenir.");
        import_mithril.default.redraw();
      });
    }
    // --- YÖNETİCİ: ÜYE ADINA PAYLAŞ ---
    // Açıkken seçilen üye; görseller ve konu/mesaj doğrudan o üye adına kaydedilir.
    // İmza seçenekleri admin'deki dağıtım moduna göre (şablon/kişisel/hibrit) üyenin
    // kişisel imzaları ve site imzalarından oluşur.
    renderAdminPanel() {
      const on = !!this.postAsEnabled;
      const user = this.postAsUser;
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-postAs" + (on ? " is-on" : "") }, /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", className: "WmA-postAsHead", role: "switch", "aria-checked": on ? "true" : "false", onclick: () => this.togglePostAs() }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-user-secret" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "\xDCye ad\u0131na payla\u015F"), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "WmA-toggle" }, /* @__PURE__ */ (0, import_mithril.default)("span", null))), on ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-postAsBody" }, user ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-postAsUser" }, /* @__PURE__ */ (0, import_mithril.default)(Avatar, { user, className: "Avatar--small" }), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-postAsName" }, /* @__PURE__ */ (0, import_mithril.default)("strong", null, user.displayName()), /* @__PURE__ */ (0, import_mithril.default)("small", null, "@", user.username(), " ad\u0131na payla\u015F\u0131lacak")), /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", className: "WmA-postAsClear", title: "\xDCyeyi de\u011Fi\u015Ftir", onclick: () => this.setPostAsUser(null) }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-times" }))) : /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-postAsSearch" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: this.isSearching ? "fas fa-spinner fa-spin" : "fas fa-search" }), /* @__PURE__ */ (0, import_mithril.default)("input", { type: "text", placeholder: "\xDCye ara (en az 2 harf)\u2026", value: this.userQuery || "", oninput: this.handleSearchInput.bind(this) }), this.userSearchResults.length ? /* @__PURE__ */ (0, import_mithril.default)("ul", { className: "WmA-postAsResults" }, this.userSearchResults.map((u) => /* @__PURE__ */ (0, import_mithril.default)("li", null, /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", onclick: () => this.setPostAsUser(u) }, /* @__PURE__ */ (0, import_mithril.default)(Avatar, { user: u, className: "Avatar--small" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, u.displayName()), /* @__PURE__ */ (0, import_mithril.default)("small", null, "@", u.username()))))) : null), this.loadingTargetWm ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-postAsNote" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-spinner fa-spin" }), " \xDCyenin imzalar\u0131 y\xFCkleniyor\u2026") : null) : null);
    }
    togglePostAs() {
      this.postAsEnabled = !this.postAsEnabled;
      if (!this.postAsEnabled) this.setPostAsUser(null);
      import_mithril.default.redraw();
    }
    /** Hedef üyeyi ayarlar ve (varsa) kişisel imzalarını getirir */
    setPostAsUser(user) {
      this.postAsUser = user;
      this.targetPersonal = [];
      this.userQuery = "";
      this.userSearchResults = [];
      this.selections = this.selections.map((sel) => {
        const wm = this.watermarkMap[sel];
        return wm && wm.is_personal ? "none" : sel;
      });
      if (user && this.watermarkMode() !== "templates") {
        this.loadingTargetWm = true;
        app_default.request({
          method: "GET",
          url: app_default.forum.attribute("apiUrl") + "/framio-media/watermarks",
          params: { for_user: user.username() }
        }).then((res) => {
          this.targetPersonal = (res.user || []).map((wm) => Object.assign({}, wm, { is_personal: true }));
          this.targetPersonal.forEach((wm) => {
            this.watermarkMap[wm.id || wm.filename] = wm;
          });
          this.loadingTargetWm = false;
          import_mithril.default.redraw();
        }).catch(() => {
          this.loadingTargetWm = false;
          import_mithril.default.redraw();
        });
      }
      import_mithril.default.redraw();
    }
    /**
     * Seçili imza bu fotoğrafın yönüne uymuyorsa düzelt: kişisel imza yöne uygun
     * kişisel imzaya çevrilir; başka yönün site imzası seçiliyse imzasıza döner.
     */
    normalizeSelection(index) {
      if (index !== this.activeIndex || this.loadingOptions) return;
      const sel = this.selections[index];
      if (!sel || sel === "none" || sel === "admin_override") return;
      const wm = this.watermarkMap[sel];
      if (!wm) {
        this.selections[index] = "none";
        return;
      }
      if (wm.is_personal) {
        const p = this.getMatchingPersonalWatermark();
        if (p) this.selections[index] = p.id || p.filename;
        return;
      }
      const ok = this.getFilteredSiteTemplates().some((t) => (t.id || t.filename) === sel);
      if (!ok) this.selections[index] = "none";
    }
    // --- YÖN BAZLI SİTE ŞABLONLARI FİLTRESİ ---
    getFilteredSiteTemplates() {
      const orientation = this.currentImageOrientation();
      const siteTemplates = this.watermarksList.filter((wm) => !wm.is_personal);
      return siteTemplates.filter((wm) => {
        const o = (wm.orientation || wm.type || "landscape").toLowerCase();
        return o === "all" || o === orientation;
      });
    }
    // --- KULLANICININ YÖNE UYGUN KİŞİSEL İMZASINI BULMA ---
    getMatchingPersonalWatermark() {
      const orientation = this.currentImageOrientation();
      const personalList = this.postAsUser ? this.targetPersonal || [] : this.watermarksList.filter((wm) => wm.is_personal);
      if (personalList.length === 0) return null;
      const matched = personalList.find((wm) => {
        const o = (wm.orientation || wm.type || "").toLowerCase();
        const fn = (wm.filename || "").toLowerCase();
        if (orientation === "portrait") {
          return o === "portrait" || fn.includes("dikey");
        }
        return o === "landscape" || !fn.includes("dikey");
      });
      return matched || personalList[0];
    }
    loadWatermarks() {
      this.loadingOptions = true;
      this.loadFailed = false;
      const attempt = this.loadAttempt = (this.loadAttempt || 0) + 1;
      clearTimeout(this.loadTimer);
      this.loadTimer = setTimeout(() => {
        if (this.loadingOptions && attempt === this.loadAttempt) {
          this.loadingOptions = false;
          this.loadFailed = true;
          import_mithril.default.redraw();
        }
      }, 12e3);
      return app_default.request({
        method: "GET",
        url: app_default.forum.attribute("apiUrl") + "/framio-media/watermarks",
        errorHandler: () => {
        }
      }).then((response) => {
        if (attempt !== this.loadAttempt) return;
        clearTimeout(this.loadTimer);
        response = response || {};
        this.loadFailed = false;
        this.watermarkMode(response.mode || "hybrid");
        this.allowPersonalUpload = response.allow_personal_upload !== false;
        const list = response.watermarks || [];
        this.watermarksList = list;
        this.watermarkMap = {};
        list.forEach((wm) => {
          const id = wm.id || wm.filename || wm.name;
          this.watermarkMap[id] = wm;
        });
        this.loadingOptions = false;
        if (!this.restoredLast) {
          this.restoredLast = true;
          const last = this.defaultSelection();
          if (last !== "none") this.selections = this.selections.map((sel) => sel === "none" ? last : sel);
        }
        this.normalizeSelection(this.activeIndex);
        this.autoSelectAll();
        import_mithril.default.redraw();
      }).catch((err) => {
        console.error(err);
        if (attempt !== this.loadAttempt) return;
        clearTimeout(this.loadTimer);
        this.loadingOptions = false;
        this.loadFailed = true;
        import_mithril.default.redraw();
      });
    }
    handleSearchInput(e) {
      const q = e.target.value;
      this.userQuery = q;
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      if (q.trim().length < 2) {
        this.userSearchResults = [];
        import_mithril.default.redraw();
        return;
      }
      this.searchTimeout = setTimeout(() => {
        this.isSearching = true;
        import_mithril.default.redraw();
        app_default.store.find("users", { filter: { q: q.trim() }, page: { limit: 6 } }).then((u) => {
          this.userSearchResults = u;
          this.isSearching = false;
          import_mithril.default.redraw();
        }).catch(() => {
          this.isSearching = false;
          import_mithril.default.redraw();
        });
      }, 300);
    }
    selectWatermark(id) {
      if (this.applyAll) {
        this.selections.fill(id);
        this.touched.fill(true);
        this.autoPicked.fill(false);
      } else {
        this.selections[this.activeIndex] = id;
        this.touched[this.activeIndex] = true;
        this.autoPicked[this.activeIndex] = false;
      }
      this.syncApplyAll();
      import_mithril.default.redraw();
    }
    /** Tüm fotoğraflarda aynı imza varsa "Tümüne" anahtarı açık görünür */
    syncApplyAll() {
      if (this.files.length < 2) return;
      const first = this.selections[0];
      if (first && this.selections.every((s) => s === first)) this.applyAll = true;
    }
    /** Dosyanın yönü (yatay / dikey / kare) */
    async orientationOf(file) {
      const { width: w, height: h } = await fileDims(file);
      if (!w || !h) return "landscape";
      const ratioDiff = Math.abs(w - h) / Math.max(w, h);
      if (ratioDiff < 0.04 || w === h) return "square";
      return w < h ? "portrait" : "landscape";
    }
    /**
     * Otomatik imza:
     *  - Kişisel imzası olan kullanıcı (Ulaşım Arşiv mantığı): fotoğrafın yönüne uygun kişisel imza seçili gelir.
     *  - Site şablonları (Spotters: renk × konum): her fotoğraf için imzanın düşeceği alanda en okunaklı olan seçilir.
     * Kullanıcının elle seçtiği fotoğraflara dokunulmaz.
     */
    async autoSelectAll() {
      const mode = this.watermarkMode();
      const personalAll = mode !== "templates" ? this.postAsUser ? this.targetPersonal || [] : this.watermarksList.filter((w) => w.is_personal) : [];
      const templatesAll = mode !== "personal" ? this.watermarksList.filter((w) => !w.is_personal) : [];
      if (!personalAll.length && !templatesAll.length) return;
      this.autoBusy = true;
      import_mithril.default.redraw();
      await Promise.all(this.files.map(async (file, i) => {
        if (this.touched[i] || this.selections[i] && this.selections[i] !== "none") return;
        try {
          const o = await this.orientationOf(file);
          let pick = null;
          if (personalAll.length) {
            pick = personalAll.find((w) => {
              const wo = (w.orientation || w.type || "").toLowerCase();
              const fn = (w.filename || "").toLowerCase();
              return o === "portrait" ? wo === "portrait" || fn.includes("dikey") : wo === "landscape" || !fn.includes("dikey");
            }) || personalAll[0];
          } else {
            const cands = templatesAll.filter((w) => {
              const wo = (w.orientation || w.type || "landscape").toLowerCase();
              return wo === "all" || wo === o;
            });
            const scores = await Promise.all(cands.map((w) => {
              const url = this.watermarkUrlFor(w.id || w.filename);
              return url ? legibility(file, url).catch(() => -1) : -1;
            }));
            let best = -1;
            scores.forEach((s, k) => {
              if (s > best) {
                best = s;
                pick = cands[k];
              }
            });
          }
          if (pick && !this.touched[i] && this.files[i] === file) {
            this.selections[i] = pick.id || pick.filename;
            this.autoPicked[i] = true;
            import_mithril.default.redraw();
          }
        } catch (e) {
        }
      }));
      this.autoBusy = false;
      if (this.files.length > 1) {
        const first = this.selections[0];
        this.applyAll = !!first && this.selections.every((x) => x === first);
      }
      import_mithril.default.redraw();
    }
    /** Sıralama: fotoğrafı ve ona bağlı imza, ad, durum bilgilerini birlikte taşır (animasyonlu) */
    moveFile(from, to) {
      if (from === to || to < 0 || to >= this.files.length) return;
      const strip = document.querySelector(".WatermarkModal .WmPick-thumbs");
      const before = {};
      if (strip) strip.querySelectorAll("[data-key]").forEach((el) => before[el.dataset.key] = el.getBoundingClientRect().left);
      const activeFile = this.files[this.activeIndex];
      [this.files, this.selections, this.customFileNames, this.touched, this.autoPicked].forEach((arr) => {
        const [x] = arr.splice(from, 1);
        arr.splice(to, 0, x);
      });
      this.activeIndex = Math.max(0, this.files.indexOf(activeFile));
      import_mithril.default.redraw.sync();
      if (strip) {
        strip.querySelectorAll("[data-key]").forEach((el) => {
          const dx = (before[el.dataset.key] || 0) - el.getBoundingClientRect().left;
          if (!dx) return;
          el.style.transition = "none";
          el.style.transform = `translateX(${dx}px)`;
          requestAnimationFrame(() => {
            el.style.transition = "";
            el.style.transform = "";
          });
        });
      }
    }
    /** Son seçilen imza (bu tarayıcıda hatırlanır); artık yoksa imzasız */
    defaultSelection() {
      return "none";
    }
    applyToAll(id) {
      this.selections.fill(id);
      import_mithril.default.redraw();
    }
    confirmUpload() {
      this.isConfirmed = true;
      if (this.onconfirm) this.onconfirm({
        // Bu pencerede sıralanan / eklenen fotoğraflar yükleme sırasını belirler
        files: this.files,
        selections: this.selections,
        // Künye önizlemesi imzayı aynı adresten gösterir (imza listesindeki gerçek adres)
        watermarkUrls: this.selections.map((id) => this.watermarkUrlFor(id)),
        customFileNames: this.customFileNames,
        targetUsername: this.postAsUser ? this.postAsUser.username() : "",
        postAs: this.postAsUser ? { id: this.postAsUser.id(), username: this.postAsUser.username(), displayName: this.postAsUser.displayName() } : null
      });
      app_default.modal.close();
    }
  };

  // vendor/upload-exif/forum/components/AttributeModal.js
  init_globals();

  // vendor/upload-exif/forum/components/CustomizePostModal.js
  init_globals();
  var CustomizePostModal = class extends Modal {
    oninit(vnode) {
      super.oninit(vnode);
      this.activeTab = "music";
      this.selectedMusic = this.attrs.music ? { ...this.attrs.music } : null;
      this.selectedGps = this.attrs.gps ? { ...this.attrs.gps } : null;
      this.audioDuration = 30;
      this.startOffset = this.selectedMusic && this.selectedMusic.start_offset ? Number(this.selectedMusic.start_offset) : 0;
      this.clipDuration = this.selectedMusic && this.selectedMusic.clip_duration ? Number(this.selectedMusic.clip_duration) : 15;
      this.searchQuery = "";
      this.searchResults = [];
      this.isSearching = false;
      this.searchTimeout = null;
      this.previewAudio = null;
      this.playingTrackId = null;
      this.previewCurrentTime = 0;
      this.previewTimer = null;
      this.mapInstance = null;
      this.mapMarker = null;
      this.mapSearchQuery = "";
      this.isGeocoding = false;
      this.mapElement = null;
      this.currentLat = this.selectedGps ? Number(this.selectedGps.lat) : this.attrs.initialGps?.lat ? Number(this.attrs.initialGps.lat) : 39.9208;
      this.currentLon = this.selectedGps ? Number(this.selectedGps.lon) : this.attrs.initialGps?.lon ? Number(this.attrs.initialGps.lon) : 32.8541;
      this.hasPinnedLocation = Boolean(this.selectedGps || this.attrs.initialGps && this.attrs.initialGps.lat);
      this.loadDefaultMusic();
    }
    className() {
      return "CustomizePostModal Modal--medium";
    }
    title() {
      return /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CustomizePostModal-titleWrapper" }, this.attrs.onback && /* @__PURE__ */ (0, import_mithril.default)(
        "button",
        {
          type: "button",
          className: "Button Button--icon Button--link CustomizePostModal-backBtn",
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleBack();
          },
          title: "K\xFCnye Ekran\u0131na Geri D\xF6n"
        },
        /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-arrow-left" })
      ), /* @__PURE__ */ (0, import_mithril.default)("span", null, "G\xF6nderiyi \xD6zelle\u015Ftir (M\xFCzik & Konum)"));
    }
    handleBack() {
      this.stopPreview();
      if (this.attrs.onback) {
        this.attrs.onback();
      } else {
        app_default.modal.close();
      }
    }
    hide() {
      this.stopPreview();
      if (this.attrs.onback) {
        this.attrs.onback();
      } else {
        app_default.modal.close();
      }
    }
    loadDefaultMusic() {
      this.isSearching = true;
      app_default.request({
        method: "GET",
        url: app_default.forum.attribute("apiUrl") + "/framio-media/music/search",
        params: { q: "T\xFCrkiye En \xC7ok Dinlenenler" }
      }).then((res) => {
        this.searchResults = res.data || [];
      }).catch(() => {
        this.searchResults = [];
      }).finally(() => {
        this.isSearching = false;
        import_mithril.default.redraw();
      });
    }
    onMusicSearchInput(val) {
      this.searchQuery = val;
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      if (!val || val.trim().length < 2) {
        this.loadDefaultMusic();
        return;
      }
      this.isSearching = true;
      this.searchTimeout = setTimeout(() => {
        app_default.request({
          method: "GET",
          url: app_default.forum.attribute("apiUrl") + "/framio-media/music/search",
          params: { q: val.trim() }
        }).then((res) => {
          this.searchResults = res.data || [];
        }).catch(() => {
          this.searchResults = [];
        }).finally(() => {
          this.isSearching = false;
          import_mithril.default.redraw();
        });
      }, 350);
    }
    togglePreview(track, e, playFromOffset = false) {
      if (e) e.stopPropagation();
      if (this.playingTrackId === track.id && !playFromOffset) {
        this.stopPreview();
        return;
      }
      this.stopPreview();
      if (!track.preview_url) return;
      this.previewAudio = new Audio(track.preview_url);
      this.playingTrackId = track.id;
      this.previewAudio.volume = 0.85;
      const start = playFromOffset ? this.startOffset : 0;
      const duration = playFromOffset ? this.clipDuration : 30;
      this.previewAudio.addEventListener("loadedmetadata", () => {
        if (this.previewAudio.duration && !isNaN(this.previewAudio.duration)) {
          this.audioDuration = Math.floor(this.previewAudio.duration);
          import_mithril.default.redraw();
        }
      });
      this.previewAudio.currentTime = start;
      this.previewCurrentTime = start;
      this.previewAudio.ontimeupdate = () => {
        if (!this.previewAudio) return;
        this.previewCurrentTime = this.previewAudio.currentTime;
        if (playFromOffset && this.previewAudio.currentTime >= start + duration) {
          this.previewAudio.currentTime = start;
        }
        import_mithril.default.redraw();
      };
      this.previewAudio.onended = () => {
        this.stopPreview();
      };
      this.previewAudio.onerror = () => {
        this.stopPreview();
      };
      this.previewAudio.play().catch(() => {
        this.stopPreview();
      });
      import_mithril.default.redraw();
    }
    stopPreview() {
      if (this.previewAudio) {
        try {
          this.previewAudio.pause();
          this.previewAudio.currentTime = 0;
        } catch (err) {
        }
        this.previewAudio = null;
      }
      this.playingTrackId = null;
      this.previewCurrentTime = 0;
      import_mithril.default.redraw();
    }
    selectMusic(track) {
      this.selectedMusic = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        preview_url: track.preview_url,
        cover_url: track.cover_url,
        start_offset: 0,
        clip_duration: 15
      };
      this.startOffset = 0;
      this.clipDuration = 15;
      this.audioDuration = 30;
      this.togglePreview(this.selectedMusic, null, true);
      import_mithril.default.redraw();
    }
    removeMusic() {
      this.selectedMusic = null;
      this.startOffset = 0;
      this.stopPreview();
      import_mithril.default.redraw();
    }
    updateStartOffset(val) {
      this.startOffset = Number(val);
      if (this.selectedMusic) {
        this.selectedMusic.start_offset = this.startOffset;
      }
      if (this.previewAudio && this.playingTrackId === this.selectedMusic.id) {
        this.previewAudio.currentTime = this.startOffset;
      } else if (this.selectedMusic) {
        this.togglePreview(this.selectedMusic, null, true);
      }
      import_mithril.default.redraw();
    }
    updateClipDuration(val) {
      this.clipDuration = Number(val);
      if (this.selectedMusic) {
        this.selectedMusic.clip_duration = this.clipDuration;
      }
      import_mithril.default.redraw();
    }
    // --- HARİTA YÖNETİMİ ---
    initLeafletMap(element) {
      if (!element) return;
      this.mapElement = element;
      if (!window.L) {
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }
        if (!document.getElementById("leaflet-js")) {
          const script = document.createElement("script");
          script.id = "leaflet-js";
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => {
            this.setupLeafletIcons();
            this.mountMap(element);
          };
          document.head.appendChild(script);
        } else {
          const checkL = setInterval(() => {
            if (window.L) {
              clearInterval(checkL);
              this.setupLeafletIcons();
              this.mountMap(element);
            }
          }, 100);
        }
      } else {
        this.setupLeafletIcons();
        this.mountMap(element);
      }
    }
    setupLeafletIcons() {
      if (!window.L || window.L.__iconsSetupDone) return;
      delete window.L.Icon.Default.prototype._getIconUrl;
      window.L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
      });
      window.L.__iconsSetupDone = true;
    }
    mountMap(element) {
      if (!element || !window.L) return;
      if (this.mapInstance) {
        try {
          this.mapInstance.remove();
        } catch (err) {
        }
        this.mapInstance = null;
      }
      const zoomLevel = this.hasPinnedLocation ? 14 : 6;
      this.mapInstance = window.L.map(element).setView([this.currentLat, this.currentLon], zoomLevel);
      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(this.mapInstance);
      if (this.hasPinnedLocation) {
        this.mapMarker = window.L.marker([this.currentLat, this.currentLon], { draggable: true }).addTo(this.mapInstance);
        this.mapMarker.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          this.setCoordinates(pos.lat, pos.lng);
        });
      }
      this.mapInstance.on("click", (e) => {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        this.setCoordinates(lat, lon);
        if (this.mapMarker) {
          this.mapMarker.setLatLng([lat, lon]);
        } else {
          this.mapMarker = window.L.marker([lat, lon], { draggable: true }).addTo(this.mapInstance);
          this.mapMarker.on("dragend", (dragEvent) => {
            const pos = dragEvent.target.getLatLng();
            this.setCoordinates(pos.lat, pos.lng);
          });
        }
      });
      setTimeout(() => {
        if (this.mapInstance) this.mapInstance.invalidateSize();
      }, 250);
    }
    setCoordinates(lat, lon) {
      this.currentLat = Number(lat.toFixed(6));
      this.currentLon = Number(lon.toFixed(6));
      this.selectedGps = { lat: this.currentLat, lon: this.currentLon };
      this.hasPinnedLocation = true;
      import_mithril.default.redraw();
    }
    searchLocationOnMap(e) {
      if (e) e.preventDefault();
      if (!this.mapSearchQuery || this.mapSearchQuery.trim().length < 2) return;
      this.isGeocoding = true;
      import_mithril.default.redraw();
      const q = encodeURIComponent(this.mapSearchQuery.trim());
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=tr&limit=1`).then((res) => res.json()).then((data) => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          this.setCoordinates(lat, lon);
          if (this.mapInstance) {
            this.mapInstance.setView([lat, lon], 14);
            if (this.mapMarker) {
              this.mapMarker.setLatLng([lat, lon]);
            } else if (window.L) {
              this.mapMarker = window.L.marker([lat, lon], { draggable: true }).addTo(this.mapInstance);
              this.mapMarker.on("dragend", (dragEvent) => {
                const pos = dragEvent.target.getLatLng();
                this.setCoordinates(pos.lat, pos.lng);
              });
            }
          }
        } else {
          app_default.alerts.show({ type: "error" }, "Konum bulunamad\u0131. L\xFCtfen haritadan elle t\u0131klayarak pinleyin.");
        }
      }).catch(() => {
        app_default.alerts.show({ type: "error" }, "Konum arama servisine eri\u015Filemedi.");
      }).finally(() => {
        this.isGeocoding = false;
        import_mithril.default.redraw();
      });
    }
    removeGps() {
      this.selectedGps = null;
      this.hasPinnedLocation = false;
      if (this.mapMarker && this.mapInstance) {
        this.mapInstance.removeLayer(this.mapMarker);
        this.mapMarker = null;
      }
      import_mithril.default.redraw();
    }
    confirmSettings() {
      this.stopPreview();
      if (this.selectedMusic) {
        this.selectedMusic.start_offset = this.startOffset;
        this.selectedMusic.clip_duration = this.clipDuration;
      }
      if (this.attrs.onconfirm) {
        this.attrs.onconfirm({
          music: this.selectedMusic,
          gps: this.selectedGps
        });
      }
      if (!this.attrs.onback) {
        app_default.modal.close();
      }
    }
    onremove(vnode) {
      this.stopPreview();
      if (this.mapInstance) {
        try {
          this.mapInstance.remove();
        } catch (e) {
        }
        this.mapInstance = null;
      }
      super.onremove(vnode);
    }
    content() {
      const maxOffset = Math.max(0, this.audioDuration - this.clipDuration);
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CustomizePostModal-body" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CustomizePostModal-tabs" }, /* @__PURE__ */ (0, import_mithril.default)(
        "button",
        {
          type: "button",
          className: `CustomizeTab-btn ${this.activeTab === "music" ? "active" : ""}`,
          onclick: () => {
            this.activeTab = "music";
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-music" }),
        " G\xF6nderi M\xFCzi\u011Fi",
        this.selectedMusic && /* @__PURE__ */ (0, import_mithril.default)("span", { className: "tab-badge" }, "1")
      ), /* @__PURE__ */ (0, import_mithril.default)(
        "button",
        {
          type: "button",
          className: `CustomizeTab-btn ${this.activeTab === "location" ? "active" : ""}`,
          onclick: () => {
            this.activeTab = "location";
            setTimeout(() => {
              if (this.mapInstance) {
                this.mapInstance.invalidateSize();
              } else if (this.mapElement) {
                this.initLeafletMap(this.mapElement);
              }
            }, 150);
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-map-marker-alt" }),
        " \xC7ekim Konumu",
        this.selectedGps && /* @__PURE__ */ (0, import_mithril.default)("span", { className: "tab-badge" }, "1")
      )), /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          className: "CustomizeTab-content",
          style: { display: this.activeTab === "music" ? "block" : "none" }
        },
        this.selectedMusic ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Customize-selected-music-wrapper" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Customize-selected-music" }, /* @__PURE__ */ (0, import_mithril.default)("img", { src: this.selectedMusic.cover_url, alt: "", className: "c-music-cover" }), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "c-music-info" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "c-music-title" }, this.selectedMusic.title), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "c-music-artist" }, this.selectedMusic.artist)), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "c-music-actions" }, /* @__PURE__ */ (0, import_mithril.default)(
          "button",
          {
            type: "button",
            className: "c-music-playbtn",
            onclick: (e) => this.togglePreview(this.selectedMusic, e, true),
            title: "Kesiti Dinle"
          },
          /* @__PURE__ */ (0, import_mithril.default)("i", { className: this.playingTrackId === this.selectedMusic.id ? "fas fa-pause" : "fas fa-play" })
        ), /* @__PURE__ */ (0, import_mithril.default)(
          "button",
          {
            type: "button",
            className: "c-music-removebtn",
            onclick: this.removeMusic.bind(this),
            title: "M\xFCzi\u011Fi Kald\u0131r"
          },
          /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-times" }),
          " Kald\u0131r"
        ))), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Customize-audio-trimmer" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "trimmer-header" }, /* @__PURE__ */ (0, import_mithril.default)("span", { className: "trimmer-title" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-sliders-h" }), " \u015Eark\u0131 Ba\u015Flang\u0131\xE7 ve S\xFCre Ayar\u0131 (Instagram Tarz\u0131)"), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "trimmer-values" }, this.startOffset, " sn - ", this.startOffset + this.clipDuration, " sn (", this.clipDuration, " sn)")), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "trimmer-visual-track" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "trimmer-wave-bars" }, [40, 65, 85, 55, 95, 75, 45, 80, 100, 70, 50, 90, 85, 60, 75, 95, 65, 50, 80, 100, 70, 90, 60, 45].map((h, i) => /* @__PURE__ */ (0, import_mithril.default)(
          "span",
          {
            key: i,
            className: "trim-bar",
            style: {
              height: `${h}%`,
              opacity: i / 24 >= this.startOffset / (this.audioDuration || 30) && i / 24 <= (this.startOffset + this.clipDuration) / (this.audioDuration || 30) ? 1 : 0.35
            }
          }
        ))), /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "range",
            className: "trimmer-range",
            min: "0",
            max: maxOffset,
            step: "1",
            value: this.startOffset,
            oninput: (e) => this.updateStartOffset(e.target.value)
          }
        )), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "trimmer-options" }, /* @__PURE__ */ (0, import_mithril.default)("label", { className: "trimmer-duration-label" }, /* @__PURE__ */ (0, import_mithril.default)("span", null, "S\xFCre:"), /* @__PURE__ */ (0, import_mithril.default)(
          "select",
          {
            className: "trimmer-select",
            value: this.clipDuration,
            onchange: (e) => this.updateClipDuration(e.target.value)
          },
          /* @__PURE__ */ (0, import_mithril.default)("option", { value: "5" }, "5 Saniye"),
          /* @__PURE__ */ (0, import_mithril.default)("option", { value: "10" }, "10 Saniye"),
          /* @__PURE__ */ (0, import_mithril.default)("option", { value: "15" }, "15 Saniye (Varsay\u0131lan)"),
          /* @__PURE__ */ (0, import_mithril.default)("option", { value: "20" }, "20 Saniye"),
          /* @__PURE__ */ (0, import_mithril.default)("option", { value: "30" }, "30 Saniye (Tam \xD6nizleme)")
        )), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "trimmer-hint" }, "Kayd\u0131r\u0131c\u0131y\u0131 hareket ettirerek \u015Fark\u0131n\u0131n ba\u015Flamas\u0131n\u0131 istedi\u011Finiz yeri se\xE7in.")))) : null,
        /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Customize-search-box" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-search search-icon" }), /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "text",
            className: "FormControl Customize-input",
            placeholder: "Instagram gibi: \u015Eark\u0131 veya sanat\xE7\u0131 ad\u0131 yaz\u0131n...",
            value: this.searchQuery,
            oninput: (e) => this.onMusicSearchInput(e.target.value)
          }
        ), this.isSearching && /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-spinner fa-spin search-spinner" })),
        /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Customize-music-list" }, this.searchResults.length === 0 && !this.isSearching ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Customize-empty-hint" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-music" }), /* @__PURE__ */ (0, import_mithril.default)("p", null, "\u015Eark\u0131 veya sanat\xE7\u0131 ad\u0131 arayarak diledi\u011Finiz m\xFCzi\u011Fi ekleyin.")) : this.searchResults.map((track) => {
          const isPlaying = this.playingTrackId === track.id;
          const isSelected = this.selectedMusic && this.selectedMusic.id === track.id;
          return /* @__PURE__ */ (0, import_mithril.default)(
            "div",
            {
              className: `Customize-music-item ${isSelected ? "selected" : ""}`,
              onclick: () => this.selectMusic(track)
            },
            /* @__PURE__ */ (0, import_mithril.default)("div", { className: "c-track-cover-wrap" }, /* @__PURE__ */ (0, import_mithril.default)("img", { src: track.cover_url, alt: "", className: "c-track-cover" }), /* @__PURE__ */ (0, import_mithril.default)(
              "button",
              {
                type: "button",
                className: "c-track-hover-play",
                onclick: (e) => this.togglePreview(track, e)
              },
              /* @__PURE__ */ (0, import_mithril.default)("i", { className: isPlaying ? "fas fa-pause" : "fas fa-play" })
            )),
            /* @__PURE__ */ (0, import_mithril.default)("div", { className: "c-track-details" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "c-track-title" }, track.title), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "c-track-artist" }, track.artist)),
            /* @__PURE__ */ (0, import_mithril.default)("div", { className: "c-track-right" }, isSelected ? /* @__PURE__ */ (0, import_mithril.default)("span", { className: "c-track-selected-tag" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-check" }), " Se\xE7ildi") : /* @__PURE__ */ (0, import_mithril.default)(
              "button",
              {
                type: "button",
                className: "Button Button--link c-track-select-btn",
                onclick: (e) => {
                  e.stopPropagation();
                  this.selectMusic(track);
                }
              },
              "Se\xE7"
            ))
          );
        }))
      ), /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          className: "CustomizeTab-content",
          style: { display: this.activeTab === "location" ? "block" : "none" }
        },
        /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Customize-map-instructions" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-info-circle" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "Foto\u011Fraf\u0131n \xE7ekildi\u011Fi yeri haritada aray\u0131n veya do\u011Frudan haritaya t\u0131klayarak pini b\u0131rak\u0131n.", this.hasPinnedLocation && /* @__PURE__ */ (0, import_mithril.default)("strong", { style: { marginLeft: "5px", color: "#27ae60" } }, "(Konum: ", this.currentLat, ", ", this.currentLon, ")")), this.hasPinnedLocation && /* @__PURE__ */ (0, import_mithril.default)(
          "button",
          {
            type: "button",
            className: "Button Button--link",
            style: { marginLeft: "auto", color: "#e74c3c" },
            onclick: this.removeGps.bind(this)
          },
          /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-trash" }),
          " Konumu Kald\u0131r"
        )),
        /* @__PURE__ */ (0, import_mithril.default)("form", { className: "Customize-map-search", onsubmit: this.searchLocationOnMap.bind(this) }, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "text",
            className: "FormControl Customize-input",
            placeholder: "\u015Eehir, il\xE7e, otogar veya cadde ad\u0131 aray\u0131n...",
            value: this.mapSearchQuery,
            oninput: (e) => this.mapSearchQuery = e.target.value
          }
        ), /* @__PURE__ */ (0, import_mithril.default)(
          Button,
          {
            type: "submit",
            className: "Button Button--primary",
            loading: this.isGeocoding,
            disabled: !this.mapSearchQuery
          },
          "Haritada Bul"
        )),
        /* @__PURE__ */ (0, import_mithril.default)(
          "div",
          {
            className: "Customize-map-container",
            oncreate: (vnode) => this.initLeafletMap(vnode.dom)
          }
        )
      ), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CustomizePostModal-footer" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "footer-summary" }, this.selectedMusic && /* @__PURE__ */ (0, import_mithril.default)("span", { className: "summary-tag music" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-music" }), " ", this.selectedMusic.title, " (", this.startOffset, "s-", this.startOffset + this.clipDuration, "s)"), this.selectedGps && /* @__PURE__ */ (0, import_mithril.default)("span", { className: "summary-tag gps" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-map-marker-alt" }), " Konum Belirlendi")), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "footer-buttons" }, /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          className: "Button",
          onclick: () => this.handleBack()
        },
        "Vazge\xE7"
      ), /* @__PURE__ */ (0, import_mithril.default)(Button, { className: "Button Button--primary", onclick: this.confirmSettings.bind(this) }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-check", style: { marginRight: "6px" } }), " Tamamla ve Kaydet"))));
    }
  };

  // vendor/upload-exif/forum/components/AttributeModal.js
  var BTN = { height: "44px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", margin: 0, lineHeight: 1 };
  var CUSTOM_CSS2 = `
    .AttributeModal, .AttributeModal .Modal-dialog, .AttributeModal .Modal-content {
        transform: none !important;
        filter: none !important;
        will-change: auto !important;
    }
    .AttributeModal .Modal-content { border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; }
    .AttributeModal .Modal-header { padding: 16px 24px; border-bottom: 1px solid #f0f0f0; background: #fff; }
    .AttributeModal .Modal-title { font-size: 1.25em; font-weight: 700; color: #333; }
    
    .Attribute-Layout {
        display: flex;
        flex-direction: column;
        padding: 0 24px 24px 24px;
        gap: 30px;
        background: #fdfdfd;
    }
    @media (min-width: 900px) {
        .AttributeModal .Modal-dialog { max-width: 1400px !important; width: 90vw !important; }
        .Attribute-Layout { flex-direction: row; }
        .Attribute-Left { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
        .Attribute-Right { width: 380px; flex-shrink: 0; display: flex; flex-direction: column; }
        .Attribute-Right::-webkit-scrollbar { width: 6px; }
        .Attribute-Right::-webkit-scrollbar-track { background: transparent; }
        .Attribute-Right::-webkit-scrollbar-thumb { background: #dcdfe6; border-radius: 4px; }
    }
    
    .Attribute-preview-area {
        position: relative;
        width: 100%;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        background: #f4f6f8;
        border-radius: 12px;
        border: 1px solid #e1e4e8;
        padding: 0;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
        overflow: hidden;
    }
    .Attribute-preview-area img, .Attribute-preview-area canvas.Attribute-previewImg {
        max-width: 100%;
        max-height: 650px;
        width: auto;
        height: auto;
        display: block;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        cursor: zoom-in;
    }
    .Attribute-preview-area canvas.Attribute-previewImg:not(.is-ready) { min-width: 320px; min-height: 220px; background: #e9edf1; }
    
    .Form-group { margin-bottom: 15px; }
    .Form-group label { font-size: 13px; font-weight: 600; color: #5c6b77; margin-bottom: 6px; display: block; }
    .FormControl {
        background: #fff; border: 1px solid #dcdfe6; border-radius: 8px;
        padding: 10px 12px; font-size: 14px; color: #333; box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        transition: all 0.2s ease; width: 100%; height: auto; min-height: 42px; line-height: 1.5; box-sizing: border-box;
    }
    .Attribute-strip { display: flex; gap: 8px; overflow-x: auto; padding: 10px 2px 6px; margin-top: 10px; width: 100%; scroll-behavior: smooth; touch-action: pan-x; }
    .Attribute-strip::-webkit-scrollbar { height: 6px; } .Attribute-strip::-webkit-scrollbar-thumb { background: #dcdfe6; border-radius: 4px; }
    .Attribute-thumb { position: relative; flex: 0 0 auto; width: 84px; height: 62px; border-radius: 8px; overflow: hidden; border: 2px solid transparent; cursor: grab; user-select: none; touch-action: none; background: #e9edf1; transition: transform .12s ease, border-color .12s ease, opacity .12s; }
    .Attribute-thumb canvas { width: 100%; height: 100%; display: block; pointer-events: none; }
    .Attribute-thumb b { position: absolute; left: 4px; top: 4px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px; background: rgba(0,0,0,.65); color: #fff; font-size: 11px; line-height: 18px; text-align: center; }
    .Attribute-thumb.is-active { border-color: var(--primary-color, #1565c0); }
    .Attribute-thumb.is-dragging { opacity: .45; cursor: grabbing; }
    .Attribute-thumb.is-target { transform: scale(1.06); border-color: #f59e0b; }
    .Attribute-thumbPh { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; color: #94a3b8; }
    .FormControl:focus { border-color: var(--primary-color, #1565c0); box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15); outline: none; }
    .AttributeModal .FormControl { transition: border-color .15s ease, box-shadow .15s ease; }
    .Attribute-Right.is-ai-checking .FormControl:placeholder-shown { border-color: color-mix(in srgb, var(--primary-color) 35%, transparent); }
    .Attribute-Right.is-ai-checking .FormControl::placeholder { color: var(--primary-color); font-style: italic; }
`;
  function escapeRe(v) {
    return String(v || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function bestMatch(text, options) {
    const norm = (v) => String(v || "").toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]+/g, " ").trim();
    const t = norm(text);
    if (!t) return "";
    let found = options.find((o) => norm(o) === t);
    if (found) return found;
    found = options.filter((o) => norm(o).includes(t) || t.includes(norm(o))).sort((a, b) => Math.abs(norm(a).length - t.length) - Math.abs(norm(b).length - t.length))[0];
    if (found) return found;
    const words = t.split(" ");
    let best = "";
    let score = 0;
    options.forEach((o) => {
      const ow = norm(o).split(" ");
      const sc = ow.filter((w) => words.includes(w)).length / Math.max(ow.length, words.length);
      if (sc > score) {
        score = sc;
        best = o;
      }
    });
    return score >= 0.5 ? best : "";
  }
  function shrinkForAi(file, max = 768) {
    if (!file || !window.createImageBitmap || !/^image\//.test(file.type || "image/")) return Promise.resolve(file);
    return createImageBitmap(file).then((bmp) => {
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
      if (bmp.close) bmp.close();
      return new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), "image/jpeg", 0.82));
    }).catch(() => file);
  }
  var aiRequests = /* @__PURE__ */ new WeakMap();
  var aiDeep = /* @__PURE__ */ new WeakMap();
  function prefetchAi(file, deep = false) {
    const store = deep ? aiDeep : aiRequests;
    if (!file || app_default.forum.attribute("framio-upload-exif.ai_enabled") === "0") return null;
    if (store.has(file)) return store.get(file);
    const formData = new FormData();
    if (deep) formData.append("deep", "1");
    const discussion = app_default.current && typeof app_default.current.get === "function" ? app_default.current.get("discussion") : null;
    if (discussion && discussion.id) {
      formData.append("discussion_id", discussion.id());
      const tags = discussion.tags && discussion.tags();
      const slug = Array.isArray(tags) && tags[0] && tags[0].slug ? tags[0].slug() : "";
      if (slug) formData.append("tag_slug", slug);
    }
    const p = shrinkForAi(file).then((small) => {
      formData.append("image", small, "ai.jpg");
      if (file.slice) formData.append("exif_head", file.slice(0, 256 * 1024), "head.jpg");
      if (file.name) formData.append("file_name", file.name);
      return app_default.request({ method: "POST", url: app_default.forum.attribute("apiUrl") + "/framio-media/analyze-ai", body: formData });
    });
    p.catch(() => store.delete(file));
    store.set(file, p);
    if (!deep) prefetchAi(file, true);
    return p;
  }
  var FOLD_MAP = { "\xE7": "c", "\u011F": "g", "\u0131": "i", "\xF6": "o", "\u015F": "s", "\xFC": "u", "i\u0307": "i" };
  var foldName = (s) => String(s || "").toLocaleLowerCase("tr").replace(/i̇|[çğıöşü]/g, (c) => FOLD_MAP[c] || c).replace(/[^a-z0-9]+/g, " ").trim();
  var canonCache = null;
  function canonRules() {
    const raw = app_default.forum.attribute("framio-upload-exif.canon_rules") || "";
    if (canonCache && canonCache.raw === raw) return canonCache.map;
    const fields = { firma: "company", marka: "brand", model: "model", yer: "location" };
    const map = {};
    raw.split(/\r?\n/).forEach((line) => {
      const m2 = line.match(/^\s*(firma|marka|model|yer)\s*:\s*(.+?)\s*=>\s*(.+?)\s*$/i);
      if (!m2) return;
      const f = fields[m2[1].toLowerCase()];
      m2[2].split(",").forEach((v) => {
        const k = foldName(v);
        if (k && k !== foldName(m2[3])) (map[f] = map[f] || {})[k] = m2[3].trim();
      });
    });
    canonCache = { raw, map };
    return map;
  }
  function canonValue(field, value) {
    const v = String(value || "").trim();
    if (!v) return value;
    const r2 = canonRules()[field];
    return r2 && r2[foldName(v)] || value;
  }
  var AttributeModal = class _AttributeModal extends Modal {
    oninit(vnode) {
      super.oninit(vnode);
      this.injectStyles();
      const initial = this.attrs.initialValues || {};
      this.files = this.attrs.files || [];
      this.session = this.attrs.session || {};
      this.isConfirmed = false;
      this.previewUrl = Stream_default(null);
      this.isZoomed = Stream_default(false);
      this.captionMode = Stream_default(initial.captionMode === "multi" && this.files.length > 1 ? "multi" : "single");
      this.photoIndex = Math.min(initial.photoIndex || 0, Math.max(0, this.files.length - 1));
      this.photoData = Array.isArray(initial.photoData) ? initial.photoData.map((d) => d ? JSON.parse(JSON.stringify(d)) : null) : [];
      this.previewUrls = [];
      if (this.files.length > 0) {
        this.showPhoto(this.photoIndex);
      }
      const filename = this.session.result && this.session.result.customFileNames ? this.session.result.customFileNames[0] : this.files[0] ? this.files[0].name : "";
      let initialPlate = initial.plate || "";
      if (!initialPlate && filename) {
        const match = filename.match(/([0-9]{2})\s*([A-Za-z]{1,3})\s*([0-9]{2,4})/);
        if (match) {
          initialPlate = match[1] + " " + match[2].toUpperCase() + " " + match[3];
        }
      }
      this.company = Stream_default(initial.company || "");
      this.plate = Stream_default(initialPlate);
      this.brand = Stream_default(initial.brand || "");
      this.model = Stream_default(initial.model || "");
      this.location = Stream_default(initial.location || "");
      this.year = Stream_default(initial.year || "");
      this.customMusic = Stream_default(initial.customMusic || null);
      this.customGps = Stream_default(initial.customGps || null);
      this.customScope = Stream_default(initial.customScope === "photo" ? "photo" : "all");
      this.city = Stream_default(initial.city || "");
      this.route = Stream_default(initial.route || "");
      this.fleetCode = Stream_default(initial.fleetCode || "");
      this.cityList = [];
      this.cityRoutes = [];
      this.isLoadingCityRoutes = false;
      this.isCustomCity = false;
      this.isCustomRoute = false;
      this.isAnalyzingAi = false;
      this.categorySchema = null;
      this.dynamicFields = {};
      this.isLoadingSchema = false;
      const cityTagSlug = app_default.forum.attribute("framio-upload-exif.city_tag_slug") || "sehirici-ulasim-araclari-fotograflari";
      this.isCityMode = false;
      this._currentTagSlugs = [];
      if (!this.attrs.globalContext && app_default.current && typeof app_default.current.get === "function") {
        const discussion = app_default.current.get("discussion");
        if (discussion) {
          const tags = discussion.tags();
          if (Array.isArray(tags)) {
            this._currentTagSlugs = tags.map((t) => t && typeof t.slug === "function" ? t.slug() : "").filter(Boolean);
            this.isCityMode = tags.some((t) => {
              const s = t && typeof t.slug === "function" ? t.slug() : "";
              return s === cityTagSlug || s.includes("sehirici") || s.includes("sehir-ici");
            });
          }
        }
      }
      if (!this.isCityMode) {
        const path = window.location.pathname;
        if (path.includes(cityTagSlug) || path.includes("sehirici") || path.includes("sehir-ici")) {
          this.isCityMode = true;
        }
      }
      if (this.isCityMode) {
        this.loadCitiesAndRoutes();
      }
      this.loadCategorySchema();
      if (!initial.year && this.files.length > 0) {
        this.readExifYear(this.files[0]);
      }
      this.taxonomy = [];
      this.availableModels = [];
      this.isLoadingTaxonomy = true;
      this.loadTaxonomy();
      const aiState = Stream_default("idle");
      this.aiPct = 0;
      this.aiBarVisible = false;
      this.aiStatus = (v) => {
        if (v === void 0) return aiState();
        const prev = aiState();
        aiState(v);
        if (v === "analyzing") {
          clearInterval(this.aiTimer);
          clearTimeout(this.aiHide);
          this.aiPct = 0;
          this.aiBarVisible = true;
          const t0 = Date.now();
          this.aiTimer = setInterval(() => {
            this.aiPct = Math.min(95, Math.round(95 * (1 - Math.exp(-(Date.now() - t0) / 2200))));
            import_mithril.default.redraw();
          }, 120);
        } else if (prev === "analyzing") {
          clearInterval(this.aiTimer);
          this.aiPct = 100;
          this.aiHide = setTimeout(() => {
            if (aiState() !== "analyzing") {
              this.aiBarVisible = v === "success" || v === "error";
              import_mithril.default.redraw();
            }
          }, v === "idle" ? 1200 : 0);
        } else if (v === "idle") {
          this.aiBarVisible = false;
        }
        return v;
      };
      this.aiMessage = Stream_default("");
      if (app_default.forum.attribute("framio-upload-exif.ai_enabled") !== "0" && this.files.length > 0) {
        this.autoAnalyzeWithAi();
      }
      this.onsubmitCallback = this.attrs.onsubmit;
      this.onskipCallback = this.attrs.onskip;
      this.onInfoCallback = this.attrs.onInfo;
      this.oncancelCallback = this.attrs.oncancel;
      this.ongobackCallback = this.attrs.ongoback;
      this.initCrosspost();
    }
    // === ORTAK PAYLAŞ (Framio Network Crosspost) ===
    // Aktarım penceresi yükleme sırasında açılır (ertelenmiş mod): hedef site, konu
    // ve imza burada seçilir, gönderi yayımlanınca crosspostOnPublish.js aktarır.
    initCrosspost() {
      this.crosspostNodes = null;
      this.crosspost = this.attrs.session && this.attrs.session.crosspost || { mode: "off", payload: null };
      if (!window.flarum || !flarum.extensions || !flarum.extensions["framio-network-crosspost"] || !app_default.session.user) return;
      app_default.request({ method: "GET", url: app_default.forum.attribute("apiUrl") + "/framio/crosspost/nodes" }).then((res) => {
        if (!res.can_crosspost || !(res.nodes || []).length) return;
        this.crosspostNodes = res.nodes;
        import_mithril.default.redraw();
      }).catch(() => {
      });
    }
    syncCrosspost() {
      if (this.attrs.session) this.attrs.session.crosspost = { ...this.crosspost };
    }
    crosspostActive() {
      return !!(this.crosspost && this.crosspost.mode === "payload" && this.crosspost.payload);
    }
    openCrosspost() {
      let CrosspostModal2 = null;
      try {
        const mod = flarum.reg.get("framio-network-crosspost", "forum/components/CrosspostModal");
        CrosspostModal2 = mod && (mod.default || mod);
      } catch (e) {
      }
      if (!CrosspostModal2) return;
      const body = app_default.composer && app_default.composer.body;
      const discussion = body && body.attrs && body.attrs.discussion || null;
      const previewImages = this.files.map((f, i) => fileUrl(f));
      app_default.modal.show(CrosspostModal2, {
        deferred: true,
        discussion,
        isReply: !!discussion,
        previewImages,
        initialPayload: this.crosspostActive() ? this.crosspost.payload : null,
        onconfirm: (payload) => {
          this.crosspost = payload ? { mode: "payload", payload } : { mode: "off", payload: null };
          this.syncCrosspost();
          import_mithril.default.redraw();
        }
      }, true);
    }
    clearCrosspost(e) {
      if (e) e.stopPropagation();
      this.crosspost = { mode: "off", payload: null };
      this.syncCrosspost();
    }
    hide() {
      if (!this.isConfirmed) {
        if (confirm("Y\xFCkleme \u0130\u015Flemi \u0130ptal Edilecektir. Onayl\u0131yor Musunuz?")) {
          if (this.oncancelCallback) this.oncancelCallback();
          super.hide();
        }
      } else {
        super.hide();
      }
    }
    readExifYear(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const view = new DataView(e.target.result);
        if (view.getUint16(0, false) !== 65496) return;
        let offset = 2;
        while (offset < view.byteLength - 2) {
          if (view.getUint16(offset, false) === 65505) {
            const exifOffset = offset + 4;
            const tiffOffset = exifOffset + 6;
            const isLittle = view.getUint16(tiffOffset, false) === 18761;
            const idfOffset = view.getUint32(tiffOffset + 4, isLittle);
            const parseIfd = (startOffset) => {
              const tags2 = view.getUint16(startOffset, isLittle);
              for (let i = 0; i < tags2; i++) {
                const tagOffset = startOffset + 2 + i * 12;
                if (view.getUint16(tagOffset, isLittle) === 36867) {
                  const valOffset = view.getUint32(tagOffset + 8, isLittle);
                  let dateString = "";
                  for (let j = 0; j < 4; j++) dateString += String.fromCharCode(view.getUint8(tiffOffset + valOffset + j));
                  if (dateString && !isNaN(parseInt(dateString))) {
                    this.year(dateString);
                    import_mithril.default.redraw();
                  }
                  return true;
                }
              }
              return false;
            };
            const ifd0 = tiffOffset + idfOffset;
            const tags = view.getUint16(ifd0, isLittle);
            for (let i = 0; i < tags; i++) {
              const tagOffset = ifd0 + 2 + i * 12;
              if (view.getUint16(tagOffset, isLittle) === 34665) {
                parseIfd(tiffOffset + view.getUint32(tagOffset + 8, isLittle));
                break;
              }
            }
            break;
          }
          offset += 2 + view.getUint16(offset + 2, false);
        }
      };
      reader.readAsArrayBuffer(file.slice(0, 128 * 1024));
    }
    injectStyles() {
      if (!document.getElementById("attribute-modal-css")) {
        const style = document.createElement("style");
        style.id = "attribute-modal-css";
        style.innerHTML = CUSTOM_CSS2;
        document.head.appendChild(style);
      }
    }
    // Dinamik kategori şemasını API'den yükle
    loadCategorySchema() {
      if (!this._currentTagSlugs || this._currentTagSlugs.length === 0) return;
      const trySlug = (index) => {
        if (index >= this._currentTagSlugs.length) return;
        const slug = this._currentTagSlugs[index];
        this.isLoadingSchema = true;
        const discussionId = this.discussion ? this.discussion.id() : null;
        app_default.request({
          method: "GET",
          url: app_default.forum.attribute("apiUrl") + "/framio-media/category-schemas",
          params: { tag_slug: slug, discussion_id: discussionId }
        }).then((res) => {
          this.isLoadingSchema = false;
          if (res.data && res.data.fields_config) {
            this.categorySchema = res.data;
            const fieldsConfig = typeof res.data.fields_config === "string" ? JSON.parse(res.data.fields_config) : res.data.fields_config;
            if (Array.isArray(fieldsConfig)) {
              fieldsConfig.forEach((f) => {
                if (!this.dynamicFields[f.key]) {
                  if (f.key === "company" && this.company()) this.dynamicFields[f.key] = this.company();
                  else if (f.key === "plate" && this.plate()) this.dynamicFields[f.key] = this.plate();
                  else if (f.key === "brand" && this.brand()) this.dynamicFields[f.key] = this.brand();
                  else if (f.key === "model" && this.model()) this.dynamicFields[f.key] = this.model();
                  else if (f.key === "location" && this.location()) this.dynamicFields[f.key] = this.location();
                  else if (f.key === "year" && this.year()) this.dynamicFields[f.key] = this.year();
                  else if (f.key === "city" && this.city()) this.dynamicFields[f.key] = this.city();
                  else if (f.key === "route" && this.route()) this.dynamicFields[f.key] = this.route();
                  else if (f.key === "fleetCode" && this.fleetCode()) this.dynamicFields[f.key] = this.fleetCode();
                  else this.dynamicFields[f.key] = "";
                }
              });
              if (fieldsConfig.some((f) => f.type === "city_select") && !this.isCityMode) {
                this.loadCitiesAndRoutes();
              }
            }
            import_mithril.default.redraw();
          } else {
            trySlug(index + 1);
          }
        }).catch(() => {
          this.isLoadingSchema = false;
          trySlug(index + 1);
        });
      };
      trySlug(0);
    }
    autoAnalyzeWithAi() {
      if (!this.files || this.files.length === 0) return;
      this.isAnalyzingAi = true;
      this.aiStatus("analyzing");
      this.aiMessage("Yapay zeka g\xF6rseli analiz ediyor ve k\xFCnye bilgilerini dolduruyor...");
      import_mithril.default.redraw();
      (prefetchAi(this.files[0]) || Promise.reject()).then((res) => {
        this.isAnalyzingAi = false;
        if (res && res.success === false) {
          this.aiStatus(res.error ? "error" : "idle");
          this.aiMessage(res.error ? "Yapay zeka \u015Fu an yan\u0131t veremedi; alanlar\u0131 elle doldurabilirsiniz." : "");
          if (res.error && app_default.session.user && app_default.session.user.isAdmin()) this.aiMessage(res.error);
          import_mithril.default.redraw();
          return;
        }
        if (res && res.data) {
          const ai = res.data;
          this.aiRaw = { brand: ai.brand || "", model: ai.model || "" };
          let filledCount = 0;
          const aiKeys = ["company", "plate", "brand", "model", "location", "year", "city", "route", "fleetCode"];
          const before = aiKeys.map((k) => String(this[k]() || ""));
          const dynBefore = Object.assign({}, this.dynamicFields);
          if (ai.company && (!this.company() || (res.history || []).includes("plate"))) {
            this.company(ai.company);
            filledCount++;
          }
          if (ai.plate && (!this.plate() || (res.history || []).includes("plate"))) {
            this.plate(ai.plate);
            filledCount++;
          }
          const fromHistory = (res.history || []).includes("plate");
          if (ai.brand && (!this.brand() || fromHistory || this.isDefaultBrand)) {
            const brands = this.getSortedBrands ? this.getSortedBrands() : [];
            const brand = brands.length ? bestMatch(ai.brand, brands) : ai.brand;
            if (brand) {
              this.brand(brand);
              this.updateModels(brand);
              filledCount++;
            }
          }
          if (ai.model && (!this.model() || fromHistory)) {
            const options = (this.availableModels || []).map((x) => x.model);
            const model = options.length ? bestMatch(String(ai.model).replace(new RegExp("^" + escapeRe(this.brand()) + "\\s+", "i"), ""), options) : ai.model;
            if (model) {
              this.model(model);
              filledCount++;
            }
          }
          if ((ai.location || ai.location_guess) && !this.location()) {
            const loc = ai.location || ai.location_guess;
            this.location(loc);
            if (!this.city()) this.city(ai.city || loc);
            filledCount++;
          }
          if ((ai.year || ai.year_guess) && !this.year()) {
            this.year(ai.year || ai.year_guess);
            filledCount++;
          }
          if (ai.city && !this.city()) {
            this.city(ai.city);
            filledCount++;
          }
          if (ai.route && !this.route()) {
            this.route(ai.route);
            filledCount++;
          }
          if (ai.fleetCode && !this.fleetCode()) {
            this.fleetCode(ai.fleetCode);
            filledCount++;
          }
          Object.keys(ai).forEach((key) => {
            if (ai[key] && !this.dynamicFields[key]) {
              this.dynamicFields[key] = String(ai[key]).trim();
            }
          });
          this.aiFilledVals = /* @__PURE__ */ new Set();
          aiKeys.forEach((k, i) => {
            const v = String(this[k]() || "").trim();
            if (v && v !== before[i].trim()) this.aiFilledVals.add(v);
          });
          Object.keys(this.dynamicFields).forEach((k) => {
            const v = String(this.dynamicFields[k] || "").trim();
            if (v && dynBefore[k] !== this.dynamicFields[k]) this.aiFilledVals.add(v);
          });
          this.aiStatus(filledCount ? "success" : "idle");
          this.refineWithDeep(this.files[0]);
          const hist = res.history || [];
          const locLabel = { gps: "\xE7ekim yeri foto\u011Fraf\u0131n GPS bilgisinden", session: "\xE7ekim yeri ayn\u0131 \xE7ekim oturumundaki foto\u011Fraflar\u0131n\u0131zdan", similar: "\xE7ekim yeri forumdaki %" + Math.round((res.similar && res.similar.score || 0) * 100) + " benzeyen foto\u011Fraftan", ai_guess: "\xE7ekim yeri tahmin, l\xFCtfen kontrol edin" }[res.location_source];
          const source = (locLabel ? " \xB7 " + locLabel : "") + (hist.includes("plate") ? " (plaka forumda kay\u0131tl\u0131, bilgiler o k\xFCnyeden)" : "");
          this.aiMessage(filledCount ? `${filledCount} alan dolduruldu${source}, kontrol etmeyi unutmay\u0131n.` : "");
        } else {
          this.aiStatus("idle");
        }
        import_mithril.default.redraw();
      }).catch((err) => {
        this.isAnalyzingAi = false;
        this.aiStatus("idle");
        this.aiMessage("");
        import_mithril.default.redraw();
      });
    }
    /**
     * Doğruluk kipindeki yanıt gelince marka/model (kullanıcı değiştirmediyse) düzeltilir; kutu yine
     * Framio AI işaretiyle kalır ve sonuç çubuğunda belirtilir.
     */
    refineWithDeep(file) {
      const p = prefetchAi(file, true);
      if (!p) return;
      const before = { brand: this.brand(), model: this.model() };
      p.then((res) => {
        const ai = res && res.data;
        if (!ai || !ai.model || this.files[0] !== file) return;
        this.aiRaw = { brand: ai.brand || "", model: ai.model };
        if (this.brand() !== before.brand || this.model() !== before.model) return;
        const brands = this.getSortedBrands ? this.getSortedBrands() : [];
        const brand = ai.brand ? brands.length ? bestMatch(ai.brand, brands) : ai.brand : this.brand();
        if (brand && brand !== this.brand()) {
          this.brand(brand);
          this.updateModels(brand);
        }
        const options = (this.availableModels || []).map((x) => x.model);
        const model = options.length ? bestMatch(String(ai.model).replace(new RegExp("^" + escapeRe(this.brand()) + "\\s+", "i"), ""), options) : ai.model;
        if (!model || model === before.model && brand === before.brand) return;
        this.model(model);
        (this.aiFilledVals = this.aiFilledVals || /* @__PURE__ */ new Set()).add(String(model).trim());
        if (brand) this.aiFilledVals.add(String(brand).trim());
        this.aiMessage("Marka/model do\u011Frulama modeliyle d\xFCzeltildi: " + (brand ? brand + " " : "") + model + ". Kontrol etmeyi unutmay\u0131n.");
        this.aiBarVisible = true;
        import_mithril.default.redraw();
      }).catch(() => {
      });
    }
    // === ÇOKLU AÇIKLAMA YARDIMCILARI ===
    isMulti() {
      return this.files.length > 1 && this.captionMode() === "multi";
    }
    showPhoto(i) {
      if (!this.files[i]) return;
      this.previewUrls[i] = fileUrl(this.files[i]);
      this.previewUrl(this.previewUrls[i]);
      warm(this.files[i + 1]);
    }
    /** Künye alanlarının anlık kopyası (müzik/konum gönderi geneli olduğu için dahil değil) */
    snapshot() {
      return {
        company: this.company(),
        plate: this.plate(),
        brand: this.brand(),
        model: this.model(),
        location: this.location(),
        year: this.year(),
        city: this.city(),
        route: this.route(),
        fleetCode: this.fleetCode(),
        dynamicFields: { ...this.dynamicFields || {} },
        customMusic: this.customMusic(),
        customGps: this.customGps()
      };
    }
    restoreSnapshot(s, quiet = false) {
      if (!s) return;
      this.company(s.company || "");
      this.plate(s.plate || "");
      this.brand(s.brand || "");
      this.model(s.model || "");
      this.location(s.location || "");
      this.year(s.year || "");
      this.city(s.city || "");
      this.route(s.route || "");
      this.fleetCode(s.fleetCode || "");
      this.dynamicFields = { ...s.dynamicFields || {} };
      if (this.customScope && this.customScope() === "photo") {
        this.customMusic(s.customMusic || null);
        this.customGps(s.customGps || null);
      }
      if (!quiet && this.taxonomy && this.taxonomy.length) this.updateModels(s.brand || this.dynamicFields.brand || "");
    }
    plateFromFileName(i) {
      const names = this.session.result && this.session.result.customFileNames;
      const name = names && names[i] || (this.files[i] ? this.files[i].name : "");
      const match = name && name.match(/([0-9]{2})\s*([A-Za-z]{1,3})\s*([0-9]{2,4})/);
      return match ? match[1] + " " + match[2].toUpperCase() + " " + match[3] : "";
    }
    setCaptionMode(mode) {
      if (mode === this.captionMode()) return;
      if (mode === "multi") {
        this.photoData = [];
        this.photoData[0] = this.snapshot();
        this.photoIndex = 0;
        this.showPhoto(0);
      } else {
        if (this.photoData[0]) this.restoreSnapshot(this.photoData[0]);
        this.photoIndex = 0;
        this.showPhoto(0);
        this.customScope("all");
      }
      this.captionMode(mode);
      import_mithril.default.redraw();
    }
    /** Önizlemede gezinme: Birden Çok'ta künyesiyle birlikte, Tek'te yalnızca görsel */
    navPhoto(i) {
      if (i < 0 || i >= this.files.length || i === this.photoIndex) return;
      if (this.isMulti()) return this.goToPhoto(i);
      this.photoIndex = i;
      this.showPhoto(i);
      import_mithril.default.redraw();
    }
    /**
     * Fotoğrafı from → to konumuna taşır. Fotoğrafa bağlı her dizi (dosya, önizleme, künye, imza seçimi,
     * dosya adı) birlikte taşınır; arka planda süren yüklemeler ilk sıraya göre kaydedildiği için
     * session.order eşlemesi tutulur ve gönderiye eklerken bu sıra uygulanır (UploadButton.finishProcess).
     */
    movePhoto(from, to) {
      const n = this.files.length;
      if (from === to || from < 0 || to < 0 || from >= n || to >= n) return;
      if (this.isMulti()) this.photoData[this.photoIndex] = this.snapshot();
      const move = (arr) => {
        if (!Array.isArray(arr)) return;
        while (arr.length < n) arr.push(void 0);
        const [item] = arr.splice(from, 1);
        arr.splice(to, 0, item);
      };
      const current = this.photoIndex;
      move(this.files);
      move(this.previewUrls);
      move(this.photoData);
      const res = this.session && this.session.result;
      if (res) {
        move(res.selections);
        move(res.customFileNames);
        move(res.watermarkUrls);
      }
      if (this.session) {
        if (!this.session.order) this.session.order = Array.from({ length: n }, (_, k) => k);
        move(this.session.order);
      }
      const next = current === from ? to : from < current && to >= current ? current - 1 : from > current && to <= current ? current + 1 : current;
      this.photoIndex = next;
      this.showPhoto(next);
      import_mithril.default.redraw();
    }
    /** Önizleme altında kaydırılabilir, sürükle-bırak ile sıralanabilir küçük resim şeridi */
    renderPhotoStrip() {
      const drag = this._drag;
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Attribute-strip", oncreate: (v) => {
        this._stripEl = v.dom;
      } }, this.files.map((file, i) => {
        const isDragging = drag && drag.active && drag.from === i;
        const isTarget = drag && drag.active && drag.over === i && drag.from !== i;
        return /* @__PURE__ */ (0, import_mithril.default)(
          "div",
          {
            key: file.name + ":" + file.size + ":" + file.lastModified,
            className: "Attribute-thumb" + (i === this.photoIndex ? " is-active" : "") + (isDragging ? " is-dragging" : "") + (isTarget ? " is-target" : ""),
            "data-index": i,
            title: i + 1 + ". foto\u011Fraf \u2014 s\xFCr\xFCkleyerek s\u0131ralay\u0131n",
            onpointerdown: (e) => this.stripPointerDown(e, i)
          },
          /* @__PURE__ */ (0, import_mithril.default)("canvas", { oncreate: (v) => drawThumb(v.dom, file), onupdate: (v) => drawThumb(v.dom, file) }),
          /* @__PURE__ */ (0, import_mithril.default)("b", null, i + 1)
        );
      }));
    }
    stripPointerDown(e, i) {
      if (e.button !== void 0 && e.button !== 0) return;
      const startX = e.clientX;
      const startY = e.clientY;
      this._drag = { from: i, over: i, active: false };
      const el = e.currentTarget;
      const strip = this._stripEl;
      const onMove = (ev) => {
        const d = this._drag;
        if (!d) return;
        if (!d.active) {
          if (Math.abs(ev.clientX - startX) < 8 && Math.abs(ev.clientY - startY) < 8) return;
          d.active = true;
          try {
            el.setPointerCapture(ev.pointerId);
          } catch (err) {
          }
        }
        ev.preventDefault();
        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        const thumb = under && under.closest && under.closest(".Attribute-thumb");
        if (thumb && thumb.dataset.index !== void 0) d.over = parseInt(thumb.dataset.index, 10);
        if (strip) {
          const rect = strip.getBoundingClientRect();
          if (ev.clientX < rect.left + 40) strip.scrollLeft -= 12;
          else if (ev.clientX > rect.right - 40) strip.scrollLeft += 12;
        }
        import_mithril.default.redraw();
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        const d = this._drag;
        this._drag = null;
        if (!d) return;
        if (d.active) this.movePhoto(d.from, d.over);
        else this.navPhoto(i);
        import_mithril.default.redraw();
      };
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    }
    goToPhoto(i) {
      if (!this.isMulti() || i < 0 || i >= this.files.length || i === this.photoIndex) return;
      this.photoData[this.photoIndex] = this.snapshot();
      if (!this.photoData[i]) {
        const copy = JSON.parse(JSON.stringify(this.photoData[this.photoIndex]));
        const vehicleKeys = ["company", "plate", "brand", "model", "route", "fleetCode", "city", "location"];
        vehicleKeys.forEach((k) => {
          copy[k] = "";
          if (copy.dynamicFields && k in copy.dynamicFields) copy.dynamicFields[k] = "";
        });
        Object.keys(copy.dynamicFields || {}).forEach((k) => {
          if (k !== "year") copy.dynamicFields[k] = "";
        });
        if (this.customScope() === "photo") {
          copy.customMusic = null;
          copy.customGps = null;
        }
        const plate = this.plateFromFileName(i);
        if (plate) {
          copy.plate = plate;
          if (copy.dynamicFields) copy.dynamicFields.plate = plate;
        }
        this.photoData[i] = copy;
      }
      this.photoIndex = i;
      this.restoreSnapshot(this.photoData[i]);
      this.showPhoto(i);
      import_mithril.default.redraw();
    }
    wrapKunye(text, withTheme = true) {
      if (!text) return null;
      const theme = app_default.forum.attribute("framio-upload-exif.kunye_theme") || "classic";
      return withTheme ? `[framio-kunye theme="${theme}"]
${text}
[/framio-kunye]` : `[framio-kunye]
${text}
[/framio-kunye]`;
    }
    /** Her fotoğrafın künye metni (fotoğraf sırasıyla); görülmeyen fotoğraflar bir öncekini alır */
    buildPerPhotoTexts(withTheme = true) {
      this.photoData[this.photoIndex] = this.snapshot();
      const current = this.snapshot();
      let last = this.photoData[0] || current;
      const texts = this.files.map((f, i) => {
        const s = this.photoData[i] || last;
        last = s;
        this.restoreSnapshot(s, true);
        return this.wrapKunye(this.prepareData(), withTheme);
      });
      this.restoreSnapshot(current, true);
      return texts;
    }
    onremove(vnode) {
      clearTimeout(this._idleRedraw);
      if (this._typingGuard && vnode.dom) vnode.dom.removeEventListener("input", this._typingGuard, true);
      const styleTag = document.getElementById("attribute-modal-css");
      if (styleTag) styleTag.remove();
      super.onremove(vnode);
    }
    applyMatchedCity() {
      if (!this.city()) {
        let matchedCity = null;
        if (this.taxonomy && this.taxonomy.length > 0) {
          const taxCity = this.taxonomy.find((t) => t.city);
          if (taxCity) matchedCity = taxCity.city;
        }
        if (!matchedCity && app_default.current && typeof app_default.current.get === "function") {
          const discussion = app_default.current.get("discussion");
          if (discussion) {
            if (typeof discussion.tags === "function") {
              const tags = discussion.tags();
              if (Array.isArray(tags)) {
                tags.forEach((t) => {
                  const slug = t && typeof t.slug === "function" ? t.slug().toLowerCase() : "";
                  const found = this.cityList.find((c) => slug.includes(c.toLowerCase()) || c.toLowerCase().includes(slug.replace("-sehirici", "")));
                  if (found) matchedCity = found;
                });
              }
            }
            if (!matchedCity && typeof discussion.title === "function") {
              const title = discussion.title();
              matchedCity = this.cityList.find((c) => title.toLowerCase().includes(c.toLowerCase()));
            }
          }
        }
        if (!matchedCity) {
          const path = window.location.pathname.toLowerCase();
          matchedCity = this.cityList.find((c) => path.includes(c.toLowerCase()));
        }
        if (matchedCity) {
          this.city(matchedCity);
          if (!this.location()) this.location(matchedCity);
        }
      }
      if (this.city()) {
        this.loadRoutesForCity(this.city());
      }
      import_mithril.default.redraw();
    }
    loadCitiesAndRoutes() {
      if (window.framioCityListCache) {
        this.cityList = window.framioCityListCache;
        this.applyMatchedCity();
        return;
      }
      app_default.request({
        method: "GET",
        url: app_default.forum.attribute("apiUrl") + "/framio-media/city-routes",
        params: { all_cities: 1 }
      }).then((res) => {
        this.cityList = (res.cities || []).map((c) => c.name);
        window.framioCityListCache = this.cityList;
        this.applyMatchedCity();
      }).catch((err) => {
        console.error("[AttributeModal] Error loading cities:", err);
      });
    }
    loadRoutesForCity(cityName) {
      if (!cityName || cityName === "Di\u011Fer") {
        this.cityRoutes = [];
        return;
      }
      window.framioCityRoutesCache = window.framioCityRoutesCache || {};
      if (window.framioCityRoutesCache[cityName]) {
        this.cityRoutes = window.framioCityRoutesCache[cityName];
        import_mithril.default.redraw();
        return;
      }
      this.isLoadingCityRoutes = true;
      app_default.request({
        method: "GET",
        url: app_default.forum.attribute("apiUrl") + "/framio-media/city-routes",
        params: { city: cityName }
      }).then((res) => {
        this.cityRoutes = res.data || [];
        window.framioCityRoutesCache[cityName] = this.cityRoutes;
        this.isLoadingCityRoutes = false;
        import_mithril.default.redraw();
      }).catch((err) => {
        this.isLoadingCityRoutes = false;
        import_mithril.default.redraw();
      });
    }
    loadTaxonomy() {
      let discussionId = null;
      if (!this.attrs.globalContext && app_default.current && typeof app_default.current.get === "function") {
        const discussion = app_default.current.get("discussion");
        if (discussion) discussionId = discussion.id();
      }
      if (!discussionId && !this.attrs.globalContext) {
        const match = window.location.pathname.match(/\/d\/(\d+)/);
        if (match) discussionId = match[1];
      }
      const cacheKey = discussionId ? String(discussionId) : "global";
      window.__framioTaxonomyCache = window.__framioTaxonomyCache || {};
      if (window.__framioTaxonomyCache[cacheKey]) {
        this.applyTaxonomy(window.__framioTaxonomyCache[cacheKey]);
        this.isLoadingTaxonomy = false;
        return;
      }
      const params = discussionId ? { discussion_id: discussionId } : {};
      this.isLoadingTaxonomy = true;
      app_default.request({
        method: "GET",
        url: app_default.forum.attribute("apiUrl") + "/framio-media/taxonomy",
        params
      }).then((result) => {
        const data = result.data || [];
        window.__framioTaxonomyCache[cacheKey] = data;
        this.applyTaxonomy(data);
        this.isLoadingTaxonomy = false;
        import_mithril.default.redraw();
      }).catch((err) => {
        this.isLoadingTaxonomy = false;
        console.error("[AttributeModal] Error loading taxonomy:", err);
        import_mithril.default.redraw();
      });
    }
    getSortedBrands() {
      if (this._brandsCache && this._brandsCache.src === this.taxonomy) return this._brandsCache.list;
      let brands = [...new Set(this.taxonomy.map((item) => String(item.brand || "").trim()))].filter(Boolean);
      let brandOrderRaw = app_default.forum.attribute("framio-upload-exif.brand_order");
      let brandOrder = [];
      if (brandOrderRaw) {
        try {
          brandOrder = typeof brandOrderRaw === "string" ? JSON.parse(brandOrderRaw) : brandOrderRaw;
          if (!Array.isArray(brandOrder)) brandOrder = [];
        } catch (e) {
        }
      }
      const list = brands.sort((a, b) => {
        const idxA = brandOrder.indexOf(a);
        const idxB = brandOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b, "tr");
      });
      this._brandsCache = { src: this.taxonomy, list };
      return list;
    }
    applyTaxonomy(data) {
      this.taxonomy = data || [];
      const brands = this.getSortedBrands();
      if (brands.length > 0) {
        if (!this.brand() || !brands.includes(this.brand())) {
          this.brand(brands[0]);
          this.isDefaultBrand = true;
        }
        this.updateModels(this.brand());
      }
    }
    updateModels(brandName) {
      if (!brandName) {
        this.availableModels = [];
        return;
      }
      const targetBrand = String(brandName).trim();
      this.availableModels = this.taxonomy.filter((item) => String(item.brand).trim() === targetBrand);
      import_mithril.default.redraw();
    }
    oncreate(vnode) {
      super.oncreate(vnode);
      this.syncAiPlaceholders(vnode.dom);
      this._typingGuard = (e) => {
        const t = e.target;
        if (!t || !t.matches || !t.matches("input.FormControl:not([type=number]):not([list]), textarea.FormControl")) return;
        e.redraw = false;
        clearTimeout(this._idleRedraw);
        this._idleRedraw = setTimeout(() => import_mithril.default.redraw(), 300);
      };
      vnode.dom.addEventListener("input", this._typingGuard, true);
    }
    onupdate(vnode) {
      if (super.onupdate) super.onupdate(vnode);
      this.syncAiPlaceholders(vnode.dom);
    }
    /** Framio AI çalışırken boş metin alanlarının içinde durum yazısı gösterilir; bitince özgün yer tutucu geri gelir */
    syncAiPlaceholders(root2) {
      const box = root2 && root2.querySelector(".Attribute-Right");
      if (!box) return;
      const checking = this.aiStatus() === "analyzing";
      const filled = this.aiFilledVals || /* @__PURE__ */ new Set();
      box.querySelectorAll("input.FormControl:not([type=hidden]), textarea.FormControl, select.FormControl").forEach((el) => {
        el.classList.toggle("is-ai-filled", !checking && !!el.value && filled.has(String(el.value).trim()));
        el.classList.toggle("is-ai-pending", checking && !el.value);
        if (el.tagName === "SELECT") return;
        if (checking) {
          if (!el.hasAttribute("data-ph")) el.setAttribute("data-ph", el.getAttribute("placeholder") || "");
          el.setAttribute("placeholder", "Framio AI %" + this.aiPct + " \xB7 dolduruluyor\u2026");
        } else if (el.hasAttribute("data-ph")) {
          el.setAttribute("placeholder", el.getAttribute("data-ph"));
          el.removeAttribute("data-ph");
        }
      });
    }
    className() {
      return "AttributeModal Modal--large";
    }
    title() {
      return "Ara\xE7 K\xFCnye Bilgileri";
    }
    content() {
      const brands = this.getSortedBrands();
      const previewIndex = this.photoIndex;
      const currentSelectionId = this.session.result && this.session.result.selections ? this.session.result.selections[previewIndex] || "none" : "none";
      let baseUrl = app_default.forum.attribute("baseUrl").replace(/\/$/, "");
      if (window.location.protocol === "https:" && baseUrl.startsWith("http:")) baseUrl = baseUrl.replace(/^http:/, "https:");
      const username = app_default.session.user ? app_default.session.user.username() : "";
      const wmUrls = this.session.result && this.session.result.watermarkUrls || [];
      const watermarkUrl = currentSelectionId !== "none" ? wmUrls[previewIndex] || baseUrl + "/assets/watermarks/" + username + "/" + encodeURIComponent(currentSelectionId) : "";
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modal-body", style: { padding: 0 } }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Attribute-Layout", style: { paddingTop: "24px" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Attribute-Left", style: { display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { style: { textAlign: "center", marginBottom: "15px" } }, /* @__PURE__ */ (0, import_mithril.default)("p", { className: "helpText", style: { margin: 0, fontSize: "13px", color: "#5c6b77", fontWeight: "500" } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-cloud-upload-alt", style: { marginRight: "6px", color: "#3498db" } }), " Foto\u011Fraflar arka planda y\xFCkleniyor. L\xFCtfen ara\xE7 bilgilerini giriniz.", /* @__PURE__ */ (0, import_mithril.default)("br", null), /* @__PURE__ */ (0, import_mithril.default)("span", { style: { fontSize: "11px", color: "#999" } }, "(Bo\u015F b\u0131rak\u0131lan alanlar \u015Fablonda g\xF6sterilmez)"))), this.files.length > 1 && this.renderCaptionModeSwitch(), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Attribute-preview-area", style: { flex: 1, display: "flex", alignItems: "center" } }, this.previewUrl() ? /* @__PURE__ */ (0, import_mithril.default)("div", { style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          style: { position: "relative", display: "inline-block", maxWidth: "100%", touchAction: this.files.length > 1 ? "pan-y" : "auto" },
          ontouchstart: (e) => {
            this.swipeX = e.changedTouches[0].clientX;
          },
          ontouchend: (e) => {
            if (this.files.length < 2 || this.swipeX == null) return;
            const dx = e.changedTouches[0].clientX - this.swipeX;
            this.swipeX = null;
            if (Math.abs(dx) < 40) return;
            const target = this.photoIndex + (dx < 0 ? 1 : -1);
            this.navPhoto(target);
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("canvas", { className: "Attribute-previewImg", oncreate: (v) => drawPreview(v.dom, this.files[this.photoIndex]), onupdate: (v) => drawPreview(v.dom, this.files[this.photoIndex]), onclick: () => this.isZoomed(true), title: "B\xFCy\xFCtmek i\xE7in t\u0131klay\u0131n" }),
        currentSelectionId !== "none" && /* @__PURE__ */ (0, import_mithril.default)("img", { src: watermarkUrl, style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }, onerror: (e) => {
          e.target.style.display = "none";
        } }),
        this.files.length > 1 && this.renderPhotoNav()
      )) : /* @__PURE__ */ (0, import_mithril.default)("div", { style: { color: "#666", padding: "20px" } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-image fa-2x" }), /* @__PURE__ */ (0, import_mithril.default)("br", null), "\xD6nizleme Yok")), this.files.length > 1 && this.renderPhotoStrip(), this.isZoomed() && this.previewUrl() && /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          style: {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.85)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out"
          },
          onclick: (e) => {
            e.stopPropagation();
            this.isZoomed(false);
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { style: { position: "relative", display: "inline-block", maxWidth: "95vw", maxHeight: "95vh" } }, /* @__PURE__ */ (0, import_mithril.default)("img", { src: this.previewUrl(), style: { maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", display: "block", borderRadius: "8px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" } }), currentSelectionId !== "none" && /* @__PURE__ */ (0, import_mithril.default)("img", { src: watermarkUrl, style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }, onerror: (e) => {
          e.target.style.display = "none";
        } }))),
        /* @__PURE__ */ (0, import_mithril.default)("button", { style: { position: "absolute", top: "20px", right: "30px", background: "transparent", border: "none", color: "#fff", fontSize: "30px", cursor: "pointer", padding: "10px" }, onclick: (e) => {
          e.stopPropagation();
          this.isZoomed(false);
        } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-times" }))
      ), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { marginTop: "auto", paddingTop: "15px", display: "flex", flexDirection: "column", gap: "10px" } }, this.files.length > 1 && /* @__PURE__ */ (0, import_mithril.default)("p", { style: { margin: 0, color: "#88929d", fontSize: "13px", textAlign: "center" } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-info-circle" }), " ", this.isMulti() ? `Her foto\u011Frafa ayr\u0131 k\xFCnye girilir. Alttaki \u015Feritten foto\u011Fraflar aras\u0131nda ge\xE7ebilir, s\xFCr\xFCkleyerek s\u0131ralayabilirsiniz.` : `Tek k\xFCnye ${this.files.length} foto\u011Fraf\u0131n tamam\u0131na uygulan\u0131r. Alttaki \u015Feritte foto\u011Fraflar\u0131 s\xFCr\xFCkleyerek g\xF6nderideki s\u0131ralar\u0131n\u0131 de\u011Fi\u015Ftirebilirsiniz.`), /* @__PURE__ */ (0, import_mithril.default)(Button, { className: "Button", style: { ...BTN, width: "100%", boxSizing: "border-box", padding: "0 12px", background: "#fff", color: "#e74c3c", border: "1px solid #e74c3c" }, onclick: this.cancel.bind(this) }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-arrow-left", style: { marginRight: "6px" } }), " Y\xFCklemeyi \u0130ptal Et ve Geri D\xF6n"))), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Attribute-Right" + (this.aiStatus() === "analyzing" ? " is-ai-checking" : ""), style: { display: "flex", flexDirection: "column", height: "100%" } }, this.aiBarVisible && this.aiStatus() !== "analyzing" ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "FramioAI-Bar is-" + this.aiStatus(), role: "status", "aria-live": "polite" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "FramioAI-BarFill", style: { width: this.aiPct + "%" } }), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "FramioAI-BarText" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-magic" }), " Framio AI %", this.aiPct, this.aiStatus() === "analyzing" ? " \xB7 k\xFCnye bilgileri dolduruluyor\u2026" : this.aiMessage() ? " \xB7 " + this.aiMessage() : ""), this.aiStatus() !== "analyzing" ? /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-times FramioAI-Close", onclick: () => {
        this.aiBarVisible = false;
      } }) : null) : null, this.categorySchema && this.categorySchema.fields_config ? this.renderDynamicForm() : this.isCityMode ? (
        // === ŞEHİRİÇİ ULAŞIM ARAÇLARI KÜNYE FORMU (4 SATIR) ===
        /* @__PURE__ */ (0, import_mithril.default)("div", null, /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", gap: "15px" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "\u015Eehir Se\xE7imi"), this.isCustomCity ? /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", gap: "5px" } }, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            className: "FormControl",
            placeholder: "\u015Eehir ad\u0131 yaz\u0131n\u0131z...",
            value: this.city(),
            oninput: (e) => {
              this.city(e.target.value);
              this.location(e.target.value);
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)(
          Button,
          {
            className: "Button",
            icon: "fas fa-list",
            onclick: () => {
              this.isCustomCity = false;
              this.city("");
              import_mithril.default.redraw();
            },
            title: "Listeden Se\xE7"
          }
        )) : /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            list: "city-datalist",
            className: "FormControl",
            placeholder: "\u015Eehir Se\xE7in veya Yaz\u0131n",
            value: this.city(),
            onchange: (e) => {
              const val = e.target.value;
              if (val === "__custom__") {
                this.isCustomCity = true;
                this.city("");
                import_mithril.default.redraw();
                return;
              }
              this.city(val);
              this.location(val);
              this.route("");
              if (val) this.loadRoutesForCity(val);
            },
            oninput: (e) => {
              if (e.target.value !== "__custom__") this.city(e.target.value);
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)("datalist", { id: "city-datalist" }, this.cityList.map((c) => /* @__PURE__ */ (0, import_mithril.default)("option", { value: c }, c)), /* @__PURE__ */ (0, import_mithril.default)("option", { value: "__custom__" }, "+ Di\u011Fer (Elle Yaz)..."))), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "Hat Se\xE7imi"), this.isCustomRoute || this.cityRoutes.length === 0 ? /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", gap: "5px" } }, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            className: "FormControl",
            placeholder: "Hat ad\u0131 yaz\u0131n\u0131z...",
            value: this.route(),
            oninput: (e) => this.route(e.target.value)
          }
        ), this.cityRoutes.length > 0 && /* @__PURE__ */ (0, import_mithril.default)(
          Button,
          {
            className: "Button",
            icon: "fas fa-list",
            onclick: () => {
              this.isCustomRoute = false;
              this.route("");
              import_mithril.default.redraw();
            },
            title: "Listeden Se\xE7"
          }
        )) : /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            list: "route-datalist",
            className: "FormControl",
            placeholder: this.isLoadingCityRoutes ? "Hatlar y\xFCkleniyor..." : "Hat Se\xE7in veya Yaz\u0131n",
            value: this.route(),
            disabled: !this.city() || this.isLoadingCityRoutes,
            onchange: (e) => {
              const val = e.target.value;
              if (val === "__custom__") {
                this.isCustomRoute = true;
                this.route("");
                import_mithril.default.redraw();
                return;
              }
              this.route(val);
            },
            oninput: (e) => {
              if (e.target.value !== "__custom__") this.route(e.target.value);
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)("datalist", { id: "route-datalist" }, this.cityRoutes.map((r2) => {
          const label = r2.display_name || (r2.route_name ? `${r2.route_code} - ${r2.route_name}` : r2.route_code);
          return /* @__PURE__ */ (0, import_mithril.default)("option", { value: label }, label);
        }), /* @__PURE__ */ (0, import_mithril.default)("option", { value: "__custom__" }, "+ Di\u011Fer (Elle Yaz)...")))), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", gap: "15px" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, this.isLoadingTaxonomy ? "Marka" : brands.length > 0 ? "Marka" : "Marka"), this.isLoadingTaxonomy ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", disabled: true, style: { background: "#f8f9fa", color: "#888" } }, /* @__PURE__ */ (0, import_mithril.default)("option", null, "Y\xFCkleniyor...")) : brands.length > 0 ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", value: this.brand(), onchange: (e) => {
          this.brand(e.target.value);
          this.isDefaultBrand = false;
          this.model("");
          this.updateModels(e.target.value);
        } }, brands.length > 1 && /* @__PURE__ */ (0, import_mithril.default)("option", { value: "" }, "-- Marka Se\xE7 --"), brands.map((brandItem) => /* @__PURE__ */ (0, import_mithril.default)("option", { value: brandItem }, brandItem))) : /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            className: "FormControl",
            value: this.brand(),
            oninput: (e) => this.brand(e.target.value),
            placeholder: "Marka giriniz (\xD6rn: Mercedes-Benz)"
          }
        )), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, this.isLoadingTaxonomy ? "Model" : brands.length > 0 ? "Model" : "Model"), this.isLoadingTaxonomy ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", disabled: true, style: { background: "#f8f9fa", color: "#888" } }, /* @__PURE__ */ (0, import_mithril.default)("option", null, "Y\xFCkleniyor...")) : brands.length > 0 ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", value: this.model(), onchange: (e) => this.model(e.target.value), disabled: !this.brand() }, /* @__PURE__ */ (0, import_mithril.default)("option", { value: "" }, "-- Model Se\xE7 --"), this.availableModels.map((mod) => /* @__PURE__ */ (0, import_mithril.default)("option", { value: mod.model }, mod.model))) : /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            className: "FormControl",
            value: this.model(),
            oninput: (e) => this.model(e.target.value),
            placeholder: "Model giriniz (\xD6rn: Conecto)"
          }
        ))), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", gap: "15px" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "Ara\xE7 Filo Kodu (Varsa)"), /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            className: "FormControl",
            value: this.fleetCode(),
            oninput: (e) => this.fleetCode(e.target.value),
            placeholder: "\xD6rn: 06-1234 veya Kap\u0131 No"
          }
        )), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "Plaka"), /* @__PURE__ */ (0, import_mithril.default)("input", { className: "FormControl", value: this.plate(), oninput: (e) => this.plate(e.target.value) }))), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", gap: "15px", marginBottom: "20px" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "\xC7ekim Yeri"), /* @__PURE__ */ (0, import_mithril.default)("input", { className: "FormControl", value: this.location(), oninput: (e) => this.location(e.target.value) })), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "Y\u0131l"), /* @__PURE__ */ (0, import_mithril.default)("input", { className: "FormControl", type: "number", value: this.year(), oninput: (e) => this.year(e.target.value) }))))
      ) : (
        // === NORMAL STANDART KÜNYE FORMU (3 SATIR) ===
        /* @__PURE__ */ (0, import_mithril.default)("div", null, /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", gap: "15px" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "Firma \u0130smi"), /* @__PURE__ */ (0, import_mithril.default)("input", { className: "FormControl", value: this.company(), oninput: (e) => this.company(e.target.value) })), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "Plaka"), /* @__PURE__ */ (0, import_mithril.default)("input", { className: "FormControl", value: this.plate(), oninput: (e) => this.plate(e.target.value) }))), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", gap: "15px" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, this.isLoadingTaxonomy ? "Marka" : brands.length > 0 ? "Marka Se\xE7iniz" : "Marka"), this.isLoadingTaxonomy ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", disabled: true, style: { background: "#f8f9fa", color: "#888" } }, /* @__PURE__ */ (0, import_mithril.default)("option", null, "Y\xFCkleniyor...")) : brands.length > 0 ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", value: this.brand(), onchange: (e) => {
          this.brand(e.target.value);
          this.isDefaultBrand = false;
          this.model("");
          this.updateModels(e.target.value);
        } }, brands.length > 1 && /* @__PURE__ */ (0, import_mithril.default)("option", { value: "" }, "-- Marka Se\xE7 --"), brands.map((brandItem) => /* @__PURE__ */ (0, import_mithril.default)("option", { value: brandItem }, brandItem))) : /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            className: "FormControl",
            value: this.brand(),
            oninput: (e) => this.brand(e.target.value),
            placeholder: "Marka giriniz (\xD6rn: Mercedes-Benz)"
          }
        )), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, this.isLoadingTaxonomy ? "Model" : brands.length > 0 ? "Model Se\xE7iniz" : "Model"), this.isLoadingTaxonomy ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", disabled: true, style: { background: "#f8f9fa", color: "#888" } }, /* @__PURE__ */ (0, import_mithril.default)("option", null, "Y\xFCkleniyor...")) : brands.length > 0 ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", value: this.model(), onchange: (e) => this.model(e.target.value), disabled: !this.brand() }, /* @__PURE__ */ (0, import_mithril.default)("option", { value: "" }, "-- Model Se\xE7 --"), this.availableModels.map((mod) => /* @__PURE__ */ (0, import_mithril.default)("option", { value: mod.model }, mod.model))) : /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            className: "FormControl",
            value: this.model(),
            oninput: (e) => this.model(e.target.value),
            placeholder: "Model giriniz (\xD6rn: Travego)"
          }
        ))), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", gap: "15px", marginBottom: "20px" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "\xC7ekim Yeri"), /* @__PURE__ */ (0, import_mithril.default)("input", { className: "FormControl", value: this.location(), oninput: (e) => this.location(e.target.value) })), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 } }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "Y\u0131l"), /* @__PURE__ */ (0, import_mithril.default)("input", { className: "FormControl", type: "number", value: this.year(), oninput: (e) => this.year(e.target.value) }))))
      ), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { marginBottom: "15px", padding: "10px 12px", background: "#f8f9fa", borderRadius: "8px", border: "1px dashed #dcdfe6" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: this.customMusic() || this.customGps() ? "8px" : "0" } }, /* @__PURE__ */ (0, import_mithril.default)("span", { style: { fontSize: "12px", fontWeight: "600", color: "#555" } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-magic", style: { marginRight: "5px", color: "var(--primary-color, #e67e22)" } }), "G\xF6nderi \xD6zelle\u015Ftirme"), this.isMulti() ? this.renderCustomScopeSwitch() : null, /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          className: "Button Button--link",
          style: { padding: 0, fontSize: "12px", fontWeight: "bold" },
          onclick: this.openCustomizeModal.bind(this)
        },
        /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-sliders-h", style: { marginRight: "4px" } }),
        this.customMusic() || this.customGps() ? "D\xFCzenle" : "M\xFCzik / Konum Ekle"
      )), (this.customMusic() || this.customGps()) && /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" } }, this.customMusic() && /* @__PURE__ */ (0, import_mithril.default)("span", { style: { display: "inline-flex", alignItems: "center", gap: "5px", background: "#f3e8ff", color: "#7e22ce", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-music" }), this.customMusic().title, " - ", this.customMusic().artist, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-times", style: { cursor: "pointer", marginLeft: "3px" }, onclick: () => {
        this.customMusic(null);
        import_mithril.default.redraw();
      }, title: "Kald\u0131r" })), this.customGps() && /* @__PURE__ */ (0, import_mithril.default)("span", { style: { display: "inline-flex", alignItems: "center", gap: "5px", background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-map-marker-alt" }), "Konum Eklendi (", this.customGps().lat, ", ", this.customGps().lon, ")", /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-times", style: { cursor: "pointer", marginLeft: "3px" }, onclick: () => {
        this.customGps(null);
        import_mithril.default.redraw();
      }, title: "Kald\u0131r" })))), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "auto" } }, this.crosspostNodes ? /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          className: "Button",
          style: this.crosspostActive() ? { ...{ ...BTN, width: "100%", minWidth: 0, boxSizing: "border-box", padding: "0 12px", background: "#fff", color: "#2c3e50", border: "1px solid #dcdfe6" }, background: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd" } : { ...BTN, width: "100%", minWidth: 0, boxSizing: "border-box", padding: "0 12px", background: "#fff", color: "#2c3e50", border: "1px solid #dcdfe6" },
          title: "Di\u011Fer sitelerde hangi tart\u0131\u015Fmaya aktar\u0131laca\u011F\u0131n\u0131 se\xE7in",
          onclick: this.openCrosspost.bind(this)
        },
        /* @__PURE__ */ (0, import_mithril.default)("i", { className: this.crosspostActive() ? "fas fa-check-circle" : "fas fa-network-wired", style: { marginRight: "6px" } }),
        " Ortak Payla\u015F",
        this.crosspostActive() ? /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-times", title: "Ortak payla\u015F\u0131m\u0131 kald\u0131r", style: { marginLeft: "8px", opacity: 0.7 }, onclick: this.clearCrosspost.bind(this) }) : null
      ) : null, /* @__PURE__ */ (0, import_mithril.default)(Button, { className: "Button", style: this.crosspostNodes ? { ...BTN, width: "100%", minWidth: 0, boxSizing: "border-box", padding: "0 12px", background: "#fff", color: "#2c3e50", border: "1px solid #dcdfe6" } : { ...{ ...BTN, width: "100%", minWidth: 0, boxSizing: "border-box", padding: "0 12px", background: "#fff", color: "#2c3e50", border: "1px solid #dcdfe6" }, gridColumn: "1 / -1" }, onclick: this.goToInfo.bind(this) }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-info-circle", style: { marginRight: "6px" } }), " Info Ekle"), /* @__PURE__ */ (0, import_mithril.default)(Button, { className: "Button", style: { ...BTN, width: "100%", minWidth: 0, boxSizing: "border-box", padding: "0 12px", background: "#fff", color: "#2c3e50", border: "1px solid #dcdfe6" }, onclick: this.skip.bind(this) }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-forward", style: { marginRight: "6px" } }), " K\xFCnye Ekleme"), /* @__PURE__ */ (0, import_mithril.default)(Button, { className: "Button Button--primary", style: { ...BTN, width: "100%", minWidth: 0, boxSizing: "border-box", padding: "0 12px", border: "1px solid transparent" }, onclick: this.submit.bind(this) }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-check", style: { marginRight: "6px" } }), " Bilgileri Onayla")))));
    }
    // === ÇOKLU AÇIKLAMA ARAYÜZÜ ===
    renderCaptionModeSwitch() {
      const opt = (mode, icon, label) => {
        const active = this.captionMode() === mode;
        return /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", onclick: () => this.setCaptionMode(mode), title: mode === "single" ? "T\xFCm foto\u011Fraflara tek k\xFCnye" : "Her foto\u011Frafa ayr\u0131 k\xFCnye", style: {
          padding: "4px 11px",
          border: "none",
          borderRadius: "999px",
          cursor: "pointer",
          fontSize: "11px",
          fontWeight: 600,
          lineHeight: "16px",
          background: active ? "#1e293b" : "transparent",
          color: active ? "#fff" : "#64748b",
          transition: "all .15s"
        } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: icon, style: { marginRight: "5px", fontSize: "10px" } }), label);
      };
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Attribute-captionMode", style: { display: "flex", justifyContent: "flex-end", marginBottom: "10px" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "inline-flex", gap: "2px", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "2px", borderRadius: "999px" } }, opt("single", "fas fa-align-left", "Tek A\xE7\u0131klama"), opt("multi", "fas fa-images", "Birden \xC7ok")));
    }
    renderCustomScopeSwitch() {
      const opt = (scope, label, title) => /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", title, onclick: () => this.setCustomScope(scope), style: {
        padding: "3px 9px",
        border: "none",
        borderRadius: "999px",
        cursor: "pointer",
        fontSize: "10px",
        fontWeight: 600,
        background: this.customScope() === scope ? "#1e293b" : "transparent",
        color: this.customScope() === scope ? "#fff" : "#64748b"
      } }, label);
      return /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "inline-flex", gap: "2px", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "2px", borderRadius: "999px", marginLeft: "auto", marginRight: "8px" } }, opt("all", "T\xFCm G\xF6nderi", "M\xFCzik ve konum b\xFCt\xFCn foto\u011Fraflara uygulan\u0131r"), opt("photo", `Bu Foto\u011Fraf (${this.photoIndex + 1})`, "Her foto\u011Frafa ayr\u0131 m\xFCzik ve konum"));
    }
    setCustomScope(scope) {
      if (scope === this.customScope()) return;
      if (scope === "photo") {
        this.photoData[this.photoIndex] = this.snapshot();
        this.photoData = this.photoData.map((d) => d ? { ...d, customMusic: this.customMusic(), customGps: this.customGps() } : d);
      }
      this.customScope(scope);
      import_mithril.default.redraw();
    }
    /** Gönderiye yazılacak müzik/konum; fotoğrafa özelse fotoğraf sırasıyla dizi */
    customPayload() {
      const data = { music: this.customMusic(), gps: this.customGps(), perPhoto: null };
      if (this.isMulti() && this.customScope() === "photo") {
        this.photoData[this.photoIndex] = this.snapshot();
        data.perPhoto = this.files.map((f, i) => {
          const d = this.photoData[i];
          return { music: d && d.customMusic || null, gps: d && d.customGps || null };
        });
        data.music = null;
        data.gps = null;
      }
      return data;
    }
    renderPhotoNav() {
      const n = this.files.length;
      const i = this.photoIndex;
      const arrow = (dir) => {
        const target = i + dir;
        const disabled = target < 0 || target >= n;
        return /* @__PURE__ */ (0, import_mithril.default)(
          "button",
          {
            type: "button",
            disabled,
            title: dir < 0 ? "\xD6nceki foto\u011Fraf" : "Sonraki foto\u011Fraf",
            onclick: (e) => {
              e.stopPropagation();
              this.navPhoto(target);
            },
            style: {
              position: "absolute",
              top: "50%",
              [dir < 0 ? "left" : "right"]: "8px",
              transform: "translateY(-50%)",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "none",
              cursor: disabled ? "default" : "pointer",
              background: "rgba(255,255,255,0.92)",
              color: "#1e293b",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
              opacity: disabled ? 0.35 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }
          },
          /* @__PURE__ */ (0, import_mithril.default)("i", { className: dir < 0 ? "fas fa-chevron-left" : "fas fa-chevron-right" })
        );
      };
      return [
        arrow(-1),
        arrow(1),
        /* @__PURE__ */ (0, import_mithril.default)("span", { style: { position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "10px", pointerEvents: "none" } }, i + 1, " / ", n)
      ];
    }
    openCustomizeModal(e) {
      if (e) e.preventDefault();
      this.isConfirmed = true;
      const rawData = this.getRawData();
      const files = this.files;
      const session = this.session;
      const oncancel = this.oncancelCallback;
      const ongoback = this.ongobackCallback;
      const onsubmit = this.onsubmitCallback;
      const onskip = this.onskipCallback;
      const onInfo = this.onInfoCallback;
      const reopenAttributeModal = (customData) => {
        if (customData) {
          if (customData.music !== void 0) rawData.customMusic = customData.music;
          if (customData.gps !== void 0) rawData.customGps = customData.gps;
          if (rawData.customScope === "photo" && rawData.photoData && rawData.photoData[rawData.photoIndex]) {
            rawData.photoData[rawData.photoIndex].customMusic = rawData.customMusic;
            rawData.photoData[rawData.photoIndex].customGps = rawData.customGps;
          }
        }
        app_default.modal.show(_AttributeModal, {
          initialValues: rawData,
          files,
          session,
          oncancel,
          ongoback,
          onsubmit,
          onskip,
          onInfo
        });
      };
      app_default.modal.show(CustomizePostModal, {
        music: this.customMusic(),
        gps: this.customGps(),
        onconfirm: (customData) => {
          reopenAttributeModal(customData);
        },
        onback: () => {
          reopenAttributeModal(null);
        }
      });
    }
    // === DİNAMİK FORM RENDER ===
    renderDynamicForm() {
      const fieldsConfig = typeof this.categorySchema.fields_config === "string" ? JSON.parse(this.categorySchema.fields_config) : this.categorySchema.fields_config;
      if (!Array.isArray(fieldsConfig) || fieldsConfig.length === 0) return null;
      const brands = this.getSortedBrands();
      const rows = [];
      for (let i = 0; i < fieldsConfig.length; i += 2) {
        rows.push(fieldsConfig.slice(i, i + 2));
      }
      return /* @__PURE__ */ (0, import_mithril.default)("div", null, rows.map((row, rowIdx) => /* @__PURE__ */ (0, import_mithril.default)("div", { key: rowIdx, style: { display: "flex", gap: "15px", marginBottom: rowIdx === rows.length - 1 ? "20px" : "0" } }, row.map((field) => /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { flex: 1 }, key: field.key }, /* @__PURE__ */ (0, import_mithril.default)("label", null, field.label, field.required && /* @__PURE__ */ (0, import_mithril.default)("span", { style: { color: "#e74c3c" } }, "*")), this.renderDynamicField(field, brands))))));
    }
    renderDynamicField(field, brands) {
      const val = this.dynamicFields[field.key] || "";
      const inputStyle = { padding: "8px 12px", minHeight: "38px", lineHeight: "normal" };
      if (field.type === "taxonomy_select" && field.key === "brand") {
        return this.isLoadingTaxonomy ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", disabled: true, style: { ...inputStyle, background: "#f8f9fa", color: "#888" } }, /* @__PURE__ */ (0, import_mithril.default)("option", null, "Y\xFCkleniyor...")) : brands.length > 0 ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", value: val, style: inputStyle, onchange: (e) => {
          this.dynamicFields[field.key] = e.target.value;
          this.brand(e.target.value);
          this.model("");
          this.dynamicFields["model"] = "";
          this.updateModels(e.target.value);
        } }, brands.length > 1 && /* @__PURE__ */ (0, import_mithril.default)("option", { value: "" }, "-- ", field.label, " Se\xE7 --"), brands.map((b) => /* @__PURE__ */ (0, import_mithril.default)("option", { value: b }, b))) : /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            className: "FormControl",
            value: val,
            style: inputStyle,
            oninput: (e) => {
              this.dynamicFields[field.key] = e.target.value;
              this.brand(e.target.value);
            },
            placeholder: `${field.label} giriniz`
          }
        );
      }
      if (field.type === "taxonomy_select" && (field.key === "model" || field.parent === "brand")) {
        return this.isLoadingTaxonomy ? /* @__PURE__ */ (0, import_mithril.default)("select", { className: "FormControl", disabled: true, style: { ...inputStyle, background: "#f8f9fa", color: "#888" } }, /* @__PURE__ */ (0, import_mithril.default)("option", null, "Y\xFCkleniyor...")) : brands.length > 0 ? /* @__PURE__ */ (0, import_mithril.default)(
          "select",
          {
            className: "FormControl",
            value: val,
            style: inputStyle,
            onchange: (e) => {
              this.dynamicFields[field.key] = e.target.value;
              this.model(e.target.value);
            },
            disabled: !this.dynamicFields["brand"]
          },
          /* @__PURE__ */ (0, import_mithril.default)("option", { value: "" }, "-- ", field.label, " Se\xE7 --"),
          this.availableModels.map((mod) => /* @__PURE__ */ (0, import_mithril.default)("option", { value: mod.model }, mod.model))
        ) : /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            className: "FormControl",
            value: val,
            style: inputStyle,
            oninput: (e) => {
              this.dynamicFields[field.key] = e.target.value;
              this.model(e.target.value);
            },
            placeholder: `${field.label} giriniz`
          }
        );
      }
      if (field.type === "city_select") {
        return /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            list: `city-datalist-${field.key}`,
            className: "FormControl",
            style: inputStyle,
            placeholder: "\u015Eehir Se\xE7in veya Yaz\u0131n",
            value: val,
            onchange: (e) => {
              this.dynamicFields[field.key] = e.target.value;
              this.city(e.target.value);
              if (e.target.value) this.loadRoutesForCity(e.target.value);
            },
            oninput: (e) => {
              this.dynamicFields[field.key] = e.target.value;
            }
          }
        );
      }
      if (field.type === "route_select") {
        return /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            list: `route-datalist-${field.key}`,
            className: "FormControl",
            style: inputStyle,
            placeholder: this.isLoadingCityRoutes ? "Hatlar y\xFCkleniyor..." : "Hat Se\xE7in veya Yaz\u0131n",
            value: val,
            disabled: this.isLoadingCityRoutes,
            onchange: (e) => {
              this.dynamicFields[field.key] = e.target.value;
              this.route(e.target.value);
            },
            oninput: (e) => {
              this.dynamicFields[field.key] = e.target.value;
            }
          }
        );
      }
      if (field.type === "year") {
        return /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            className: "FormControl",
            type: "number",
            value: val || this.year(),
            style: inputStyle,
            oninput: (e) => {
              this.dynamicFields[field.key] = e.target.value;
              this.year(e.target.value);
            }
          }
        );
      }
      return /* @__PURE__ */ (0, import_mithril.default)(
        "input",
        {
          className: "FormControl",
          value: val,
          style: inputStyle,
          oninput: (e) => {
            this.dynamicFields[field.key] = e.target.value;
          },
          placeholder: field.label
        }
      );
    }
    getRawData() {
      const base = {
        company: this.company(),
        plate: this.plate(),
        brand: this.brand(),
        model: this.model(),
        location: this.location(),
        year: this.year(),
        city: this.city(),
        route: this.route(),
        fleetCode: this.fleetCode(),
        customMusic: this.customMusic(),
        customGps: this.customGps(),
        customScope: this.customScope()
      };
      if (this.dynamicFields) {
        Object.keys(this.dynamicFields).forEach((key) => {
          if (!base[key]) base[key] = this.dynamicFields[key];
        });
      }
      if (this.isMulti()) {
        this.photoData[this.photoIndex] = this.snapshot();
        base.captionMode = "multi";
        base.photoIndex = this.photoIndex;
        base.photoData = JSON.parse(JSON.stringify(this.photoData));
        base.customPerPhoto = this.customPayload().perPhoto;
      }
      return base;
    }
    prepareData() {
      if (this.categorySchema && this.categorySchema.output_template) {
        return this.prepareDynamicData();
      }
      const lines = [];
      if (this.isCityMode) {
        const brandVal2 = this.brand();
        const modelVal2 = this.model();
        let line12 = "";
        if (brandVal2 && modelVal2) line12 = `${brandVal2} ${modelVal2}`;
        else if (brandVal2) line12 = brandVal2;
        else if (modelVal2) line12 = modelVal2;
        if (line12) lines.push(`- **${line12}**`);
        const fleetVal = this.fleetCode();
        const plateVal2 = this.plate();
        let line22 = "";
        if (fleetVal && plateVal2) line22 = `${fleetVal} | ${plateVal2}`;
        else if (fleetVal) line22 = fleetVal;
        else if (plateVal2) line22 = plateVal2;
        if (line22) lines.push(`- **${line22}**`);
        const routeVal = this.route();
        let line32 = "";
        if (routeVal) {
          if (routeVal.includes(" | ")) {
            line32 = routeVal;
          } else {
            const dashIndex = routeVal.indexOf(" - ");
            if (dashIndex !== -1) {
              const code = routeVal.substring(0, dashIndex).trim();
              const name = routeVal.substring(dashIndex + 3).trim();
              line32 = `${code} | ${name}`;
            } else {
              line32 = routeVal;
            }
          }
        }
        if (line32) lines.push(`- **${line32}**`);
        const locVal2 = this.location();
        let yearVal2 = this.year();
        if (yearVal2) yearVal2 = "'" + yearVal2.toString().slice(-2);
        let line4 = "";
        if (locVal2 && yearVal2) line4 = `${locVal2} / ${yearVal2}`;
        else if (locVal2) line4 = locVal2;
        else if (yearVal2) line4 = yearVal2;
        if (line4) lines.push(`- **${line4}**`);
        return lines.length > 0 ? lines.join("\n") : null;
      }
      const firmVal = this.company();
      const plateVal = this.plate();
      let line1 = "";
      if (firmVal && plateVal) line1 = `${firmVal} | ${plateVal}`;
      else if (firmVal) line1 = firmVal;
      else if (plateVal) line1 = plateVal;
      if (line1) lines.push(`- **${line1}**`);
      const brandVal = this.brand();
      const modelVal = this.model();
      let line2 = "";
      if (brandVal && modelVal) line2 = `${brandVal} ${modelVal}`;
      else if (brandVal) line2 = brandVal;
      else if (modelVal) line2 = modelVal;
      if (line2) lines.push(`- **${line2}**`);
      const locVal = this.location();
      let yearVal = this.year();
      if (yearVal) yearVal = "'" + yearVal.toString().slice(-2);
      let line3 = "";
      if (locVal && yearVal) line3 = `${locVal} / ${yearVal}`;
      else if (locVal) line3 = locVal;
      else if (yearVal) line3 = yearVal;
      if (line3) lines.push(`- **${line3}**`);
      return lines.length > 0 ? lines.join("\n") : null;
    }
    prepareDynamicData() {
      const template = this.categorySchema.output_template;
      const values = { ...this.dynamicFields };
      if (!values.company && this.company()) values.company = this.company();
      if (!values.plate && this.plate()) values.plate = this.plate();
      if (!values.brand && this.brand()) values.brand = this.brand();
      if (!values.model && this.model()) values.model = this.model();
      if (!values.location && this.location()) values.location = this.location();
      if (!values.year && this.year()) values.year = this.year();
      if (!values.city && this.city()) values.city = this.city();
      if (!values.route && this.route()) values.route = this.route();
      if (!values.fleetCode && this.fleetCode()) values.fleetCode = this.fleetCode();
      let result = template;
      Object.keys(values).forEach((key) => {
        const val = String(values[key] || "").trim();
        if (key === "year" && val) {
          result = result.replace(new RegExp(`'\\{${key}\\}`, "g"), "'" + val.slice(-2));
        }
        result = result.replace(new RegExp(`\\{${key}\\}`, "g"), val);
      });
      result = result.replace(/\{[a-z_]+\}/gi, "");
      result = result.replace(/\|\s*\*\*/g, "**").replace(/\*\*\s*\|/g, "**");
      const lines = result.split("\n").filter((l) => {
        const cleaned = l.replace(/[-*\s]/g, "");
        return cleaned.length > 0;
      });
      return lines.length > 0 ? lines.join("\n") : null;
    }
    /** Onayda yazım standardı: kullanıcının yazdığı "Varan Turizm" de "Varan" olur (çoklu açıklamada her fotoğraf) */
    applyCanon() {
      const fix = (s) => {
        ["company", "brand", "model", "location"].forEach((f) => {
          if (s[f]) s[f] = canonValue(f, s[f]);
        });
        return s;
      };
      (this.photoData || []).forEach((s) => s && fix(s));
      const cur = fix(this.snapshot());
      this.company(cur.company || "");
      this.brand(cur.brand || "");
      this.model(cur.model || "");
      this.location(cur.location || "");
    }
    submit(e) {
      e.preventDefault();
      this.isConfirmed = true;
      this.learnAlias();
      this.applyCanon();
      const resultText = this.isMulti() ? this.buildPerPhotoTexts(true) : this.wrapKunye(this.prepareData(), true);
      const customData = this.customPayload();
      if (this.onsubmitCallback) this.onsubmitCallback(resultText, customData);
      app_default.modal.close();
    }
    /** AI'nın marka/modeli onayda farklı yazıldıysa sunucuya bildirilir (şehir içi ve kamyon başlıklarında öğrenilir) */
    learnAlias() {
      const raw = this.aiRaw;
      if (!raw || !raw.model || !this.model()) return;
      const fold = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9çğıöşü]+/g, " ").trim();
      if (fold(raw.brand + " " + raw.model) === fold(this.brand() + " " + this.model())) return;
      const discussion = app_default.current && typeof app_default.current.get === "function" ? app_default.current.get("discussion") : null;
      app_default.request({
        method: "POST",
        url: app_default.forum.attribute("apiUrl") + "/framio-media/ai-alias",
        body: { ai_brand: raw.brand, ai_model: raw.model, brand: this.brand(), model: this.model(), tag_slug: (this._currentTagSlugs || [])[0] || "", discussion_id: discussion ? discussion.id() : "" }
      }).catch(() => {
      });
    }
    goToInfo(e) {
      e.preventDefault();
      this.isConfirmed = true;
      const resultText = this.isMulti() ? this.buildPerPhotoTexts(false) : this.wrapKunye(this.prepareData(), false);
      const rawData = this.getRawData();
      if (this.onInfoCallback) this.onInfoCallback(resultText, rawData);
    }
    skip() {
      this.isConfirmed = true;
      const customData = this.customPayload();
      if (this.onskipCallback) this.onskipCallback(customData);
      app_default.modal.close();
    }
    cancel(e) {
      if (e) e.preventDefault();
      if (!this.isConfirmed) {
        if (confirm("Y\xFCkleme \u0130ptal Edilip \u0130mza Se\xE7imine Geri D\xF6n\xFClecektir. Onayl\u0131yor Musunuz?")) {
          this.isConfirmed = true;
          if (this.ongobackCallback) this.ongobackCallback();
          app_default.modal.close();
        }
      }
    }
  };

  // vendor/upload-exif/forum/components/InfoModal.js
  init_globals();
  var InfoModal = class extends Modal {
    oninit(vnode) {
      super.oninit(vnode);
      this.loading = false;
      this.onsubmitCallback = this.attrs.onsubmit;
      this.onbackCallback = this.attrs.onback;
      this.files = this.attrs.files || [];
      this.previews = this.files.map((f) => {
        try {
          return URL.createObjectURL(f);
        } catch (e) {
          return null;
        }
      });
      const initial = Array.isArray(this.attrs.initial) ? this.attrs.initial : [];
      this.entries = initial.length ? initial.map((e) => ({ ...e, photos: [...e.photos || []] })) : [this.newEntry()];
      this.active = 0;
    }
    onremove(vnode) {
      super.onremove(vnode);
      this.previews.forEach((u) => u && URL.revokeObjectURL(u));
    }
    newEntry(scope = "all") {
      return { scope, photos: [], text: "" };
    }
    className() {
      return "InfoModal Modal--large";
    }
    title() {
      return "Info Ekle";
    }
    entry() {
      return this.entries[this.active];
    }
    label(e, i) {
      if (e.scope === "all") return `Info ${i + 1} \xB7 T\xFCm g\xF6nderi`;
      return `Info ${i + 1} \xB7 ${e.photos.length ? "Foto\u011Fraf " + e.photos.map((p) => p + 1).join(", ") : "foto\u011Fraf se\xE7ilmedi"}`;
    }
    content() {
      const e = this.entry();
      const multiPhoto = this.files.length > 1;
      const chip = (active) => ({
        padding: "6px 12px",
        borderRadius: "999px",
        border: "1px solid " + (active ? "#1e293b" : "#e2e8f0"),
        background: active ? "#1e293b" : "#fff",
        color: active ? "#fff" : "#475569",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer"
      });
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modal-body" }, /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" } }, this.entries.map((x, i) => /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", style: chip(i === this.active), onclick: () => {
        this.active = i;
      } }, this.label(x, i), this.entries.length > 1 ? /* @__PURE__ */ (0, import_mithril.default)(
        "i",
        {
          className: "fas fa-times",
          style: { marginLeft: "8px", opacity: 0.7 },
          title: "Bu Info'yu kald\u0131r",
          onclick: (ev) => {
            ev.stopPropagation();
            this.entries.splice(i, 1);
            this.active = Math.max(0, Math.min(this.active, this.entries.length - 1));
          }
        }
      ) : null)), /* @__PURE__ */ (0, import_mithril.default)(
        "button",
        {
          type: "button",
          style: { ...chip(false), borderStyle: "dashed" },
          onclick: () => {
            this.entries.push(this.newEntry(multiPhoto ? "photos" : "all"));
            this.active = this.entries.length - 1;
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-plus", style: { marginRight: "6px" } }),
        " Info ekle"
      )), multiPhoto ? /* @__PURE__ */ (0, import_mithril.default)("div", { style: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px" } }, /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } }, /* @__PURE__ */ (0, import_mithril.default)("span", { style: { fontSize: "12px", fontWeight: 700, color: "#334155" } }, "Bu Info nereye ait?"), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "inline-flex", gap: "2px", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "2px", borderRadius: "999px" } }, [["all", "fas fa-align-left", "T\xFCm g\xF6nderi"], ["photos", "fas fa-images", "Se\xE7ilen foto\u011Fraflar"]].map(([s, ic, t]) => /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", onclick: () => {
        e.scope = s;
      }, style: {
        padding: "4px 11px",
        border: "none",
        borderRadius: "999px",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: 600,
        background: e.scope === s ? "#1e293b" : "transparent",
        color: e.scope === s ? "#fff" : "#64748b"
      } }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: ic, style: { marginRight: "5px", fontSize: "10px" } }), t)))), e.scope === "photos" ? /* @__PURE__ */ (0, import_mithril.default)("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" } }, this.files.map((f, i) => {
        const on = e.photos.includes(i);
        return /* @__PURE__ */ (0, import_mithril.default)(
          "div",
          {
            title: f.name,
            onclick: () => {
              on ? e.photos.splice(e.photos.indexOf(i), 1) : e.photos.push(i);
              e.photos.sort((a, b) => a - b);
            },
            style: {
              position: "relative",
              width: "72px",
              height: "54px",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "pointer",
              border: on ? "3px solid #3b82f6" : "1px solid #cbd5e1",
              opacity: on ? 1 : 0.65
            }
          },
          this.previews[i] ? /* @__PURE__ */ (0, import_mithril.default)("img", { src: this.previews[i], style: { width: "100%", height: "100%", objectFit: "cover" } }) : null,
          /* @__PURE__ */ (0, import_mithril.default)("span", { style: { position: "absolute", left: "4px", top: "3px", background: "rgba(0,0,0,.65)", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "8px" } }, i + 1),
          on ? /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-check-circle", style: { position: "absolute", right: "4px", bottom: "4px", color: "#3b82f6", background: "#fff", borderRadius: "50%" } }) : null
        );
      })) : null) : null, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Rich-Toolbar", style: { display: "flex", gap: "5px", padding: "5px", border: "1px solid #ddd", borderBottom: "none", background: "#f9f9f9", borderRadius: "4px 4px 0 0", flexWrap: "wrap" } }, this.renderButton("bold", "fa fa-bold", "Kal\u0131n"), this.renderButton("italic", "fa fa-italic", "\u0130talik"), this.renderButton("strikethrough", "fa fa-strikethrough", "\xDCst\xFC \xC7izili"), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { width: "1px", background: "#ccc", margin: "0 5px" } }), this.renderButton("url", "fa fa-link", "Ba\u011Flant\u0131"), this.renderButton("quote", "fa fa-quote-right", "Al\u0131nt\u0131"), this.renderButton("code", "fa fa-code", "Kod"), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { width: "1px", background: "#ccc", margin: "0 5px" } }), this.renderButton("list", "fa fa-list-ul", "Madde \u0130\u015Fareti"), this.renderButton("numlist", "fa fa-list-ol", "Numaral\u0131 Liste"), /* @__PURE__ */ (0, import_mithril.default)("div", { style: { width: "1px", background: "#ccc", margin: "0 5px" } }), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Toolbar-Item", style: { position: "relative", display: "flex", alignItems: "center" } }, /* @__PURE__ */ (0, import_mithril.default)("label", { htmlFor: "txtColor", style: { margin: 0, cursor: "pointer", padding: "5px" }, title: "Metin Rengi" }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fa fa-palette" })), /* @__PURE__ */ (0, import_mithril.default)("input", { type: "color", id: "txtColor", onchange: (ev) => this.insertColor(ev.target.value), style: { width: "20px", height: "20px", padding: 0, border: "none", background: "transparent", cursor: "pointer" } }))), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group" }, /* @__PURE__ */ (0, import_mithril.default)(
        "textarea",
        {
          className: "FormControl",
          rows: "9",
          value: e.text,
          oninput: (ev) => {
            e.text = ev.target.value;
          },
          id: "infoTextArea",
          placeholder: e.scope === "photos" ? "Se\xE7ilen foto\u011Fraflara \xF6zel bilgileri buraya girin\u2026" : "G\xF6nderinin tamam\u0131 i\xE7in detayl\u0131 bilgileri buraya girin\u2026",
          style: { borderRadius: "0 0 4px 4px", fontFamily: "monospace" },
          disabled: this.loading
        }
      )), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: { display: "flex", justifyContent: "space-between", gap: "10px" } }, /* @__PURE__ */ (0, import_mithril.default)(Button, { className: "Button Button--text", icon: "fas fa-arrow-left", onclick: this.back.bind(this), disabled: this.loading }, "K\xFCnye Ekran\u0131na D\xF6n"), /* @__PURE__ */ (0, import_mithril.default)(Button, { className: "Button Button--primary", onclick: this.submit.bind(this), loading: this.loading }, "Info'yu Tamamla ve Bitir")));
    }
    renderButton(type, iconClass, title) {
      return /* @__PURE__ */ (0, import_mithril.default)("button", { className: "Button Button--icon Button--link", type: "button", title, onclick: () => this.formatText(type) }, /* @__PURE__ */ (0, import_mithril.default)("i", { className: iconClass }));
    }
    wrapSelection(before, after) {
      const textarea = document.getElementById("infoTextArea");
      const e = this.entry();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      e.text = e.text.substring(0, start) + before + e.text.substring(start, end) + after + e.text.substring(end);
      import_mithril.default.redraw();
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, end + before.length);
      }, 50);
    }
    formatText(type) {
      const map = {
        bold: ["[b]", "[/b]"],
        italic: ["[i]", "[/i]"],
        strikethrough: ["[s]", "[/s]"],
        url: ["[url]", "[/url]"],
        quote: ["[quote]", "[/quote]"],
        code: ["[code]", "[/code]"],
        list: ["[list]\n[*]", "\n[/list]"],
        numlist: ["[list=1]\n[*]", "\n[/list]"]
      };
      if (map[type]) this.wrapSelection(map[type][0], map[type][1]);
    }
    insertColor(colorHex) {
      this.wrapSelection(`[color=${colorHex}]`, "[/color]");
    }
    /** Dolu Info'lar, yerleştirmeye hazır biçimde */
    result() {
      return this.entries.filter((e) => e.text.trim() !== "" && (e.scope === "all" || e.photos.length)).map((e) => {
        const quoted = e.text.split("\n").map((line) => "> " + line).join("\n");
        const formatted = e.scope === "all" ? `> [b][i]T R I V I A[/i][/b]
> 
${quoted}` : `> **\u{1F4F7} Foto\u011Fraf ${e.photos.map((p) => p + 1).join(", ")} \xB7 Merakl\u0131s\u0131na Info**
>
${quoted}`;
        return { scope: e.scope, photos: [...e.photos], text: e.text, formatted };
      });
    }
    finish(value) {
      const done = () => {
        this.loading = false;
        if (this.onsubmitCallback) this.onsubmitCallback(value);
        app_default.modal.close();
      };
      if (this.attrs.uploadPromise) {
        this.loading = true;
        import_mithril.default.redraw();
        this.attrs.uploadPromise.then(done).catch(() => {
          this.loading = false;
          import_mithril.default.redraw();
        });
      } else {
        done();
      }
    }
    submit(e) {
      e.preventDefault();
      const invalid = this.entries.find((x) => x.text.trim() !== "" && x.scope === "photos" && !x.photos.length);
      if (invalid) {
        this.active = this.entries.indexOf(invalid);
        app_default.alerts.show({ type: "error" }, "Foto\u011Frafa \xF6zel Info i\xE7in en az bir foto\u011Fraf se\xE7in.");
        return;
      }
      this.finish(this.result());
    }
    back(e) {
      e.preventDefault();
      if (this.onbackCallback) this.onbackCallback(this.entries);
    }
    // Çarpı (X) ile kapatılırsa Info'suz tamamlanır
    hide() {
      if (this.loading) return;
      this.finish([]);
    }
  };

  // vendor/upload-exif/forum/components/UploadButton.js
  var UploadButton = class extends Component {
    oninit(vnode) {
      super.oninit(vnode);
      this.loading = false;
      this.progressPercent = 0;
      this.fileProgresses = [];
      this.isHoveringCancel = false;
      this.session = null;
    }
    view() {
      if (this.loading) {
        const gradient = `linear-gradient(to right, #d4edda ${this.progressPercent}%, #f0f0f0 ${this.progressPercent}%)`;
        return /* @__PURE__ */ (0, import_mithril.default)(
          "button",
          {
            className: "Button spotter-upload-button hasIcon",
            type: "button",
            style: {
              background: this.isHoveringCancel ? "#f8d7da" : gradient,
              color: this.isHoveringCancel ? "#721c24" : "#555",
              border: "1px solid #ddd",
              transition: "none",
              minWidth: "130px"
            },
            onmouseenter: () => this.isHoveringCancel = true,
            onmouseleave: () => this.isHoveringCancel = false,
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (this.session) this.cancelUploads(this.session, false);
            }
          },
          this.isHoveringCancel ? /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-times" }) : /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-spinner fa-spin" }),
          /* @__PURE__ */ (0, import_mithril.default)("span", { className: "Button-label" }, this.isHoveringCancel ? " \u0130ptal Et" : this.progressPercent === 100 ? " \u0130\u015Fleniyor..." : ` Y\xFCkleniyor... %${this.progressPercent}`)
        );
      }
      const buttonClasses = ["Button", "spotter-upload-button", "hasIcon", "Button--link", "Button--icon"].join(" ");
      return /* @__PURE__ */ (0, import_mithril.default)(Tooltip, { text: "Foto\u011Fraf Y\xFCkle" }, /* @__PURE__ */ (0, import_mithril.default)("button", { className: buttonClasses, type: "button", onclick: () => !this.loading && this.element.querySelector("input").click() }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-camera" }), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "Button-label" }, "Foto\u011Fraf Y\xFCkle"), /* @__PURE__ */ (0, import_mithril.default)("input", { type: "file", multiple: true, accept: "image/*", style: "display:none", onchange: this.process.bind(this) })));
    }
    prefetchTaxonomy() {
      let discussionId = null;
      if (app_default.current && typeof app_default.current.get === "function") {
        const discussion = app_default.current.get("discussion");
        if (discussion) discussionId = discussion.id();
      }
      if (!discussionId) {
        const match = window.location.pathname.match(/\/d\/(\d+)/);
        if (match) discussionId = match[1];
      }
      const key = discussionId ? String(discussionId) : "global";
      window.__framioTaxonomyCache = window.__framioTaxonomyCache || {};
      if (!window.__framioTaxonomyCache[key]) {
        const params = discussionId ? { discussion_id: discussionId } : {};
        app_default.request({
          method: "GET",
          url: app_default.forum.attribute("apiUrl") + "/framio-media/taxonomy",
          params
        }).then((res) => {
          window.__framioTaxonomyCache[key] = res.data || [];
        }).catch(() => {
        });
      }
    }
    process(e) {
      const fileList = Array.from(e.target.files);
      if (fileList.length === 0) return;
      fileList.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true, sensitivity: "base" }));
      this.prefetchTaxonomy();
      prefetchAi(fileList[0]);
      app_default.modal.show(WatermarkModal, {
        files: fileList,
        onconfirm: (result) => this.startUpload(result.files || fileList, result)
      });
      e.target.value = "";
    }
    startUpload(fileList, result) {
      if (result && result.postAs && app_default.composer && app_default.composer.body && app_default.composer.body.attrs) {
        app_default.composer.body.attrs.framioPostAs = result.postAs;
      }
      this.loading = true;
      this.progressPercent = 0;
      this.fileProgresses = new Array(fileList.length).fill(0);
      this.isHoveringCancel = false;
      import_mithril.default.redraw();
      const session = {
        abortController: new AbortController(),
        completedUploads: [],
        fileList,
        result,
        isCancelled: false
      };
      this.session = session;
      const uploadPromise = this.performBackgroundUpload(fileList, result, session);
      this.openAttributeModal(uploadPromise, null, session);
    }
    // --- NAVİGASYON FONKSİYONLARI (Modallar arası geçiş) ---
    openAttributeModal(uploadPromise, initialData, session) {
      app_default.modal.show(AttributeModal, {
        initialValues: initialData,
        files: session.fileList,
        session,
        oncancel: () => {
          this.cancelUploads(session, false);
        },
        ongoback: () => {
          this.cancelUploads(session, true);
        },
        onsubmit: (attributeText, customData) => {
          if (!session.isCancelled) {
            this.attachCustomDataToSession(session, customData);
            this.finishProcess(uploadPromise, attributeText, null);
          }
        },
        onskip: (customData) => {
          if (!session.isCancelled) {
            this.attachCustomDataToSession(session, customData);
            this.finishProcess(uploadPromise, null, null);
          }
        },
        onInfo: (attributeText, rawData) => {
          if (!session.isCancelled) this.openInfoModal(uploadPromise, attributeText, rawData, session);
        }
      });
    }
    attachCustomDataToSession(session, customData) {
      if (!session || !customData) return;
      session.customMusic = customData.music || null;
      session.customGps = customData.gps || null;
      session.customPerPhoto = customData.perPhoto || null;
    }
    openInfoModal(uploadPromise, attributeText, rawData, session) {
      app_default.modal.show(InfoModal, {
        files: session.fileList,
        initial: session.infoEntries || null,
        onsubmit: (infoText) => {
          if (!session.isCancelled) {
            this.attachCustomDataToSession(session, { music: rawData?.customMusic, gps: rawData?.customGps, perPhoto: rawData?.customPerPhoto });
            this.finishProcess(uploadPromise, attributeText, infoText);
          }
        },
        onback: (entries) => {
          session.infoEntries = entries || null;
          this.openAttributeModal(uploadPromise, rawData, session);
        }
      });
    }
    cancelUploads(session, goBack) {
      session.isCancelled = true;
      session.abortController.abort();
      this.loading = false;
      import_mithril.default.redraw();
      app_default.alerts.show({ type: "info" }, "Y\xFCkleme i\u015Flemi iptal ediliyor, l\xFCtfen bekleyin...");
      const deletePromises = session.completedUploads.map((bbcode) => {
        const match = bbcode.match(/id=(\d+)/);
        if (match && match[1]) {
          return app_default.request({
            method: "DELETE",
            url: app_default.forum.attribute("apiUrl") + "/framio-media/image/" + match[1]
          }).catch((e) => console.warn("Silme hatas\u0131:", e));
        }
        return Promise.resolve();
      });
      Promise.all(deletePromises).then(() => {
        app_default.alerts.show({ type: "success" }, "\u0130\u015Flem iptal edildi.");
        if (goBack) {
          app_default.modal.show(WatermarkModal, {
            files: session.fileList,
            onconfirm: (res) => this.startUpload(res.files || session.fileList, res)
          });
        }
      });
    }
    // --- SONUÇLANDIRMA VE EDİTÖRE BASMA ---
    finishProcess(uploadPromise, attributeText, infoText) {
      const altFromKunye = (text) => {
        const parts = [...String(text || "").matchAll(/\*\*(.*?)\*\*/g)].map((m2) => m2[1].trim());
        return parts.slice(0, 2).join(" - ");
      };
      const withAlt = (code, text) => {
        const alt = altFromKunye(text);
        return alt ? code.replace(/alt="([^"]*)"/g, `alt="${alt.replace(/"/g, "&quot;")}"`) : code;
      };
      uploadPromise.then((validCodes) => {
        const s = this.session;
        if (s && Array.isArray(s.order) && Array.isArray(s.codesByIndex) && !s._orderApplied) {
          const original = s.codesByIndex;
          s.codesByIndex = s.order.map((o) => original[o] || null);
          s._orderApplied = true;
          validCodes = s.codesByIndex.filter(Boolean);
        }
        if (validCodes.length > 0) {
          let textToInsert;
          const infos = Array.isArray(infoText) ? infoText : infoText && infoText.trim() ? [{ scope: "all", photos: [], formatted: infoText }] : [];
          const photoInfos = infos.filter((x) => x.scope === "photos" && x.photos && x.photos.length);
          const lastPhotoOf = (x) => Math.max(...x.photos);
          infoText = infos.filter((x) => x.scope !== "photos").map((x) => x.formatted).join("\n>\n");
          if (Array.isArray(attributeText)) {
            const byIndex = this.session && this.session.codesByIndex || validCodes;
            const blocks = [];
            byIndex.forEach((code, i) => {
              if (!code) return;
              const kunye = attributeText[i];
              let block = withAlt(code, kunye) + (kunye ? "\n" + kunye : "");
              photoInfos.filter((x) => lastPhotoOf(x) === i).forEach((x) => {
                block += "\n\n" + x.formatted;
              });
              blocks.push(block);
            });
            validCodes = byIndex.filter(Boolean);
            textToInsert = blocks.join("\n\n");
          } else {
            if (attributeText) validCodes = validCodes.map((code) => withAlt(code, attributeText));
            textToInsert = validCodes.join("\n");
            if (attributeText) textToInsert += "\n" + attributeText;
            photoInfos.forEach((x) => {
              textToInsert += "\n\n" + x.formatted;
            });
          }
          if (infoText && infoText.trim() !== "") {
            textToInsert += "\n\n> **Merakl\u0131s\u0131na Info**\n>\n";
            const lines = infoText.split("\n");
            const quotedLines = lines.map((line) => `> ${line}`);
            textToInsert += quotedLines.join("\n") + "\n";
          } else {
            textToInsert += "\n";
          }
          if (this.attrs.editor && typeof this.attrs.editor.insertAtCursor === "function") {
            this.attrs.editor.insertAtCursor(textToInsert);
          } else if (app_default.composer && app_default.composer.editor) {
            app_default.composer.editor.insertAtCursor(textToInsert);
          }
          const cp = this.session && this.session.crosspost;
          if (cp && cp.mode === "payload" && cp.payload) {
            window.__framioCrosspostIntent = {
              mode: "payload",
              payload: cp.payload,
              imageIds: validCodes.map((c) => (c.match(/id="?(\d+)/) || [])[1]).filter(Boolean),
              // Yükleme sırasına göre görsel kimlikleri (seçilmeyen görsellerin eşlenmesi için)
              imageIdsByIndex: (this.session && this.session.codesByIndex || validCodes).map((c) => c && (c.match(/id="?(\d+)/) || [])[1] || null),
              at: Date.now()
            };
          }
          const perPhoto = this.session && this.session.customPerPhoto;
          const customTargets = perPhoto ? (this.session.codesByIndex || validCodes).map((code, i) => ({ code, ...perPhoto[i] || {} })).filter((t) => t.code && (t.music || t.gps)) : this.session && (this.session.customMusic || this.session.customGps) ? validCodes.map((code) => ({ code, music: this.session.customMusic, gps: this.session.customGps })) : [];
          if (customTargets.length) {
            customTargets.forEach(({ code, music: customMusic, gps: customGps }) => {
              const idMatch = code.match(/id=(\d+)/);
              if (idMatch && idMatch[1]) {
                const imageId = idMatch[1];
                let apiUrl2 = app_default.forum.attribute("apiUrl");
                if (window.location.protocol === "https:" && apiUrl2.startsWith("http:")) apiUrl2 = apiUrl2.replace(/^http:/, "https:");
                app_default.request({
                  method: "PATCH",
                  url: apiUrl2 + "/framio-media/image/" + imageId + "/custom-data",
                  body: {
                    custom_music: customMusic,
                    custom_gps: customGps
                  }
                }).catch((err) => {
                  console.warn("G\xF6rsel #" + imageId + " \xF6zelle\u015Ftirme verisi kaydedilemedi:", err);
                });
              }
            });
          }
        } else {
          app_default.alerts.show({ type: "error" }, "Y\xFCkleme ba\u015Far\u0131s\u0131z oldu.");
        }
      }).catch((err) => {
        console.error(err);
        app_default.alerts.show({ type: "error" }, "Bir hata olu\u015Ftu.");
      }).finally(() => {
        this.loading = false;
        import_mithril.default.redraw();
      });
    }
    // --- ARKA PLAN YÜKLEME İŞLEMLERİ ---
    performBackgroundUpload(fileList, result, session) {
      const selections = result.selections || [];
      const targetUsername = result.targetUsername || "";
      const targetWatermarkType = result.targetWatermarkType || "";
      const customFileNames = result.customFileNames || [];
      const CONCURRENCY = 2;
      const results = new Array(fileList.length).fill(null);
      const uploadOne = (index, attempt = 0) => {
        const file = fileList[index];
        let watermarkType = selections[index] || "none";
        if (watermarkType === "admin_override") watermarkType = "none";
        const customName = customFileNames[index] || "";
        return this.uploadFile(file, watermarkType, targetUsername, targetWatermarkType, customName, session, index).then((bbcode) => {
          if (!bbcode && !session.isCancelled && attempt < 2) {
            this.fileProgresses[index] = 0;
            return new Promise((r2) => setTimeout(r2, 1500 * (attempt + 1))).then(() => uploadOne(index, attempt + 1));
          }
          if (bbcode && !session.isCancelled) {
            session.completedUploads.push(bbcode);
          }
          return bbcode;
        }).catch((err) => {
          if (err.message === "AbortError") console.log("Y\xFCkleme iptal edildi:", file.name);
          return null;
        });
      };
      let next = 0;
      const worker = () => {
        if (session.isCancelled || next >= fileList.length) return Promise.resolve();
        const index = next++;
        return uploadOne(index).then((code) => {
          results[index] = code;
          return worker();
        });
      };
      const workers = Array.from({ length: Math.min(CONCURRENCY, fileList.length) }, worker);
      return Promise.all(workers).then(() => {
        session.codesByIndex = results;
        const failed = results.filter((code) => code === null).length;
        if (failed && !session.isCancelled) {
          app_default.alerts.show({ type: "error" }, `${failed} foto\u011Fraf y\xFCklenemedi (sunucu yan\u0131t vermedi). L\xFCtfen bu foto\u011Fraflar\u0131 tekrar y\xFCkleyin.`);
        }
        return results.filter((code) => code !== null);
      });
    }
    uploadFile(file, watermarkType, targetUsername, targetWatermarkType, customName, session, index) {
      return new Promise((resolve, reject) => {
        const data = new FormData();
        data.append("spotter_image", file);
        data.append("watermark_type", watermarkType);
        if (customName) data.append("custom_filename", customName);
        if (targetUsername) {
          data.append("target_username", targetUsername);
          if (targetWatermarkType) data.append("target_watermark_type", targetWatermarkType);
        }
        let apiUrl2 = app_default.forum.attribute("apiUrl");
        if (window.location.protocol === "https:" && apiUrl2.startsWith("http:")) apiUrl2 = apiUrl2.replace(/^http:/, "https:");
        const xhr = new window.FramioXHR();
        xhr.open("POST", apiUrl2 + "/framio-media/upload");
        xhr.setRequestHeader("X-CSRF-Token", app_default.session.csrfToken);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round(e.loaded / e.total * 100);
            this.fileProgresses[index] = percent;
            const totalPercent = Math.round(this.fileProgresses.reduce((a, b) => a + b, 0) / this.fileProgresses.length);
            this.progressPercent = totalPercent;
            import_mithril.default.redraw();
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.bbcode);
            } catch (err) {
              console.warn("Yan\u0131t ayr\u0131\u015Ft\u0131rma hatas\u0131:", err);
              resolve(null);
            }
          } else {
            console.warn("Sunucu hatas\u0131:", xhr.status);
            resolve(null);
          }
        };
        xhr.onerror = () => {
          console.warn("XHR Hatas\u0131");
          resolve(null);
        };
        const abortHandler = () => {
          xhr.abort();
          reject(new Error("AbortError"));
        };
        session.abortController.signal.addEventListener("abort", abortHandler);
        xhr.onloadend = () => {
          session.abortController.signal.removeEventListener("abort", abortHandler);
        };
        xhr.send(data);
      });
    }
  };

  // shim/TopicModal.js
  init_globals();
  var TopicModal = class extends Modal {
    oninit(vnode) {
      super.oninit(vnode);
      this.hooks = this.attrs.hooks;
      this.items = [];
      this.sel = null;
      this.q = "";
      this.loading = true;
      this.busy = false;
      this.done = false;
      this.err = "";
      Promise.resolve(this.hooks.suggest(this.attrs.files)).then((l) => {
        this.items = l || [];
        if (this.items.length && !this.sel) this.sel = this.items[0];
      }).catch(() => {
      }).finally(() => {
        this.loading = false;
        import_mithril.default.redraw();
      });
    }
    className() {
      return "TopicModal Modal--medium";
    }
    title() {
      return "Ba\u015Fl\u0131k Se\xE7";
    }
    onremove(vnode) {
      super.onremove(vnode);
      if (!this.done) this.attrs.oncancel && this.attrs.oncancel();
    }
    search() {
      const q = this.q.trim();
      if (!q) return;
      this.loading = true;
      import_mithril.default.redraw();
      Promise.resolve(this.hooks.search(q)).then((l) => {
        this.items = l || [];
        this.sel = this.items[0] || null;
      }).catch((e) => {
        this.err = String(e && e.message || e);
      }).finally(() => {
        this.loading = false;
        import_mithril.default.redraw();
      });
    }
    confirm() {
      if (!this.sel || this.busy) return;
      this.busy = true;
      import_mithril.default.redraw();
      Promise.resolve(this.hooks.pick(this.sel)).then((d) => {
        this.done = true;
        this.attrs.onpick(d);
        this.hide();
      }).catch((e) => {
        this.busy = false;
        this.err = String(e && e.message || e);
        import_mithril.default.redraw();
      });
    }
    content() {
      return (0, import_mithril.default)("div", { className: "Modal-body" }, [
        (0, import_mithril.default)("p", { className: "helpText" }, "Foto\u011Fraf yapay zek\xE2yla okundu; uygun ba\u015Fl\u0131klar \xF6nerildi. \u0130stersen de\u011Fi\u015Ftirebilir ya da arayabilirsin. K\xFCnye alanlar\u0131 ba\u015Fl\u0131\u011F\u0131n t\xFCr\xFCne g\xF6re gelir."),
        (0, import_mithril.default)("div", { className: "Form-group", style: "display:flex;gap:8px" }, [
          (0, import_mithril.default)("input", { className: "FormControl", style: "flex:1;min-width:0", placeholder: "Ba\u015Fl\u0131k ara ya da forum ba\u011Flant\u0131s\u0131n\u0131 yap\u0131\u015Ft\u0131r", value: this.q, oninput: (e) => {
            this.q = e.target.value;
          }, onkeydown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              this.search();
            }
          } }),
          (0, import_mithril.default)(Button, { className: "Button", style: "flex:none;background:var(--control-bg);color:var(--control-color)", onclick: () => this.search() }, "Ara")
        ]),
        this.err ? (0, import_mithril.default)("div", { className: "Alert Alert--error", style: "margin-bottom:10px" }, this.err) : null,
        this.loading ? (0, import_mithril.default)("div", { style: "padding:14px;text-align:center" }, [(0, import_mithril.default)(LoadingIndicator, { display: "inline" }), (0, import_mithril.default)("div", { className: "helpText" }, "Ba\u015Fl\u0131klar aran\u0131yor\u2026")]) : this.items.length ? (0, import_mithril.default)("div", { className: "Form-group" }, this.items.map((it) => (0, import_mithril.default)("button", {
          type: "button",
          className: "Button Button--block" + (this.sel === it ? " Button--primary" : ""),
          style: "display:block;width:100%;text-align:left;margin-bottom:6px;white-space:normal;" + (this.sel === it ? "" : "background:var(--control-bg);color:var(--text-color)"),
          onclick: () => {
            this.sel = it;
          }
        }, it.title))) : (0, import_mithril.default)("div", { className: "helpText", style: "padding:10px 0" }, "\xD6neri bulunamad\u0131; yukar\u0131dan arayabilirsin."),
        (0, import_mithril.default)("div", { className: "Form-group" }, (0, import_mithril.default)(Button, { className: "Button Button--primary Button--block", disabled: !this.sel || this.busy, loading: this.busy, onclick: () => this.confirm() }, "Bu ba\u015Fl\u0131\u011Fa devam et"))
      ]);
    }
  };

  // vendor/crosspost/forum/components/CrosspostModal.tsx
  init_globals();
  var CrosspostModal = class extends Modal {
    currentStep = 1;
    /** Eşleşen tartışma varsa sade onay ekranı */
    quickConfirm = false;
    loading = true;
    submitting = false;
    nodes = [];
    selectedNodes = {};
    targetTags = {};
    targetDiscussionUrls = {};
    targetDiscussionObjects = {};
    customTitle = "";
    customDescription = "";
    postMode = {};
    results = [];
    // Hedef Kategori / Marka Durumu (Özellikle Portfolyo ve Etiketler için)
    nodeCategories = {};
    loadingCategories = {};
    detectedBrand = "";
    // Görsel ve Önizleme
    extractedImages = [];
    /** Aktarılmayacak görseller (URL bazlı) */
    excludedImageUrls = {};
    postExcerpt = "";
    moveImage(fromIdx, toIdx) {
      if (fromIdx < 0 || fromIdx >= this.extractedImages.length) return;
      if (toIdx < 0 || toIdx >= this.extractedImages.length) return;
      const item = this.extractedImages.splice(fromIdx, 1)[0];
      this.extractedImages.splice(toIdx, 0, item);
      import_mithril.default.redraw();
    }
    // Hedef Konu Arama Durumu
    searchQueries = {};
    searchResults = {};
    searchingNodes = {};
    // İmza (Watermark) Durumu
    watermarkMode = "keep_source";
    selectedWatermarkId = null;
    customWatermarkBase64 = null;
    customWatermarkFileName = "";
    targetWatermarks = {};
    loadingWatermarks = {};
    applyToAll = true;
    /** Görsel başına seçilen imza (görsel URL'i => imza id) */
    wmPerImage = {};
    /** Görsellerin yönü için boyutları (URL => {w,h}) */
    imageDims = {};
    /** İmza dosyalarının en/boy oranı (URL => h/w) */
    wmRatios = {};
    /** Hedef sitenin imza dağıtım modu (templates | personal | hybrid) */
    targetWmMode = {};
    /** Açık site imzası menüsü (görsel URL'i) */
    openWmMenu = null;
    /** Kaynaktaki imzasız orijinal adresleri (görsel URL'i => orijinal) */
    originalSrc = {};
    /** İmzasız orijinali bulutta olmayan görseller (yeni imza basılmaz) */
    originalMissing = {};
    /** Büyütülmüş önizleme */
    zoomPreview = null;
    /** İmza adımında açık olan fotoğraf */
    activeWmIndex = 0;
    // Hedef Kullanıcı (Admin kullanıcı eşleme ve seçme)
    targetUsernames = {};
    targetUserObjects = {};
    userSearchQueries = {};
    userSearchResults = {};
    searchingUsers = {};
    showUserSearch = {};
    isPortfolioNode(node) {
      const url = (node.url || "").toLowerCase();
      const name = (node.name || "").toLowerCase();
      return url.includes("portfolyo") || name.includes("portfolyo");
    }
    detectBrandAndKunye() {
      let content = "";
      if (this.attrs.post) content = this.attrs.post.content() || "";
      else if (this.attrs.discussion) content = "";
      let kunyeText = "";
      const kunyeAttrMatch = content.match(/\bkunye=["']([^"']+)["']/i);
      if (kunyeAttrMatch) {
        kunyeText = kunyeAttrMatch[1].replace(/\\n/g, "\n");
      }
      if (!kunyeText) {
        const altMatch = content.match(/\[(?:framio-image|spotter-image|ulasimarsiv-image)[^\]]*\balt=["']([^"']+)["']/i);
        if (altMatch && altMatch[1] && (altMatch[1].includes("|") || altMatch[1].includes("-"))) {
          kunyeText = altMatch[1].trim();
        }
      }
      if (!kunyeText) {
        const cleanBody = content.replace(/\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\].*?\[\/(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)\]/gis, "").replace(/\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\]/gi, "").replace(/!\[.*?\]\(.*?\)/gi, "");
        const lines = cleanBody.split("\n").map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (line.includes("|")) {
            kunyeText = lines.slice(lines.indexOf(line)).join("\n");
            break;
          }
        }
      }
      let detectedBrand = "";
      let autoTitle = "";
      const brandKeywords = [
        { key: "setra", name: "Setra", patterns: [/setra/i, /s\s*\d{3}/i] },
        { key: "mercedes", name: "Mercedes-Benz", patterns: [/mercedes/i, /benz/i, /travego/i, /tourismo/i, /actros/i, /arocs/i, /atego/i] },
        { key: "man", name: "MAN", patterns: [/\bman\b/i, /lion'?s/i, /tgx/i, /tgs/i] },
        { key: "neoplan", name: "Neoplan", patterns: [/neoplan/i, /tourliner/i, /cityliner/i, /skyliner/i] },
        { key: "temsa", name: "TEMSA", patterns: [/temsa/i, /maraton/i, /safir/i, /prestij/i] },
        { key: "otokar", name: "Otokar", patterns: [/otokar/i, /kent/i, /sultan/i, /doruk/i] },
        { key: "scania", name: "Scania", patterns: [/scania/i, /irizar/i] },
        { key: "volvo", name: "Volvo", patterns: [/volvo/i, /9700/i, /9900/i, /fh/i] },
        { key: "ford", name: "Ford", patterns: [/ford/i, /f-max/i] },
        { key: "daf", name: "DAF", patterns: [/\bdaf\b/i, /xf/i, /cf/i] },
        { key: "iveco", name: "Iveco", patterns: [/iveco/i, /stralis/i, /s-way/i] },
        { key: "bmc", name: "BMC", patterns: [/\bbmc\b/i, /tugra/i, /neocity/i] },
        { key: "isuzu", name: "Isuzu", patterns: [/isuzu/i, /novociti/i, /turquoise/i] }
      ];
      if (kunyeText) {
        const lines = kunyeText.split("\n").map((l) => l.trim()).filter(Boolean);
        let company = "";
        let model = "";
        if (lines.length >= 2) {
          const line1 = lines[0];
          const line2 = lines[1];
          if (line1.includes("|")) {
            company = line1.split("|")[0].trim();
          } else {
            company = line1;
          }
          model = line2;
        } else if (lines.length === 1) {
          const singleLine = lines[0];
          if (singleLine.includes("-")) {
            const parts = singleLine.split("-");
            const left = parts[0].trim();
            model = parts.slice(1).join("-").trim();
            if (left.includes("|")) {
              company = left.split("|")[0].trim();
            } else {
              company = left;
            }
          } else if (singleLine.includes("|")) {
            const parts = singleLine.split("|");
            company = parts[0].trim();
            model = parts[1].trim();
          } else {
            company = singleLine;
          }
        }
        if (company && model) {
          autoTitle = `${company} & ${model}`;
        } else if (company) {
          autoTitle = company;
        } else if (model) {
          autoTitle = model;
        }
        for (const b of brandKeywords) {
          if (b.patterns.some((p) => p.test(model) || p.test(kunyeText) || p.test(content))) {
            detectedBrand = b.key;
            break;
          }
        }
      } else {
        for (const b of brandKeywords) {
          if (b.patterns.some((p) => p.test(content))) {
            detectedBrand = b.key;
            break;
          }
        }
      }
      return { brand: detectedBrand, title: autoTitle };
    }
    loadCategoriesForNode(nodeId) {
      this.loadingCategories[nodeId] = true;
      import_mithril.default.redraw();
      app_default.request({
        method: "GET",
        url: app_default.forum.attribute("apiUrl") + "/framio/crosspost/target-data",
        params: {
          action: "categories",
          node_id: nodeId
        }
      }).then((res) => {
        this.nodeCategories[nodeId] = res.categories || [];
        this.loadingCategories[nodeId] = false;
        const detected = this.detectedBrand || this.detectBrandAndKunye().brand;
        if (detected && this.nodeCategories[nodeId].length > 0) {
          const found = this.nodeCategories[nodeId].find((cat) => {
            const s = (cat.slug || "").toLowerCase();
            const n = (cat.name || "").toLowerCase();
            return s.includes(detected) || n.includes(detected);
          });
          if (found) {
            this.targetTags[nodeId] = found.slug;
          }
        }
        import_mithril.default.redraw();
      }).catch(() => {
        this.nodeCategories[nodeId] = [];
        this.loadingCategories[nodeId] = false;
        import_mithril.default.redraw();
      });
    }
    oninit(vnode) {
      super.oninit(vnode);
      const discussion = this.attrs.discussion || (this.attrs.post ? this.attrs.post.discussion() : null);
      if (discussion) {
        this.customTitle = discussion.title();
      }
      this.inspectPostContent();
      const kunyeInfo = this.detectBrandAndKunye();
      this.detectedBrand = kunyeInfo.brand;
      if (kunyeInfo.title) {
        this.customTitle = kunyeInfo.title;
      }
      const defaultWm = app_default.forum.attribute("framioCrosspostWmDefaultMode") || "keep_source";
      this.watermarkMode = defaultWm;
      const authorUser = this.attrs.post ? this.attrs.post.user() : discussion ? discussion.user() : null;
      const authorUsername = authorUser ? authorUser.username() : "";
      this.loading = true;
      app_default.request({
        method: "GET",
        url: app_default.forum.attribute("apiUrl") + "/framio/crosspost/nodes",
        params: discussion && discussion.id() ? { discussion_id: discussion.id() } : {}
      }).then((response) => {
        this.nodes = response.nodes || [];
        this.nodes.forEach((node) => {
          const isPort = this.isPortfolioNode(node);
          this.selectedNodes[node.id] = true;
          this.targetTags[node.id] = node.default_tag_slug || "";
          this.targetDiscussionUrls[node.id] = "";
          this.targetDiscussionObjects[node.id] = null;
          this.searchQueries[node.id] = "";
          this.searchResults[node.id] = [];
          this.searchingNodes[node.id] = false;
          this.postMode[node.id] = isPort ? "new_discussion" : this.isReplyContext() ? "reply" : "new_discussion";
          if (!isPort && node.mapped && node.mapped.url) {
            this.postMode[node.id] = "reply";
            this.targetDiscussionUrls[node.id] = node.mapped.url;
            this.targetDiscussionObjects[node.id] = { id: "", title: node.mapped.title || node.mapped.url, slug: "", comment_count: 0, url: node.mapped.url };
          }
          this.targetUsernames[node.id] = authorUsername;
          this.targetUserObjects[node.id] = null;
          this.userSearchQueries[node.id] = "";
          this.userSearchResults[node.id] = [];
          this.searchingUsers[node.id] = false;
          this.showUserSearch[node.id] = false;
          if (isPort) {
            this.loadCategoriesForNode(node.id);
          }
        });
        const mappedNodes = this.nodes.filter((n) => !this.isPortfolioNode(n) && n.mapped && n.mapped.url);
        if (mappedNodes.length) {
          this.quickConfirm = true;
          this.nodes.forEach((n) => {
            this.selectedNodes[n.id] = !!(n.mapped && n.mapped.url);
          });
        }
        this.restoreInitialPayload();
        this.loading = false;
        import_mithril.default.redraw();
      }).catch(() => {
        this.loading = false;
        import_mithril.default.redraw();
      });
    }
    isReplyContext() {
      if (this.attrs.deferred) return !!this.attrs.isReply;
      return !!(this.attrs.post && this.attrs.post.number() > 1);
    }
    /** Ertelenmiş modda önceki seçimi geri yükle */
    restoreInitialPayload() {
      const p = this.attrs.initialPayload;
      if (!p) return;
      this.quickConfirm = false;
      this.nodes.forEach((n) => {
        this.selectedNodes[n.id] = (p.target_nodes || []).includes(n.id);
      });
      Object.assign(this.targetTags, p.target_tags || {});
      Object.assign(this.targetUsernames, p.target_usernames || {});
      Object.entries(p.target_discussion_urls || {}).forEach(([id, url]) => {
        if (url) {
          this.targetDiscussionUrls[id] = url;
          this.postMode[id] = "reply";
        }
      });
      if (p.custom_title) this.customTitle = p.custom_title;
      if (p.custom_description) this.customDescription = p.custom_description;
      if (p.watermark_mode) this.watermarkMode = p.watermark_mode;
      this.selectedWatermarkId = p.watermark_id || null;
      this.excludedImageUrls = {};
      (p.excluded_image_indexes || []).forEach((i) => {
        if (this.extractedImages[i]) {
          this.excludedImageUrls[this.extractedImages[i].url] = true;
        }
      });
    }
    inspectPostContent() {
      if (this.attrs.deferred) {
        this.extractedImages = (this.attrs.previewImages || []).map((url) => ({ url }));
        this.postExcerpt = "";
        return;
      }
      let content = "";
      if (this.attrs.post) {
        content = this.attrs.post.content() || "";
      } else if (this.attrs.discussion) {
        content = "";
      }
      this.extractedImages = [];
      const seenUrls = /* @__PURE__ */ new Set();
      const bbRegex = /\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\]/gi;
      let match;
      while ((match = bbRegex.exec(content)) !== null) {
        const tag = match[0];
        const idMatch = tag.match(/\bid=['"]?(\d+)['"]?/i);
        const urlMatch = tag.match(/\burl=['"]([^'"]+)['"]/i) || tag.match(/\burl=([^\s\]]+)/i);
        const altMatch = tag.match(/\balt=['"]([^'"]*)['"]/i);
        if (urlMatch && urlMatch[1] && !seenUrls.has(urlMatch[1])) {
          seenUrls.add(urlMatch[1]);
          this.extractedImages.push({
            url: urlMatch[1],
            alt: altMatch ? altMatch[1] : "",
            id: idMatch ? parseInt(idMatch[1], 10) : void 0
          });
        }
      }
      const mdRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
      while ((match = mdRegex.exec(content)) !== null) {
        const alt = match[1];
        const url = match[2];
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url);
          this.extractedImages.push({ url, alt });
        }
      }
      const cleanText = content.replace(/\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\].*?\[\/(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)\]/gis, "").replace(/\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\]/gi, "").replace(/!\[.*?\]\(.*?\)/gi, "").replace(/[#*`_~>]/g, "").trim();
      this.postExcerpt = cleanText.length > 200 ? cleanText.substring(0, 197) + "..." : cleanText;
    }
    hasWatermarkOptions() {
      const wmAllowKeepSource = app_default.forum.attribute("framioCrosspostWmAllowKeepSource") !== false;
      const wmAllowTargetSite = app_default.forum.attribute("framioCrosspostWmAllowTargetSite") !== false;
      const wmAllowNoWatermark = !!app_default.forum.attribute("framioCrosspostWmAllowNoWatermark");
      const wmAllowCustomUpload = !!app_default.forum.attribute("framioCrosspostWmAllowCustomUpload");
      const anyEnabled = wmAllowKeepSource || wmAllowTargetSite || wmAllowNoWatermark || wmAllowCustomUpload;
      return this.extractedImages.length > 0 && anyEnabled;
    }
    className() {
      return "CrosspostModal Modal--medium";
    }
    title() {
      if (this.results.length > 0) {
        return "Aktar\u0131m Sonu\xE7lar\u0131";
      }
      if (this.quickConfirm) return "Ortak Payla\u015F\u0131m \u2014 E\u015Fle\u015Fen Tart\u0131\u015Fma";
      const postNum = this.attrs.post ? ` (#${this.attrs.post.number()})` : "";
      switch (this.currentStep) {
        case 1:
          return `Mesaj\u0131 A\u011Fa Aktar${postNum} \u2014 Hedef Platform`;
        case 2:
          return `Mesaj\u0131 A\u011Fa Aktar${postNum} \u2014 Konu & \xD6nizleme`;
        case 3:
          return `Mesaj\u0131 A\u011Fa Aktar${postNum} \u2014 \u0130mza Se\xE7imi`;
        default:
          return `Mesaj\u0131 A\u011Fa Aktar${postNum}`;
      }
    }
    content() {
      if (this.loading) {
        return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modal-body" }, /* @__PURE__ */ (0, import_mithril.default)(LoadingIndicator, null));
      }
      if (this.results.length > 0) {
        return this.renderResults();
      }
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modal-body CrosspostModal-body" }, !this.quickConfirm && this.renderStepper(), this.nodes.length === 0 ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Alert Alert--warning" }, app_default.translator.trans("framio-network-crosspost.forum.no_nodes")) : this.quickConfirm ? this.renderQuickConfirm() : /* @__PURE__ */ (0, import_mithril.default)("form", { onsubmit: (e) => {
        e.preventDefault();
      } }, this.currentStep === 1 && this.renderStep1(), this.currentStep === 2 && this.renderStep2(), this.currentStep === 3 && this.renderStep3()));
    }
    renderStepper() {
      const hasWm = this.hasWatermarkOptions();
      const steps = [
        { num: 1, title: "Hedef Platform", icon: "fas fa-network-wired" },
        { num: 2, title: "Konu & \xD6nizleme", icon: "fas fa-eye" },
        ...hasWm ? [{ num: 3, title: "\u0130mza Ayarlar\u0131", icon: "fas fa-stamp" }] : []
      ];
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostStepper" }, steps.map((st) => {
        const isActive = this.currentStep === st.num;
        const isPassed = this.currentStep > st.num;
        return /* @__PURE__ */ (0, import_mithril.default)("div", { className: `CrosspostStepper-item ${isActive ? "is-active" : ""} ${isPassed ? "is-passed" : ""}`, key: st.num }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostStepper-circle" }, isPassed ? /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-check" }) : /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: st.icon })), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostStepper-label" }, /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostStepper-num" }, "Ad\u0131m ", st.num), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostStepper-title" }, st.title)));
      }));
    }
    // ==========================================
    // ADIM 1: HEDEF VE MOD SEÇİMİ
    // ==========================================
    renderStep1() {
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostStep-content" }, /* @__PURE__ */ (0, import_mithril.default)("p", { className: "CrosspostModal-desc" }, "Bu i\xE7eri\u011Fi payla\u015Fmak istedi\u011Finiz hedef a\u011F platformlar\u0131n\u0131 ve aktar\u0131m t\xFCr\xFCn\xFC belirleyin."), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group" }, /* @__PURE__ */ (0, import_mithril.default)("label", { className: "CrosspostModal-field-label" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-heading" }), " Ba\u015Fl\u0131k"), /* @__PURE__ */ (0, import_mithril.default)(
        "input",
        {
          type: "text",
          className: "FormControl",
          value: this.customTitle,
          oninput: (e) => {
            this.customTitle = e.target.value;
          },
          placeholder: "Konu Ba\u015Fl\u0131\u011F\u0131..."
        }
      )), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-node-list" }, this.nodes.map((node) => {
        const isSelected = !!this.selectedNodes[node.id];
        const isPort = this.isPortfolioNode(node);
        const mode = this.postMode[node.id] || "new_discussion";
        return /* @__PURE__ */ (0, import_mithril.default)("div", { className: `CrosspostModal-node-item ${isSelected ? "is-selected" : ""}`, key: node.id }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-node-header" }, /* @__PURE__ */ (0, import_mithril.default)("label", null, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "checkbox",
            checked: isSelected,
            onchange: (e) => {
              this.selectedNodes[node.id] = e.target.checked;
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostModal-node-name" }, node.name)), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostModal-node-url" }, node.url)), isSelected && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-node-options" }, isPort ? /* @__PURE__ */ (0, import_mithril.default)("div", { style: "display: flex; align-items: center; gap: 8px; margin-top: 8px; color: #0369a1; background: #e0f2fe; padding: 8px 12px; border-radius: 6px; font-size: 13px;" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-camera" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, /* @__PURE__ */ (0, import_mithril.default)("strong", null, "Portfolyo Foto\u011Fraf\u0131:"), " \u0130\xE7erik, ilgili markan\u0131n alt\u0131nda ba\u011F\u0131ms\u0131z bir foto\u011Fraf g\xF6nderisi olarak payla\u015F\u0131lacakt\u0131r.")) : (this.attrs.post || this.isReplyContext()) && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-mode-radios" }, /* @__PURE__ */ (0, import_mithril.default)("label", { className: `CrosspostModal-radio-pill ${mode === "new_discussion" ? "is-active" : ""}` }, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "radio",
            name: `mode_${node.id}`,
            checked: mode === "new_discussion",
            onchange: () => {
              this.postMode[node.id] = "new_discussion";
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-plus-circle" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "Yeni Konu Ba\u015Flat")), /* @__PURE__ */ (0, import_mithril.default)("label", { className: `CrosspostModal-radio-pill ${mode === "reply" ? "is-active" : ""}` }, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "radio",
            name: `mode_${node.id}`,
            checked: mode === "reply",
            onchange: () => {
              this.postMode[node.id] = "reply";
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-reply" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "Mevcut Konuya Yan\u0131t Ekle"))), !isPort && mode === "new_discussion" && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-node-tag-input" }, /* @__PURE__ */ (0, import_mithril.default)("label", null, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-tag" }), " Hedef Etiket (Slug):"), /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "text",
            className: "FormControl",
            placeholder: app_default.translator.trans("framio-network-crosspost.forum.target_tag_placeholder"),
            value: this.targetTags[node.id] || "",
            oninput: (e) => {
              this.targetTags[node.id] = e.target.value;
            }
          }
        ))));
      })), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-actions" }, /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          type: "button",
          className: "Button",
          onclick: () => {
            this.hide();
          }
        },
        "\u0130ptal"
      ), /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          type: "button",
          className: "Button Button--primary",
          disabled: !Object.values(this.selectedNodes).some(Boolean),
          onclick: () => {
            this.currentStep = 2;
            this.prepareStep2();
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("span", null, "\u0130leri: Konu & \xD6nizleme"),
        /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-arrow-right" })
      )));
    }
    renderQuickConfirm() {
      const mapped = this.nodes.filter((n) => n.mapped && n.mapped.url);
      const others = this.nodes.filter((n) => !(n.mapped && n.mapped.url));
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostStep-content" }, /* @__PURE__ */ (0, import_mithril.default)("p", { className: "CrosspostModal-desc" }, "Bu tart\u0131\u015Fman\u0131n di\u011Fer sitelerdeki kar\u015F\u0131l\u0131\u011F\u0131 tan\u0131ml\u0131. \u0130\xE7erik a\u015Fa\u011F\u0131daki tart\u0131\u015Fmalara yan\u0131t olarak aktar\u0131ls\u0131n m\u0131?"), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-node-list" }, mapped.map((node) => /* @__PURE__ */ (0, import_mithril.default)("div", { className: `CrosspostModal-node-item ${this.selectedNodes[node.id] ? "is-selected" : ""}`, key: node.id }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-node-header" }, /* @__PURE__ */ (0, import_mithril.default)("label", null, /* @__PURE__ */ (0, import_mithril.default)(
        "input",
        {
          type: "checkbox",
          checked: !!this.selectedNodes[node.id],
          onchange: (e) => {
            this.selectedNodes[node.id] = e.target.checked;
          }
        }
      ), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostModal-node-name" }, node.name))), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetCard-new-info" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-link" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, /* @__PURE__ */ (0, import_mithril.default)("strong", null, node.mapped.title || "E\u015Fle\u015Fen tart\u0131\u015Fma"), /* @__PURE__ */ (0, import_mithril.default)("br", null), /* @__PURE__ */ (0, import_mithril.default)("a", { href: node.mapped.url, target: "_blank", rel: "noopener noreferrer", style: "font-size: 12px;" }, node.mapped.url)))))), this.extractedImages.length > 1 && /* @__PURE__ */ (0, import_mithril.default)("div", { style: "margin-top: 12px;" }, this.renderImagePicker()), this.watermarkMode === "target_site" && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostQuickWm" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostQuickWm-title" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-stamp" }), " \u0130mza"), this.renderWatermarkPicker(mapped.find((n) => this.selectedNodes[n.id]) || mapped[0])), others.length > 0 && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "helpText", style: "margin-top: 8px;" }, others.map((n) => n.name).join(", "), ' i\xE7in e\u015Fle\u015Fme yok; oraya da aktarmak i\xE7in "Farkl\u0131 Yer Se\xE7"i kullan\u0131n.'), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-actions" }, /* @__PURE__ */ (0, import_mithril.default)(Button, { type: "button", className: "Button", onclick: () => {
        this.quickConfirm = false;
        this.currentStep = 1;
      } }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-sliders-h" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "Farkl\u0131 Yer Se\xE7")), /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          type: "button",
          className: "Button Button--primary",
          loading: this.submitting,
          disabled: !Object.values(this.selectedNodes).some(Boolean) || this.extractedImages.length > 1 && this.selectedImageCount() === 0,
          onclick: this.onsubmit.bind(this)
        },
        /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-check" }),
        /* @__PURE__ */ (0, import_mithril.default)("span", null, "Evet, Buraya Aktar")
      )));
    }
    isImageExcluded(img) {
      return !!this.excludedImageUrls[img.url];
    }
    toggleImageExcluded(img) {
      this.excludedImageUrls[img.url] = !this.isImageExcluded(img);
      import_mithril.default.redraw();
    }
    selectedImageCount() {
      return this.extractedImages.filter((img) => !this.isImageExcluded(img)).length;
    }
    /** Birden çok görsel varsa hangilerinin aktarılacağını ve sırasını seçtiren görsel yöneticisi */
    renderImagePicker() {
      const imgs = this.extractedImages;
      if (imgs.length === 0) return null;
      const multi = imgs.length > 1;
      const count = this.selectedImageCount();
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostImagePicker" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostImagePicker-head", style: "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;" }, /* @__PURE__ */ (0, import_mithril.default)("span", null, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-images" }), " Aktar\u0131lacak g\xF6rseller: ", /* @__PURE__ */ (0, import_mithril.default)("strong", null, count, " / ", imgs.length), multi && /* @__PURE__ */ (0, import_mithril.default)("span", { style: "font-size: 11px; color: #64748b; margin-left: 8px;" }, "(Oklar\u0131 kullanarak kapak g\xF6rselini ve aktar\u0131m s\u0131ras\u0131n\u0131 belirleyebilirsiniz)")), multi && /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostImagePicker-bulk" }, /* @__PURE__ */ (0, import_mithril.default)("a", { onclick: () => {
        this.excludedImageUrls = {};
      } }, "T\xFCm\xFC"), " \xB7 ", /* @__PURE__ */ (0, import_mithril.default)("a", { onclick: () => {
        imgs.forEach((img) => {
          this.excludedImageUrls[img.url] = true;
        });
      } }, "Hi\xE7biri"))), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostPreviewBox-thumbnails", style: "display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px;" }, imgs.map((img, idx) => {
        const off = this.isImageExcluded(img);
        const isCover = idx === 0;
        return /* @__PURE__ */ (0, import_mithril.default)(
          "div",
          {
            className: "CrosspostPreviewBox-thumb-wrapper",
            key: img.url,
            style: "display: flex; flex-direction: column; align-items: center; gap: 4px;"
          },
          /* @__PURE__ */ (0, import_mithril.default)(
            "div",
            {
              className: `CrosspostPreviewBox-thumb ${multi ? "is-pickable" : ""} ${off ? "is-excluded" : "is-picked"}`,
              title: off ? "Aktar\u0131lmayacak \u2014 eklemek i\xE7in t\u0131klay\u0131n" : isCover ? "Kapak Foto\u011Fraf\u0131 (\u0130lk G\xF6rsel)" : "Aktar\u0131lacak \u2014 \xE7\u0131karmak i\xE7in t\u0131klay\u0131n",
              onclick: () => {
                if (multi) this.toggleImageExcluded(img);
              },
              style: `cursor: pointer; position: relative; width: 88px; height: 64px; border-radius: 6px; overflow: hidden; border: 2px solid ${isCover && !off ? "#0284c7" : off ? "#cbd5e1" : "#10b981"}; opacity: ${off ? "0.45" : "1"}; transition: all 0.2s;`
            },
            /* @__PURE__ */ (0, import_mithril.default)("img", { src: img.url, alt: img.alt || `G\xF6rsel ${idx + 1}`, style: "width: 100%; height: 100%; object-fit: cover;" }),
            multi && /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostImagePicker-check", style: "position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.65); border-radius: 50%; color: white; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px;" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: off ? "far fa-circle" : "fas fa-check-circle", style: off ? "color: #94a3b8;" : "color: #10b981;" })),
            /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostPreviewBox-thumb-id", style: "position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.7); color: white; font-size: 10px; padding: 1px 5px; border-radius: 3px; font-weight: bold;" }, idx + 1),
            isCover && !off && /* @__PURE__ */ (0, import_mithril.default)("span", { style: "position: absolute; bottom: 4px; right: 4px; background: #0284c7; color: white; font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: bold; text-transform: uppercase;" }, "Kapak")
          ),
          multi && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostThumb-order-buttons", style: "display: flex; gap: 4px;" }, /* @__PURE__ */ (0, import_mithril.default)(
            "button",
            {
              type: "button",
              className: "Button Button--icon Button--small",
              disabled: idx === 0,
              title: "Sola ta\u015F\u0131 (\xD6ne al)",
              onclick: (e) => {
                e.stopPropagation();
                this.moveImage(idx, idx - 1);
              },
              style: "padding: 2px 7px; font-size: 10px; line-height: 1; border-radius: 4px; background: #f1f5f9; border: 1px solid #cbd5e1; cursor: pointer;"
            },
            /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-chevron-left" })
          ), /* @__PURE__ */ (0, import_mithril.default)(
            "button",
            {
              type: "button",
              className: "Button Button--icon Button--small",
              disabled: idx === imgs.length - 1,
              title: "Sa\u011Fa ta\u015F\u0131 (Arkaya al)",
              onclick: (e) => {
                e.stopPropagation();
                this.moveImage(idx, idx + 1);
              },
              style: "padding: 2px 7px; font-size: 10px; line-height: 1; border-radius: 4px; background: #f1f5f9; border: 1px solid #cbd5e1; cursor: pointer;"
            },
            /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-chevron-right" })
          ))
        );
      })), multi && count === 0 && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostImagePicker-warn", style: "color: #ef4444; font-size: 12px; margin-top: 6px;" }, "En az bir g\xF6rsel se\xE7melisiniz."));
    }
    prepareStep2() {
      const selectedNodeIds = Object.keys(this.selectedNodes).filter((id) => this.selectedNodes[id]);
      selectedNodeIds.forEach((nodeId) => {
        const node = this.nodes.find((n) => n.id === nodeId);
        if (node && this.isPortfolioNode(node)) {
          if (!this.nodeCategories[nodeId] || this.nodeCategories[nodeId].length === 0) {
            this.loadCategoriesForNode(nodeId);
          }
        } else if (this.postMode[nodeId] === "reply") {
          if (!this.searchResults[nodeId] || this.searchResults[nodeId].length === 0) {
            this.searchDiscussions(nodeId, "");
          }
        }
      });
    }
    renderCategoryOptions(categories) {
      if (!categories || categories.length === 0) {
        return [
          /* @__PURE__ */ (0, import_mithril.default)("optgroup", { label: "Otob\xFCs" }, /* @__PURE__ */ (0, import_mithril.default)("option", { value: "otobussetra" }, "Setra"), /* @__PURE__ */ (0, import_mithril.default)("option", { value: "otobusmercedesbenz" }, "Mercedes-Benz"), /* @__PURE__ */ (0, import_mithril.default)("option", { value: "otobusman" }, "MAN"), /* @__PURE__ */ (0, import_mithril.default)("option", { value: "otobusneoplan" }, "Neoplan"), /* @__PURE__ */ (0, import_mithril.default)("option", { value: "temsa" }, "TEMSA"), /* @__PURE__ */ (0, import_mithril.default)("option", { value: "diger-markalar" }, "Di\u011Fer Markalar")),
          /* @__PURE__ */ (0, import_mithril.default)("option", { value: "otobus" }, "Otob\xFCs (Genel)"),
          /* @__PURE__ */ (0, import_mithril.default)("option", { value: "cekici-tir" }, "\xC7ekici / T\u0131r"),
          /* @__PURE__ */ (0, import_mithril.default)("option", { value: "kamyon" }, "Kamyon")
        ];
      }
      const parents = categories.filter((c) => !c.parentId);
      const children = categories.filter((c) => !!c.parentId);
      if (parents.length > 0 && children.length > 0) {
        return parents.map((parent) => {
          const subCats = children.filter((c) => c.parentId === parent.id);
          if (subCats.length > 0) {
            return /* @__PURE__ */ (0, import_mithril.default)("optgroup", { label: parent.name, key: parent.id }, subCats.map((sub) => /* @__PURE__ */ (0, import_mithril.default)("option", { value: sub.slug, key: sub.id }, sub.name)), /* @__PURE__ */ (0, import_mithril.default)("option", { value: parent.slug }, parent.name, " (Genel)"));
          }
          return /* @__PURE__ */ (0, import_mithril.default)("option", { value: parent.slug, key: parent.id }, parent.name);
        });
      }
      return categories.map((cat) => /* @__PURE__ */ (0, import_mithril.default)("option", { value: cat.slug, key: cat.id }, cat.name));
    }
    searchDiscussions(nodeId, query) {
      this.searchingNodes[nodeId] = true;
      import_mithril.default.redraw();
      app_default.request({
        method: "GET",
        url: app_default.forum.attribute("apiUrl") + "/framio/crosspost/target-data",
        params: {
          action: "discussions",
          node_id: nodeId,
          q: query
        }
      }).then((res) => {
        this.searchResults[nodeId] = res.discussions || [];
        this.searchingNodes[nodeId] = false;
        import_mithril.default.redraw();
      }).catch(() => {
        this.searchResults[nodeId] = [];
        this.searchingNodes[nodeId] = false;
        import_mithril.default.redraw();
      });
    }
    searchUsers(nodeId, query) {
      this.searchingUsers[nodeId] = true;
      import_mithril.default.redraw();
      app_default.request({
        method: "GET",
        url: app_default.forum.attribute("apiUrl") + "/framio/crosspost/target-data",
        params: {
          action: "users",
          node_id: nodeId,
          q: query
        }
      }).then((res) => {
        this.userSearchResults[nodeId] = res.users || [];
        this.searchingUsers[nodeId] = false;
        import_mithril.default.redraw();
      }).catch(() => {
        this.userSearchResults[nodeId] = [];
        this.searchingUsers[nodeId] = false;
        import_mithril.default.redraw();
      });
    }
    /** Görselin yönü: yükleme ekranındaki gibi yatay fotoğrafa yalnızca yatay imzalar önerilir */
    imageOrientation(url) {
      const d = this.imageDims[url];
      if (!d) {
        if (!(url in this.imageDims)) {
          this.imageDims[url] = void 0;
          const img = new Image();
          img.onload = () => {
            this.imageDims[url] = { w: img.naturalWidth, h: img.naturalHeight };
            import_mithril.default.redraw();
          };
          img.src = url;
        }
        return null;
      }
      return d.w >= d.h ? "landscape" : "portrait";
    }
    /** Önizleme için kaynaktaki imzasız orijinal (yoksa mesajdaki görsel) */
    previewSource(img) {
      if (img.id && !(img.url in this.originalSrc)) {
        this.originalSrc[img.url] = "";
        app_default.request({ method: "GET", url: app_default.forum.attribute("apiUrl") + "/framio-media/image/" + img.id }).then((res) => {
          const a = res && res.data && res.data.attributes || res || {};
          const orig = a.original_url || a.original_path || "";
          if (!orig) return;
          const probe = new Image();
          probe.onload = () => {
            this.originalSrc[img.url] = orig;
            import_mithril.default.redraw();
          };
          probe.onerror = () => {
            this.originalMissing[img.url] = true;
            import_mithril.default.redraw();
          };
          probe.src = orig;
        }).catch(() => {
        });
      }
      return this.originalSrc[img.url] || img.url;
    }
    watermarksForImage(url, all) {
      const orient = this.imageOrientation(url);
      if (!orient) return all;
      return all.filter((wm) => wm.type === orient || wm.type === "other");
    }
    /** Seçili imza yoksa ya da görselin yönüne uymuyorsa: önce kişisel imza, yoksa ilk site imzası */
    chosenWatermarkFor(url, all) {
      const list = this.watermarksForImage(url, all);
      let chosen = list.find((wm) => wm.id === this.wmPerImage[url]);
      if (!chosen && list.length) {
        chosen = list.find((wm) => wm.is_personal) || list.find((wm) => wm.id === this.selectedWatermarkId) || list[0];
        this.wmPerImage[url] = chosen.id;
      }
      return chosen || null;
    }
    chooseWatermark(url, wm) {
      this.wmPerImage[url] = wm.id;
      this.selectedWatermarkId = wm.id;
      this.openWmMenu = null;
      if (this.applyToAll) {
        this.extractedImages.forEach((other) => {
          if (other.url !== url && this.imageOrientation(other.url) === this.imageOrientation(url)) this.wmPerImage[other.url] = wm.id;
        });
      }
    }
    renderWmPreview(src, wm, large = false) {
      const ratio = wm ? this.wmRatios[wm.url] : void 0;
      const full = ratio !== void 0 && ratio > 0.3;
      const center = wm && /orta/i.test(wm.filename || wm.url);
      return /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          className: `CrosspostWmPreview ${large ? "is-large" : ""}`,
          title: large ? "" : "B\xFCy\xFCtmek i\xE7in t\u0131klay\u0131n",
          onclick: large ? void 0 : () => {
            this.zoomPreview = { src, wm };
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("img", { className: "CrosspostWmPreview-photo", src, alt: "", decoding: "async" }),
        wm && /* @__PURE__ */ (0, import_mithril.default)(
          "img",
          {
            className: `CrosspostWmPreview-wm ${full ? "is-full" : center ? "is-center" : "is-strip"}`,
            src: wm.url,
            alt: "",
            onload: (e) => {
              const el = e.target;
              if (!(wm.url in this.wmRatios) && el.naturalWidth) {
                this.wmRatios[wm.url] = el.naturalHeight / el.naturalWidth;
                import_mithril.default.redraw();
              }
            }
          }
        ),
        !large && /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostWmPreview-zoom" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-search-plus" }))
      );
    }
    wmButtonStyle(wm, swatch = false) {
      const st = {};
      if (wm.bg_color) st.background = wm.bg_color;
      if (wm.text_color) st.color = wm.text_color;
      if (wm.border_color) st.borderColor = wm.border_color;
      if (swatch && !wm.bg_color && !wm.border_color) st.background = "var(--control-bg)";
      return st;
    }
    /** Yükleme ekranındaki (WatermarkModal) düğmeler: kişisel imza + yöne uygun site imzası menüsü */
    renderWmControls(url, nodeId, all, chosen) {
      const mode = this.targetWmMode[nodeId] || "hybrid";
      const options = this.watermarksForImage(url, all);
      const personal = mode !== "templates" ? options.find((wm) => wm.is_personal) : void 0;
      const templates = mode !== "personal" ? options.filter((wm) => !wm.is_personal) : [];
      const selectedTemplate = chosen && !chosen.is_personal ? chosen : null;
      const open = this.openWmMenu === url;
      const orient = this.imageOrientation(url);
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-options" }, personal && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-optWrap" }, /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", className: "WmA-opt is-primary" + (chosen && chosen.id === personal.id ? " is-selected" : ""), onclick: () => this.chooseWatermark(url, personal) }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-signature" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "Ki\u015Fisel \u0130mza"))), templates.length > 0 && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Watermark-Dropdown-Container WmA-optWrap" }, /* @__PURE__ */ (0, import_mithril.default)(
        "button",
        {
          type: "button",
          className: "WmA-opt is-site" + (selectedTemplate ? " is-selected" : ""),
          style: selectedTemplate ? this.wmButtonStyle(selectedTemplate) : void 0,
          onclick: (e) => {
            e.preventDefault();
            this.openWmMenu = open ? null : url;
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-stamp" }),
        /* @__PURE__ */ (0, import_mithril.default)("span", null, selectedTemplate ? selectedTemplate.label || selectedTemplate.name : "Site \u0130mzas\u0131 Se\xE7"),
        /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-chevron-down WmA-chevron" + (open ? " is-open" : "") })
      ), open && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-menu" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "WmA-menuHead" }, orient === "portrait" ? "Dikey" : "Yatay", " foto\u011Fraf imzalar\u0131"), templates.map((wm) => {
        const on = chosen && chosen.id === wm.id;
        return /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", className: "WmA-menuItem" + (on ? " is-selected" : ""), onclick: () => this.chooseWatermark(url, wm) }, /* @__PURE__ */ (0, import_mithril.default)("span", { className: "WmA-menuLabel" }, /* @__PURE__ */ (0, import_mithril.default)("span", { className: "WmA-swatch", style: this.wmButtonStyle(wm, true) }), wm.label || wm.name), on ? /* @__PURE__ */ (0, import_mithril.default)("i", { className: "fas fa-check" }) : null);
      }))), !personal && !templates.length && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Alert Alert--info" }, "Hedef sitede bu y\xF6ne uygun imza bulunamad\u0131."));
    }
    /** Normal yüklemedeki gibi: her görsel için imzasız önizleme ve yönüne uygun imzalar */
    renderWatermarkPicker(node) {
      if (!node) return null;
      if (this.targetWatermarks[node.id] === void 0 && !this.loadingWatermarks[node.id]) {
        this.loadWatermarksForNode(node.id);
      }
      if (this.loadingWatermarks[node.id]) return /* @__PURE__ */ (0, import_mithril.default)("div", { style: "padding: 12px; text-align: center;" }, /* @__PURE__ */ (0, import_mithril.default)(LoadingIndicator, null));
      const all = this.targetWatermarks[node.id] || [];
      if (!all.length) return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Alert Alert--info" }, "Hedef platformda tan\u0131ml\u0131 imza dosyas\u0131 bulunamad\u0131.");
      const images = this.extractedImages.filter((img) => !this.isImageExcluded(img));
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmPerImage", onclick: (e) => e.stopPropagation() }, (() => {
        const idx = Math.min(this.activeWmIndex, images.length - 1);
        const img = images[idx];
        if (!img) return null;
        const chosen = this.chosenWatermarkFor(img.url, all);
        const orient = this.imageOrientation(img.url);
        return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmPerImage-row", key: "active" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmPerImage-main" }, this.renderWmPreview(this.previewSource(img), chosen), images.length > 1 && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmStrip" }, images.map((other, i) => /* @__PURE__ */ (0, import_mithril.default)(
          "button",
          {
            type: "button",
            className: "CrosspostWmStrip-item" + (i === idx ? " is-active" : ""),
            key: other.url,
            onclick: () => {
              this.activeWmIndex = i;
              this.openWmMenu = null;
            },
            title: i + 1 + ". foto\u011Fraf"
          },
          /* @__PURE__ */ (0, import_mithril.default)("img", { src: other.url, alt: "", loading: "lazy" }),
          /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostWmStrip-num" }, i + 1)
        )))), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmPerImage-side" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmPerImage-orient" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: orient === "portrait" ? "fas fa-mobile-alt" : "fas fa-image" }), " ", images.length > 1 ? idx + 1 + "/" + images.length + " \xB7 " : "", orient === "portrait" ? "Dikey foto\u011Fraf" : orient === "landscape" ? "Yatay foto\u011Fraf" : "Foto\u011Fraf"), this.originalMissing[img.url] ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Alert Alert--warning CrosspostWmNoOriginal" }, "Bu foto\u011Fraf\u0131n imzas\u0131z orijinali kaynakta bulunamad\u0131. \xDCst \xFCste imza olmamas\u0131 i\xE7in mevcut imzas\u0131yla aktar\u0131lacak.") : this.renderWmControls(img.url, node.id, all, chosen)));
      })(), this.zoomPreview && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmZoom", onclick: () => {
        this.zoomPreview = null;
      } }, this.renderWmPreview(this.zoomPreview.src, this.zoomPreview.wm, true), /* @__PURE__ */ (0, import_mithril.default)("button", { type: "button", className: "CrosspostWmZoom-close", "aria-label": "Kapat" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-times" }))));
    }
    loadWatermarksForNode(nodeId, username) {
      this.loadingWatermarks[nodeId] = true;
      import_mithril.default.redraw();
      const targetUser = username !== void 0 ? username : this.targetUsernames[nodeId] || "";
      app_default.request({
        method: "GET",
        url: app_default.forum.attribute("apiUrl") + "/framio/crosspost/target-data",
        params: {
          action: "watermarks",
          node_id: nodeId,
          username: targetUser
        }
      }).then((res) => {
        this.targetWatermarks[nodeId] = res.watermarks || [];
        this.targetWmMode[nodeId] = res.mode || "hybrid";
        this.loadingWatermarks[nodeId] = false;
        if (this.targetWatermarks[nodeId].length > 0) {
          const currentValid = this.targetWatermarks[nodeId].some((wm) => wm.id === this.selectedWatermarkId);
          if (!currentValid || !this.selectedWatermarkId) {
            this.selectedWatermarkId = this.targetWatermarks[nodeId][0].id;
          }
        } else {
          this.selectedWatermarkId = null;
        }
        import_mithril.default.redraw();
      }).catch(() => {
        this.targetWatermarks[nodeId] = [];
        this.loadingWatermarks[nodeId] = false;
        import_mithril.default.redraw();
      });
    }
    // ==========================================
    // ADIM 2: KONU SEÇİMİ VE İÇERİK ÖNİZLEME
    // ==========================================
    renderStep2() {
      const currentUser = app_default.session.user;
      const isAdmin = currentUser && (currentUser.isAdmin ? currentUser.isAdmin() : currentUser.data?.attributes?.isAdmin);
      const allowSelectUserSetting = app_default.forum.attribute("framioCrosspostAllowAdminSelectUser") !== false;
      const canAdminSelectUser = !!isAdmin && allowSelectUserSetting;
      const selectedNodes = this.nodes.filter((n) => this.selectedNodes[n.id]);
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostStep-content" }, /* @__PURE__ */ (0, import_mithril.default)("p", { className: "CrosspostModal-desc" }, "Hedef sitedeki tart\u0131\u015Fmay\u0131 canl\u0131 arayarak se\xE7in veya do\u011Frudan ba\u011Flant\u0131 verin."), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-target-selection-section" }, selectedNodes.map((node) => {
        const isPort = this.isPortfolioNode(node);
        const mode = this.postMode[node.id] || "new_discussion";
        const selectedDiscussion = this.targetDiscussionObjects[node.id];
        const currentUrl = this.targetDiscussionUrls[node.id] || "";
        const isSearching = !!this.searchingNodes[node.id];
        const results = this.searchResults[node.id] || [];
        const targetUsername = this.targetUsernames[node.id] || "";
        const categories = this.nodeCategories[node.id] || [];
        const isLoadingCats = !!this.loadingCategories[node.id];
        const currentTag = this.targetTags[node.id] || "";
        return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetCard", key: node.id }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetCard-header" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetCard-title" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: isPort ? "fas fa-camera" : "fas fa-server" }), /* @__PURE__ */ (0, import_mithril.default)("strong", null, node.name)), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostTargetCard-badge", style: isPort ? "background: #0284c7; color: white;" : "" }, isPort ? "Portfolyo Foto\u011Fraf\u0131" : mode === "new_discussion" ? "Yeni Konu" : "Yan\u0131t Ekle")), isPort ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetCard-portfolio-body", style: "padding: 16px; background: #f8fafc; border-radius: 8px; margin-top: 10px;" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: "margin-bottom: 12px;" }, /* @__PURE__ */ (0, import_mithril.default)("label", { style: "display: flex; align-items: center; gap: 6px; font-weight: 600; margin-bottom: 6px;" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-tags", style: "color: #0284c7;" }), " Hedef Ara\xE7 Markas\u0131 / Kategorisi:"), isLoadingCats ? /* @__PURE__ */ (0, import_mithril.default)("div", { style: "padding: 10px 0;" }, /* @__PURE__ */ (0, import_mithril.default)(LoadingIndicator, null)) : /* @__PURE__ */ (0, import_mithril.default)(
          "select",
          {
            className: "FormControl",
            value: currentTag,
            onchange: (e) => {
              this.targetTags[node.id] = e.target.value;
            }
          },
          /* @__PURE__ */ (0, import_mithril.default)("option", { value: "" }, "-- Marka / Kategori Se\xE7in --"),
          this.renderCategoryOptions(categories)
        ), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "helpText", style: "margin-top: 6px; font-size: 12px; color: #64748b;" }, this.detectedBrand ? /* @__PURE__ */ (0, import_mithril.default)("span", null, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-magic", style: "color: #0284c7;" }), " K\xFCnye bilgilerinden ", /* @__PURE__ */ (0, import_mithril.default)("strong", null, '"', this.detectedBrand.toUpperCase(), '"'), " markas\u0131 alg\u0131lanarak otomatik se\xE7ildi. Gerekirse a\xE7\u0131l\u0131r men\xFCden de\u011Fi\u015Ftirebilirsiniz.") : /* @__PURE__ */ (0, import_mithril.default)("span", null, "\u0130\xE7eri\u011Fin portfolyoda listelenece\u011Fi ilgili markay\u0131 veya kategoriyi se\xE7in."))), /* @__PURE__ */ (0, import_mithril.default)("div", { style: "padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;" }, /* @__PURE__ */ (0, import_mithril.default)("div", { style: "display: flex; align-items: center; gap: 6px; color: #0f172a; font-weight: 600; margin-bottom: 4px;" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-check-circle", style: "color: #10b981;" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "Portfolyo Kay\u0131t \xD6zeti:")), /* @__PURE__ */ (0, import_mithril.default)("div", { style: "color: #334155;" }, /* @__PURE__ */ (0, import_mithril.default)("strong", null, "Ba\u015Fl\u0131k:"), " ", this.customTitle.replace(/\[(?:framio-image|spotter-image|ulasimarsiv-image|upl-image-preview)[^\]]*\]/gi, "").trim() || "Ba\u015Fl\u0131ks\u0131z"), /* @__PURE__ */ (0, import_mithril.default)("div", { style: "color: #64748b; font-size: 12px; margin-top: 4px;" }, "Bu mesaj forumda bir konunun yan\u0131t\u0131 olsa bile, portfolyoda se\xE7ilen markan\u0131n alt\u0131nda ba\u011F\u0131ms\u0131z bir foto\u011Fraf g\xF6nderisi olarak yay\u0131mlanacakt\u0131r."))) : mode === "new_discussion" ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetCard-new-info" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-info-circle" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "Bu platformda ", /* @__PURE__ */ (0, import_mithril.default)("strong", null, '"', this.customTitle, '"'), " ba\u015Fl\u0131\u011F\u0131yla yeni bir tart\u0131\u015Fma olu\u015Fturulacak.")) : /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetCard-reply-body" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostSearch-bar" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostSearch-input-wrapper" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-search" }), /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "text",
            className: "FormControl",
            placeholder: `${node.name} \xFCzerinde konu ara...`,
            value: this.searchQueries[node.id] || "",
            oninput: (e) => {
              this.searchQueries[node.id] = e.target.value;
            },
            onkeydown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                this.searchDiscussions(node.id, this.searchQueries[node.id] || "");
              }
            }
          }
        )), /* @__PURE__ */ (0, import_mithril.default)(
          Button,
          {
            type: "button",
            className: "Button Button--primary",
            loading: isSearching,
            onclick: () => {
              this.searchDiscussions(node.id, this.searchQueries[node.id] || "");
            }
          },
          "Ara"
        )), isSearching ? /* @__PURE__ */ (0, import_mithril.default)("div", { style: "padding: 20px; text-align: center;" }, /* @__PURE__ */ (0, import_mithril.default)(LoadingIndicator, null)) : results.length > 0 ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostDiscussionList" }, results.map((disc) => {
          const isChosen = currentUrl === disc.url || selectedDiscussion && selectedDiscussion.id === disc.id;
          return /* @__PURE__ */ (0, import_mithril.default)(
            "div",
            {
              className: `CrosspostDiscussionItem ${isChosen ? "is-selected" : ""}`,
              key: disc.id,
              onclick: () => {
                this.targetDiscussionUrls[node.id] = disc.url;
                this.targetDiscussionObjects[node.id] = disc;
                import_mithril.default.redraw();
              }
            },
            /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostDiscussionItem-main" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostDiscussionItem-title" }, isChosen && /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-check-circle", style: "color: #059669; margin-right: 6px;" }), disc.title), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostDiscussionItem-meta" }, /* @__PURE__ */ (0, import_mithril.default)("span", null, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "far fa-comment" }), " ", disc.comment_count, " mesaj"), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostDiscussionItem-url" }, disc.url))),
            /* @__PURE__ */ (0, import_mithril.default)(
              Button,
              {
                type: "button",
                className: `Button Button--small ${isChosen ? "Button--primary" : ""}`
              },
              isChosen ? "Se\xE7ildi" : "Se\xE7"
            )
          );
        })) : /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostSearch-empty" }, /* @__PURE__ */ (0, import_mithril.default)("span", null, "Konu bulunamad\u0131. A\u015Fa\u011F\u0131dan do\u011Frudan URL veya ID girebilirsiniz.")), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostManualUrl-row" }, /* @__PURE__ */ (0, import_mithril.default)("label", null, "Veya do\u011Frudan Konu URL / ID:"), /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "text",
            className: "FormControl",
            placeholder: "\xD6rn: http://forum.../d/132-nostalji-otobusler veya 132",
            value: this.targetDiscussionUrls[node.id] || "",
            oninput: (e) => {
              this.targetDiscussionUrls[node.id] = e.target.value;
            }
          }
        ))), canAdminSelectUser && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetUserSection" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetUserSection-header" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetUserSection-title" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-user-tag" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "Hedef Forumdaki Yazar / Sahip:"), /* @__PURE__ */ (0, import_mithril.default)("strong", null, targetUsername ? `@${targetUsername}` : "Varsay\u0131lan Yazar")), /* @__PURE__ */ (0, import_mithril.default)(
          Button,
          {
            type: "button",
            className: "Button Button--link Button--small",
            onclick: () => {
              this.showUserSearch[node.id] = !this.showUserSearch[node.id];
              if (this.showUserSearch[node.id] && (!this.userSearchResults[node.id] || this.userSearchResults[node.id].length === 0)) {
                this.searchUsers(node.id, this.userSearchQueries[node.id] || "");
              }
              import_mithril.default.redraw();
            }
          },
          /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: this.showUserSearch[node.id] ? "fas fa-chevron-up" : "fas fa-user-edit" }),
          /* @__PURE__ */ (0, import_mithril.default)("span", null, this.showUserSearch[node.id] ? "Kapat" : "De\u011Fi\u015Ftir")
        )), this.showUserSearch[node.id] && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetUserSearch-dropdown" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostSearch-input-wrapper" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-search" }), /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "text",
            className: "FormControl",
            placeholder: `${node.name} \xFCzerinde \xFCye ara...`,
            value: this.userSearchQueries[node.id] || "",
            oninput: (e) => {
              this.userSearchQueries[node.id] = e.target.value;
            },
            onkeydown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                this.searchUsers(node.id, this.userSearchQueries[node.id] || "");
              }
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)(
          Button,
          {
            type: "button",
            className: "Button Button--primary Button--small",
            loading: !!this.searchingUsers[node.id],
            onclick: () => {
              this.searchUsers(node.id, this.userSearchQueries[node.id] || "");
            }
          },
          "Ara"
        )), this.searchingUsers[node.id] ? /* @__PURE__ */ (0, import_mithril.default)("div", { style: "padding: 12px; text-align: center;" }, /* @__PURE__ */ (0, import_mithril.default)(LoadingIndicator, null)) : (this.userSearchResults[node.id] || []).length > 0 ? /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetUser-list" }, (this.userSearchResults[node.id] || []).map((u) => {
          const isSelectedUser = targetUsername === u.username;
          return /* @__PURE__ */ (0, import_mithril.default)(
            "div",
            {
              className: `CrosspostTargetUser-item ${isSelectedUser ? "is-selected" : ""}`,
              key: u.id,
              onclick: () => {
                this.targetUsernames[node.id] = u.username;
                this.targetUserObjects[node.id] = u;
                this.showUserSearch[node.id] = false;
                this.loadWatermarksForNode(node.id, u.username);
                import_mithril.default.redraw();
              }
            },
            /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetUser-avatar" }, u.avatar_url ? /* @__PURE__ */ (0, import_mithril.default)("img", { src: u.avatar_url, alt: u.username }) : /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-user-circle" })),
            /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostTargetUser-info" }, /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostTargetUser-name" }, u.display_name), /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostTargetUser-username" }, "@", u.username)),
            isSelectedUser && /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-check", className: "CrosspostTargetUser-check" })
          );
        })) : /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostSearch-empty", style: "padding: 8px 12px; font-size: 12px;" }, "\xDCye bulunamad\u0131. Kullan\u0131c\u0131 ad\u0131n\u0131 arama kutusuna yaz\u0131p enter'a bas\u0131n."))));
      })), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostPreviewBox" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostPreviewBox-header" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-file-alt" }), /* @__PURE__ */ (0, import_mithril.default)("strong", null, "Ta\u015F\u0131nacak \u0130\xE7erik \xD6nizlemesi"), this.extractedImages.length > 0 && /* @__PURE__ */ (0, import_mithril.default)("span", { className: "CrosspostPreviewBox-img-count" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-camera" }), " ", this.extractedImages.length, " G\xF6rsel")), this.renderImagePicker(), this.postExcerpt && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostPreviewBox-excerpt" }, this.postExcerpt)), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Form-group", style: "margin-top: 16px;" }, /* @__PURE__ */ (0, import_mithril.default)("label", { style: "display: flex; justify-content: space-between; align-items: center; font-weight: 600; margin-bottom: 6px;" }, /* @__PURE__ */ (0, import_mithril.default)("span", { style: "display: flex; align-items: center; gap: 6px; color: #1e293b;" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-comment-alt", style: "color: #0284c7;" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, "A\xE7\u0131klama Ekle (\u0130ste\u011Fe Ba\u011Fl\u0131):")), /* @__PURE__ */ (0, import_mithril.default)("span", { style: "font-size: 11px; font-weight: normal; color: #64748b;" }, "Bo\u015F b\u0131rak\u0131l\u0131rsa k\xFCnye veya konu metni kullan\u0131l\u0131r")), /* @__PURE__ */ (0, import_mithril.default)(
        "textarea",
        {
          className: "FormControl",
          rows: 3,
          placeholder: "Foto\u011Fraf, ara\xE7 veya \xE7ekim hakk\u0131nda portfolyoda g\xF6r\xFCnecek \xF6zel bir a\xE7\u0131klama yazabilirsiniz...",
          value: this.customDescription,
          oninput: (e) => {
            this.customDescription = e.target.value;
          }
        }
      )), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-actions" }, /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          type: "button",
          className: "Button",
          onclick: () => {
            this.currentStep = 1;
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-arrow-left" }),
        /* @__PURE__ */ (0, import_mithril.default)("span", null, "Geri: Platform Se\xE7imi")
      ), this.hasWatermarkOptions() ? /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          type: "button",
          className: "Button Button--primary",
          disabled: this.extractedImages.length > 1 && this.selectedImageCount() === 0,
          onclick: () => {
            this.currentStep = 3;
            this.prepareStep3();
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("span", null, "\u0130leri: \u0130mza Se\xE7imi"),
        /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-arrow-right" })
      ) : /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          type: "button",
          className: "Button Button--primary",
          loading: this.submitting,
          onclick: this.onsubmit.bind(this)
        },
        /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-network-wired" }),
        /* @__PURE__ */ (0, import_mithril.default)("span", null, this.attrs.deferred ? "Kaydet" : "A\u011Fa Aktar")
      )));
    }
    prepareStep3() {
      const selectedNodes = this.nodes.filter((n) => this.selectedNodes[n.id]);
      selectedNodes.forEach((node) => {
        if (!this.targetWatermarks[node.id]) {
          this.loadWatermarksForNode(node.id);
        }
      });
    }
    // ==========================================
    // ADIM 3: İMZA (WATERMARK) SEÇİMİ
    // ==========================================
    renderStep3() {
      const wmAllowKeepSource = app_default.forum.attribute("framioCrosspostWmAllowKeepSource") !== false;
      const wmAllowTargetSite = app_default.forum.attribute("framioCrosspostWmAllowTargetSite") !== false;
      const wmAllowNoWatermark = !!app_default.forum.attribute("framioCrosspostWmAllowNoWatermark");
      const wmAllowCustomUpload = !!app_default.forum.attribute("framioCrosspostWmAllowCustomUpload");
      const selectedNodes = this.nodes.filter((n) => this.selectedNodes[n.id]);
      const firstNode = selectedNodes[0];
      const targetWms = firstNode ? this.targetWatermarks[firstNode.id] || [] : [];
      const isLoadingWms = firstNode ? !!this.loadingWatermarks[firstNode.id] : false;
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostStep-content" }, /* @__PURE__ */ (0, import_mithril.default)("p", { className: "CrosspostModal-desc" }, "Aktar\u0131lacak ", /* @__PURE__ */ (0, import_mithril.default)("strong", null, this.selectedImageCount(), " adet g\xF6rsel"), " i\xE7in uygulanacak imza y\xF6ntemini se\xE7in."), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceList" }, wmAllowKeepSource && /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          className: `CrosspostWmChoiceCard ${this.watermarkMode === "keep_source" ? "is-selected" : ""}`,
          onclick: () => {
            this.watermarkMode = "keep_source";
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("label", null, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "radio",
            name: "wm_mode",
            checked: this.watermarkMode === "keep_source",
            onchange: () => {
              this.watermarkMode = "keep_source";
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-info" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-title" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-image" }), " Kaynak Sitedeki \u0130mzay\u0131 Koru"), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-desc" }, "Foto\u011Fraflar mevcut imzalar\u0131yla oldu\u011Fu gibi korunarak ta\u015F\u0131n\u0131r.")))
      ), wmAllowTargetSite && /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          className: `CrosspostWmChoiceCard ${this.watermarkMode === "target_site" ? "is-selected" : ""}`,
          onclick: () => {
            this.watermarkMode = "target_site";
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("label", null, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "radio",
            name: "wm_mode",
            checked: this.watermarkMode === "target_site",
            onchange: () => {
              this.watermarkMode = "target_site";
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-info" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-title" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-exchange-alt" }), " Hedef Sitenin \u0130mzas\u0131n\u0131 Uygula"), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-desc" }, "\u0130mzas\u0131z orijinal foto\u011Fraf indirilir ve hedef sitenin imzas\u0131 bas\u0131larak y\xFCklenir."))),
        this.watermarkMode === "target_site" && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmTargetSubList", onclick: (e) => e.stopPropagation() }, firstNode && this.targetUsernames[firstNode.id] && /* @__PURE__ */ (0, import_mithril.default)("div", { style: "font-size: 12px; color: var(--muted-color, #64748b); margin-bottom: 8px;" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-user-circle", style: "margin-right: 5px; color: var(--primary-color, #0ea5e9);" }), /* @__PURE__ */ (0, import_mithril.default)("strong", null, "@", this.targetUsernames[firstNode.id]), " ad\u0131na haz\u0131rlanm\u0131\u015F imza se\xE7enekleri:"), this.renderWatermarkPicker(firstNode))
      ), wmAllowNoWatermark && /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          className: `CrosspostWmChoiceCard ${this.watermarkMode === "no_watermark" ? "is-selected" : ""}`,
          onclick: () => {
            this.watermarkMode = "no_watermark";
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("label", null, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "radio",
            name: "wm_mode",
            checked: this.watermarkMode === "no_watermark",
            onchange: () => {
              this.watermarkMode = "no_watermark";
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-info" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-title" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-ban" }), " \u0130mzas\u0131z Ta\u015F\u0131 (Temiz / Orijinal)"), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-desc" }, "Foto\u011Fraflar\u0131n imzas\u0131z orijinal halleri do\u011Frudan hedef siteye aktar\u0131l\u0131r.")))
      ), wmAllowCustomUpload && /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          className: `CrosspostWmChoiceCard ${this.watermarkMode === "custom" ? "is-selected" : ""}`,
          onclick: () => {
            this.watermarkMode = "custom";
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)("label", null, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "radio",
            name: "wm_mode",
            checked: this.watermarkMode === "custom",
            onchange: () => {
              this.watermarkMode = "custom";
            }
          }
        ), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-info" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-title" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-upload" }), " Kendi \u0130mzan\u0131 Y\xFCkle (PNG)"), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmChoiceCard-desc" }, "\xD6zel bir \u015Feffaf PNG imza dosyas\u0131 y\xFCkleyin ve foto\u011Fraflara bu imza uygulans\u0131n."))),
        this.watermarkMode === "custom" && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmUploadBox", onclick: (e) => e.stopPropagation() }, /* @__PURE__ */ (0, import_mithril.default)(
          "input",
          {
            type: "file",
            accept: "image/png",
            onchange: (e) => {
              const file = e.target.files?.[0];
              if (file) {
                this.customWatermarkFileName = file.name;
                const reader = new FileReader();
                reader.onload = (re) => {
                  this.customWatermarkBase64 = re.target?.result;
                  import_mithril.default.redraw();
                };
                reader.readAsDataURL(file);
              }
            }
          }
        ), this.customWatermarkBase64 && /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostWmUploadPreview" }, /* @__PURE__ */ (0, import_mithril.default)("img", { src: this.customWatermarkBase64, alt: "\xD6zel \u0130mza" }), /* @__PURE__ */ (0, import_mithril.default)("span", null, this.customWatermarkFileName)))
      )), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostApplyAllRow" }, /* @__PURE__ */ (0, import_mithril.default)("label", null, /* @__PURE__ */ (0, import_mithril.default)(
        "input",
        {
          type: "checkbox",
          checked: this.applyToAll,
          onchange: (e) => {
            this.applyToAll = e.target.checked;
          }
        }
      ), /* @__PURE__ */ (0, import_mithril.default)("span", null, "Se\xE7ilen imza y\xF6ntemini aktar\u0131lacak t\xFCm g\xF6rsellere (", this.selectedImageCount(), ") uygula"))), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-actions" }, /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          type: "button",
          className: "Button",
          onclick: () => {
            this.currentStep = 2;
          }
        },
        /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-arrow-left" }),
        /* @__PURE__ */ (0, import_mithril.default)("span", null, "Geri: Konu & \xD6nizleme")
      ), /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          type: "button",
          className: "Button Button--primary",
          loading: this.submitting,
          onclick: this.onsubmit.bind(this)
        },
        /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-network-wired" }),
        /* @__PURE__ */ (0, import_mithril.default)("span", null, this.attrs.deferred ? "Kaydet" : "A\u011Fa Aktar (\xC7apraz Payla\u015F)")
      )));
    }
    // ==========================================
    // SONUÇLAR EKRANI
    // ==========================================
    renderResults() {
      return /* @__PURE__ */ (0, import_mithril.default)("div", { className: "Modal-body CrosspostModal-body" }, /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-results" }, this.results.map((res, i) => /* @__PURE__ */ (0, import_mithril.default)(
        "div",
        {
          key: i,
          className: `CrosspostModal-result-item ${res.success ? "is-success" : "is-error"}`
        },
        /* @__PURE__ */ (0, import_mithril.default)("div", null, /* @__PURE__ */ (0, import_mithril.default)("strong", null, res.node, ": "), /* @__PURE__ */ (0, import_mithril.default)("span", null, res.success ? res.message || "Ba\u015Far\u0131l\u0131" : res.error || "Hata olu\u015Ftu")),
        res.url && /* @__PURE__ */ (0, import_mithril.default)("a", { href: res.url, target: "_blank", rel: "noopener noreferrer" }, /* @__PURE__ */ (0, import_mithril.default)(Icon, { name: "fas fa-external-link-alt" }), " ", app_default.translator.trans("framio-network-crosspost.forum.view_crosspost"))
      ))), /* @__PURE__ */ (0, import_mithril.default)("div", { className: "CrosspostModal-actions", style: "margin-top: 20px;" }, /* @__PURE__ */ (0, import_mithril.default)(
        Button,
        {
          type: "button",
          className: "Button Button--primary",
          onclick: () => {
            this.hide();
          }
        },
        "Kapat"
      )));
    }
    onsubmit() {
      const selectedNodeIds = Object.keys(this.selectedNodes).filter((id) => this.selectedNodes[id]);
      if (selectedNodeIds.length === 0) return;
      this.submitting = true;
      this.results = [];
      const discussion = this.attrs.discussion || (this.attrs.post ? this.attrs.post.discussion() : null);
      const targetUserIds = {};
      selectedNodeIds.forEach((nodeId) => {
        if (this.targetUserObjects[nodeId]) {
          targetUserIds[nodeId] = this.targetUserObjects[nodeId].id;
        }
      });
      const payload = {
        target_nodes: selectedNodeIds,
        target_tags: this.targetTags,
        target_discussion_urls: Object.fromEntries(
          Object.entries(this.targetDiscussionUrls).filter(([id, url]) => url && this.postMode[id] === "reply")
        ),
        custom_title: this.customTitle,
        custom_description: this.customDescription,
        watermark_mode: this.watermarkMode,
        watermark_id: this.selectedWatermarkId,
        watermark_map: this.watermarkMode === "target_site" ? this.wmPerImage : {},
        custom_watermark: this.customWatermarkBase64,
        target_usernames: this.targetUsernames,
        target_user_ids: targetUserIds
      };
      const activeImages = this.extractedImages.filter((img) => !this.isImageExcluded(img));
      payload.ordered_image_urls = activeImages.map((img) => img.url);
      payload.ordered_image_ids = activeImages.filter((img) => img.id).map((img) => img.id);
      const excluded = this.extractedImages.map((img, i) => ({ img, i })).filter(({ img }) => this.isImageExcluded(img));
      if (excluded.length) {
        if (this.attrs.deferred) {
          payload.excluded_image_indexes = excluded.map(({ i }) => i);
        } else {
          payload.excluded_image_ids = excluded.filter(({ img }) => img.id).map(({ img }) => img.id);
          payload.excluded_image_urls = excluded.map(({ img }) => img.url);
        }
      }
      if (this.attrs.deferred) {
        this.submitting = false;
        if (this.attrs.onconfirm) this.attrs.onconfirm(payload);
        app_default.alerts.show({ type: "success" }, "Ortak payla\u015F\u0131m ayarland\u0131; g\xF6nderi yay\u0131mlan\u0131nca se\xE7ilen yerlere aktar\u0131lacak.");
        this.hide();
        return;
      }
      if (this.attrs.post) {
        payload.post_id = this.attrs.post.id();
        if (discussion) {
          payload.discussion_id = discussion.id();
        }
      } else if (discussion) {
        payload.discussion_id = discussion.id();
      }
      app_default.request({
        method: "POST",
        url: app_default.forum.attribute("apiUrl") + "/framio/crosspost/outbound",
        body: payload
      }).then((resp) => {
        this.submitting = false;
        this.results = resp.results || [];
        app_default.alerts.show({ type: "success" }, app_default.translator.trans("framio-network-crosspost.forum.success_msg"));
        import_mithril.default.redraw();
      }).catch((err) => {
        this.submitting = false;
        app_default.alerts.show({ type: "error" }, err.message || "G\xF6nderim s\u0131ras\u0131nda hata olu\u015Ftu.");
        import_mithril.default.redraw();
      });
    }
  };

  // shim/entry.js
  var root = null;
  var btn = null;
  var hooks = {};
  var wrapped = false;
  var themed = [];
  var applyTheme = () => themed.forEach((e) => e.setAttribute("data-theme", document.documentElement.dataset.theme || "dark"));
  function ensureRoot() {
    if (root) return;
    root = document.createElement("div");
    root.className = "fl-scope App";
    root.id = "fl-root";
    root.style.display = "contents";
    themed.push(root);
    applyTheme();
    new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    document.body.appendChild(root);
    const mm = document.createElement("div");
    mm.id = "modal";
    root.appendChild(mm);
    const al = document.createElement("div");
    al.id = "alerts";
    root.appendChild(al);
    import_mithril.default.mount(mm, { view: () => (0, import_mithril.default)(ModalManager, { state: app_default.modal }) });
    import_mithril.default.mount(al, { view: () => (0, import_mithril.default)(AlertManager, { state: app_default.alerts }) });
  }
  async function configure(f) {
    ensureRoot();
    app_default.configure(f);
    window.flarum = window.flarum || {};
    window.flarum.extensions = {};
    window.flarum.reg = { get: (ext, p) => ext === "framio-network-crosspost" && /CrosspostModal$/.test(p) ? { default: CrosspostModal } : null };
    try {
      const r2 = await app_default.request({ method: "GET", url: app_default.forum.attribute("apiUrl") + "/framio/crosspost/nodes", background: true });
      if (r2 && r2.can_crosspost !== void 0) window.flarum.extensions["framio-network-crosspost"] = true;
    } catch (e) {
    }
    const c = f.attrs && f.attrs.themePrimaryColor || "";
    if (/^#[0-9a-f]{3,8}$/i.test(c)) root.style.setProperty("--primary-color", c);
  }
  function setHooks(h) {
    hooks = h || {};
  }
  function wrapModal() {
    if (wrapped) return;
    wrapped = true;
    const orig = app_default.modal.show.bind(app_default.modal);
    app_default.modal.show = (cls, attrs, stack) => {
      if (cls === WatermarkModal) {
        app_default.setDiscussion(null);
        if (hooks.onTopic) hooks.onTopic(null);
      }
      if (cls === AttributeModal && !app_default._discussion && hooks.pick) {
        orig(TopicModal, {
          hooks,
          files: attrs.files,
          onpick: (d) => {
            app_default.setDiscussion(d);
            if (hooks.onTopic) hooks.onTopic(d);
            setTimeout(() => orig(cls, attrs, stack), 0);
          },
          oncancel: () => {
            if (attrs.oncancel) attrs.oncancel();
          }
        });
        return;
      }
      return orig(cls, attrs, stack);
    };
  }
  function mountUpload(el, h) {
    ensureRoot();
    el.classList.add("fl-scope");
    themed.push(el);
    applyTheme();
    app_default._onInsert = h.onInsert;
    wrapModal();
    import_mithril.default.mount(el, { view: () => (0, import_mithril.default)(UploadButton, { editor: app_default.composer.editor, oncreate: (v) => {
      btn = v.state;
    } }) });
  }
  function addFiles(files) {
    if (!btn) throw new Error("Y\xFCkleme bile\u015Feni haz\u0131r de\u011Fil");
    btn.process({ target: { files: Array.from(files) } });
  }
  function openTopic() {
    wrapModal();
    app_default.modal.show(TopicModal, { hooks, files: [], onpick: (d) => {
      app_default.setDiscussion(d);
      if (hooks.onTopic) hooks.onTopic(d);
    }, oncancel: () => {
    } });
  }
  var resolveAi = (file) => {
    const p = prefetchAi(file);
    return p ? p.then((r2) => r2 && r2.data || {}).catch(() => ({})) : Promise.resolve({});
  };
  var getPostAs = () => app_default.composer.body.attrs.framioPostAs || null;
  var clearPostAs = () => {
    delete app_default.composer.body.attrs.framioPostAs;
  };
  var getCrosspostIntent = () => window.__framioCrosspostIntent || null;
  var request = (o) => app_default.request(o);
  var apiUrl = () => app_default.forum.attribute("apiUrl");
  function applyCrosspost(res) {
    const d = res && res.data;
    const intent = window.__framioCrosspostIntent;
    if (!d || !intent || intent.mode !== "payload" || !intent.payload || Date.now() - intent.at > 2 * 60 * 60 * 1e3) return Promise.resolve(false);
    const html = d.attributes && d.attributes.contentHtml || "";
    if (intent.imageIds.length && !intent.imageIds.some((id) => html.includes(`data-id="${id}"`) || html.includes(`id=${id}`))) return Promise.resolve(false);
    window.__framioCrosspostIntent = null;
    const payload = { ...intent.payload };
    if (payload.excluded_image_indexes) {
      const byIndex = intent.imageIdsByIndex || [];
      payload.excluded_image_ids = payload.excluded_image_indexes.map((i) => byIndex[i]).filter(Boolean).map(Number);
      delete payload.excluded_image_indexes;
    }
    return app_default.request({ method: "POST", url: app_default.forum.attribute("apiUrl") + "/framio/crosspost/outbound", body: { ...payload, post_id: d.id } }).then((r2) => {
      const failed = (r2 && r2.results || []).filter((x) => !x.success);
      if (failed.length) app_default.alerts.show({ type: "error" }, "Ortak payla\u015F\u0131m k\u0131smen ba\u015Far\u0131s\u0131z: " + failed.map((x) => `${x.node}: ${x.error || "hata"}`).join(" \xB7 "));
      else app_default.alerts.show({ type: "success" }, "G\xF6nderi ortak payla\u015F\u0131mla di\u011Fer sitelere de aktar\u0131ld\u0131.");
      return true;
    }).catch(() => {
      app_default.alerts.show({ type: "error" }, "G\xF6nderi yay\u0131mland\u0131 ama di\u011Fer sitelere aktar\u0131lamad\u0131.");
      return false;
    });
  }
  return __toCommonJS(entry_exports);
})();
