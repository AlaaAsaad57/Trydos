import { UserInterface } from "models/User";

const users = [
  {
    id: 1,
    name: "Admin",
    email: "admin@admin.com",
  },
  {
    id: 2,
    name: "Admin2",
    email: "admin2@admin.com",
  },
  {
    id: 3,
    name: "Admin3",
    email: "admin3@admin.com",
  },
];

/**
 * Mock function that mimics fetching users from a database.
 */
export const fetchUsers = async (query = ""): Promise<UserInterface[]> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("fetched users");

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(query.toLowerCase())
  );

  // Uncomment the line below to trigger an error
  // throw new Error();

  return [...filteredUsers];
};

/**
 * Mock function that mimics adding a user to a database.
 */
export const addUser = async (user: UserInterface): Promise<UserInterface> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const newUser = {
    id: users.length + 1,
    name: user.name,
    email: user.email,
  };

  // User is stored in memory and cleared on page reload
  users.push(newUser);

  return newUser;
};
