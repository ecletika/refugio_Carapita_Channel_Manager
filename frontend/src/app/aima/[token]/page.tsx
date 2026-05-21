/**
 * Este ficheiro existe apenas para satisfazer o requisito do Next.js static export
 * (output: 'export'). O formulário AIMA está em /aima?token=TOKEN.
 * Cloudflare Pages redireciona /aima/:token → /aima?token=:token via public/_redirects.
 */
export function generateStaticParams() {
  return [];
}

export default function AimaTokenLegacy() {
  return null;
}
