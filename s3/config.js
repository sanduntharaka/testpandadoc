import { S3 } from "@aws-sdk/client-s3";

export const s3 = new S3({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_KEY,
    },
});