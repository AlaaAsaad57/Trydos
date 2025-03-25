import { UserInterface } from "models/User";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const users: UserInterface[] = [];

export const signup = async (user: UserInterface): Promise<UserInterface> => {
  await delay(1000);

  const newUser = {
    id: users.length + 1,
    name: user.name,
    passowrd: user.passowrd,
    avatar: "",
    idToken: "",
    already_exists: false,
  };

  users.push(newUser);

  return newUser;
};

export const signin = async (user: UserInterface): Promise<UserInterface> => {
  await delay(1000);

  const existingUser = users.find((u) => u.name === user.name);

  return existingUser;
};
