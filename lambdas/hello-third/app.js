exports.handler = async (event) => {
  console.log(event, 3);
  return {
    statusCode: 200,
    message: "Hello World!",
  };
};
