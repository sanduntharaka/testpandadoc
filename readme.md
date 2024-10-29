# Setup netlify

we can setup netlify using following commands

**netlify login** > this is using to login </br>
**netlify build** > build project </br>
**netlify build --prod** > deploy to production

## netlify.toml

```
[build]
    functions = "functions"
    external_node_modules = ["express","axios", "pandadoc-node-client", "@aws-sdk/client-s3", "cookie-parser" , "dotenv", "multer",  "serverless-http","@aws-sdk/s3-request-presigner",]

[functions]
  node_bundler = "esbuild"

[[redirects]]
  force = true
  from = "/api/*"
  status = 200
  to = "/.netlify/functions/api/:splat"

```

**add api.js(same as server file) within functions folder**

## make sure add .env in netlify
sample .env </br>
```
# PandaDoc
PANDADOC_API_KEY=
PANDADOC_BASE_URL=

# S3
ACCESS_KEY=
SECRET_KEY=
REGION=eu-central-1
S3_BUCKET_NAME=

# NGROK URL
NGROK_URL=

# Odoo URL
ODOO_URL=
ODOO_DB= 
ODOO_USERNAME=
ODOO_PASSWORD=

```
