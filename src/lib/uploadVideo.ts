import fs from 'fs';
import fetch from 'node-fetch';

//上传到 youtube 视频
interface VideoMetadata {
    snippet: {
        title: string;
        description: string;
        tags: string[];
        categoryId: string;
        defaultLanguage?: string;
        localizations?: {
            [key: string]: {
                title: string;
                description: string;
            };
        };
    };
    status: {
        embeddable?: boolean;
        license?: string;
        privacyStatus: string;
        publicStatsViewable?: boolean;
        publishAt?: string;
        selfDeclaredMadeForKids?: boolean;
    };
}

export async function uploadYoutubeVideo(videoFile: string, metadata: VideoMetadata, accessToken: string) {
    try {
        const videoData = await fs.promises.readFile(videoFile);
        const params = new URLSearchParams({
            part: 'snippet,status',
        });

        const response = await fetch(`https://www.googleapis.com/upload/youtube/v3/videos?${params.toString()}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'video/*',
            },
            body: JSON.stringify({
                ...metadata,
                file: videoData.toString('base64'), // Convert video data to base64
            }),
        });
        if (!response.ok) {
            console.log(response)
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error(error);
        return;
    }
}

