export const toNumber = (value) => (value == null ? value : Number(value));

export function serializePersona(persona) {
  return persona;
}

export function serializeUsuario(usuario) {
  if (!usuario) return usuario;
  const { password, ...rest } = usuario;
  return {
    ...rest,
    sucursal: usuario.sucursal ?? null,
    persona: usuario.persona ? serializePersona(usuario.persona) : usuario.persona,
  };
}
