export class Router {
    routes = null;
    currentView = null;

    constructor(routes) {
        this.routes = routes;
        const path = window.location.pathname;
    }

    async navigate(path) {
        window.history.pushState(null, null, path);
        await this.#loadRoute(path);

        window.onpopstate = () => {
            this.#loadRoute(window.location.pathname);
        };
    }

    async #loadRoute(path) {
        let matchedRoute = this.routes.find(route => route.path === path);
        if (!matchedRoute) {
            console.error('Route not found for path', path);
            matchedRoute = this.routes[0];
            window.location.pathname = matchedRoute.path;
        }

        const controller = new matchedRoute.controller();
        const view = new matchedRoute.view(controller);
        controller.setView(view);

        if (this.currentView)
            await this.currentView.onLeave();
        this.currentView = view;
        await view.onMount();
        await view.render();
    }
}
