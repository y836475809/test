<pagination>
    <style scoped>
        :scope {
            display: flex;
        }

        .label {
            user-select: none;
            margin-left: 5px;
        }

        .label.page {
            min-width: 80px;
            cursor: pointer;
            border: 1px solid gray;
            border-radius: 3px;
            padding: 5px;
            background-color: white;
        }

        .page-container {
            position: relative;
            display: flex;
        }
        .page-selector {
            display: none;
            position: absolute;
            top: 30px;
            left: 0px;
            z-index: 999;
        }
        .page-selector-show {
            display: block;
        }

        i[class^="fas fa-chevron"] {
            font-size: 20px;
        }

        .navi {
            width: 30px;
            height: 30px;
            cursor: pointer;
        }
        .navi > i {
            color: gray;
        }
        .navi > i:hover {
            color: black;
        }
    </style>

    <div class="navi center-hv" onclick={onclickBack}><i class="fas fa-chevron-left"></i></div>
    <div class="page-container center-hv" >
        <div class="label page center-hv" title="ページ選択" onclick={onclickTogglePageSelector}>
            {page_num} / {total_page_num}
        </div>
        <search-page-selector class="page-selector" obs={obs_page_selector}> 
        </search-page-selector>
    </div>
    <div class="navi center-hv" onclick={onclickForward}><i class="fas fa-chevron-right"></i></div>
    <div class="label center-hv">ヒット件数: {search_result_num.toLocaleString()}</div>

    <script>
        /* globals riot */
        const pagination_obs = this.opts.obs;
        this.obs_page_selector = riot.observable();

        this.page_num = 1;
        this.total_page_num = 0;
        this.search_result_num = 0;

        pagination_obs.on("set-page-num", (args) => {
            const { page_num } = args;

            this.page_num = page_num;
            this.update();
        });

        pagination_obs.on("set-data", (args) => {
            const { page_num, total_page_num, search_result_num } = args;

            this.page_num = page_num;
            this.total_page_num = total_page_num;
            this.search_result_num = search_result_num;
            this.update();

            this.obs_page_selector.trigger("set-data", { page_num, total_page_num });
        });

        pagination_obs.on("forward", () => {
            this.onclickForward();
        });

        pagination_obs.on("back", () => {
            this.onclickBack();
        });

        this.onclickBack = () =>{
            if(this.page_num > 1){
                this.page_num -= 1;
                this.update();

                pagination_obs.trigger("move-page", { page_num: this.page_num });
            }
        };

        this.onclickForward = () =>{
            if(this.page_num < this.total_page_num){
                this.page_num += 1;
                this.update();

                pagination_obs.trigger("move-page", { page_num: this.page_num });
            }
        };

        const changePageSelector = (name) => {
            const elm = this.root.querySelector(".page-selector");
            elm.classList[name]("page-selector-show"); 
        };

        this.onclickTogglePageSelector = () => {
            changePageSelector("toggle");
        };

        this.obs_page_selector.on("selected-page-num", (args) => {
            const { page_num } = args;
            this.page_num = page_num;
            this.update();

            pagination_obs.trigger("move-page", { page_num: this.page_num });
            changePageSelector("remove");
        });

        this.obs_page_selector.on("close", () => {
            const elm = this.root.querySelector(".page-selector");
            elm.classList.remove("page-selector-show"); 

            changePageSelector("remove");
        });
    </script>
</pagination>