/**
 * Este ficheiro existe apenas para satisfazer o requisito do Next.js static export
 * (output: 'export'). O formulário AIMA está em /aima?token=TOKEN.
 * Cloudflare Pages redireciona /aima/:token → /aima?token=:token via public/_redirects.
 *
 * generateStaticParams com um placeholder garante que o Next.js aceita a rota
 * em modo export. A página em si nunca é servida — o redirect do Cloudflare
 * encaminha /aima/:token → /aima?token=:token antes de chegar aqui.
 */
export function generateStaticParams() {
  return [{ token: '_placeholder' }];
}

export const dynamicParams = false;

export default function AimaTokenLegacy() {
  return null;
}
