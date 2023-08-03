import { widget, requirejsPromise } from "@widget-lab/3ddashboard-utils";
async function taggerProxyPromiseCreation() {
    const TagNavigatorProxy = await requirejsPromise("DS/TagNavigatorProxy/TagNavigatorProxy");
    return TagNavigatorProxy.createProxy({
        widgetId: widget.id,
        filteringMode: "WithFilteringServices"
    });
}
const taggerProxyPromise = taggerProxyPromiseCreation();
export { taggerProxyPromise };
