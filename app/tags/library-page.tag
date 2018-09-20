<library-page id="library-page">
    <style scoped>
        :scope .table-base {
            background-color: #cccccc;
            width: 100%;
            height: 100%;
        } 
    </style>

<div class="table-base">
    <input type="button" value="show" onclick={read}>  
    <base-datatable ref="lib" my_datatable_id="lib-table-id"></base-datatable>
</div>

<script>
    const remote = require('electron').remote;
    const shared_obj = remote.getGlobal('sharedObj');
    const base_dir = shared_obj.base_dir;
    require(`${base_dir}/app/tags/base-datatable.tag`);

    let self = this;
    const config = opts.config;

    read(){
      console.log("read config", config.pp);  
    };
    this.params = {}
    this.params.dt = {
        columns : [
            { title: 'image' },
            { title: 'name' },
            { title: 'salary' },
            { title: 'office' },
            { title: 'position' }
        ],
        columnDefs: [
            {
                targets: 0,
                orderable: false,
                data: "image",
                render: function (data, type, row, meta) {
                    return `<img src='${data}' width="240" height="240">`
                },
            },
            { targets: 1, data: "name" },
            { targets: 2, data: "salary" },
            { targets: 3, data: "office" },
            { targets: 4, data: "position" }
        ], 
        colResize : {
            handleWidth: 10,
            exclude: [0],
        },
        dom: 'Zlfrtip',  
        scrollY:'400px',
        scrollCollapse:false,
        autoWidth: true,
        paging: true,
        deferRender: true,
        stateSave: true,
        displayLength: 2,
        lengthMenu: [ 2, 4, 10, 20, 30, 40, 50 ],
        displayLength: 4,
        contextMenu: {
            items: {
                "edit": {name: "Edit", icon: "edit"},
                "cut": {name: "Cut", icon: "cut"},
                "copy": {name: "Copy", icon: "copy"},
                "paste": {name: "Paste", icon: "paste"},
                "delete": {name: "Delete", icon: "delete"}
            },
            callback: function(key, data){
                console.log( "clicked: " + key, ", data:", data); 
            }
        },
        dblclickRow: function(data){
            console.log( "dblclickRow data:", data); 
        }        
    };

    this.on('mount', function () {
        // console.log(this.refs.lib);
    });

    obs.on('pageResizedEvent', function (size) {
        if(self.refs!==undefined){
            self.refs.lib.ress(size);
        }
    });
</script>
</library-page>