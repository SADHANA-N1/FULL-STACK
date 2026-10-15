// No database for this practical - users live in a Map and vanish on restart.
// Swap this file out for a real DB later; nothing else touches `users` directly.
const users = new Map();

export const findUser = (username) => users.get(username);
export const addUser = (username, passwordHash) => users.set(username, { username, passwordHash });
export const clearUsers = () => users.clear();
