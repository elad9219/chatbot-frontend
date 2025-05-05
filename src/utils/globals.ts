class Globals {}

export class DevelopmentGlobals extends Globals {
    public api = {
        chat: 'http://localhost:8080/bot',
    };
    }

    export class ProductionGlobals extends Globals {
    public api = {
        chat: '/bot',
    };
    }

    const globals = process.env.NODE_ENV === 'production'
    ? new ProductionGlobals()
    : new DevelopmentGlobals();

export default globals;
