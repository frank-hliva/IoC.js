export function inject(...names)
{
    return function(target)
    {
        target.__constructor__ = names;
        return target;
    }
}

export function injectSetter(name)
{
    return function(target, key, descriptor)
    {
        target.__setters__ = target.__setters__ || [];
        target.__setters__.push([key, name]);
        return descriptor;
    }
}

export const LifeTime =
{
    perResolve: 0,
    singleton: 1
}

function constructorMeta(type)
{
    return type.__constructor__ || [];
}

function settersMeta(instance)
{
    return instance.__setters__ || [];
}

function createInstance(type, args)
{
    return new (type.bind.apply(type, [type].concat(args)));
}

function applySetters(kernel, instance)
{
    const setters = settersMeta(instance);
    for (let i = 0, len = setters.length; i < len; i++)
    {
        const [prop, name] = setters[i];
        instance[prop] = kernel.resolve(name);
    }
}

export class Kernel
{
    constructor()
    {
        this._types = {};
    }
    
    get types() { return this._types; }
    
    register(name, type, lifeTime = LifeTime.perResolve)
    {
        this.types[name] = { type, lifeTime };
        return this;
    }
    
    registerInstance(name, instance, injectSetters = false)
    {
        if (injectSetters) applySetters(this, instance);
        this.types[name] = {
            instance,
            lifeTime: LifeTime.singleton
        };
        return this;
    }
    
    resolve(name)
    {
        const item = this.types[name];
        if (item.instance) return item.instance;
        else
        {
            const
                { type, lifeTime } = item,
                args = constructorMeta(type).map(n => this.resolve(n)),
                instance = createInstance(type, args);
            applySetters(this, instance);
            if (lifeTime === LifeTime.singleton)
            {
                this.types[name] = { instance };
            }
            return instance;
        }
    }
}

export default { inject, injectSetter, LifeTime, Kernel }