import { S3, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const { ACCESS_KEY, SECRET_KEY, REGION } = process.env;

if (!ACCESS_KEY || !SECRET_KEY || !REGION) {
    throw new Error("Missing AWS S3 environment variables: ACCESS_KEY, SECRET_KEY, or REGION");
}

export const s3 = new S3({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
});


export const s3_new = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
});
