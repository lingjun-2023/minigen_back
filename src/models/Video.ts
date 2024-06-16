import mongoose from "mongoose";
import { ISerie } from "./Serie";

const { Schema } = mongoose;

export interface IVideo {
    _id: string,
    videoBlob?: IVideoBlob,
    script: IVideoDetail,
    serie: ISerie,
    createdAt: string,
    updatedAt: string,
    status: 'pending' | 'ready' | 'published'
}


export interface IVideoBlob {
    _id: string,
    url: string,
    downloadUrl: string,
    pathname: string,
    contentType: string,
    contentDisposition: string
}


export interface IVideoDetail {
    title: string,
    description: string,
    script: string,
}

const videoSchema = new Schema(
    {
        videoBlob: {
            type: Schema.Types.Mixed,
            required: false,
        },
        script: {
            type: Schema.Types.Mixed,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: "pending",
            enum: ['pending', 'ready', 'published']
        },
        serie: {
            type: Schema.Types.ObjectId,
            ref: "Serie",
            required: true,
        }
    },
    { timestamps: true }
);

export default mongoose.models.Video || mongoose.model("Video", videoSchema);