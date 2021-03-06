const path = require("path");
const fs = require("fs");
const NicoDataParser = require("./nico-data-parser");

class NicoDataFile {
    constructor(id){
        this.id = id;
    }

    set commonFilename(name){
        this.common_filename = `${this._cnvFilename(name)} - [${this.id}]`;
    }

    set dirPath(dir_path){
        this.dir_path = dir_path;
    }
    
    set thumbnailSize(thumbnail_size){
        this.thumbnail_size = thumbnail_size;
    }
    
    get thumbnailSize(){
        return this.thumbnail_size;
    }

    get videoPath(){
        return path.join(this.dir_path, this.videoFilename);
    }

    get videoType(){
        return this.video_type;
    }

    set videoType(video_type){
        this.video_type = video_type;
    }

    get commentPath(){
        return path.join(this.dir_path, this.commentFilename);
    }

    get thumbInfoPath(){
        return path.join(this.dir_path, this.thumbInfoFilename);
    }

    get thumbImgPath(){
        return path.join(this.dir_path, this.thumbImgFilename);
    }

    get videoFilename(){
        return `${this.common_filename}.${this.video_type}`;
    }

    _cnvFilename(name){
        // \/:?*"<>|
        return name
            .replace(/\\/g, "＼")
            .replace(/\//g, "／")
            .replace(/:/g, "：")
            .replace(/\?/g, "？")
            .replace(/\*/g, "＊")
            .replace(/</g, "＜")
            .replace(/>/g, "＞")
            .replace(/\|/g, "｜")
            .replace(/#/g, "＃");
    }
}

class NicoXMLFile extends NicoDataFile {
    get commentFilename(){
        return `${this.common_filename}.xml`;
    }

    get ownerCommentPath(){
        return path.join(this.dir_path, `${this.common_filename}[Owner].xml`);
    }

    get ichibaInfoPath(){
        return path.join(this.dir_path, `${this.common_filename}[IchibaInfo].html`);
    }

    get thumbInfoFilename(){
        return `${this.common_filename}[ThumbInfo].xml`;
    }

    get thumbImgFilename(){
        return `${this.common_filename}[ThumbImg].jpeg`;
    }

    /**
     * 
     * @returns {Array} comments 
     */
    getComments() {
        const comment_data = this.getCommentData();
        return NicoDataParser.makeComments(comment_data);
    }

    getCommentData(){
        const owner_xml = fs.readFileSync(this.ownerCommentPath, "utf-8");
        const user_xml = fs.readFileSync(this.commentPath, "utf-8");
        const owner_comment_data = NicoDataParser.xml_comment(owner_xml, true);
        const user_comment_data = NicoDataParser.xml_comment(user_xml, false);
        return owner_comment_data.concat(user_comment_data);
    }

    getThumbInfo() {
        const file_path = this.thumbInfoPath;
        const xml = fs.readFileSync(file_path, "utf-8");
        const thumb_info = NicoDataParser.xml_thumb_info(xml);
        const tags = thumb_info.tags.map((value, index) => {
            return {
                id: index+1,
                name: value.text,
                isLocked: value.lock,
            };
        });
        return {
            video: {
                video_id: thumb_info.video_id,
                title: thumb_info.title, 
                description: thumb_info.description, 
                thumbnailURL: thumb_info.thumbnail_url, 
                largeThumbnailURL: thumb_info.thumbnail_url + ".L", 
                postedDateTime: thumb_info.first_retrieve, 
                duration: thumb_info.length, 
                viewCount: thumb_info.view_counter, 
                mylistCount: thumb_info.mylist_counter, 
                video_type: thumb_info.video_type
            },
            thread: {
                commentCount: thumb_info.comment_counter
            },
            tags: tags,
            owner: {
                id: thumb_info.user_id, 
                nickname: thumb_info.user_nickname,
                iconURL: thumb_info.user_icon_url,
            }
        };
    }
}

class NicoJsonFile extends NicoDataFile {   
    get commentFilename(){
        return `${this.common_filename}[Comment].json`;
    }

    get thumbInfoFilename(){
        return `${this.common_filename}[ThumbInfo].json`;
    }

    get thumbImgFilename(){
        if(this.thumbnail_size=="L"){
            return `${this.common_filename}[ThumbImg].L.jpeg`;
        }else{
            return `${this.common_filename}[ThumbImg].jpeg`;
        }
    }

    getComments() {
        const comment_data = this.getCommentData();
        return NicoDataParser.makeComments(comment_data);
    }

    getCommentData(){
        const text = fs.readFileSync(this.commentPath, "utf-8");
        return NicoDataParser.json_comment(text);
    }

    getThumbInfo() {
        const file_path = this.thumbInfoPath;
        const text = fs.readFileSync(file_path, "utf-8");
        const thumb_info = JSON.parse(text);
        return thumb_info;
    }
}

class NicoVideoData {
    constructor(video_item){
        this.nico_data = this._getData(video_item);
    }

    _getData(video_item){
        let nico_data = null;

        const data_type = video_item.data_type;
        if(data_type=="xml"){
            nico_data = new NicoXMLFile(video_item.id);
        } else if(data_type=="json"){
            nico_data = new NicoJsonFile(video_item.id);
        }else{
            throw new Error(`${data_type} is unkown`);
        }

        nico_data.dirPath = video_item.dirpath;
        nico_data.commonFilename = video_item.common_filename;
        nico_data.videoType = video_item.video_type;
        nico_data.thumbnailSize = video_item.thumbnail_size;
        nico_data.is_deleted = video_item.is_deleted;
        nico_data.is_economy = video_item.is_economy;
        return nico_data;
    }

    getVideoPath() {
        return this.nico_data.videoPath;
    }

    getVideoType(){
        return this.nico_data.videoType;
    }

    getThumbImgPath(){
        return this.nico_data.thumbImgPath;
    }

    getComments() {
        return this.nico_data.getComments();
    }

    getCommentData() {
        return this.nico_data.getCommentData();
    }

    getThumbInfoPath() {
        return this.nico_data.thumbInfoPath;
    }

    getThumbInfo() {
        const thumb_info = this.nico_data.getThumbInfo();
        const thumb_img_path = this.getThumbImgPath();
        thumb_info.video.thumbnailURL = thumb_img_path;
        thumb_info.video.largeThumbnailURL = thumb_img_path;
        return thumb_info;
    }

    getIsDeleted() {
        return this.nico_data.is_deleted;
    }

    getIsEconomy() {
        return this.nico_data.is_economy;
    }
}

const getNicoDataFilePaths = (video_item) => {
    const xml_item = new NicoXMLFile(video_item.id);
    xml_item.dirPath        = video_item.dirpath;
    xml_item.commonFilename = video_item.common_filename;
    xml_item.videoType      = video_item.video_type;
    xml_item.thumbnailSize  = video_item.thumbnail_size;
    xml_item.is_deleted     = video_item.is_deleted;

    const json_item = new NicoJsonFile(video_item.id);
    json_item.dirPath        = video_item.dirpath;
    json_item.commonFilename = video_item.common_filename;
    json_item.videoType      = video_item.video_type;
    json_item.thumbnailSize  = video_item.thumbnail_size;
    json_item.is_deleted     = video_item.is_deleted;

    const paths = new Set();
    paths.add(xml_item.videoPath);
    paths.add(xml_item.thumbImgPath);
    paths.add(xml_item.thumbInfoPath);
    paths.add(xml_item.commentPath);
    paths.add(xml_item.ownerCommentPath);
    paths.add(xml_item.ichibaInfoPath);

    paths.add(json_item.videoPath);
    paths.add(json_item.thumbImgPath);
    paths.add(json_item.thumbInfoPath);
    paths.add(json_item.commentPath);

    return [...paths];  
};

/**
 * *** - [(***)].***
 * @param {string} finename 
 */
const getIDFromFilename = (finename) => {
    const regexp = /\s-\s\[([a-z]*[\d]+|[\d]+)\]\.+/gi;
    let match = null;
    let id = null;
    while ((match = regexp.exec(finename))!== null) {
        id = match[1];
    }
    if(id==null){
        throw new Error(`cant get id form ${finename}`);
    }
    return id;
};

/**
 * (***) - [***].***
 * @param {string} finename 
 */
const getCommonNameFromFilename = (finename) => {
    const regexp = /(.+)\s-\s\[[a-z]*[\d]+\]\.+/gi;
    const match = regexp.exec(finename);
    if(match==null){
        throw new Error(`cant get common name form ${finename}`);
    }
    return match[1];
};

module.exports = {
    NicoDataFile,
    NicoXMLFile,
    NicoJsonFile,
    NicoVideoData,
    getNicoDataFilePaths,
    getIDFromFilename,
    getCommonNameFromFilename
};