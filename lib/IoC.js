"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Kernel = exports.LifeTime = undefined;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

exports.inject = inject;
exports.injectSetter = injectSetter;
exports.injectMethod = injectMethod;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var prop = {
    constructor: "__constructor__",
    setters: "__setters__",
    methods: "__methods__"
};

function inject() {
    for (var _len = arguments.length, names = Array(_len), _key = 0; _key < _len; _key++) {
        names[_key] = arguments[_key];
    }

    return function (target) {
        target[prop.constructor] = names;
        return target;
    };
}

function injectSetter(name) {
    return function (target, key, descriptor) {
        target[prop.setters] = target[prop.setters] || [];
        target[prop.setters].push([key, name]);
        return descriptor;
    };
}

function injectMethod() {
    for (var _len2 = arguments.length, names = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        names[_key2] = arguments[_key2];
    }

    return function (target, key, descriptor) {
        target[prop.methods] = target[prop.methods] || [];
        target[prop.methods].push([key, names]);
        return descriptor;
    };
}

var LifeTime = exports.LifeTime = {
    perResolve: 0,
    singleton: 1
};

function constructorMeta(type) {
    return type[prop.constructor] || [];
}
function settersMeta(instance) {
    return instance[prop.setters] || [];
}
function methodsMeta(instance) {
    return instance[prop.methods] || [];
}

function createInstance(type, args) {
    return new (type.bind.apply(type, [type].concat(args)))();
}

function injectSetters(kernel, instance) {
    var setters = settersMeta(instance);
    for (var i = 0, len = setters.length; i < len; i++) {
        var _setters$i = (0, _slicedToArray3.default)(setters[i], 2);

        var _prop = _setters$i[0];
        var name = _setters$i[1];

        instance[_prop] = kernel.resolve(name);
    }
}

function injectMethods(kernel, instance) {
    var methods = methodsMeta(instance);
    for (var i = 0, len = methods.length; i < len; i++) {
        var _methods$i = (0, _slicedToArray3.default)(methods[i], 2);

        var _prop2 = _methods$i[0];
        var names = _methods$i[1];

        instance[_prop2].apply(instance, names.map(function (n) {
            return kernel.resolve(n);
        }));
    }
}

function injectAllMembers(kernel, instance) {
    injectSetters(kernel, instance);
    injectMethods(kernel, instance);
}

var Kernel = exports.Kernel = function () {
    function Kernel() {
        (0, _classCallCheck3.default)(this, Kernel);

        this._types = {};
        this._factories = {};
    }

    (0, _createClass3.default)(Kernel, [{
        key: "contains",
        value: function contains(name) {
            return this.types[name] !== undefined;
        }
    }, {
        key: "register",
        value: function register(name, type) {
            var lifeTime = arguments.length <= 2 || arguments[2] === undefined ? LifeTime.perResolve : arguments[2];

            this.types[name] = { type: type, lifeTime: lifeTime };
            return this;
        }
    }, {
        key: "registerType",
        value: function registerType(type) {
            var lifeTime = arguments.length <= 1 || arguments[1] === undefined ? LifeTime.perResolve : arguments[1];

            this.register(type.name, type, lifeTime);
            return this;
        }
    }, {
        key: "registerInstance",
        value: function registerInstance(name, instance) {
            var injectMembers = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            if (injectMembers) {
                injectAllMembers(this, instance);
            }
            this.types[name] = {
                instance: instance,
                lifeTime: LifeTime.singleton
            };
            return this;
        }
    }, {
        key: "factoryFor",
        value: function factoryFor(name, factory) {
            this.factories[name] = factory;
        }
    }, {
        key: "resolve",
        value: function resolve(name) {
            var _this = this;

            var item = this.types[name];
            if (item.instance) return item.instance;else {
                var type = item.type;

                var lifeTime = item.lifeTime;
                var args = constructorMeta(type).map(function (n) {
                    return _this.resolve(n);
                });
                var factory = this.factories[name];
                var instance = factory ? factory({ kernel: this, type: type, args: args }) : createInstance(type, args);
                injectAllMembers(this, instance);
                if (lifeTime === LifeTime.singleton) {
                    this.types[name] = { instance: instance, lifeTime: lifeTime };
                }
                return instance;
            }
        }
    }, {
        key: "getType",
        value: function getType(name) {
            return this.types[name].type;
        }
    }, {
        key: "types",
        get: function get() {
            return this._types;
        }
    }, {
        key: "factories",
        get: function get() {
            return this._factories;
        }
    }]);
    return Kernel;
}();

exports.default = { inject: inject, injectSetter: injectSetter, injectMethod: injectMethod, LifeTime: LifeTime, Kernel: Kernel };
