const test = require("ava");
const fs = require("fs").promises;
const path = require("path");

const pp = (key, ary) => {
    const output = ary.map(value=>{
        return JSON.stringify(value, null, 0);
    }).join(",\n");

    return `["${key}", [\n${output}\n]]`;
};

/**
 * 
 * @param {String} name 
 * @param {Array} ary 
 */
const rr = (name, ary) =>{
    const map = new Map();
    ary.forEach(value=>{
        map.set(value[name], value);
    });
    return map;
};

class testDB {
    constructor({filename="./db.json", autonum=10, use_log=true}={}){  
        this.autonum = autonum;
        this.use_log = use_log;
        const fullpath = path.resolve(filename);
        this.db_path = fullpath;
        this.log_path = this._getLogFilePath(fullpath);

        // this.init();
        this.db_map = new Map();
        this.cmd_log_count = 0;
    }

    // init(){
    //     // this.db_map = new Map();
    //     // ["path", "video"].forEach(name => {
    //     //     this.db_map.set(name, new Map());
    //     // });
    //     this.cmd_log_count = 0;
    // }

    createTable(names){
        this.db_map.clear();
        names.forEach(name => {
            this.db_map.set(name, new Map());
        });
    }

    _getLogFilePath(db_file_path){
        const dir = path.dirname(db_file_path);
        const ext = path.extname(db_file_path);
        return path.join(dir, `${path.basename(db_file_path, ext)}.log`);
    }

    async load(){
        if(await this._existFile(this.db_path)){ 
            const jsonString = await this._readFile(this.db_path);
            const obj = JSON.parse(jsonString);
            const r_map = new Map(obj);  
            r_map.forEach((value, key)=>{
                this.db_map.set(key, rr("id", value));
            }); 
        }
        
        if(await this._existFile(this.log_path)){
            const cmd_logs = await this._readlog(this.log_path);
            this._applyCmdLog(cmd_logs);
            await this.save();
        }
    }

    async _existFile(file_path){
        try {
            await fs.stat(file_path);
            return true;
        } catch (error) {
            return false;
        }  
    }

    exist(name, id){
        if(!this.db_map.has(name)){
            return false;
        }
        return this.db_map.get(name).has(id);
    }

    find(name, id){
        if(!this.db_map.has(name)){
            return null;
        }
        const map = this.db_map.get(name);
        if(!map.has(id)){
            return null;
        }   
        return map.get(id);
    }

    findAll(name){
        if(!this.db_map.has(name)){
            return [];
        }
        const map = this.db_map.get(name);
        return Array.from(map.values()); 
    }

    async insert(name, data){
        const map = this.db_map.get(name);
        map.set(data.id, data);
        
        await this._log({
            target:name,
            type:"insert",
            value:{id:data.id,data:data}
        });
    }

    async update(name, id, props){
        const map = this.db_map.get(name);
        if(!map.has(id)){
            throw new Error(`${name} not has ${id}`);
        }

        map.set(id, 
            Object.assign(map.get(id), props));

        await this._log({
            target:name,
            type:"update",
            value:{id:id, data:props}
        });
    }

    async save(){
        const items = [];
        this.db_map.forEach((value, key)=>{
            const ary = Array.from(value.values());
            items.push(pp(key, ary));
        }); 

        const jsonString = `[${items.join(",\n")}]`;
        await this._safeWriteFile(this.db_path , jsonString);
        await this._deletelog();
        this.cmd_log_count = 0;
    }

    async _safeWriteFile(file_path, data){
        const tmp_path = path.join(path.dirname(file_path), `~${path.basename(file_path)}`);
        await this._writeFile(tmp_path, data, "utf-8");    
        await this._rename(tmp_path, file_path);
    }

    async _log(cmd){
        if(!this.use_log){
            return;
        }

        this.cmd_log_count++;
        await this._writelog(cmd);

        if(this.cmd_log_count >= this.autonum){
            await this.save();      
            return;
        }
    }

    async _deletelog(){
        await this._unlink(this.log_path);
    } 

    async _writelog(cmd){
        const data = JSON.stringify(cmd, null, 0);
        await this._appendFile(this.log_path, `${data}\n`);
    }

