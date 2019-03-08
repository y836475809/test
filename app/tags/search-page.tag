<search-page>
<style scoped>
    :scope{
        width: 100%;
        height: 100%;
        background-color: var(--control-color);
    }

    .search-cond-container .radio-input[type=radio] {
        display: none; 
    }
    .search-cond-container .radio-input[type=radio]:checked + .radio-label {
        background: gray;
        color: lightgray;
    }

    .search-cond-container,
    .search-cond-container > * {
        display: flex;
    }
    .search-cond-container {
        flex-wrap: wrap;
    }

    .search-cond-container .label {   
        height: 30px;
        width: 100px;
        user-select: none;
    }
    .search-cond-container .radio-label {
        border: 1px solid gray;
        border-radius: 2px;
        height: 100%;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .search-cond-container .label + .label {
        border-left: none;  
        margin-left: -1px;
    }

    .search-sort-container i.fa-sort-up {
        position :relative;
        top:10%;
        left:5%;
    }
    .search-sort-container i.fa-sort-down {
        position :relative;
        top:-10%;
        left:5%;
    }
    .search-cond-container .label:hover{
        cursor: pointer; 
    }  

    .search-target-container {
        margin-left: 30px;
    }

    .search-query-container input {
        width: 150px;
        height: 30px;
        font-size: 1.2em;
        outline: 0;
    }

    .search-query-container .search-button {
        width: 30px;
        height: 30px;
        border-radius: 2px;
        background-color: #7fbfff;
    }
    .search-query-container .fa-search {
        position :relative;
        transform: translate(40%, 50%);
    }
    .search-query-container .add-search-cond-button {
        margin-left: 10px;
        width: 30px;
        height: 30px;
    }
    .search-query-container .fa-plus-square {
        position :relative;
        transform: translate(-5%, -5%);
        color: darkgray;
    }
    .search-query-container .search-button:hover,
    .search-query-container .icon-button:hover { 
        opacity: 0.5;
        cursor: pointer; 
    } 

    .line-break {
        white-space: normal;
        word-wrap: break-word;
    }
</style>

<div class="search-cond-container">
    <div class="search-sort-container">
        <label class="label" each="{item, i in this.sort_items}">
            <input class="radio-input" type="radio" name="sort" checked={item.select} 
                onclick="{ this.onclickSort.bind(this, i) }"> 
            <span class="radio-label">{item.title}<i class="fas fa-{item.order=='+'?'sort-up':'sort-down'}  fa-2x"></i></span>
        </label>
    </div>
    <div class="search-target-container">
        <label class="label" each="{item, i in this.search_items}">
            <input class="radio-input" type="radio" name="target" checked={item.select} 
                onclick="{ this.onclickSearchTarget.bind(this, i) }"> 
            <span class="radio-label">{item.title}</span>
        </label>
    </div>
    <div class="search-query-container">
        <input class="query-input" type="search" onkeydown={this.onkeydownSearchInput}>
        <span class="search-button" onclick={this.onclickSearch}>
            <i class="icon-button fas fa-search fa-lg" ></i></span>
        <span class="add-search-cond-button" onclick={this.onclickAddNicoSearchCond}>
            <i class="icon-button far fa-plus-square fa-3x"></i></span>
    </div>      
</div>
<pagination ref="page" onmovepage={this.onmovePage}></pagination>
<div class="search-grid-container">
    <div class="search-grid"></div>
</div>

<modal-dialog ref="search-dialog" oncancel={this.onCancelSearch}></modal-dialog>

<script>
    /* globals app_base_dir riot obs debug_search_host */
    const {remote, ipcRenderer} = require("electron");
    const {Menu, MenuItem, dialog} = remote;
    const { GridTable } = require(`${app_base_dir}/js/gridtable`);
    const { NicoSearchParams, NicoSearch } = require(`${app_base_dir}/js/niconico-search`);

    require(`${app_base_dir}/tags/pagination.tag`);
    require(`${app_base_dir}/tags/modal-dialog.tag`);

    this.sort_items = [
        { kind: "startTime",    order:"-", select: true, title:"投稿日" },
        { kind: "commentCounter", order:"-", select: false, title:"コメント数" },
        { kind: "viewCounter",    order:"-", select: false, title:"再生数" }
    ];
    this.search_items = [
        { kind: "keyword", select: false, title:"キーワード" },
        { kind: "tag",     select: true,  title:"タグ" }
    ];

    const search_offset = 1600;
    const search_limit = 32;
    const nico_search_params = new NicoSearchParams(search_limit);
    nico_search_params.page(0);
    nico_search_params.sortTarget("startTime");
    nico_search_params.sortOder("-");
    nico_search_params.cond("tag");

    const nico_search = debug_search_host?new NicoSearch(debug_search_host):new NicoSearch();

    const htmlFormatter = (row, cell, value, columnDef, dataContext)=> {
        return `<div>${value}</div>`;
    };
    const stateFormatter = (row, cell, value, columnDef, dataContext)=> {
        const state_local = dataContext.has_local?"Local":"";
        return `<div>${state_local}</div>`;
    };
    const lineBreakFormatter = (row, cell, value, columnDef, dataContext)=> {
        return `<div class="line-break">${value}</div>`;
    };

    const columns = [
        {id: "thumb_img", name: "image", height:100, width: 130},
        {id: "name", name: "名前", formatter:lineBreakFormatter},
        {id: "info", name: "info", formatter:htmlFormatter},
        {id: "pub_date", name: "投稿日"},
        {id: "play_time", name: "時間"},
        {id: "tags", name: "タグ", formatter:lineBreakFormatter},
        {id: "state", name: "state", formatter:stateFormatter}
    ];
    const options = {
        rowHeight: 100,
        _saveColumnWidth: true,
    };   
    const grid_table = new GridTable("search-grid", columns, options);

    this.search = async () => {
        this.refs["search-dialog"].showModal("検索中...", ["cancel"], result=>{
            this.onCancelSearch();
        });

        try {
            const search_result = await nico_search.search(nico_search_params);
            setData(search_result);            
        } catch (error) {
            dialog.showMessageBox(remote.getCurrentWindow(),{
                type: "error",
                buttons: ["OK"],
                message: error.message
            });
        }

        this.refs["search-dialog"].close();
        resizeGridTable(); //only first?
    };

    this.onmovePage = async (page) => {
        nico_search_params.page(page);
        this.search();
    };

    this.onCancelSearch = () => {
        nico_search.cancel();
    };

    const setData = (search_result) => {     
        const total_count = search_result.meta.totalCount;
        this.refs.page.setTotaCount(total_count);
        if(total_count<search_offset+search_limit){
            this.refs.page.setTotalPages(Math.ceil(total_count/search_limit));
        }else{
            this.refs.page.setTotalPages(Math.ceil((search_offset+search_limit)/search_limit))
        }
        const video_ids = search_result.data.map(value => {
            return value.contentId;
        });

        obs.trigger("get-library-data-callback", { video_ids: video_ids, cb: (id_map)=>{
            const items = search_result.data.map(value => {
                const has_local = id_map.has(value.contentId);
                return {
                    thumb_img: value.thumbnailUrl,
                    id: value.contentId,
                    name: value.title,
                    info: `ID:${value.contentId}<br>再生:${value.viewCounter}<br>コメント:${value.commentCounter}`,
                    play_time: value.lengthSeconds,
                    pub_date: value.startTime,
                    tags: value.tags,
                    has_local: has_local,
                    state: "" 
                };
            });
            grid_table.setData(items);
            grid_table.grid.scrollRowToTop(0); //TODO      
        }});
    };

    const setSearchCondState = (sort_kind, sort_order, search_kind) => {
        {
            const index = this.sort_items.findIndex(value=>{
                return value.kind == sort_kind;
            });
            if(index!==-1){
                this.sort_items.forEach((value) => {
                    value.select = false;
                });

                this.sort_items[index].select = true;
                this.sort_items[index].order = sort_order;
            }
        }
        {
            const index = this.search_items.findIndex(value=>{
                return value.kind == search_kind;
            });
            if(index!==-1){
                this.search_items.forEach((value) => {
                    value.select = false;
                });
                this.search_items[index].select = true;
                this.search_items[index].kind = search_kind;
            }
        }
        this.update();
    };

    this.onclickSort = (index, e) => {
        const pre_selected = this.sort_items.findIndex(value=>{
            return value.select === true;
        });

        this.sort_items.forEach((value) => {
            value.select = false;
        });
        this.sort_items[index].select = true;

        if(pre_selected===index){
            const pre_order = this.sort_items[index].order; 
            this.sort_items[index].order = pre_order=="+"?"-":"+";
        }

        nico_search_params.sortTarget(this.sort_items[index].name);
        nico_search_params.sortOder(this.sort_items[index].order);

        this.update();
    };
    
    this.onclickSearchTarget = (index, e) => {
        this.search_items.forEach((value) => {
            value.select = false;
        });
        this.search_items[index].select = true; 

        nico_search_params.cond(this.search_items[index].kind);
    };

    this.onclickSearch = (e) => {
        const elm = this.root.querySelector(".search-query-container > .query-input");
        const query = elm.value;
        nico_search_params.query(query);
        this.search();

        this.refs.page.resetPage();
    };

    this.onkeydownSearchInput = (e) =>{
        if(e.keyCode===13){
            const param = e.target.value;
            nico_search_params.query(param);
            this.search();
            this.refs.page.resetPage();
        }
    };

    this.onclickAddNicoSearchCond = (e) => {
        const elm = this.root.querySelector(".search-query-container > .query-input");
        const cond = {
            query: elm.value,
            sort_order: nico_search_params._sort_order,
            sort_name: nico_search_params._sort_name,
            search_kind: nico_search_params.search_kind,
            page: 1
        };
        const icon = cond.search_kind=="tag"? {
            name: "fas fa-tag fa-lg",
            style: "color:red;"
        } : undefined;

        obs.trigger("on_add_nico_search_cond", { cond, icon });
    };

    obs.on("on_change_nico_search_cond", (cond)=> {
        const elm = this.root.querySelector(".search-query-container > .query-input");
        elm.value = cond.query;
        nico_search_params.cond(cond.search_kind);
        nico_search_params.query(cond.query);
        nico_search_params.page(cond.page);
        nico_search_params.sortTarget(cond.sort_name);
        nico_search_params.sortOder(cond.sort_order);

        setSearchCondState(cond.sort_name, cond.sort_order, cond.search_kind);

        this.search();
        this.refs.page.resetPage();
    });

    const resizeGridTable = () => {
        const container = this.root.querySelector(".search-grid-container");
        grid_table.resizeFitContainer(container);
    };

    const menu = new Menu();
    menu.append(new MenuItem({
        label: "Play", click() {
            const items = grid_table.getSelectedDatas();
            console.log("search context menu data=", items);
        }
    }));
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(new MenuItem({ label: "MenuItem2", type: "checkbox", checked: true }));
    
    this.on("mount", () => {
        grid_table.init(this.root.querySelector(".search-grid"));

        grid_table.onDblClick((e, data)=>{
            if(data.has_local){
                const video_id = data.id;
                obs.trigger("get-library-data-callback", { video_ids: [video_id], cb: (id_map)=>{
                    const library_data = id_map.get(video_id);
                    const thumb_info = library_data.viweinfo.thumb_info;   
                    obs.trigger("add-history-items", {
                        image: thumb_info.thumbnail_url, 
                        id: video_id, 
                        name: thumb_info.title, 
                        url: library_data.video_data.src
                    });
                    ipcRenderer.send("request-play-library", library_data);
                }});
            }else{
                const video_id = data.id;
                ipcRenderer.send("request-play-niconico", video_id);
            }
        });

        resizeGridTable();
    });

    obs.on("resizeEndEvent", (size)=>{
        resizeGridTable();
    });
    
</script>
</search-page>