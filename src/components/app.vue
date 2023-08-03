<template>
    <v-app id="inspire">
        <v-main>
            <v-container>
                <!--button @click="fetchIssues">Fetch issues</button>
                <table>
                    <tr>
                        <th>Id</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Requirements</th>
                    </tr>
                    <tr
                        v-for="issue of filteredIssues"
                        :key="issue.id"
                        :class="{ 'row-highlight': issue.requirements.find(req => req.id === highlightId) }"
                        @drop="handleDrop(issue.id, $event)"
                        @dragenter.prevent
                        @dragover.prevent
                    >
                        <td>{{ issue.id }}</td>
                        <td>{{ issue.title }}</td>
                        <td>{{ issue.description }}</td>
                        <td>{{ issue.status }}</td>
                        <td>{{ issue.requirements.map(req => req.name).join(", ") }}</td>
                    </tr>
                </table-->
                <v-data-table :headers="headers" :items="issues">
                    <template #item="props">
                        <tr
                            :class="{ 'row-highlight': props.item.requirements.find(req => req.id === highlightId) }"
                            @drop="handleDrop(props.item.id, $event)"
                            @dragenter.prevent
                            @dragover.prevent
                        >
                            <td>{{ props.item.id }}</td>
                            <td>{{ props.item.title }}</td>
                            <td>{{ props.item.description }}</td>
                            <td>{{ props.item.status }}</td>
                            <td>{{ props.item.requirements.map(req => req.name).join(", ") }}</td>
                        </tr>
                    </template>
                </v-data-table>
            </v-container>
        </v-main>
    </v-app>
</template>

<style>
.row-highlight {
    background-color: #f7cc4a;
}
/*
table {
    border-spacing: 0;
    border-collapse: collapse;
}

th {
    background-color: #e2e2e2;
}

td,
th {
    padding: 6px;
    border: 1px solid black;
}
*/
</style>

<!-- no scope for app.vue, style defined here is global for the app -->

<script>
import { widget, requirejsPromise } from "@widget-lab/3ddashboard-utils";
import { taggerProxyPromise } from "../utils/TaggerProxyCreator";
import { call3DSpace } from "@widget-lab/platform-connectors";

console.debug(widget);
console.debug(taggerProxyPromise);

