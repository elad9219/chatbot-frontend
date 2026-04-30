class Globals {}

export class DevelopmentGlobals extends Globals {
    // Dynamically get the host so it works on localhost and local network IP
    private static host = window.location.hostname;
    
    public api = {
        chat: `http://${DevelopmentGlobals.host}:8080/bot`,
    };
}

export class ProductionGlobals extends Globals {
    public api = {
        chat: 'https://aichat.runmydocker-app.com/bot',
    };
}

const globals = process.env.NODE_ENV === 'production'
    ? new ProductionGlobals()
    : new DevelopmentGlobals();

export default globals;