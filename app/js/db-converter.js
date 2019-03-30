const fs = require("fs");
const path = require("path");
const sql = require("sql.js");


class DBConverter {
    /**
     * 
     * @param {string} db_file_path 
     */
    init(db_file_path) {
        const data = fs.readFileSync(db_file_path);
        const uint_8array = new Uint8Array(data);
        this.db = new sql.Database(uint_8array);
    }
    get_dirpath() {
        return this.dirpath_list;
    }

    get_video() {
        return this.video_list;
    }

    read() {
        this._read_dirpath();
        this._read_tag_string();
        this._read_tag();
        this._read_video();
    }

    _read_dirpath() {
        // this.dirpath_map = new Map();
        let res = this.db.exec("SELECT * FROM file");
        const values = res[0].values;
        this.dirpath_list = values.map(value=>{
            const _data_type = "dir";
            const dirpath_id = value[0];
            const dirpath = decodeURIComponent(value[1]);
            return { _data_type, dirpath_id, dirpath };
        });
    }

    _read_tag_string() {
        this.tag_string_map = new Map();

        let res = this.db.exec("SELECT * FROM tagstring");
        const values = res[0].values;
        values.forEach((value) => {
            const id = value[0];
            const tag = value[1];
            this.tag_string_map.set(id, tag);
        });
    }

    _read_tag() {
        this.tag_map = new Map();
        let res = this.db.exec("SELECT * FROM nnddvideo_tag");
        const values = res[0].values;
        values.forEach((value) => {
            const video_id = value[1];
            const tag_id = value[2];
            if (!this.tag_map.has(video_id)) {
                this.tag_map.set(video_id, new Array());
            }
            if (this.tag_string_map.has(tag_id)) {
                const tag_string = this.tag_string_map.get(tag_id);
                this.tag_map.get(video_id).push(tag_string);
            }
        });
    }

    _read_video() {
        let res = this.db.exec("SELECT * FROM nnddvideo");
        const values = res[0].values;
        this.video_list = values.map(value=>{
            const id = value[0];
            const key = value[1];
            const uri = value[2];
            const dirpath_id = value[3];
            const video_name = value[4];
            const is_economy = value[5];
            const modification_date = value[6];
            const creation_date = value[7];
            const thumb_url = value[8];
            const play_count = value[9];
            const time = value[10];
            const last_play_date = value[11];
            const yet_reading = value[12];
            const pub_date = value[13];

            const video_filename = path.basename(decodeURIComponent(uri));
            const video_type = path.extname(uri).slice(1);

            const tags = this.tag_map.get(id);
            return {
                _data_type: "video",
                _db_type: "xml",
                video_id: key,
                //uri: uri,
                dirpath_id: dirpath_id,
                video_name: video_name,
                video_filename: video_filename,
                video_type: video_type,
                is_economy: is_economy,
                modification_date: modification_date,
                creation_date: creation_date,
                // thumb_url: thumb_url,
                play_count: play_count,
                time: time,
                last_play_date: last_play_date,
                yet_reading: yet_reading,
                pub_date: pub_date,
                tags: tags
            };
        });
    }
}

module.exports = DBConverter;