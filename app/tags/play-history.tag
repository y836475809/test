<play-history>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }
        .table-base {
            background-color: var(--control-color);
            width: 100%;
            height: 100%;
            overflow-y: hidden;
        }
        table.dataTable tbody td {
            padding: 0px;
            margin: 0px;
            padding-left: 4px;
            padding-right: 4px;
        }
    </style>
    
    <div ref="base" class="table-base">
        <base-datatable ref="dt" params={this.params}></base-datatable>
    </div>

    <script>
        /* globals base_dir obs */
        const ipc = require("electron").ipcRenderer;
        require(`${base_dir}/app/tags/base-datatable.tag`);
        const time_format = require(`${base_dir}/app/js/time_format`);

        // const history_max_size = 100;
        const row_img_width = 130/2;
        const row_hight = 100/2;

        const loadHistoryItems = (history_items) => {
            resizeDataTable();
            this.refs.dt.setData(history_items); 
        };

        const resizeDataTable = (size) => {
            if(this.refs == undefined){
                return;
            }
            const dt_root = this.refs.dt.root;
            const dt_elm = dt_root.querySelector("div.dataTables_scrollHead");
            const margin = 4;
            const exclude_h = 
                + dt_elm.offsetHeight 
                + margin;
            let ch = this.refs.base.clientHeight;
            if(size){
                ch = size.h;
            }
            this.refs.dt.setScrollSize({
                w: null,
                h: ch - exclude_h,
            });  
        };

        obs.on("resizeEndEvent", (size)=> {
            resizeDataTable(size);
        });

        this.params = {};
        this.params.dt = {
            columns : [
                { title: "image" },
                { title: "id" },
                { title: "name" },
                { title: "play_date" },
                { title: "play_time" },
                { title: "url" },
            ],
            columnDefs: [
                { width:100, targets: [1,2,3,4] },
                {
                    targets: 0,
                    searchable: false,
                    width: row_img_width,
                    data: "image",
                    render: function (data, type, row, meta) {
                        return `<img src="${data}" width="${row_img_width}" height="${row_hight}">`;
                    },
                },
                { targets: 1, data: "id" },
                { targets: 2, data: "name" },
                { 
                    targets: 3, 
                    searchable: false,
                    data: "play_date" ,
                    render: function (data, type, row, meta) {
                        return time_format.toDate(data);
                    },
                },
                { 
                    targets: 4, 
                    searchable: false,
                    data: "play_time",
                    render: function (data, type, row, meta) {
                        return time_format.toPlayTime(data);
                    },
                },
                { targets: 5, searchable: false, data: "url" }
            ], 
            colResize : {
                handleWidth: 10,
            },

            dom: "Zrt",    
            ordering: false,
            scrollX: true,
            scrollY: true,
            scrollCollapse:false,
            scroller: {
                displayBuffer: 10
            },
            paging: true,
            autoWidth: false,
            deferRender: true,
            stateSave: true,
            dblclickRow: function(data){
                const video_id = data.id;
                const url = data.url;    
                ipc.send("add-history-items", {
                    image: data.image, 
                    id: video_id, 
                    name: data.name, 
                    url: url
                });
                if(!/^(http)/.test(url)){
                    const library_data = ipc.sendSync("get-library-data", data.id);
                    ipc.send("request-show-player", library_data);
                }
            }
        };

        this.on("mount", () => {
            ipc.send("get-history-items");
        });

        ipc.on("get-history-items-reply", (event, history_items) => {     
            loadHistoryItems(history_items);
        });
    </script>
</play-history>
