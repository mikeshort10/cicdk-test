exports.handler = async (event) => {
  console.log(event, 1);
  return {
    statusCode: 200,
    message: "Hello World!",
  };
};
