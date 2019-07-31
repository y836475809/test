<pagination>
    <style scoped>
        :scope {
            display: flex;
            margin: 5px 0 5px 20px;
        }

        .label {
            user-select: none;
            margin-left: 5px;
        }

        .page-input-container {
            display: flex;
        }
        .page-input-container input {
            width: 50px;
            height: 25px;
            text-align: right;
            outline: 0;
        }

        i[class^="fas fa-chevron"] {
            font-size: 20px;
        }

        .navi {
            width: 30px;
            height: 30px;
        }
        .navi:hover {
            background-color: lightgray;
            cursor: pointer;
        }
    </style>

    <div class="navi center-hv" onclick={this.onclickBack}><i class="fas fa-chevron-left"></i></div>
    <div class="page-input-container center-hv">
        <input type="tel" value={this.current_page} onkeypress={this.onkeypress}/>
        <div class="label center-hv"> / {this.total_pages}</div>
    </div>
    <div class="navi center-hv" onclick={this.onclickForward}><i class="fas fa-chevron-right"></i></div>
    <div class="label center-hv">ヒット件数: {this.total_count.toLocaleString()}</div>

    <script>
        this.current_page = 1;
        this.total_pages = 0;
        this.total_count = 0;

        this.setCurrentPage = (page) => {
            this.current_page = page;
            this.update();
        };

        this.setTotalPages = (pages) => {
            this.total_pages = pages;
            this.update();
        };
        
        this.setTotaCount = (total_count) => {
            this.total_count = total_count;
            this.update();
        };

        this.resetPage = () => {
            this.current_page = 1;
            this.total_pages = 0;
            this.total_count = 0;  
            this.update();
        };

        this.onkeypress = (e) =>{
            if(e.key=="Enter"){
                const num = parseInt(e.target.value);
                if(isNaN(num)){
                    return;
                }
                this.current_page = num;
                this.opts.onmovepage(this.current_page);
                return;
            }
            if(!/^[0-9]+$/.test(e.key)){
                e.returnValue = false;
            }
        };

        this.onclickBack = () =>{
            if(this.current_page > 1){
                this.current_page -= 1;
                this.update();

                this.opts.onmovepage(this.current_page);
            }
        };

        this.onclickForward = () =>{
            if(this.current_page < this.total_pages){
                this.current_page += 1;
                this.update();

                this.opts.onmovepage(this.current_page);
            }
        };

    </script>
</pagination>