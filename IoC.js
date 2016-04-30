import "babel-polyfill"

const prop = 
{
    constructor: "__constructor__",
    setters: "__setters__",
    methods: "__methods__"
}

export function inject(...names)
{
    return function(target)
    {
        target[prop.constructor] = names;
        return target;
    }
}

export function injectSetter(name)
{
    return function(target, key, descriptor)
    {
        target[prop.setters] = target[prop.setters] || [];
        target[prop.setters].push([key, name]);
        return descriptor;
    }
}

export function injectMethod(...names)
{
    return function(target, key, descriptor)
    {
        target[prop.methods] = target[prop.methods] || [];
        target[prop.methods].push([key, names]);
        return descriptor;
    }
}

export const LifeTime =
{
    perResolve: 0,
    singleton: 1
}

function constructorMeta(type) { return type[prop.constructor] || []; }
function settersMeta(instance) { return instance[prop.setters] || []; }
function methodsMeta(instance) { return instance[prop.methods] || []; }

function createInstance(type, args)
{
    return new (type.bind.apply(type, [type].concat(args)));
}

function injectSetters(kernel, instance)
{
    const setters = settersMeta(instance);
    for (let i = 0, len = setters.length; i < len; i++)
    {
        const [prop, name] = setters[i];
        instance[prop] = kernel.resolve(name);
    }
}

function injectMethods(kernel, instance)
{
    const methods = methodsMeta(instance);
    for (let i = 0, len = methods.length; i < len; i++)
    {
        const [prop, names] = methods[i];
        instance[prop].apply(instance, names.map(n => kernel.resolve(n)));
    }
}

function injectAllMembers(kernel, instance)
{
    injectSetters(kernel, instance);
    injectMethods(kernel, instance);
}

export class Kernel
{
    constructor()
    {
        this._types = {};
        this._factories = {};
    }
    
    get types() { return this._types; }
    get factories() { return this._factories; }
    
    contains(name)
    {
        return this.types[name] !== undefined;
    }
    
    register(name, type, lifeTime = LifeTime.perResolve)
    {
        this.types[name] = { type, lifeTime };
        return this;
    }
    
    registerType(type, lifeTime = LifeTime.perResolve)
    {
        this.register(type.name, type, lifeTime);
        return this;
    }
    
    registerInstance(name, instance, injectMembers = false)
    {
        if (injectMembers)
        {
            injectAllMembers(this, instance);
        }
        this.types[name] = {
            instance,
            lifeTime: LifeTime.singleton
        };
        return this;
    }
    
    factoryFor(name, factory) { this.factories[name] = factory; }
    
    resolve(name)
    {
        const item = this.types[name];
        if (item.instance) return item.instance;
        else
        {
            const
                { type, lifeTime } = item,
                args = constructorMeta(type).map(n => this.resolve(n)),
                factory = this.factories[name],
                instance = factory ?
                    factory({ kernel: this, type, args }) :
                    createInstance(type, args);
            injectAllMembers(this, instance);
            if (lifeTime === LifeTime.singleton)
            {
                this.types[name] = { instance, lifeTime };
            }
            return instance;
        }
    }
    
    getType(name) { return this.types[name].type; }
}

export default { inject, injectSetter, injectMethod, LifeTime, Kernel }