!(function (moduleExports, moduleSetupFunction) {
  // Check if the environment is CommonJS
  if (typeof exports === "object" && typeof module !== "undefined") {
    moduleSetupFunction(exports);
  } else if (typeof define === "function" && define.amd) {
    // Check if the environment supports Asynchronous Module Definition
    define(["exports"], moduleSetupFunction);
  } else {
    // Assume a global environment (e.g., web browser)
    moduleSetupFunction(
      ((moduleExports =
        typeof globalThis !== "undefined"
          ? globalThis
          : moduleExports || self).blockCookiesScript = {})
    );
  }
})(this, function (customExports) {
  var blockedJavascriptType = "javascript/blocked";
  var blackList = window.COOKIES_BLACKLIST;
  var blackListedScripts = [];
  var observer = new MutationObserver((mutations) => {
    for (var i = 0; i < mutations.length; i++) {
      var { addedNodes: nodeList } = mutations[i];
      nodeList.forEach(_processNode);
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  function _processNode(node) {
    if (_isScript(node)) {
      var src = node.src;
      var type = node.type;

      if (_shouldDelete(src, type)) {
        _deleteNode(node);
      }
    }
  }

  function _shouldDelete(src, type) {
    return src && !_isBlockedType(type) && _isInBlackList(src);
  }

  function _isBlockedType(type) {
    return type && type === blockedJavascriptType;
  }

  function _isInBlackList(src) {
    return blackList && blackList.some((t) => t.test(src));
  }

  function _isScript(node) {
    return node.nodeType && node.tagName === "SCRIPT";
  }

  function _deleteNode(node) {
    blackListedScripts.push([node, node.type]);
    node.type = blockedJavascriptType;
    _addFirefoxLogic(node);

    // Remove the node from parent element
    if (node.parentElement) {
      node.parentElement.removeChild(node);
    }
  }

  // Nedded for it to work on Firefox ^v4
  function _addFirefoxLogic(node) {
    node.addEventListener(
      "beforescriptexecute",
      function handleBeforeScriptExecute(event) {
        if (node.getAttribute("type") === blockedJavascriptType) {
          event.preventDefault();
        }

        node.removeEventListener(
          "beforescriptexecute",
          handleBeforeScriptExecute
        );
      }
    );
  }

  function _getEnumerableProperties(element, deleteNonEnumerableProperties) {
    var result = Object.keys(element);
    if (Object.getOwnPropertySymbols) {
      var property = Object.getOwnPropertySymbols(element);
      deleteNonEnumerableProperties &&
        (property = property.filter(function (t) {
          return Object.getOwnPropertyDescriptor(element, t).enumerable;
        })),
        result.push.apply(result, property);
    }
    return result;
  }

  function _extendObject(element) {
    for (var i = 1; i < arguments.length; i++) {
      var argument = null != arguments[i] ? arguments[i] : {};

      i % 2
        ? _getEnumerableProperties(Object(argument), true).forEach(function (
            t
          ) {
            _setProperties(element, t, argument[t]);
          })
        : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(
            element,
            Object.getOwnPropertyDescriptors(argument)
          )
        : _getEnumerableProperties(Object(argument)).forEach(function (t) {
            Object.defineProperty(
              element,
              t,
              Object.getOwnPropertyDescriptor(argument, t)
            );
          });
    }
    return element;
  }
  function _setProperties(element, key, value) {
    return (
      key in element
        ? Object.defineProperty(element, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true,
          })
        : (element[key] = value),
      element
    );
  }

  var createElementBackup = document.createElement;
  var scriptStructure = {
    src: Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src"),
    type: Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "type"),
  };

  document.createElement = function () {
    for (var e = arguments.length, r = new Array(e), i = 0; i < e; i++)
      r[i] = arguments[i];
    if ("script" !== r[0].toLowerCase())
      return createElementBackup.bind(document)(...r);
    var newCreateElement = createElementBackup.bind(document)(...r);
    try {
      Object.defineProperties(newCreateElement, {
        src: _extendObject(
          _extendObject({}, scriptStructure.src),
          {},
          {
            set(e) {
              _shouldDelete(e, newCreateElement.type) &&
                scriptStructure.type.set.call(this, blockedJavascriptType),
                scriptStructure.src.set.call(this, e);
            },
          }
        ),
        type: _extendObject(
          _extendObject({}, scriptStructure.type),
          {},
          {
            get() {
              var e = scriptStructure.type.get.call(this);
              return e === blockedJavascriptType || _shouldDelete(this.src, e)
                ? null
                : e;
            },
            set(e) {
              var r = _shouldDelete(newCreateElement.src, newCreateElement.type)
                ? blockedJavascriptType
                : e;
              scriptStructure.type.set.call(this, r);
            },
          }
        ),
      }),
        (newCreateElement.setAttribute = function (e, t) {
          "type" === e || "src" === e
            ? (newCreateElement[e] = t)
            : HTMLScriptElement.prototype.setAttribute.call(
                newCreateElement,
                e,
                t
              );
        });
    } catch (e) {
      console.warn(
        "Unable to prevent script execution for script src ",
        newCreateElement.src,
        ".\n",
        'You are propably using a third-party browser extension that patches the "document.createElement" function.'
      );
    }
    return newCreateElement;
  };

  function _isValidScript(script) {
    var src = script.getAttribute("src");
    return blackList && blackList.every((e) => !e.test(src));
  }

  (customExports.unblock = function () {
    for (var e = arguments.length, n = new Array(e), o = 0; o < e; o++)
      n[o] = arguments[o];
    n.length < 1
      ? (blackList = [])
      : blackList &&
        (blackList = blackList.filter((e) =>
          n.every((t) =>
            "string" == typeof t
              ? !e.test(t)
              : t instanceof RegExp
              ? e.toString() !== t.toString()
              : void 0
          )
        ));
    for (
      var l = document.querySelectorAll(
          'script[type="'.concat(blockedJavascriptType, '"]')
        ),
        a = 0;
      a < l.length;
      a++
    ) {
      var p = l[a];
      _isValidScript(p) &&
        (blackListedScripts.push([p, "application/javascript"]),
        p.parentElement.removeChild(p));
    }
    var u = 0;
    [...blackListedScripts].forEach((e, t) => {
      var [script, n] = e;
      if (_isValidScript(script)) {
        for (
          var newScript = document.createElement("script"), i = 0;
          i < script.attributes.length;
          i++
        ) {
          var attribute = script.attributes[i];
          "src" !== attribute.name &&
            "type" !== attribute.name &&
            newScript.setAttribute(attribute.name, script.attributes[i].value);
        }
        newScript.setAttribute("src", script.src),
          newScript.setAttribute("type", n || "application/javascript"),
          document.head.appendChild(newScript),
          blackListedScripts.splice(t - u, 1),
          u++;
      }
    }),
      blackList && blackList.length < 1 && observer.disconnect();
  }),
    Object.defineProperty(customExports, "__esModule", {
      value: true,
    });
});
