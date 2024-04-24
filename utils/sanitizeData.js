export function sanitizeData(user) {
  return {
    id: user._id,
    name: user.name[user.name.length - 1].name,
    email: user.email[user.email.length - 1].email,
    userName: user.userName[user.userName.length - 1].userName,
    image:user.image,
    birthday:user.birthday,
    permissions: user.role?.permissions
  }
}
