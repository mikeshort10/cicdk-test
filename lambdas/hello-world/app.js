module.exports.handler = (event) => {
  console.log(event);
  return {
    statusCode: 200,
    message: "Hello World!",
  };
};
