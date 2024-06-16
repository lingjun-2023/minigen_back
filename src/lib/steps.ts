import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { openai } from './openai'
import axios from 'axios';
import ffmpegStatic from 'ffmpeg-static'
import { saveSubFile, Subtitles } from './subTitles';
import { generateImgPrompt, splitPrompt } from './prompt';
import { put } from "@vercel/blob";
import Video from '../models/Video';

ffmpeg.setFfmpegPath(ffmpegStatic!);


/*
    流程
    1. 文本生成图片，将图片存储到临时文件夹
    2. 音频合成
    2.1 导出字幕
    3. 给每一张图片分配特定的时间
    4. 给图片分配特定的动效
    5. 图片合成视频
    6. 添加字幕
    7. 添加音频
    8. 添加背景音乐
    9. 导出视频，上传到数据库

    5s一张图
    对标账号生成一个视频，耗时：12分钟

    另一种方案：1. 切割，生成每一小片段，合并片段。然后获取字幕再合并。

    主要难点：
    1. 总时长
    2. 语音和图片在时间轴上难以匹配

    第三版解决方案：
    1. 对段落切割成单独的一个句子
    2. 对每一个句子单独处理（可并行）：
        2.1 文字生成语音（一个时长1分20秒的音频，调用API要花34秒，切割成多段并行可以节省时间）
        2.2 语音转录
        2.3 合并字幕、语音以及照片
        备注：时长=生成语音+转录+合成视频(照片生成可忽略，并行)
    3. 合并所有的片段
    4. 控制时长在特定的时间，加快或者缩短

    相对于传统方案，至少时长：合成语音34s+语音转录18s+全部合成34s = 1分30秒
    现在（理论上）总时长预估：合成语音10s+语音转录4s+合并字幕、语音、照片5s+合并单独的视频2s = 30s左右
*/


//1. 对段落切割成单独的一个句子，同时生成提示词

export const splitParagraph = async (text: string, attempt = 1): Promise<string> => {
    // 设置最大尝试次数
    const maxAttempts = 3;

    // 切割场景
    const processMessage = (message: string) => {
        if (message.startsWith('```json')) {
            let lines = message.split('\n');
            lines = lines.slice(1, lines.length - 1);
            const text = lines.join('\n');
            return text;
        } else {
            return message;
        }
    };

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: splitPrompt(),
                },
                { role: "user", content: text },
            ],
            model: "gpt-3.5-turbo-1106",
            response_format: { type: "json_object" },
        });

        if (completion.choices[0].message.content) {
            const result = processMessage(completion.choices[0].message.content);
            console.log('最终的结果', result);
            return result;
        } else {
            throw new Error("Empty response content");
        }
    } catch (error) {
        if (attempt < maxAttempts) {
            console.warn(`Attempt ${attempt} failed. Retrying...`);
            return splitParagraph(text, attempt + 1);
        } else {
            console.error('All attempts failed. Throwing error.');
            throw new Error("Failed to get a valid response after 3 attempts");
        }
    }
};


/*2. 对每一个句子单独处理（可并行）：
     2.1 文字生成语音
     2.2 语音转字幕
     2.3 生成图片提示词
     2.3 生成图片 
*/

// 2.2 语音转字幕
// 2.1 文字生成语音 
export const generateSpeech = async (inputText: string, outputAudioFile: string, voice: string) => {
    //测试总耗时： 34067
    const startTime = Date.now();
    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice as unknown as any,
        input: inputText,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(outputAudioFile, buffer);
    console.log('音频生成完成')
    console.log('耗时：', Date.now() - startTime);
}

export const getSubtitle = async (audio_path: string, subtitlePath: string) => {
    //用时18747
    let time = Date.now();
    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audio_path),
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word"]
    });
    console.log('共用时：', Date.now() - time);
    saveSubFile(transcription as unknown as Subtitles, subtitlePath)
    return transcription
}

export const generateSpeechAndSubtitle = async (inputText: string, audio_path: string, subtitlePath: string, voice: string) => {
    await generateSpeech(inputText, audio_path, voice)
    await getSubtitle(audio_path, subtitlePath)
    return
}

// 2.3 生成图片提示词 
// 2.4 生成图片
export const generateImagePrompt = async (text: string) => {

    const completion = await openai.chat.completions.create({
        messages: [{ "role": "system", "content": generateImgPrompt() },
        { "role": "user", "content": text },
        ],
        model: "gpt-3.5-turbo",
    });
    console.log(completion.choices[0].message.content)
    return completion.choices[0].message.content;
}

