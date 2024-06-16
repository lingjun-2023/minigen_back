//生成图片提示词
export const generateImgPrompt = () => {
    const imgPromptExample = [
        'A minimal and whimsical illustration with a bold pastel color scheme; using marker art in the style of Matisse; inspired by I fall for you and aboriginal art; focusing on a lynx; the mood is playful and surrealistic. There is gold leaf all over the artwork.',
        "A candid snapshot capturing the pure joy and affection shared between a father and his daughter as they engage in a playful pillow fight on the bed, the father's face lighting up with a wide smile as he receives a loving declaration from his little girl on Father's Day.",
        "Sasquatch, silkscreen printing, retro poster art, Milton Avery style, simple/minimal, 1960's, bright and vibrant, funky/groovy, cloudy/bloated forms, flat shapes, simple/minimal, hand-crafted art, plain background"
    ]

    const imgSys = `你是一个高级的提示词工程师，并且具有很强的艺术天分，能够根据用户的一句话，生成对应的图片提示词。该提示词将用于大模型的文字生成图像。
    这是一些优秀的提示词，你可以参考：${imgPromptExample}.
    记住，你的输出应该只有提示词，没有其它。提示词的字数应该尽量控制在30字之内。
    `
    return imgSys
}

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

//重新生成脚本的提示词
export const generateReScriptPrompt = () => {
    const SCRIPT = 'Once upon a time, in a land far beyond the rolling hills, there stood a majestic tree known as the Dream Tree. Its branches reached high into the sky, adorned with shimmering leaves that sparkled like stars. Each night, as the moon rose, the Dream Tree came to life with whispers of ancient tales. It was said that anyone who fell asleep under its canopy would be transported to a realm of dreams and wonder. One moonlit night, a young girl named Lily stumbled upon the tree. Intrigued by its beauty, she settled under its branches and closed her eyes. As the gentle breeze danced through the leaves, the Dream Tree began to weave a dream just for her. Lily found herself in a meadow filled with colorful flowers that sang in harmony. Butterflies carried her across crystal-clear streams, and birds whispered secrets of the forest. Through enchanted forests and mystical mountains, Lily journeyed, guided by the soft glow of fireflies. As dawn approached, the Dream Tree gently roused her from slumber. With a heart full of wonder, Lily awoke, carrying the magic of her dream in her heart. From that night on, the Dream Tree and Lily shared many adventures in the world of dreams, where anything was possible. And so, dear children, if you ever find yourself near a towering tree with leaves that shimmer like stars, remember the tale of the Dream Tree and the magical dreams it weaves for those pure of heart.'
    const message = `你是一名短视频剧本专家，善于运用各种理论去撰写剧本，你能够根据用户给定你的主题、语言、标题、描述，随机生成对应的剧本。
            记住，你的回答除了剧本内容，不要其它任何内容。
            剧本例子：${SCRIPT}
            `
    return message
}

export const splitPrompt = () => {
    const example = {
        'result': [
            {
                "original": "Once upon a time, in a cozy little town nestled between rolling hills and lush forests, lived a young boy named Timmy",
                "imgPrompt": "A whimsical illustration featuring the Dream Tree as the centerpiece, surrounded by rolling hills and a vibrant sunset in the background.",
                "index": 0
            },
            {
                "original": "Timmy was an adventurous soul, always seeking new and exciting experiences",
                "imgPrompt": "A majestic tree with branches reaching high, adorned with shimmering leaves that sparkle like stars.",
                "index": 1
            },
            {
                "original": "But there was one thing that Timmy cherished above all else - his magical blanket",
                "imgPrompt": "A mystical scene featuring a Dream Tree with moonlit whispers",
                "index": 2
            },
        ]
    }

    const sysMessage = `你是一个短视频编剧专家，能够根据用户给定的剧本，将剧本划分成不同的片段。并且可以为每个片段生成一段
                        文字生成图片的提示词，其中图像的风格应该保持一致。你的划分应该尽量以句子为单位，不要过长。你的输出应该是严格的json格式。包含：{original:用户给定的剧本原文,imgPrompt:文生图的提示词,index:索引，是数字。}
                        例如:${JSON.stringify(example)}.
                        用户将给定一段剧本：
                        `
    return sysMessage
}