    async _readlog(log_path){
        if(!await this._existFile(log_path)){
            return [];
        }

        const str = await this._readFile(log_path);
        const lines = str.split(/\r\n|\n/);
        const cmds = lines.filter(line=>{
            return line.trim().length > 0;
        }).map(line=>{
            return JSON.parse(line.trim());
        });
        return cmds;
    }

    async _readFile(file_path){
        return await fs.readFile(file_path, "utf-8");
    }
    async _appendFile(file_path, data){
        await fs.appendFile(file_path, data, "utf-8");
    }
    async _unlink(file_path){
        return await fs.unlink(file_path);
    }
    async _writeFile(file_path, data){
        await fs.writeFile(file_path, data, "utf-8");    
    }
    async _rename(old_path, new_path){
        await fs.rename(old_path, new_path);
    }

    /**
     * 
     * @param {Array} cmd_logs 
     */
    _applyCmdLog(cmd_logs){
        cmd_logs.forEach(item=>{
            const target = item.target;
            if(!this.db_map.has(target)){
                return;
            }

            const data_map = this.db_map.get(target);
            const value = item.value;
            if(item.type=="insert"){
                data_map.set(value.id, value.data);
            }

            if(item.type=="update"){
                if(!data_map.has(value.id)){
                    return;
                }
                data_map.set(value.id, 
                    Object.assign(data_map.get(value.id), value.data));
            }
        }); 
    }
}

class kk {
    constructor({db_file_path="./db.json", autonum=10}={}){
        // this._db = this._createDB({filename:db_file_path, autonum:autonum});
        // this._db.createTable(["path, video"]);
        this.params = {filename:db_file_path, autonum:autonum};
    }

    _createDB(params){
        return new testDB(params);
    }

    async load(){
        this._db = this._createDB(this.params);
        this._db.createTable(["path, video"]);
        await this._db.load();
    }

    exist(video_id){
        return this._db.exist("vieo", video_id);
    }

    find(video_id){ 
        const video_item = this._db.find("video", video_id);
        const path_item = this._db.find("path", video_item.path_id);
        video_item.path = path_item.path;
        // Object.assign(vieo_item, {path: path});
        return video_item;
    }

    findAll(){
        const video_items = this._db.findAll("video");
        video_items.forEach(item=>{
            const path_item = this._db.find("path", item.path_id);
            item.path = path_item.path;
        });
        return video_items;
        // return this._db.findAll("video");
    }

    async insert(path, video_data){
        const path_id = await this._getPathID(path);
        video_data.path_id = path_id;

        await this._db.insert("path", {"id":path_id,"path":path});
        await this._db.insert("video", video_data);
    }

    async update(video_id, props){
        await this._db.update("video", video_id, props);
    }

    async _getPathID(path){
        const path_map = this._db.db_map.get("path");
        for (let [k, v] of path_map) {
            if (v.path == path) { 
                return k; 
            }
        }  

        const max_id = 10000;
        for (let index = 0; index < max_id; index++) {
            const id = String(index);
            if(!path_map.has(id)){
                return id;
            } 
        }

        throw new Error("maximum id value has been exceeded");
    }
}

class testDB2 extends testDB {
    constructor(exist_log=false){
        super({autonum:2});
        this.test_log = [];
        this.exist_log = exist_log;
    }

    async _readFile(file_path){
        if(file_path.match(/db\.json/)){
            const data = 
                `[["path", [
                {"id":"0","path":"c:/data"}
                ]],
                ["video", [
                {"id":"sm1","path_id":"0","tags":["tag1"]}
                ]]]`;
            return data;
        }

        if(file_path.match(/db\.log/)){
            return `
            {"target":"path","type":"insert","value":{"id":"1","data":{"id":"1","path":"c:/data1"}}}
            {"target":"video","type":"insert","value":{"id":"sm2","data":{"id":"sm2","path_id":"1","tags":["tag2"]}}}
            {"target":"video","type":"update","value":{"id":"sm1","data":{"tags":["tag1","tag2","tag3"]}}}
            `;
        }
    }

