// src/utils/formatHelpers.ts
export const fmt = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });