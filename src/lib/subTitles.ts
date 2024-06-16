import fs from 'fs';

interface Word {
    word: string;
    start: number;
    end: number;
}

export interface Subtitles {
    task: string;
    language: string;
    duration: number;
    text: string;
    words: Word[];
}

//  辅助函数，将秒数转换为SRT时间格式
const formatTime = (seconds: number): string => {
    const date = new Date(seconds * 1000);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const secondsPart = String(date.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${secondsPart},${milliseconds}`;
};

// 生成SRT内容
const generateSRTContent = (subtitles: Subtitles): string => {
    let srtContent = '';
    let index = 1;

    for (let i = 0; i < subtitles.words.length; i += 3) {
        const group = subtitles.words.slice(i, i + 3);
        const start = group[0].start;
        const end = group[group.length - 1].end;
        const text = group.map(sub => sub.word).join(' ');

        srtContent += `${index}\n`;
        srtContent += `${formatTime(start)} --> ${formatTime(end)}\n`;
        srtContent += `${text}\n\n`;
        index++;
    }

    return srtContent;
};

// 生成并保存SRT文件
export const saveSubFile = (subtitles:Subtitles,subtitlePath:string) => {
    const srtContent = generateSRTContent(subtitles);
    fs.writeFileSync(subtitlePath, srtContent);
    console.log('Subtitles saved to subtitles.srt');
}


