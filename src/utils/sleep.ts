const sleep = (ms: number) =>
  // 使用promise延时返回结果 以达到“睡眠”的效果
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export default sleep;
