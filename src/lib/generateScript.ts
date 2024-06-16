import Serie from "../models/Serie";
import Video from "../models/Video";
import { openai } from "./openai";


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

// export const generateScript = async (topic: string, language: string, retryCount: number = 0): Promise<{ success: boolean; message: any, status?: number }> => {
//     try {

//         //获取会员信息
//         //查看用户直接创建的series数量
//         //创建series
//         //创建视频任务

//         const completion = await openai.chat.completions.create(
//             {
//                 model: "gpt-3.5-turbo-0125",
//                 response_format: { "type": "json_object" },
//                 messages: [
//                     {
//                         role: "system",
//                         content: "You are a helpful assistant designed to output JSON.",
//                     },
//                     { role: "user", content: generateScriptPrompt(videoInfo.topic, videoInfo.language) },
//                 ],
//             }
//         );
//         if (completion.choices[0].message.content) {
//             const result = JSON.parse(processMessage(completion.choices[0].message.content))
//             const res = JSON.parse(JSON.stringify(await Serie.create({
//                 topic: videoInfo.topic,
//                 voice: videoInfo.voice,
//                 language: videoInfo.language,
//                 duration: videoInfo.duration,
//                 owner: session?.user!.email,
//                 account: [videoInfo.sendMidea]
//             })))

//             const video = JSON.parse(JSON.stringify(await Video.create({
//                 script: result,
//                 status: 'pending',
//                 serie: res._id
//             })))

//             await Serie.findByIdAndUpdate(res._id, {
//                 $push: { video: video._id } // 正确使用 $push 操作符
//             });

//             return { success: true, message: res }
//         } else {
//             console.log('出错了')
//             if (retryCount < 3) {
//                 return generateScript(videoInfo, retryCount + 1);
//             } else {
//                 return { success: false, message: 'Failed to update, please try again' };
//             }
//         }
//     } catch (error) {
//         console.log(error)
//         if (retryCount < 3) {
//             return generateScript(videoInfo, retryCount + 1);
//         } else {
//             return { success: false, message: 'Failed to create, please try again' };
//         }
//     }
// }