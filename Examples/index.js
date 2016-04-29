import { inject, injectSetter, injectMethod, LifeTime, Kernel } from '../IoC.js';

class KatanaRepository
{
    getData()
    {
        return  "cut!";
    }
}

@inject("KatanaRepository")
class Katana
{
    constructor(katanaRepository)
    {
        this._katanaRepository = katanaRepository;
    }

    hit()
    {
        return this._katanaRepository.getData();
    }
}

class Shuriken
{
    throw()
    {
        return "hit!";
    }
}

@inject("Katana", "Shuriken")
class Ninja
{
    constructor(katana, shuriken)
    {
        this._katana = katana;
        this._shuriken = shuriken;
    }

    @injectMethod("Katana", "Shuriken")
    someMethod(katana, shuriken)
    {
        console.log("method injection katana:", katana.hit());
        console.log("method injection shuriken:", shuriken.throw());
    }

    fight() { return this._katana.hit(); };
    sneak() { return this._shuriken.throw(); };

    @injectSetter("ninjaName")
    set name(name) { this._name = name }
    get name() { return this._name; }
}

let container = new Kernel();

container.register("Katana", Katana);
container.registerType(KatanaRepository);
container.register("Shuriken", Shuriken);
container.register("Ninja1", Ninja, LifeTime.singleton);
container.register("Ninja2", Ninja, LifeTime.perResolve);
container.register("Ninja3", Ninja, LifeTime.perResolve);
container.registerInstance("ninjaName", "Big boss");

let ninja1 = container.resolve("Ninja1");
console.log("Ninja1 name", ninja1.name);
console.log("Ninja1 fight", ninja1.fight());
console.log("Ninja1 sneak", ninja1.sneak());
container.resolve("Ninja1").name = "Don Corleone";
console.log("Ninja1 name", container.resolve("Ninja1").name); //singleton displays "Don Corleone"
console.log("------------------------------------------------");
container.resolve("Ninja2").name = "Al Capone";
console.log("Ninja2 name", container.resolve("Ninja2").name); //new instance displays "Big boss"
console.log("------------------------------------------------");