import express from "express";
import * as mongoose from "mongoose";
import cors from 'cors'
import videoRouter from './routes/video.route';
import { generateAll } from "./lib/steps";
import connectDB from "./lib/db";
import Video, { IVideo } from "./models/Video";
import Serie from "./models/Serie"


import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// middleware
app.use(express.json());
app.use(cors());

// routes
app.use("/api/videoBlob", videoRouter);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

/*
  1. 每15秒发送一次fetch请求，查看是否有等待生成的视频，如果有，那么开始合成视频。
     合成过程中，停止发送请求。
  2. 如果视频生成完毕，查看是否是会员，如果是，那么直接加入定时任务队列中。
  3. 等待发送到绑定的账号中。
*/

/**
 * 
 * 
 */

(async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error(error);  // 使用 console.error 以更清晰地标识错误信息
  }
})();

let canFetch = true;

setInterval(async () => {
  if (canFetch) {
    try {
      await Serie.init()
      const videos = await Video.find({ status: 'pending' }).populate('serie');
      console.log(videos.length)

      if (videos.length > 0) {
        canFetch = false;

        const pendingVideo = JSON.parse(JSON.stringify(videos[0]))
        // 开始合成时间最早的视频
        const paragraph = pendingVideo.script.script
        const voice = pendingVideo.serie.voice
        const pathname = pendingVideo.script.title
        const videoId = pendingVideo._id
        console.log(voice, pathname, videoId)
        await generateAll(paragraph, voice, pathname, videoId)
        canFetch = true;
      } else {
        console.log('没有等待生成的视频');
      }
    } catch (error) {
      console.error('请求失败:', error);
    }
  }
}, 15000);



app.listen(port, () => {
  console.log(`listening at 端口 ${port}`)
})

