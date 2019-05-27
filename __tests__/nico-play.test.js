const test = require("ava");
const { NicoPlay } = require("../app/js/nico-play");

const { NicoMocks, TestData } = require("./helper/nico-mock");
const { ProfTime } = require("./helper/ava-prof-time");

const prof_time = new ProfTime();
const nico_mocks = new NicoMocks();

let state_log = "";
const hb_1s_rate = 1/120;

test.before(t => {
    prof_time.clear();
});

test.after(t => {
    prof_time.log(t);

    nico_mocks.clean();
});

test.beforeEach(t => {
    prof_time.start(t);

    nico_mocks.clean();
    state_log = "";
});

test.afterEach(t => {
    prof_time.end(t);
});

test("nico play dmc", async (t) => {
    t.plan(4);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const nico_play = new NicoPlay(hb_1s_rate);
    nico_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);    
    }).catch(error => {
        t.is(error, undefined);
    });

    await new Promise(resolve => setTimeout(resolve, 2500));
    t.is(state_log, 
        "start watch:finish watch:"
        + "start comment:finish comment:"
        + "start video:start HeartBeat:finish video:");
    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 2);

    nico_play.stopHB();
});

test.cb("nico play dmc cancel", (t) => {
    t.plan(2);

    nico_mocks.watch(3000);
    // nico_mocks.comment();
    // nico_mocks.dmc_session();
    // nico_mocks.dmc_hb();

    const nico_play = new NicoPlay();

    setTimeout(()=>{
        nico_play.cancel();
    },1000);

    nico_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.truthy(error.cancel);
        t.is(state_log, "start watch:");
        t.end();
    });
});

test.cb("nico play dmc cancel hb", (t) => {
    t.plan(5);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const nico_play = new NicoPlay(hb_1s_rate);

    setTimeout(()=>{
        nico_play.cancel();
    },2500);

    setTimeout(()=>{
        t.is(nico_mocks.hb_options_count, 1);
        t.is(nico_mocks.hb_post_count, 2);    
        t.end();
    },6000);   

    nico_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }, (error)=>{
        t.is(state_log, 
            "start watch:finish watch:"
            + "start comment:finish comment:"
            + "start video:start HeartBeat:finish video:");
        t.truthy(error.cancel);
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error, undefined);
    });     
});

test.cb("nico play dmc error watch", (t) => {
    t.plan(3);

    nico_mocks.watch(1, 404);
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const nico_play = new NicoPlay(hb_1s_rate);

    nico_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.is(state_log, "start watch:");
        t.end();
    });
});

test.cb("nico play dmc error comment", (t) => {
    t.plan(3);

    nico_mocks.watch();
    nico_mocks.comment(1, 403);
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const nico_play = new NicoPlay(hb_1s_rate);

    nico_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.is(state_log, "start watch:finish watch:start comment:");
        t.end();
    });
});

test.cb("nico play dmc error dmc_session", (t) => {
    t.plan(5);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session_error();
    nico_mocks.dmc_hb();

    const nico_play = new NicoPlay(hb_1s_rate);

    nico_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.is(state_log, 
            "start watch:finish watch:"
            + "start comment:finish comment:"
            + "start video:");
        t.is(nico_mocks.hb_options_count, 0);
        t.is(nico_mocks.hb_post_count, 0);
        t.end();
    });
});

test.cb("nico play dmc error hb_options", (t) => {
    t.plan(5);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb_options_error(403);

    const nico_play = new NicoPlay(hb_1s_rate);

    nico_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.is(state_log, 
            "start watch:finish watch:"
            + "start comment:finish comment:"
            + "start video:");
        t.is(nico_mocks.hb_options_count, 0);
        t.is(nico_mocks.hb_post_count, 0);
        t.end();
    });
});

test.cb("nico play dmc error hb_post", (t) => {
    t.plan(7);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb_post_error(403);

    const nico_play = new NicoPlay(hb_1s_rate);

    nico_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }, (hb_error)=>{
        t.is(hb_error.cancel, undefined);
        t.is(hb_error.name, "Error");
        t.is(state_log, 
            "start watch:finish watch:"
            + "start comment:finish comment:"
            + "start video:start HeartBeat:finish video:");
        t.is(nico_mocks.hb_options_count, 1);
        t.is(nico_mocks.hb_post_count, 0);
        t.is(nico_play.nico_video.heart_beat_id, null);
        t.end();        
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error, undefined);
    });
});

test("nico play smile", async (t) => {
    t.plan(4);

    nico_mocks.watch();
    nico_mocks.comment();
    // nico_mocks.dmc_session();
    // nico_mocks.dmc_hb();

    const nico_play = new NicoPlay();
    nico_play.setForceSmile(true);

    nico_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);    
    }).catch(error => {
        t.is(error, undefined);
    });

    await new Promise(resolve => setTimeout(resolve, 2500));
    t.is(state_log, 
        "start watch:finish watch:"
        + "start comment:finish comment:"
        + "start video:finish smile:");
    t.is(nico_mocks.hb_options_count, 0);
    t.is(nico_mocks.hb_post_count, 0);
});