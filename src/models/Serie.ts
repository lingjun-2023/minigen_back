import mongoose from "mongoose";
import { IVideo } from "./Video";

const { Schema } = mongoose;


export interface IAccount {
    account: string,
    id: string,
    type: string,
}

export interface ISerie {
    _id: string,
    topic: string,
    voice: string,
    language: string,
    duration: string,
    account: IAccount[],
    owner: string,
    video?: string[],
    youTubeVisibility: 'Private' | 'Public',
    tikTokVisibility: 'Private' | 'Public',
    allowUsersTo: {
        comment: boolean,
        duet: boolean,
        stitch: boolean
    },
    watermarkText?: string,
    createdAt: string,
    updatedAt: string
}

const serieSchema = new Schema(
    {
        topic: {
            type: String,
            required: true,
        },
        voice: {
            type: String,
            required: true,
        },
        language: {
            type: String,
            required: true,
        },
        duration: {
            type: String,
            required: true,
        },
        account: [{
            type: {
                type: String,
            },
            account: {
                type: String,
            },
            id: {
                type: String,
            }
        }],
        owner: {
            type: String,
            required: true,
        },
        video: [{
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: false,
        }],
        youTubeVisibility: {
            type: String,
            default: 'Private',
            enum: ['Private', 'Public']
        },
        tikTokVisibility: {
            type: String,
            default: 'Private',
            enum: ['Private', 'Public']
        },
        allowUsersTo: {
            comment: {
                type: Boolean,
                default: true
            },
            duet: {
                type: Boolean,
                default: true
            },
            stitch: {
                type: Boolean,
                default: true
            }
        },
        watermarkText: {
            type: String,
            required: false,
        }
    },
    { timestamps: true }
);

export default mongoose.models.Serie || mongoose.model("Serie", serieSchema);