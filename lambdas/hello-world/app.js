exports.handler = async (event) => {
  console.log(event, 2);
  return {
    statusCode: 200,
    message: "Hello World!",
  };
};