export const sdGen = async (prompt: string, outputPath: string) => {
    let retryCount = 0;
    let success = false;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 10000; // 10 seconds
    while (!success && retryCount < MAX_RETRIES) {
        try {
            const startTime = new Date().getTime();
            const key = 'sk-nVSKai0A2jxw1IlHBK95NEPeToZjcTEoLdKjB9AbTcFESkBC';
            const payload = {
                prompt: prompt,
                aspect_ratio: '9:16',
                model: 'sd3-large-turbo'
            };
            const response = await axios.postForm(
                `https://api.stability.ai/v2beta/stable-image/generate/sd3`,
                axios.toFormData(payload, new FormData()),
                {
                    validateStatus: undefined,
                    responseType: "arraybuffer",
                    headers: {
                        Authorization: `Bearer ${key}`,
                        Accept: "image/*"
                    },
                },
            );

            if (response.status === 200) {
                console.log('耗时：', new Date().getTime() - startTime);
                fs.writeFileSync(outputPath, Buffer.from(response.data));
                success = true;
            } else {
                throw new Error(`${response.status}: ${response.data.toString()}`);
            }
        } catch (error) {
            console.error('Error generating image:', error);
            retryCount++;
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }

    if (!success) {
        console.error('Maximum number of retries reached. Unable to generate image.');
    }
};

export const generatePromptAndImg = async (text: string, outputImgPath: string) => {
    const imgPromt = await generateImagePrompt(text)
    await sdGen(imgPromt!, outputImgPath)
    return
}

// 2.5. 合并字幕、语音以及照片
export const mergeVideoWithAudioAndSubtitles = async (
    imageFile: string,
    audioFile: string,
    subtitleFile: string,
    outputFile: string
) => {
    //耗时5s
    const duration = await getAudioDuration(audioFile)

    await new Promise<void>((resolve, reject) => {
        ffmpeg()
            .input(imageFile)
            .inputOptions('-loop', '1')
            .input(audioFile)
            .outputOptions([
                '-vf', `scale=720:1280,zoompan=z='min(zoom+0.0015,1.5)':d=125:s=720x1280,subtitles=${subtitleFile}:force_style='Alignment=10,OutlineColour=&H000000&,Outline=3'`,
                '-pix_fmt', 'yuv420p',
                '-r', '24'
            ])// 添加字幕滤镜，居中且带黑色描边
            .outputOptions('-t', duration)
            .on('start', () => {
                console.log('开始合并视频、音频和字幕...');
            })
            .on('end', () => {
                console.log('合并完成!');
                resolve();
            })
            .on('error', (err: Error) => {
                console.error('合并出错:', err);
                reject(err);
            })
            .save(outputFile);
    });
    return
};

//3. 合并所有的小视频
export async function mergeVideos(folderPath: string, outputFile: string): Promise<void> {
    // 获取文件夹下所有视频文件的路径
    const getVideoFiles = async (folderPath: string): Promise<string[]> => {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(folderPath, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    const videoFiles = files.filter((file) => {
                        const ext = path.extname(file).toLowerCase();
                        return ext === '.mp4' || ext === '.mov' || ext === '.avi';
                    });

                    // 按照文件名中的序号进行排序
                    videoFiles.sort((a, b) => {
                        const aMatch = a.match(/-(\d+)\./);
                        const bMatch = b.match(/-(\d+)\./);

                        if (aMatch && bMatch) {
                            return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
                        }
                        return 0;
                    });

                    resolve(videoFiles);
                }
            });
        });
    };
    const videoFiles = await getVideoFiles(folderPath)

    // 如果没有找到任何视频文件,则退出
    if (videoFiles.length === 0) {
        console.log('未找到任何视频文件');
        return;
    }

    // 创建一个文本文件,列出所有要合并的视频文件
    const concatFile = path.join(folderPath, 'concat.txt');
    await fs.promises.writeFile(concatFile, videoFiles.map((file) => `file '${path.join(folderPath, file)}'`).join('\n'));


    // 创建 ffmpeg 实例并合并视频
    return new Promise<void>((resolve, reject) => {
        ffmpeg()
            .input(concatFile)
            .inputOptions('-f', 'concat')
            .inputOptions('-safe', '0')
            .outputOptions('-c', 'copy')
            .on('start', () => {
                console.log('开始合并视频...');
            })
            .on('end', () => {
                console.log('视频合并完成!');
                resolve();
            })
            .on('error', (err: Error) => {
                console.error('合并出错:', err);
                reject(err);
            })
            .save(outputFile);
    });
}

