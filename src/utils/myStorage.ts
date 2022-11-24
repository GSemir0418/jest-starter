const KEY_NAME = "my-app-";

const set = (key: string, value: string) => {
  localStorage.setItem(KEY_NAME + key, value);
};

const get = (key: string) => localStorage.getItem(KEY_NAME + key);

const myStorage = { get, set };

export default myStorage;
