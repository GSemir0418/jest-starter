type AnyFunc = (...args: any[]) => any;

const after1000ms = (callback?: AnyFunc) => {
  console.log("开始计时");
  setTimeout(() => {
    console.log("午时已到");
    callback && callback();
  }, 1000);
};

export default after1000ms;
