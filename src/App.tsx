import React from "react";
import AuthButton from "components/AuthButton";
import User from "components/User";

const App = () => {
  return (
    <div>
      <section>
        <AuthButton>登录</AuthButton>
      </section>
      <section>
        <User />
      </section>
    </div>
  );
};

export default App;