export default {
    name: "App",
    data() {
        return {
            //tenant: "",
            //ds3dspace: "",
            //role: "",
            //organization: "",
            //collabspace: "",
            //securityContext: "",
            issues: [],
            userSearch: "",
            filteredIdList: undefined,
            projectId: "",
            highlightId: "",
            headers: [
                {
                    text: "Id",
                    value: "id"
                },
                {
                    text: "Title",
                    value: "title"
                },
                {
                    text: "Description",
                    value: "description"
                },
                {
                    text: "Status",
                    value: "status"
                },
                {
                    text: "Requirements",
                    value: "requirements"
                }
            ]
        };
    },
    computed: {
        filteredIssues() {
            let filteredIssues = this.issues;
            if (this.userSearch) {
                filteredIssues = filteredIssues.filter(i => i.title.includes(this.userSearch));
            }
            if (this.filteredIdList) {
                filteredIssues = filteredIssues.filter(i => this.filteredIdList.includes(i.id.toString()));
            }
            return filteredIssues;
        }
    },
    watch: {
        //Watcher: a method named exactly like an attribute will be executed whenever that attribute gets updated
        async issues(newVal) {
            //console.log("Issues updated.", newVal);
            const tags = {}; // Empty object creation
            for (const issue of newVal) {
                tags[issue.id.toString()] = [
                    // Setting values with key = string ID
                    {
                        object: issue.status,
                        sixw: "ds6w:when/Status",
                        dispValue: issue.status
                    }
                ];
            }
            //console.log(tags);
            const taggerProxy = await taggerProxyPromise;
            taggerProxy.setSubjectsTags(tags);
        },
        projectId() {
            this.fetchIssues();
        }
    },
    async mounted() {
        //await this.get3DServices();
        //await this.getUserPreferredCredentials();
        console.log("Security Context:", this.securityContext);
        this.fetchIssues();
        widget.addPreference({
            name: "Project ID",
            type: "text",
            defaultValue: ""
        });
        widget.addEvent("onSearch", input => {
            this.userSearch = input;
        });
        widget.addEvent("onResetSearch", () => {
            this.userSearch = "";
        });
        const taggerProxy = await taggerProxyPromise;
        taggerProxy.addEvent("onFilterSubjectsChange", data => {
            if (Object.keys(data.allfilters).length === 0) {
                this.filteredIdList = undefined;
            } else {
                this.filteredIdList = data.filteredSubjectList;
            }
        });
        widget.addEvent("onRefresh", () => {
            this.projectId = widget.getValue("Project ID");
        });
        const PlatformAPI = await requirejsPromise("DS/PlatformAPI/PlatformAPI");
        PlatformAPI.subscribe("DS/PADUtils/PADCommandProxy/select", event => {
            const reqId = event.data.paths[0].pop();
            this.highlightId = reqId;
            setTimeout(() => {
                this.highlightId = "";
            }, 1500);
        });
    },
    methods: {
        async fetchIssues() {
            this.projectId = widget.getValue("Project ID");
            if (this.projectId === "") {
                this.projectId = "204";
            }
            const res = await fetch("https://3ds.mytuleap.com/api/trackers/" + this.projectId + "/artifacts?values=all", {
                headers: {
                    Accept: "application/json",
                    Authorization: "Basic d2lkZ2V0bGFiOndpZGdldGxhYl9kcw=="
                }
            });
            const artifacts = await res.json();

            const linkListRes = await fetch("https://localhost:443/links");
            const linkList = await linkListRes.json();

            for (const link of linkList) {
                link.name = await this.getRequirementInfoById(link.reqId);
            }
            this.issues = artifacts.map(a => {
                // Fetch linked requirements and set the ID in the requirements array
                const linkedReq = linkList.filter(l => l.issueId === a.id);
                return {
                    id: a.id,
                    title: a.title,
                    description: a.values.find(v => v.label === "Description").commonmark,
                    status: a.status,
                    requirements: linkedReq.map(l => {
                        return {
                            id: l.reqId,
                            name: l.name
                        };
                    })
                };
            });
        },
        async handleDrop(issueId, event) {
            const droppedData = JSON.parse(event.dataTransfer.getData("text"));
            const reqName = droppedData.data.items[0].displayName;
            const reqId = droppedData.data.items[0].objectId;
            const issue = this.issues.find(i => i.id === issueId);
            if (!issue.requirements.find(req => req.id === reqId)) {
                const url = "https://localhost:443/links";
                const data = {
                    issueId: issue.id,
                    reqId: droppedData.data.items[0].objectId
                };
                const customHeaders = {
                    "Content-Type": "application/json"
                };

                await fetch(url, {
                    method: "POST",
                    headers: customHeaders,
                    body: JSON.stringify(data)
                });
                issue.requirements.push({
                    id: reqId,
                    name: reqName
                });
            }
        },
        async get3DServices() {
            const i3DXCompassServices = await requirejsPromise("DS/i3DXCompassServices/i3DXCompassServices");
            return new Promise((resolve, reject) => {
                i3DXCompassServices.getPlatformServices({
                    onComplete: services => {
                        this.tenant = services[0].platformId;
                        this.ds3dspace = services[0]["3DSpace"];
                        resolve();
                    }
                });
            });
        },
        async getUserPreferredCredentials() {
            const url = "/resources/modeler/pno/person?current=true&select=preferredcredentials&tenant=" + this.tenant;
            const WAFData = await requirejsPromise("DS/WAFData/WAFData");
            return new Promise((resolve, reject) => {
                WAFData.authenticatedRequest(this.ds3dspace + url, {
                    type: "json",

                    onComplete: data => {
                        this.role = data.preferredcredentials.role.name;
                        this.organization = data.preferredcredentials.organization.name;
                        this.collabspace = data.preferredcredentials.collabspace.name;
                        this.securityContext = this.role + "." + this.organization + "." + this.collabspace;
                        resolve();
                    }
                });
            });
        },
        async getRequirementInfoById(reqId) {
            const WAFData = await requirejsPromise("DS/WAFData/WAFData");
            const reqDataUrl = "/resources/v1/modeler/dsreq/dsreq:Requirement/{ID}";
            //return new Promise((resolve, reject) => {
            //WAFData.authenticatedRequest(this.ds3dspace + reqDataUrl.replace("{ID}", reqId), {
            //    type: "json",
            //    headers: {
            //        Accept: "application/json",
            //        SecurityContext: this.securityContext
            //    },
            //    onComplete: data => {
            //        console.log("GET /requirement Title:", data.member[0].title);
            //        resolve(data.member[0].title);
            //    }
            //});
            //});
            const res = await call3DSpace(reqDataUrl.replace("{ID}", reqId), {
                type: "json",
                headers: {
                    Accept: "application/json",
                    SecurityContext: this.securityContext
                }
            });
            return res.member[0].title;
        }
    }
};
</script>
