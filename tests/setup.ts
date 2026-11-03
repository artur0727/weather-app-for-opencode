// Bun no expone una TTY en los tests y además desactivamos el color explícitamente,
// para que `styleText` devuelva texto plano y las aserciones sean estables.
process.env.NO_COLOR = "1";
