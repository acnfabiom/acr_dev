// import 3ddashboard utils before imports requiring static ressources (such as vuetify webfonts)
import { widget, disableDefaultCSS, requirejs, onVisibilityChange } from "@widget-lab/3ddashboard-utils";
import Vue from "vue";
import App from "./components/app.vue";
import vuetify from "./plugins/vuetify";
import { store } from "./store";
import { initPlatformConnectors } from "@widget-lab/platform-connectors";

const start = () => {
    disableDefaultCSS(true);

    widget.setTitle("Widget Template Vue");

    initPlatformConnectors({
        allowTenantsSelection: true,
        allowSecurityContextSelection: true
    });

    const mainComponent = new Vue({
        store,
        vuetify,
        render: h => h(App)
    });

    mainComponent.$mount("app");

    requirejs(["DS/PlatformAPI/PlatformAPI"], (/* PlatformAPI */) => {
        // use 3DDashboard APIs
    });

    onVisibilityChange((/* visibility */) => {
        // widget (or fullpage) visibility has changed
        // you can enable/disable periodic data refresh based on visibility
    });
};

/**
 * Entry point for both standalone & 3DDashboard modes
 */
widget.addEvent("onLoad", () => {
    start();
});
widget.addEvent("onRefresh", () => {
    // TODO an application data refresh
    // meaning only refresh dynamic content based on remote data, or after preference changed.
    // we could reload the frame [ window.location.reload() ], but this is not a good practice, since it reset preferences
});
