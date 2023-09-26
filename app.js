// const uploadFile = async (event) => {
//   const { file, fields } = await parseFormData(event);
//   const tags = { filename: file.filename };
//   try {
//     await s3Client
//       .putObject({
//         Bucket: BUCKET_NAME,
//         Key: fields.filename || file.filename,
//         Body: file.content,
//         Tagging: queryString.encode(tags),
//       })
//       .promise();

//     return {
//       statusCode: 200,
//       body: JSON.stringify({ description: "file created", result: "ok" }),
//     };
//   } catch (_error) {
//     // this is not ideal error handling, but good enough for the purpose of this example
//     //Api testing
//     return {
//       statusCode: 409,
//       body: JSON.stringify({
//         description: "something went wrong",
//         result: "error",
//       }),
//     };
//   }
// };
const AWS = require('aws-sdk');
const parseMultipart = require('parse-multipart');

const BUCKET = 'serverless-bucket-1';

const s3 = new AWS.S3();

function extractFile(event) {
  const contentType = event.headers['Content-Type'];
  if (!contentType) {
    throw new Error('Content-Type header is missing in the request.');
  }

  const boundary = parseMultipart.getBoundary(contentType);
  if (!boundary) {
    throw new Error(
      'Unable to determine the boundary from the Content-Type header.'
    );
  }

  const parts = parseMultipart.Parse(
    Buffer.from(event.body, 'base64'),
    boundary
  );
  console.log('--------parts', parts);

  if (!parts || parts.length === 0) {
    throw new Error('No parts found in the multipart request.');
  }

  const [{ filename, data }] = parts;

  if (!filename || !data) {
    throw new Error(
      'Invalid or missing filename or data in the multipart request.'
    );
  }

  return {
    filename,
    data,
  };
}

module.exports.uploadFile = async (event) => {
  try {
    const { filename, data } = extractFile(event);
    console.log('---------data', data);
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: filename,
        Body: data,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        link: `https://${BUCKET}.s3.amazonaws.com/${filename}`,
      }),
    };
  } catch (err) {
    console.log('error-----', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};		  

exports.download = async (event, context) => {
  console.log(`Hi from Node.js ${process.version} on Lambda!`)
  s3.getObject({Bucket: BUCKET, Key: 'pic1 - Copy (1).pdf'}).promise().then( data =>{
    return {
      statusCode: 200,
      body: data
  }})
}