    async _existFile(file_path){
        if(file_path.match(/db\.json/)){
            return true;
        }
        if(file_path.match(/db\.log/)){
            return this.exist_log;
        }
        return false;
    }

    async _appendFile(file_path, data){
        const fname = path.basename(file_path);
        this.test_log.push(`append ${fname}`);
    }
    async _unlink(file_path){
        const fname = path.basename(file_path);
        this.test_log.push(`unlink ${fname}`);
    }
    async _writeFile(file_path, data){
        const fname = path.basename(file_path);
        this.test_log.push(`writeFile ${fname}`);   
    }
    async _rename(old_path, new_path){
        const old_fname = path.basename(old_path);
        const new_fname = path.basename(new_path);
        this.test_log.push(`rename ${old_fname} ${new_fname}`);
    }
} 

class testDB3 extends kk {
    constructor(exist_log=false){
        super({autonum:2});
        this.exist_log = exist_log;
    }

    _createDB(params){
        return new testDB2(this.exist_log);
    }
} 


test("db non", async t => {
    const db = new testDB({use_log:false});

    t.falsy(db.exist("sm1"));
    t.is(db.find("sm1"), null);
    t.deepEqual(db.findAll(), []);
});

test("db1", async t => {
    const db = new testDB({use_log:false});
    db.createTable(["p", "v"]);

    const p_list = [
        {id:"1", path: "n1-data1"},
        {id:"2", path: "n1-data2"}
    ];
    const v_list = [
        {id:"sm1", num:1, bool:false, ary:["tag1"]},
        {id:"sm2", num:2, bool:true, ary:["tag1","tag2"]}
    ];   

    await db.insert("p", p_list[0]);
    await db.insert("p", p_list[1]);

    await db.insert("v", v_list[0]);
    await db.insert("v", v_list[1]);

    t.truthy(db.exist("p", "1"));
    t.truthy(db.exist("p", "2"));
    t.falsy(db.exist("p", "3"));

    t.truthy(db.exist("v", "sm1"));
    t.truthy(db.exist("v", "sm2"));
    t.falsy(db.exist("v", "sm3"));

    t.falsy(db.exist("non", "1"));

    t.deepEqual(db.find("p", "1"), p_list[0]);
    t.deepEqual(db.find("p", "2"), p_list[1]);
    t.deepEqual(db.findAll("p"), p_list);

    t.deepEqual(db.find("v", "sm1"), v_list[0]);
    t.deepEqual(db.find("v", "sm2"), v_list[1]);
    t.deepEqual(db.findAll("v"), v_list);

    await db.update("v", "sm1", {bool:true, ary:["tag1", "tag2", "tag3"]});
    t.deepEqual(db.find("v", "sm1"), {id:"sm1", num:1, bool:true, ary:["tag1", "tag2", "tag3"]});

    t.deepEqual(db.findAll("v"), 
        [
            {id:"sm1", num:1, bool:true, ary:["tag1", "tag2", "tag3"]},
            v_list[1]
        ]);
    
});

test("db2", async t => {
    const filename = path.join(__dirname, "test.join");
    const db = new testDB({filename:filename});

    t.is(db.db_path, filename);
    t.is(db.log_path, path.join(__dirname, "test.log"));
});

test("db3", async t => {
    const db_fname = "db.json";
    const db_tmp_fname = "~db.json";
    const log_fname = "db.log";

    const db = new testDB2();
    await db.load();

    await db.insert("path", {id:1, path:1});
    await db.insert("path", {id:1, path:1});
    await db.update("video", "sm1", {path_id:1});
    await db.save();

    t.deepEqual(db.test_log, [
        `append ${log_fname}`,
        `append ${log_fname}`,

        `writeFile ${db_tmp_fname}`,
        `rename ${db_tmp_fname} ${db_fname}`,
        `unlink ${log_fname}`,

        `append ${log_fname}`,

        `writeFile ${db_tmp_fname}`,
        `rename ${db_tmp_fname} ${db_fname}`,
        `unlink ${log_fname}`,
    ]);
});