// 4. 合并一个小视频
export const generateVideoItem = async (
    inputText: string,
    imgPrompt: string,
    audioPath: string,
    subtitlePath: string,
    imagePath: string,
    outputFile: string,
    voice: string
): Promise<string> => {
    const startTime = Date.now();

    try {
        await Promise.all([
            generateSpeechAndSubtitle(inputText, audioPath, subtitlePath, voice),
            sdGen(imgPrompt, imagePath)
        ]);
        await mergeVideoWithAudioAndSubtitles(imagePath, audioPath, subtitlePath, outputFile);
        console.log('完成了', Date.now() - startTime);
        return outputFile;
    } catch (error) {
        console.error('生成视频项时出错', error);
        throw error;
    }
};

// 5. 合并所有的单独视频
const createFolderIfNotExists = async (folderPath: string): Promise<void> => {
    try {
        await fs.promises.access(folderPath, fs.constants.F_OK);
    } catch (error) {
        await fs.promises.mkdir(folderPath, { recursive: true });
    }
};

export const generateAll = async (paragraph: string, voice: string, pathname: string, videoId: string, retryCount = 1): Promise<void> => {
    const maxRetries = 2; // 最大重试次数
    const retryDelay = 5000; // 5秒
    const projectRoot = process.cwd(); // 获取项目根目录
    interface IPrompt {
        original: string,
        imgPrompt: string,
        index: number
    }
    try {
        const textArray: IPrompt[] = JSON.parse(await splitParagraph(paragraph)).result;
        const currentDirectory = process.cwd();
        const folderPromises = textArray.map(async (item, index) => {
            const newFolderPath = path.join(currentDirectory, `staticFile/frames/frame-${index}`);
            await createFolderIfNotExists(newFolderPath);
            const audioPath = path.join(newFolderPath, `audio-${index}.mp3`);
            const subtitlePath = path.join(newFolderPath, `subtitle-${index}.srt`);
            const imagePath = path.join(newFolderPath, `frame-${index}.png`);
            const outputFile = path.join(currentDirectory, `staticFile/videoOutput/mergedvideo-${index}.mp4`);

            return generateVideoItem(item.original, item.imgPrompt, audioPath, subtitlePath, imagePath, outputFile, voice);
        });

        const mergedAllVideoPath = path.join(projectRoot, `staticFile/mergedAllVideo.mp4`);
        const outputFile = path.join(projectRoot, `staticFile/videoOutput`);
        await Promise.all(folderPromises);
        await mergeVideos(outputFile, mergedAllVideoPath);
        //更新到数据库
        await UpdateVideo(pathname, videoId)
        //清除本地的文件夹数据
        deleteFilesInFolder(outputFile)

    } catch (error) {
        if (retryCount <= maxRetries) {
            console.error(`Error in generateAll, retrying in ${retryDelay / 1000} seconds... (Attempt ${retryCount + 1})`);
            setTimeout(async () => {
                await generateAll(paragraph, voice, pathname, videoId, retryCount + 1);
            }, retryDelay);
        } else {
            console.error('Max retries reached. Exiting with error:', error);
            throw error; // 抛出错误以便外部捕获
        }
    }
};

// 6. 上传合并后的视频到云数据库
export const UpdateVideo = async (pathname: string, videoId: string) => {
    try {
        const projectRoot = process.cwd(); // 获取项目根目录
        const mergedAllVideoPath = path.join(projectRoot, `staticFile/mergedAllVideo.mp4`);
        const file = await fs.readFileSync(mergedAllVideoPath)
        const res = await put(
            `${pathname}.mp4`,
            file,
            { access: 'public' }
        );
        console.log(res)
        await Video.findByIdAndUpdate(videoId, {
            status: 'ready',
            videoBlob: res
        })
        return true
    } catch (error) {
        console.log(error)
        return null
    }
}

// 7. 清除缓存数据
function deleteFilesInFolder(folderPath: string) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading folder:', err);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    if (err.code === 'EPERM') {
                        console.warn(`Unable to delete file ${filePath} due to permissions.`);
                    } else {
                        console.error('Error deleting file:', err);
                    }
                } else {
                    console.log(`File ${filePath} deleted successfully`);
                }
            });
        });
    });
}


export const getAudioDuration = async (audioFilePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioFilePath, (err, metadata) => {
            if (err) {
                console.error('Error getting audio metadata:', err);
                resolve('5'); // 返回默认值 '5'
                return;
            }
            const duration = metadata.format.duration;
            const data = duration!.toString();

            console.log(`Audio duration: ${duration} seconds`);
            resolve(data);
        });
    });
}




