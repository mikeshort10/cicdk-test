export const handler = (event) => {
  console.log(event);
  console.log("Hello handler");
  return {
    statusCode: 200,
    message: "Hello World!",
  };
};
