import Serie, { ISerie } from "../models/Serie"
import Video, { IVideo } from "../models/Video";
import { openai } from "./openai";
import schedule from 'node-schedule'

const processMessage = (message: string) => {
    if (message.startsWith('```json')) {
        let lines = message.split('\n');
        lines = lines.slice(1, lines.length - 1);
        const text = lines.join('\n');
        return text
    } else {
        return message
    }
};

//生成故事脚本的提示词
export const generateScriptPrompt = (topic: string, language: string) => {
    const example = {
        title: 'The Tale of the Dream Tree',
        description: 'Immerse your child in the enchanting story of the Dream Tree. Let their imagination soar with this magical bedtime tale. #BedtimeStory #Imagination #DreamTree #ChildrensStory #autoshorts.ai',
        SCRIPT: 'Once upon a time, in a land far beyond the rolling hills, there stood a majestic tree known as the Dream Tree. Its branches reached high into the sky, adorned with shimmering leaves that sparkled like stars. Each night, as the moon rose, the Dream Tree came to life with whispers of ancient tales. It was said that anyone who fell asleep under its canopy would be transported to a realm of dreams and wonder. One moonlit night, a young girl named Lily stumbled upon the tree. Intrigued by its beauty, she settled under its branches and closed her eyes. As the gentle breeze danced through the leaves, the Dream Tree began to weave a dream just for her. Lily found herself in a meadow filled with colorful flowers that sang in harmony. Butterflies carried her across crystal-clear streams, and birds whispered secrets of the forest. Through enchanted forests and mystical mountains, Lily journeyed, guided by the soft glow of fireflies. As dawn approached, the Dream Tree gently roused her from slumber. With a heart full of wonder, Lily awoke, carrying the magic of her dream in her heart. From that night on, the Dream Tree and Lily shared many adventures in the world of dreams, where anything was possible. And so, dear children, if you ever find yourself near a towering tree with leaves that shimmer like stars, remember the tale of the Dream Tree and the magical dreams it weaves for those pure of heart.'
    }
    const message = `你是一名短视频剧本专家，善于运用各种理论去写剧本，我将给定你特定的主题和对应的语言，你将撰写出有吸引力的短视频脚本。
            你的回答应该是json格式的。有以下元素{title: string,description:string,script:string}。
            例如:${JSON.stringify(example)}。
            下面是主题和要求的语言：${JSON.stringify({ topic: topic, language: language })}.
            请你回答：         
            `
    return message
}

//生成视频脚本
export const generateScript = async (topic: string, language: string, serieId: string, retryCount: number = 0): Promise<{ success: boolean; message: any, status?: number }> => {
    try {
        const completion = await openai.chat.completions.create(
            {
                model: "gpt-3.5-turbo-0125",
                response_format: { "type": "json_object" },
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant designed to output JSON.",
                    },
                    { role: "user", content: generateScriptPrompt(topic, language) },
                ],
            }
        );
        if (completion.choices[0].message.content) {
            const result = JSON.parse(processMessage(completion.choices[0].message.content))
            const video = JSON.parse(JSON.stringify(await Video.create({
                script: result,
                status: 'pending',
                serie: serieId
            })))

            await Serie.findByIdAndUpdate(serieId, {
                $push: { video: video._id }
            });

            return { success: true, message: '成功' }
        } else {
            console.log('出错了')
            if (retryCount < 3) {
                return generateScript(topic, language, serieId, retryCount + 1);
            } else {
                return { success: false, message: 'Failed to update, please try again' };
            }
        }
    } catch (error) {
        console.log(error)
        if (retryCount < 3) {
            return generateScript(topic, language, serieId, retryCount + 1);
        } else {
            return { success: false, message: 'Failed to create, please try again' };
        }
    }
}

/**
 *  6.16 补充
 *  定时发送视频的逻辑
 *  一、 生成视频脚本
 *      1. 获取 所有 series 数据，查看下一个发送日期
 *      2. 对比时间，如果与当下时间相比，时差小于一天，那么创建视频脚本，VIDEO，设置状态为pending。
 *      3. 等待生成视频API获取然后生成视频即可
 * 
 *  二、 设置定时任务
 *      1. 获取所有ready状态的Video数据。
 *      2. 为其设置定时发布任务
 */

export const generateVideoScript = async () => {
    // 1. 查找发布日期最近的数据
    const latestSeries = await Serie.find().sort({ nextPublishDate: -1 }).limit(1);
    // 2. 对比时间，如果与当下时间相比，时差小于一天，那么创建视频脚本，VIDEO，设置状态为pending。
    if (latestSeries.length > 0) {
        const lastSerie: ISerie = JSON.parse(JSON.stringify(latestSeries[0].nextPublishDate));
        const currentDate = new Date();
        //这里待调试
        const differenceInTime = lastSerie.nextPublishDate - currentDate.getTime();
        const differenceInDays = differenceInTime / (1000 * 3600 * 24); // 将毫秒转换为天

        if (differenceInDays < 1) {
            // 创建视频脚本，设置状态为 pending
            const res = await generateScript(lastSerie.topic, lastSerie.language, lastSerie._id)
            if (res.success) {
                // 创建脚本成功
                // *  3. 设置定时任务。
                // 等待视频生成

            }
            return
            // 这里可以添加您的逻辑
        }
    }
}

export const setScheduled = async () => {
    // 获取所有ready状态的Video数据。
    try {
        const videos:IVideo[] = await Video.find({
            status: 'ready'
        }).populate('serie')

        if (videos.length > 0) {
            videos.forEach((video) => {

                const publishTime = video.serie.nextPublishDate;
                // publishTime.setHours(publishTime.getHours());
        
                // 为视频设置定时发布任务
                schedule.scheduleJob(publishTime, function(){
                    // console.log(`发布视频 ${video.title}，发布时间: ${publishTime}`);
                    // 在这里执行发布视频的代码，比如调用上传视频到YouTube的功能
                    publishVideo()
                });
            });
        }
    } catch (error) {

    }
}

const publishVideo = async () => {


}

