const fs = require("fs");
const util = require("util");
const path = require("path");
const request = require("request");
const { NicoWatch, NicoVideo, NicoComment } = require("./niconico");
const { NicoJsonFile } = require("./nico-data-file");
const  NicoDataParser = require("./nico-data-parser");
const logger = require("./logger");

const validateStatus = (status) => {
    return status >= 200 && status < 300;
};

const convertMB = (size_byte) => {
    const mb = 1024**2;
    return (size_byte/mb).toFixed(1);
};

const DonwloadProgMsg =  Object.freeze({   
    start_watch: "watch取得",
    start_thumbinfo: "thumbinfo取得",
    start_comment: "コメント取得",
    start_thumbimg: "サムネイル取得",
    start_dmc: "DMC取得",
    start_smile: "smile取得",
    write_data: "データ書き込み",
    complete: "完了",
    rename_video_file: "動画ファイルリネーム",
    stop_hb: "HB停止",
});

class DownloadRequest {
    constructor(url, cookie){
        this.url = url;
        this.cookie = cookie;
        this.req = null;
        this.canceled = false;
    }

    cancel(){
        if(this.req){
            this.canceled = true;
            this.req.abort();
        }
    }

    download(stream, on_progress=(state)=>{}){
        this.canceled = false;
        return new Promise(async (resolve, reject) => {
            let content_len = 0;
            let current = 0 ;
            let error_obj = null;
            const closeWithError = (error) => {
                error_obj = error;
                stream.close();
            };
            const options = {
                method: "GET",
                uri: this.url, 
                jar: this.cookie,
                timeout: 5 * 1000
            };
            this.req = request(options, (error, res, body) => {
                if(error){
                    closeWithError(error);
                }
                else if(!validateStatus(res.statusCode)){
                    closeWithError(new Error(`${res.statusCode}:${this.url}`));
                }
            }).on("error", (error) => {
                closeWithError(error);
            }).on("response", (res) => {
                if(validateStatus(res.statusCode)){
                    content_len = res.headers["content-length"];
                }else{
                    closeWithError(new Error(`${res.statusCode}:${this.url}`));
                }
            }).on("data", (chunk) => {
                if(content_len > 0){
                    const pre_per = Math.floor((current/content_len)*100);
                    current += chunk.length;
                    const cur_per = Math.floor((current/content_len)*100);
                    if(cur_per > pre_per){
                        on_progress(`${convertMB(content_len)}MB ${cur_per}%`);
                    }
                }
            }).on("abort", () => {
                if(this.canceled){
                    const error = new Error("cancel");
                    error.cancel = true;
                    closeWithError(error);
                }
            });

            stream.on("error", (error) => { 
                reject(error);
            }).on("close", () => {
                if(error_obj!=null){
                    reject(error_obj);
                }else{
                    on_progress(DonwloadProgMsg.complete);
                    resolve();
                }
            });

            this.req.pipe(stream);
        });
    }
}

const DownloadResultType = Object.freeze({
    complete: "complete",
    cancel: "cancel",
    skip: "skip",
    error: "error"
});

class NicoDownloader {
    constructor(video_id, dist_dir, only_max_quality=true){
        this.video_id = video_id;
        this.dist_dir = dist_dir;
        this.only_max_quality = only_max_quality;

        this.nico_json = new NicoJsonFile(video_id);
    }

    static get ResultType(){
        return DownloadResultType;
    }

    cancel(){
        if(this.nico_watch){
            this.nico_watch.cancel();
        }
        if(this.nico_video){
            this.nico_video.cancel();
        }   
        if(this.nico_comment){
            this.nico_comment.cancel();
        }  
        if(this.img_request){
            this.img_reuqest_canceled = true;
            this.img_request.abort();
        }         
        if(this.video_download){
            this.video_download.cancel();
        }
    }

    async _renameTmp(oldname, newname){
        const promisify_rename = util.promisify(fs.rename);
        await promisify_rename(oldname, newname);
    }

    async download(on_progress){
        try {
            on_progress(DonwloadProgMsg.start_watch);
            await this._getWatchData(this.video_id);
            await this._getVideoInfo();

            if(this.only_max_quality){
                if(!this.videoinfo.maxQuality){
                    return {
                        type: DownloadResultType.skip,
                        reason: "最高画質でないため"
                    };
                }
            }

            this._setupNicoFilePath();

            on_progress(DonwloadProgMsg.start_thumbinfo);
            const thumbInfo_data = NicoDataParser.json_thumb_info(this.watch_data.api_data);

            on_progress(DonwloadProgMsg.start_comment);
            const comment_data = await this._getComment();


            on_progress(DonwloadProgMsg.start_thumbimg);
            const { thumbImg_data, thumbnail_size } = await this._getThumbImg();
            this.nico_json.thumbnailSize = thumbnail_size;

            const tmp_video_path = this._getTmpVideoPath();
            const stream = this._createStream(tmp_video_path);
            if(this.videoinfo.server=="dmc"){
                on_progress(DonwloadProgMsg.start_dmc);
                await this._getVideoDmc(stream, on_progress);
            }else{
                on_progress(DonwloadProgMsg.start_smile);
                await this._getVideoSmile(stream, on_progress);
            }

            on_progress(DonwloadProgMsg.write_data);
            this._writeJson(this.nico_json.thumbInfoPath, thumbInfo_data);
            this._writeJson(this.nico_json.commentPath, comment_data);
            this._writeBinary(this.nico_json.thumbImgPath, thumbImg_data);

            on_progress(DonwloadProgMsg.rename_video_file);
            await this._renameTmp(tmp_video_path, this.nico_json.videoPath);

            return {
                type: DownloadResultType.complete,
                reason: ""
            };
        } catch (error) {
            if(error.cancel){
                return {
                    type: DownloadResultType.cancel,
                    reason: "cancel"
                };
            }

            return {
                type: DownloadResultType.error,
                reason: error
            };
        }
    }