test("db4", async t => {
    const db_fname = "db.json";
    const db_tmp_fname = "~db.json";
    const log_fname = "db.log";

    const exist_log = true;
    const db = new testDB2(exist_log);
    await db.load();

    t.deepEqual(db.findAll("path"), [
        {id:"0",path:"c:/data"},
        {id:"1",path:"c:/data1"}
    ]);

    t.deepEqual(db.findAll("video"), [
        {id:"sm1",path_id:"0",tags:["tag1","tag2","tag3"]},
        {id:"sm2",path_id:"1",tags:["tag2"]},
    ]);

    t.deepEqual(db.test_log, [
        `writeFile ${db_tmp_fname}`,
        `rename ${db_tmp_fname} ${db_fname}`,
        `unlink ${log_fname}`,
    ]);
});

test("db path", async t => {
    const db = new testDB3();
    await db.load();

    await db.insert("c:/data", {id:"sm2"});
    t.deepEqual(db.find("sm2"), {id:"sm2",path_id:"0", path:"c:/data"});

    await db.insert("c:/data1", {id:"sm3"});
    t.deepEqual(db.find("sm3"), {id:"sm3",path_id:"1", path:"c:/data1"});

    await db.insert("c:/data1", {id:"sm4"});
    t.deepEqual(db.find("sm4"), {id:"sm4",path_id:"1", path:"c:/data1"});
});

test("db log", async t => {
    const exist_log = true;
    const db = new testDB3(exist_log);
    await db.load();

    t.deepEqual(db.findAll(), [
        {id:"sm1", path_id:"0", path:"c:/data", tags:["tag1","tag2","tag3"]},
        {id:"sm2", path_id:"1", path:"c:/data1", tags:["tag2"]},
    ]);
});

test.skip("db", t => {
    const map = new Map();
    map.set("path", [
        {"path_id":1,"path":"C:\\dev\\test\\data1"},
        {"path_id":0,"path":"C:/dev/test/data2"}
    ]);
    map.set("library", [
        {"video_id":"sm1","path_id":0,"is_economy":false,"time":100,"tags":["タグ1"]},
        {"video_id":"sm2","path_id":1,"is_economy":false,"time":200,"tags":["タグ1","タグ2"]}
    ]);


    const o_items = [];
    map.forEach((value, key)=>{
        o_items.push(pp(key, value));
    });
    const jsonString = `[${o_items.join(",\n")}]`;
    // const jsonString = JSON.stringify([...map]);
    console.log(jsonString);


    const items = JSON.parse(jsonString);
    const r_map = new Map(items);
    const p_map = rr("path_id", r_map.get("path"));
    const v_map = rr("video_id", r_map.get("library"));
    console.log("p_map=", p_map);
    console.log("v_map=", v_map);
    console.log("[0].tags=", r_map.get("library")[0].tags);
    console.log("[1].tags=", r_map.get("library")[1].tags);

    const lmap = new Map();
    lmap.set("path", Array.from( p_map.values() ));
    lmap.set("library", Array.from( v_map.values() ));
    console.log("lmap=", lmap);

    const uu = [
        {
            "target":"path",
            "type":"add",
            "value":{"path_id":2,"path":"C:\\dev\\test\\data3"}
        },
        {
            "target":"library",
            "type":"add",
            "value":{
                "video_id":"sm3","path_id":0,"is_economy":false,"time":300,"tags":["タグ3"],
            }
        }, 
        {
            "target":"library",
            "type":"update",
            "value":{
                "video_id":"sm1","is_economy":true,"time":300,"tags":[],
            }
        },  
    ];
    const uu_str = pp_ary(uu);
    console.log("uu_str=", uu_str);
    const uu_res = JSON.parse(uu_str);
    console.log("uu_res=", uu_res);

    uu.forEach(item=>{
        if(item.target=="path"){
            const value = item.value;
            if(item.type=="add"){
                p_map.set(value.path_id, value);
            }
        }
        if(item.target=="library"){
            const value = item.value;
            if(item.type=="add"){
                v_map.set(value.video_id, value);
            }
            if(item.type=="update"){
                // Object.assign(target, source);
                v_map.set(value.video_id, 
                    Object.assign(v_map.get(value.video_id), value));
            }
        }
    });
    console.log("p_map2=", p_map);
    console.log("v_map2=", v_map);
});