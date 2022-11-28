test("执行顺序", async () => {
  console.log("1");
  setTimeout(() => {
    console.log("6");
  }, 0);
  const promise = new Promise<void>((resolve) => {
    console.log("2");
    // 只有resolve执行了 才能把.then中的内容放到Job Quene里
    resolve();
  }).then(() => {
    console.log("4");
  });
  console.log("3");
  await promise;
  console.log("5");
});