    async _getWatchData(video_id){
        this.nico_watch = new NicoWatch();
        this.watch_data = await this.nico_watch.watch(video_id);
    }

    async _getVideoInfo(){
        const api_data = this.watch_data.api_data;
        this.nico_video = new NicoVideo(this.watch_data.api_data);

        if(this.nico_video.isDmc()){
            const dmc_session = await this.nico_video.postDmcSession();
            this.videoinfo = {
                server: "dmc",
                maxQuality: this._isDMCMaxQuality(api_data, dmc_session)
            };
        }else{
            this.videoinfo = {
                server: "smile",
                maxQuality: this._isSmileMaxQuality(api_data)
            };
        }        
    }

    async _getComment(){
        const api_data = this.watch_data.api_data;
        this.nico_comment = new NicoComment(api_data);
        return await this.nico_comment.getComment();
    }

    _getThumbnailData(api_data){
        const video = api_data.video;
        if(video.largeThumbnailURL!==null){
            return { 
                thumbnail_url: video.largeThumbnailURL, 
                thumbnail_size: "L" 
            };
        }
        
        return { 
            thumbnail_url: video.thumbnailURL, 
            thumbnail_size: "S" 
        };
    }

    //TODO
    _getThumbImg(){
        const api_data = this.watch_data.api_data;
        const { thumbnail_url, thumbnail_size } = this._getThumbnailData(api_data);

        this.img_reuqest_canceled = false;

        return new Promise(async (resolve, reject) => {
            const options = {
                method: "GET", 
                uri: thumbnail_url, 
                timeout: 5 * 1000,
                encoding: null
            };

            this.img_request = request(options, (error, response, body)=>{
                if(error){
                    reject(error);
                }else if(validateStatus(response.statusCode)){
                    resolve({ thumbImg_data: body, thumbnail_size: thumbnail_size });
                } else {
                    reject(new Error(`${response.statusCode}:${thumbnail_url}`));
                }
            }).on("abort", () => {
                if(this.img_reuqest_canceled){
                    const error = new Error("cancel");
                    error.cancel = true;
                    reject(error);
                }
            });
        });
    }

    _createStream(dist_path){
        return fs.createWriteStream(dist_path);
    }

    async _getVideoDmc(stream, on_progress){
        //cancel
        await this.nico_video.optionsHeartBeat();
        this.nico_video.postHeartBeat((error)=>{
            logger.error("video dmc HeartBeat: ", error);
            throw error;
        });

        const { cookie_jar } = this.watch_data;
        const video_url = this.nico_video.DmcContentUri;

        this.video_download = new DownloadRequest(video_url, cookie_jar);
        try {
            await this.video_download.download(stream, on_progress);
        } catch (error) {
            throw error;
        }finally{
            this.nico_video.stopHeartBeat();
            on_progress(DonwloadProgMsg.stop_hb);
        }
    }

    async _getVideoSmile(stream, on_progress){
        //cancel
        const { cookie_jar, api_data } = this.watch_data;
        const url = api_data.video.smileInfo.url;

        this.video_download = new DownloadRequest(url, cookie_jar);
        await this.video_download.download(stream, on_progress);
    }   

    getDownloadedItem(){
        const { api_data } = this.watch_data;
        const is_deleted = api_data.video.isDeleted;
        const video_id = api_data.video.id;
        const video_type = NicoDataParser.getVideoType(api_data.video.smileInfo.url);
        const tags = api_data.tags.map((value) => {
            return value.name;
        });
        const { thumbnail_url, thumbnail_size } = this._getThumbnailData(api_data);
        
        return {
            data_type:"json", 
            dirpath: this.dist_dir,
            id: video_id,
            video_name: api_data.video.title,
            video_type: video_type,
            is_economy: !this.videoinfo.maxQuality,
            play_time: api_data.video.duration,
            pub_date: new Date(api_data.video.postedDateTime).getTime(),
            tags: tags,
            is_deleted: is_deleted,
            thumbnail_size: thumbnail_size,
        };
    }

    _setupNicoFilePath(){
        const { api_data } = this.watch_data;
        const video_type = NicoDataParser.getVideoType(api_data.video.smileInfo.url);

        this.nico_json.dirPath = this.dist_dir;
        this.nico_json.commonFilename = api_data.video.title;
        this.nico_json.videoType = video_type;
    }

    _getTmpVideoPath(){
        return path.join(this.dist_dir, "_video.tmp");
    }

    _writeJson(file_path, data){
        const json = JSON.stringify(data, null, "  ");
        fs.writeFileSync(file_path, json, "utf-8");
    }

    _writeBinary(file_path, data){
        fs.writeFileSync(file_path, data, "binary");
    }

    _isSmileMaxQuality(api_data){
        const url = api_data.video.smileInfo.url;
        return !/low/.test(url);
    }

    _isDMCMaxQuality(api_data, dmc_session){
        const quality = api_data.video.dmcInfo.quality;
        const max_quality = { 
            video: quality.videos[0].id,
            audio: quality.audios[0].id
        };
    
        const src_id_to_mux = 
            dmc_session.session.content_src_id_sets[0].content_src_ids[0].src_id_to_mux;
        const session_quality = { 
            video: src_id_to_mux.video_src_ids[0],
            audio: src_id_to_mux.audio_src_ids[0]
        };
    
        return max_quality.video == session_quality.video
            && max_quality.audio == session_quality.audio;
    }
}

module.exports = {
    DonwloadProgMsg: DonwloadProgMsg,
    NicoDownloader: NicoDownloader
};